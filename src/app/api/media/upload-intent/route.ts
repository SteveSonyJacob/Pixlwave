import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerEnv } from "@/lib/config/env";
import { MAX_CREATIVE_BYTES } from "@/lib/media/validation";

export const runtime = "nodejs";

const uploadFields = { originalName: z.string().min(1).max(200), size: z.number().int().positive().max(MAX_CREATIVE_BYTES) };
const inputSchema = z.discriminatedUnion("purpose", [
  z.object({ purpose: z.literal("listing"), listingId: z.uuid(), revisionId: z.uuid().nullable().optional(), contentType: z.enum(["image/png", "image/jpeg"]), ...uploadFields }).strict(),
  z.object({ purpose: z.literal("creative"), contentType: z.enum(["image/png", "image/jpeg", "video/mp4", "video/webm"]), ...uploadFields }).strict()
]);

function safeName(name: string) {
  return name.normalize("NFKC").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120) || "upload";
}

function resumableEndpoint(projectUrl: string) {
  const url = new URL(projectUrl);
  const projectRef = url.hostname.endsWith(".supabase.co") ? url.hostname.split(".")[0] : null;
  // Signed upload tokens are validated by the dedicated /sign route.
  return projectRef ? `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable/sign` : `${url.origin}/storage/v1/upload/resumable/sign`;
}

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Valid private media details are required." }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  let listingId: string | null = null;
  let revisionId: string | null = null;
  if (parsed.data.purpose === "listing") {
    const { data: listing, error } = await supabase.from("inventory_listings").select("id,status").eq("id", parsed.data.listingId).eq("owner_id", user.id).maybeSingle();
    if (error) return Response.json({ error: "Listing access could not be checked." }, { status: 503 });
    if (!listing) return Response.json({ error: "Listing not found." }, { status: 404 });
    listingId = listing.id;
    revisionId = parsed.data.revisionId ?? null;
    if (["draft", "rejected"].includes(listing.status)) {
      if (revisionId) return Response.json({ error: "Initial draft media cannot target a replacement revision." }, { status: 409 });
    } else if (listing.status === "published") {
      if (!revisionId) return Response.json({ error: "Save a replacement revision before uploading new public media." }, { status: 409 });
      const { data: revision, error: revisionError } = await supabase.from("inventory_listing_revisions").select("id,status").eq("id", revisionId).eq("listing_id", listing.id).eq("owner_id", user.id).maybeSingle();
      if (revisionError) return Response.json({ error: "Replacement revision access could not be checked." }, { status: 503 });
      if (!revision || !["draft", "rejected"].includes(revision.status)) return Response.json({ error: "Replacement revision is not editable." }, { status: 403 });
    } else return Response.json({ error: "Listing media cannot be changed in its current state." }, { status: 403 });
  } else {
    const { data: profile, error } = await supabase.from("profiles").select("advertiser_enabled").eq("id", user.id).maybeSingle();
    if (error) return Response.json({ error: "Advertiser access could not be checked." }, { status: 503 });
    if (!profile?.advertiser_enabled) return Response.json({ error: "Advertiser mode is required." }, { status: 403 });
  }

  const limited = await supabase.rpc("check_media_upload_rate");
  if (limited.error) return Response.json({ error: limited.error.message }, { status: 429 });
  const env = readServerEnv();
  const admin = createAdminSupabaseClient();
  const bucket = env.MEDIA_PRIVATE_BUCKET;
  const bucketCheck = await admin.storage.getBucket(bucket);
  if (bucketCheck.error?.message.toLowerCase().includes("not found")) {
    const created = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: MAX_CREATIVE_BYTES });
    if (created.error) return Response.json({ error: "Private media storage is unavailable." }, { status: 503 });
  } else if (bucketCheck.error) return Response.json({ error: "Private media storage is unavailable." }, { status: 503 });

  const id = randomUUID();
  const objectKey = `${user.id}/${parsed.data.purpose}/${id}-${safeName(parsed.data.originalName)}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const inserted = await admin.from("media_upload_sessions").insert({
    id, uploader_id: user.id, purpose: parsed.data.purpose, listing_id: listingId, listing_revision_id: revisionId,
    object_key: objectKey, original_name: safeName(parsed.data.originalName), declared_mime: parsed.data.contentType,
    expected_bytes: parsed.data.size, expires_at: expiresAt
  });
  if (inserted.error) return Response.json({ error: "Upload session could not be created." }, { status: 503 });
  const signed = await admin.storage.from(bucket).createSignedUploadUrl(objectKey, { upsert: false });
  if (signed.error) {
    await admin.from("media_upload_sessions").update({ status: "failed", error_message: "Upload authorization failed." }).eq("id", id);
    return Response.json({ error: "Upload authorization could not be created." }, { status: 503 });
  }
  return Response.json({ sessionId: id, endpoint: resumableEndpoint(env.NEXT_PUBLIC_SUPABASE_URL), bucket, objectKey, token: signed.data.token, expiresAt });
}
