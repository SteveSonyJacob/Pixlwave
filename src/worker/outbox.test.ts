import { describe, expect, it } from "vitest";
import { processOne, type OutboxEvent, type OutboxStore } from "./outbox";

class MemoryStore implements OutboxStore {
  event: OutboxEvent | null;
  completed = 0;
  retried = 0;
  constructor(event: OutboxEvent) { this.event = event; }
  async claim() { const value = this.event; this.event = null; return value; }
  async complete() { this.completed += 1; }
  async retry(event: OutboxEvent) { this.retried += 1; this.event = event; }
  async recoverStaleLocks() { return 0; }
}

const event = { id: "1", topic: "foundation.healthcheck", aggregate_type: "system", aggregate_id: "1", payload: {}, attempts: 1, max_attempts: 3, dedupe_key: "same" };

describe("durable outbox processing", () => {
  it("records completion once", async () => {
    const store = new MemoryStore(event);
    expect((await processOne(store, "worker-a", async () => {})).outcome).toBe("completed");
    expect(store.completed).toBe(1);
    expect((await processOne(store, "worker-b", async () => {})).outcome).toBe("empty");
  });
  it("returns failed work for persisted retry", async () => {
    const store = new MemoryStore(event);
    expect((await processOne(store, "worker-a", async () => { throw new Error("temporary"); })).outcome).toBe("retry");
    expect(store.retried).toBe(1);
    expect(store.event?.dedupe_key).toBe("same");
  });
});
