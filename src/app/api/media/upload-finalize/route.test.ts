import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ server: vi.fn(), admin: vi.fn(), validate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: mocks.admin }));
vi.mock("@/lib/config/env", () => ({ readServerEnv: () => ({ MEDIA_PRIVATE_BUCKET: "private" }) }));
vi.mock("@/lib/media/validation", () => ({ validateUpload: mocks.validate }));
import { POST } from "./route";

const sessionId = "60000000-0000-4000-8000-000000000001";
const userId = "20000000-0000-0000-0000-000000000001";
const request = () => new Request("http://localhost/api/media/upload-finalize", { method: "POST", body: JSON.stringify({ sessionId }) });
const fixture = () => ({ id: sessionId, uploader_id: userId, status: "issued", purpose: "creative", expected_bytes: 20, declared_mime: "image/png", object_key: `${userId}/creative/object.png`, expires_at: new Date(Date.now() + 60_000).toISOString(), finalized_asset_id: null as string | null });
let session: ReturnType<typeof fixture>;
let user: { id: string } | null;
let download: ReturnType<typeof vi.fn>;
let remove: ReturnType<typeof vi.fn>;
let rpc: ReturnType<typeof vi.fn>;
let filters = vi.fn<(key: string, value: string) => void>();

beforeEach(() => {
  session = fixture(); user = { id: userId };
  download = vi.fn().mockResolvedValue({ data: new Blob([new Uint8Array(20)]), error: null });
  remove = vi.fn().mockResolvedValue({ error: null });
  rpc = vi.fn().mockResolvedValue({ data: { id: "asset" }, error: null });
  filters = vi.fn();
  const serverQuery = { select: () => serverQuery, eq: (key: string, value: string) => { filters(key, value); return serverQuery; }, maybeSingle: async () => ({ data: session, error: null }) };
  mocks.server.mockResolvedValue({ auth: { getUser: async () => ({ data: { user } }) }, from: () => serverQuery });
  const assetQuery = { select: () => assetQuery, eq: () => assetQuery, maybeSingle: async () => ({ data: { id: "asset", original_name: "creative.png" }, error: null }) };
  mocks.admin.mockReturnValue({ storage: { from: () => ({ download, remove }) }, from: () => assetQuery, rpc });
  mocks.validate.mockReturnValue({ mimeType: "image/png", sha256: "e".repeat(64), width: 1920, height: 1080 });
});

describe("private upload finalization", () => {
  it("denies unauthenticated requests before storage access", async () => {
    user = null;
    expect((await POST(request())).status).toBe(401);
    expect(download).not.toHaveBeenCalled();
  });
  it("scopes the session to the authenticated uploader and commits validated metadata", async () => {
    expect((await POST(request())).status).toBe(201);
    expect(filters).toHaveBeenCalledWith("uploader_id", userId);
    expect(rpc).toHaveBeenCalledWith("finalize_private_upload", expect.objectContaining({ target_uploader: userId, validated_metadata: expect.objectContaining({ bytes: 20, mime: "image/png" }) }));
    expect(remove).not.toHaveBeenCalled();
  });
  it("returns a finalized asset without downloading or inserting it again", async () => {
    session.status = "finalized"; session.finalized_asset_id = "asset";
    expect((await POST(request())).status).toBe(200);
    expect(download).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("retains bytes after a transient storage failure so the user can retry", async () => {
    download.mockResolvedValue({ data: null, error: { message: "Temporary failure" } });
    expect((await POST(request())).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
  it("rejects a content mismatch before allowing deletion", async () => {
    mocks.validate.mockImplementation(() => { throw new Error("Signature mismatch"); });
    rpc.mockResolvedValue({ data: session.object_key, error: null });
    expect((await POST(request())).status).toBe(400);
    expect(rpc).toHaveBeenCalledWith("reject_private_upload", expect.objectContaining({ rejection: "Signature mismatch" }));
    expect(remove).toHaveBeenCalledWith([session.object_key]);
  });
  it("does not delete an asset when a concurrent finalization already committed", async () => {
    mocks.validate.mockImplementation(() => { throw new Error("Signature mismatch"); });
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await POST(request())).status).toBe(400);
    expect(remove).not.toHaveBeenCalled();
  });
  it("keeps a valid uploaded file after a database timeout", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57014" } });
    expect((await POST(request())).status).toBe(503);
    expect(remove).not.toHaveBeenCalled();
  });
});
