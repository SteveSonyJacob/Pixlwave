import type { QueryResult, QueryResultRow } from "pg";

type CleanupJob = { id: string; asset_id: string; object_key: string };

export interface RetentionDatabase {
  query<Row extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

export interface PrivateMediaStorage {
  remove(paths: string[]): Promise<{ error: { message: string } | null }>;
}

export type RetentionCleanupResult = {
  scanned: number;
  deleted: number;
  skipped: number;
  failures: Array<{ assetId: string; error: string }>;
};

export async function claimWeeklyRetentionCleanup(database: RetentionDatabase, force = false) {
  const claimed = await database.query<{ last_started_at: Date }>(`
    update public.media_retention_cleanup_state
    set last_started_at = now()
    where singleton = true
      and ($1::boolean or last_started_at <= now() - interval '7 days')
    returning last_started_at
  `, [force]);
  return claimed.rowCount === 1;
}

export async function cleanupExpiredSupportAttachments(
  database: RetentionDatabase,
  storage: PrivateMediaStorage,
  batchSize = 500,
): Promise<RetentionCleanupResult> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
    throw new Error("Retention cleanup batch size must be between 1 and 500.");
  }

  await database.query(`
    with candidates as (
      select id, object_key, retention_until
      from public.private_media_assets
      where purpose = 'support_attachment' and retention_until <= now()
      order by retention_until, created_at
      for update skip locked
      limit $1
    ), staged as (
      insert into public.media_retention_cleanup_jobs(asset_id, object_key, retention_until)
      select id, object_key, retention_until from candidates
      on conflict(asset_id) do nothing
      returning asset_id
    )
    delete from public.private_media_assets asset
    using staged where asset.id = staged.asset_id
  `, [batchSize]);
  const selected = await database.query<CleanupJob>(`
    select id, asset_id, object_key
    from public.media_retention_cleanup_jobs
    where status = 'pending'
    order by created_at
    limit $1
  `, [batchSize]);
  const result: RetentionCleanupResult = { scanned: selected.rows.length, deleted: 0, skipped: 0, failures: [] };

  for (const job of selected.rows) {
    try {
      const removed = await storage.remove([job.object_key]);
      if (removed.error) throw new Error(removed.error.message);
      const recorded = await database.query<{ subject_id: string }>(`
        with completed as (
          update public.media_retention_cleanup_jobs
          set status = 'deleted', attempts = attempts + 1, last_error = null,
            last_attempt_at = now(), deleted_at = now(), object_key = null
          where id = $1 and status = 'pending'
          returning asset_id, retention_until
        ), evidence as (
          insert into public.audit_log(actor_id, action, subject_type, subject_id, metadata)
          select null, 'media.retention.deleted', 'private_media_asset', asset_id::text,
            jsonb_build_object('purpose', 'support_attachment', 'retentionUntil', retention_until)
          from completed
          returning subject_id
        )
        select subject_id from evidence
      `, [job.id]);
      if (recorded.rowCount) result.deleted += 1;
      else result.skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Retention cleanup failed.";
      await database.query(`
        update public.media_retention_cleanup_jobs
        set attempts = attempts + 1, last_attempt_at = now(), last_error = left($2, 1000)
        where id = $1 and status = 'pending'
      `, [job.id, message]);
      result.failures.push({ assetId: job.asset_id, error: message });
    }
  }

  return result;
}
