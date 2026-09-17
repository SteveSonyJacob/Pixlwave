import os from "node:os";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { log } from "../lib/logging";
import { loadLocalEnvFile } from "../lib/config/load-local-env";
import { PostgresOutboxStore, processOne, type OutboxEvent } from "./outbox";

loadLocalEnvFile();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required by the durable worker.");
const workerId = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const once = process.argv.includes("--once");
const pool = new Pool({ connectionString: databaseUrl, max: 5, application_name: "pixlwave-worker" });
const store = new PostgresOutboxStore(pool);

async function handle(event: OutboxEvent) {
  if (event.topic === "foundation.healthcheck") {
    log("info", "outbox.foundation_healthcheck", { eventId: event.id, dedupeKey: event.dedupe_key });
    return;
  }
  throw new Error(`No delivery adapter registered for topic ${event.topic}`);
}

async function cycle() {
  const recovered = await store.recoverStaleLocks(15);
  if (recovered) log("warn", "outbox.stale_locks_recovered", { count: recovered });
  const result = await processOne(store, workerId, handle);
  if (result.outcome !== "empty") log(result.outcome === "completed" ? "info" : "warn", `outbox.${result.outcome}`, { eventId: result.event.id, topic: result.event.topic, attempts: result.event.attempts });
  return result.outcome;
}

async function main() {
  log("info", "worker.started", { workerId, once });
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
