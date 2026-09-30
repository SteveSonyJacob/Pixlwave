import { describe, expect, it } from "vitest";
import { listingDefaults } from "@/components/listing-form-model";
import { DraftAutosaver } from "./draft-autosaver";
import { checkpointSchema, type DraftContext, type DraftSaveResult } from "./drafts";

const context: DraftContext = { id: "e32a4c41-d12b-47ed-8dcb-fbc1f6990092", revision: 0, listingId: null, baseUpdatedAt: null, step: 0 };
const initial = { payload: listingDefaults(), step: 0 };
const snapshot = (title: string, step = 0) => ({ payload: { ...initial.payload, title }, step });

describe("draft autosave coordination", () => {
  it("serializes edits arriving during a save and acknowledges only the latest snapshot", async () => {
    let release!: (result: DraftSaveResult) => void;
    const requests: (DraftContext & typeof initial)[] = [];
    const manager = new DraftAutosaver(context, initial, (input) => {
      requests.push(input);
      return requests.length === 1 ? new Promise((resolve) => { release = resolve; }) : Promise.resolve({ ok: true, revision: 2 });
    });
    manager.update(snapshot("First"));
    const saving = manager.flush();
    manager.update(snapshot("Second", 1));
    expect(manager.state.status).toBe("saving");
    expect(requests).toHaveLength(1);
    release({ ok: true, revision: 1 });
    expect(await saving).toBe(true);
    expect(requests.map((item) => [item.payload.title, item.revision])).toEqual([["First", 0], ["Second", 1]]);
    expect(manager.state).toEqual({ status: "saved", revision: 2 });
  });

  it("retries the exact ambiguous request before saving newer edits", async () => {
    const requests: (DraftContext & typeof initial)[] = [];
    const manager = new DraftAutosaver(context, initial, async (input) => {
      requests.push(input);
      if (requests.length === 1) throw new Error("response lost after commit");
      return { ok: true, revision: requests.length - 1 };
    });
    manager.update(snapshot("First"));
    expect(await manager.flush()).toBe(false);
    manager.update(snapshot("Second"));
    expect(await manager.flush()).toBe(true);
    expect(requests[1]).toEqual(requests[0]);
    expect(requests[2].payload.title).toBe("Second");
    expect(requests[2].revision).toBe(1);
  });

  it("blocks writes after a conflict, including final-save flushes", async () => {
    let writes = 0;
    const manager = new DraftAutosaver(context, initial, async () => { writes++; return { ok: false, kind: "conflict", message: "Changed elsewhere" }; });
    manager.update(snapshot("First"));
    expect(await manager.flush()).toBe(false);
    manager.update(snapshot("Second"));
    expect(await manager.flush(true)).toBe(false);
    expect(writes).toBe(1);
    expect(manager.state.status).toBe("conflict");
  });

  it("does not write untouched defaults but forces a checkpoint before final save", async () => {
    let writes = 0;
    const manager = new DraftAutosaver(context, initial, async () => ({ ok: true, revision: ++writes }));
    await manager.flush();
    expect(writes).toBe(0);
    await Promise.all([manager.flush(true), manager.flush(true)]);
    expect(writes).toBe(1);
  });

  it("accepts incomplete drafts while rejecting oversized values and mismatched references", () => {
    expect(checkpointSchema.safeParse({ ...context, ...initial }).success).toBe(true);
    expect(checkpointSchema.safeParse({ ...context, ...snapshot("a".repeat(12001)) }).success).toBe(false);
    expect(checkpointSchema.safeParse({ ...context, ...initial, listingId: context.id }).success).toBe(false);
    expect(checkpointSchema.safeParse({ ...context, ...initial, ownerId: context.id }).success).toBe(false);
  });

  it("stops a checkpoint based on an outdated inventory listing before writing", async () => {
    let writes = 0;
    const manager = new DraftAutosaver({ ...context, stale: true }, initial, async () => ({ ok: true, revision: ++writes }));
    manager.update(snapshot("Changed locally"));
    expect(await manager.flush(true)).toBe(false);
    expect(writes).toBe(0);
  });

  it("sends only the checkpoint contract, excluding server-loaded metadata", async () => {
    const manager = new DraftAutosaver({ ...context, payload: initial.payload, stale: false }, initial, async (input) => {
      expect(checkpointSchema.safeParse(input).success).toBe(true);
      return { ok: true, revision: 1 };
    });
    manager.update(snapshot("New name"));
    expect(await manager.flush()).toBe(true);
  });
});
