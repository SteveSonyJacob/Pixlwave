import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";
import { PostgresOutboxStore, processOne } from "../src/worker/outbox";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  assert(connectionString, "DATABASE_URL is required.");
  return new Pool({ connectionString, max: 1, application_name: "pixlwave-outbox-acceptance" });
}

async function main() {
  loadLocalEnvFile();
  assert(process.env.APP_ENV !== "production", "The live outbox acceptance check must not run in production.");

  const eventId = randomUUID();
  const dedupeKey = `foundation.healthcheck:${eventId}`;
  const aggregateId = randomUUID();

  const enqueuePool = createPool();
  try {
    const pending = await enqueuePool.query<{ count: string }>(`
      select count(*)::text as count from public.outbox_events
      where status = 'available' and available_at <= now()
    `);
    assert(pending.rows[0]?.count === "0", "Refusing to run while unrelated available outbox work exists.");
    await enqueuePool.query(`
      insert into public.outbox_events
        (id, topic, aggregate_type, aggregate_id, payload, dedupe_key)
      values ($1, 'foundation.healthcheck', 'foundation', $2, $3::jsonb, $4)
    `, [eventId, aggregateId, JSON.stringify({ source: "P01-T07-live-check", external_side_effect: false }), dedupeKey]);
  } finally {
    await enqueuePool.end();
  }

  const workerPool = createPool();
  try {
    const store = new PostgresOutboxStore(workerPool);
    const result = await processOne(store, `acceptance:${randomUUID()}`, async (event) => {
      assert(event.id === eventId, "Worker claimed an unexpected event.");
      assert(event.topic === "foundation.healthcheck", "Worker claimed an unexpected topic.");
    });
    assert(result.outcome === "completed", `Expected completed outcome, received ${result.outcome}.`);
  } finally {
    await workerPool.end();
  }

  const evidencePool = createPool();
  try {
    const evidence = await evidencePool.query<{ status: string; attempts: number; processed_at: Date | null; last_error: string | null }>(`
      select status::text, attempts, processed_at, last_error
      from public.outbox_events where id = $1
    `, [eventId]);
    const row = evidence.rows[0];
    assert(row?.status === "completed", "Persisted event was not completed.");
    assert(row.attempts === 1, "Persisted event was not processed exactly once.");
    assert(row.processed_at && row.last_error === null, "Persisted completion evidence is incomplete.");
    console.log(`Outbox acceptance PASS: ${eventId} persisted across connections and completed exactly once.`);
  } finally {
    await evidencePool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
