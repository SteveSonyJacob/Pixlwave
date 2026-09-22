import os from "node:os";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { log } from "../lib/logging";
import { loadLocalEnvFile } from "../lib/config/load-local-env";
import { PostgresOutboxStore, processOne, type OutboxEvent } from "./outbox";
import { deliverEmail } from "./email-delivery";
import { claimWeeklyRetentionCleanup, cleanupExpiredSupportAttachments, type RetentionDatabase } from "./media-retention";
import { createAdminSupabaseClient } from "../lib/supabase/admin";
import { readServerEnv } from "../lib/config/env";

loadLocalEnvFile();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required by the durable worker.");
const workerId = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const once = process.argv.includes("--once");
const cleanupOnly = process.argv.includes("--cleanup-media-only");
const pool = new Pool({ connectionString: databaseUrl, max: 5, application_name: "pixlwave-worker" });
const store = new PostgresOutboxStore(pool);
let nextRetentionCleanupAt = 0;
const retentionScheduleCheckMs = 24 * 60 * 60 * 1000;

async function handle(event: OutboxEvent) {
  if (event.topic === "foundation.healthcheck") {
    log("info", "outbox.foundation_healthcheck", { eventId: event.id, dedupeKey: event.dedupe_key });
    return;
  }
  if (event.topic === "communication.email.requested") {
    await deliverEmail(pool, event);
    return;
  }
  throw new Error(`No delivery adapter registered for topic ${event.topic}`);
}

async function cycle() {
  await runRetentionCleanup();
  const recovered = await store.recoverStaleLocks(15);
  if (recovered) log("warn", "outbox.stale_locks_recovered", { count: recovered });
  const result = await processOne(store, workerId, handle);
  if (result.outcome !== "empty") log(result.outcome === "completed" ? "info" : "warn", `outbox.${result.outcome}`, { eventId: result.event.id, topic: result.event.topic, attempts: result.event.attempts });
  return result.outcome;
}

async function runRetentionCleanup(force = false) {
  const now = Date.now();
  if (!force && now < nextRetentionCleanupAt) return;
  nextRetentionCleanupAt = now + retentionScheduleCheckMs;
  try {
    const env = readServerEnv();
    const database = pool as unknown as RetentionDatabase;
    if (!await claimWeeklyRetentionCleanup(database, force)) return;
    const storage = createAdminSupabaseClient().storage.from(env.MEDIA_PRIVATE_BUCKET);
    const result = await cleanupExpiredSupportAttachments(database, storage);
    if (result.deleted || result.failures.length) {
      log(result.failures.length ? "warn" : "info", "media.retention_cleanup", {
        scanned: result.scanned,
        deleted: result.deleted,
        skipped: result.skipped,
        failed: result.failures.length,
      });
    }
    if (force && result.failures.length) throw new Error(`${result.failures.length} retained media object(s) could not be deleted.`);
  } catch (error) {
    log("error", "media.retention_cleanup_failed", { error: error instanceof Error ? error.message : "unknown cleanup error" });
    if (force) throw error;
  }
}

async function main() {
  log("info", "worker.started", { workerId, once, cleanupOnly });
  if (cleanupOnly) { await runRetentionCleanup(true); return; }
  if (once) { await cycle(); return; }
  while (true) {
    const outcome = await cycle();
    await new Promise((resolve) => setTimeout(resolve, outcome === "empty" ? 5000 : 100));
  }
}

function shutdown(signal: string) {
  log("info", "worker.stopping", { signal });
  void pool.end().finally(() => process.exit(0));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((error) => {
  log("error", "worker.crashed", { error: error instanceof Error ? error.message : "unknown" });
  void pool.end().finally(() => process.exit(1));
});
