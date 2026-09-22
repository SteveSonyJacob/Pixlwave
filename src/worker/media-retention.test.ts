import { describe, expect, it, vi } from "vitest";
import { claimWeeklyRetentionCleanup, cleanupExpiredSupportAttachments, type RetentionDatabase } from "./media-retention";

function databaseWithAsset(recorded = true) {
  const query = vi.fn()
    .mockResolvedValueOnce({ rows: [], rowCount: 1 })
    .mockResolvedValueOnce({ rows: [{ id: "job-1", asset_id: "asset-1", object_key: "private/asset-1.pdf" }], rowCount: 1 })
    .mockResolvedValueOnce({ rows: recorded ? [{ subject_id: "asset-1" }] : [], rowCount: recorded ? 1 : 0 });
  return { query } as unknown as RetentionDatabase;
}

describe("support attachment retention cleanup", () => {
  it("uses the durable weekly schedule gate unless an operator forces a run", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    const database = { query } as unknown as RetentionDatabase;
    await expect(claimWeeklyRetentionCleanup(database)).resolves.toBe(false);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("interval '7 days'"), [false]);
    await claimWeeklyRetentionCleanup(database, true);
    expect(query).toHaveBeenLastCalledWith(expect.any(String), [true]);
  });

  it("deletes an expired object and records database evidence", async () => {
    const database = databaseWithAsset();
    const storage = { remove: vi.fn().mockResolvedValue({ error: null }) };
    const result = await cleanupExpiredSupportAttachments(database, storage);
    expect(storage.remove).toHaveBeenCalledWith(["private/asset-1.pdf"]);
    expect(result).toEqual({ scanned: 1, deleted: 1, skipped: 0, failures: [] });
  });

  it("keeps a durable pending job when storage deletion fails so a later run can retry", async () => {
    const database = databaseWithAsset();
    const storage = { remove: vi.fn().mockResolvedValue({ error: { message: "temporary storage failure" } }) };
    const result = await cleanupExpiredSupportAttachments(database, storage);
    expect(result.deleted).toBe(0);
    expect(result.failures).toEqual([{ assetId: "asset-1", error: "temporary storage failure" }]);
    expect(database.query).toHaveBeenCalledTimes(3);
  });

  it("bounds batch sizes", async () => {
    const database = databaseWithAsset();
    const storage = { remove: vi.fn().mockResolvedValue({ error: null }) };
    await expect(cleanupExpiredSupportAttachments(database, storage, 0)).rejects.toThrow("between 1 and 500");
    expect(database.query).not.toHaveBeenCalled();
  });
});
