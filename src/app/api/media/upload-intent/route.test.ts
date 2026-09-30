import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ server: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: mocks.admin }));
vi.mock("@/lib/config/env", () => ({ readServerEnv: () => ({ MEDIA_PRIVATE_BUCKET: "private", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }) }));
import { POST } from "./route";

let user: { id: string } | null;
let advertiserEnabled: boolean;
let insert: ReturnType<typeof vi.fn>;
let sign: ReturnType<typeof vi.fn>;
const request = (purpose = "creative") => new Request("http://localhost/api/media/upload-intent", { method: "POST", body: JSON.stringify({ purpose, originalName: "creative.png", contentType: "image/png", size: 9_000_000 }) });

beforeEach(() => {
  user = { id: "20000000-0000-4000-8000-000000000001" }; advertiserEnabled = true;
  insert = vi.fn().mockResolvedValue({ error: null });
  sign = vi.fn().mockResolvedValue({ data: { token: "signed.upload.token" }, error: null });
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { advertiser_enabled: advertiserEnabled }, error: null }) };
  mocks.server.mockResolvedValue({ auth: { getUser: async () => ({ data: { user } }) }, from: () => query, rpc: async () => ({ error: null }) });
  mocks.admin.mockReturnValue({ from: () => ({ insert }), storage: { getBucket: async () => ({ error: null }), from: () => ({ createSignedUploadUrl: sign }) } });
});

describe("private signed upload authorization", () => {
  it("returns the dedicated signed TUS endpoint and a new uploader-scoped session", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    const intent = await response.json();
    expect(intent.endpoint).toBe("https://example.storage.supabase.co/storage/v1/upload/resumable/sign");
    expect(intent.objectKey).toMatch(new RegExp(`^${user!.id}/creative/`));
    expect(sign).toHaveBeenCalledWith(intent.objectKey, { upsert: false });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ uploader_id: user!.id, purpose: "creative", listing_id: null, expected_bytes: 9_000_000 }));
  });
  it("does not issue upload credentials to anonymous visitors", async () => {
    user = null;
    expect((await POST(request())).status).toBe(401);
    expect(sign).not.toHaveBeenCalled();
  });
  it("denies creative upload when advertiser mode is disabled", async () => {
    advertiserEnabled = false;
    expect((await POST(request())).status).toBe(403);
    expect(sign).not.toHaveBeenCalled();
  });
  it("does not let a listing upload omit its listing target", async () => {
    expect((await POST(request("listing"))).status).toBe(400);
    expect(sign).not.toHaveBeenCalled();
  });
});
