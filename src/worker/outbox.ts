import type { Pool, PoolClient } from "pg";

export type OutboxEvent = {
  id: string;
  topic: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  dedupe_key: string;
};

export type EventHandler = (event: OutboxEvent) => Promise<void>;

export interface OutboxStore {
  claim(workerId: string): Promise<OutboxEvent | null>;
  complete(event: OutboxEvent): Promise<void>;
  retry(event: OutboxEvent, error: string, delaySeconds: number): Promise<void>;
  recoverStaleLocks(staleAfterMinutes: number): Promise<number>;
}

export class PostgresOutboxStore implements OutboxStore {
  constructor(private readonly pool: Pool) {}

  async recoverStaleLocks(staleAfterMinutes: number) {
    const result = await this.pool.query(`
      update public.outbox_events set status = 'available', locked_at = null, locked_by = null,
        last_error = coalesce(last_error, 'worker lock expired')
      where status = 'processing' and locked_at < now() - make_interval(mins => $1)
    `, [staleAfterMinutes]);
    return result.rowCount ?? 0;
  }

  async claim(workerId: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const selected = await client.query<OutboxEvent>(`
        select id, topic, aggregate_type, aggregate_id, payload, attempts, max_attempts, dedupe_key
        from public.outbox_events
        where status = 'available' and available_at <= now()
        order by available_at, created_at
        for update skip locked limit 1
      `);
      const event = selected.rows[0];
      if (!event) { await client.query("commit"); return null; }
      await client.query(`
        update public.outbox_events set status = 'processing', attempts = attempts + 1,
          locked_at = now(), locked_by = $2 where id = $1
      `, [event.id, workerId]);
      await client.query("commit");
      return { ...event, attempts: event.attempts + 1 };
    } catch (error) {
      await rollback(client);
      throw error;
    } finally { client.release(); }
  }

  async complete(event: OutboxEvent) {
    await this.pool.query(`
      update public.outbox_events set status = 'completed', processed_at = now(),
        locked_at = null, locked_by = null, last_error = null where id = $1 and status = 'processing'
    `, [event.id]);
  }

  async retry(event: OutboxEvent, error: string, delaySeconds: number) {
    const status = event.attempts >= event.max_attempts ? "dead" : "available";
    await this.pool.query(`
      update public.outbox_events set status = $2::public.outbox_status,
        available_at = case when $2 = 'available' then now() + make_interval(secs => $3) else available_at end,
        locked_at = null, locked_by = null, last_error = left($4, 1000)
      where id = $1 and status = 'processing'
    `, [event.id, status, delaySeconds, error]);
  }
}

async function rollback(client: PoolClient) {
  try { await client.query("rollback"); } catch { /* connection failure preserves the original error */ }
}

export async function processOne(store: OutboxStore, workerId: string, handler: EventHandler) {
  const event = await store.claim(workerId);
  if (!event) return { outcome: "empty" as const };
  try {
    await handler(event);
    await store.complete(event);
    return { outcome: "completed" as const, event };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown worker error";
    const delaySeconds = Math.min(900, 2 ** Math.min(event.attempts, 9));
    await store.retry(event, message, delaySeconds);
    return { outcome: event.attempts >= event.max_attempts ? "dead" as const : "retry" as const, event, message };
  }
}
