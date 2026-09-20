import { randomUUID } from "node:crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerEnv } from "@/lib/config/env";
import { MAX_CREATIVE_BYTES, MAX_VERIFICATION_BYTES, validateUpload } from "@/lib/media/validation";

export const runtime = "nodejs";

function safeName(name: string) {
  return name.normalize("NFKC").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120) || "upload";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const purpose = form.get("purpose");
  if (!(file instanceof File) || (purpose !== "creative" && purpose !== "verification")) {
    return Response.json({ error: "A file and valid purpose are required." }, { status: 400 });
  }
  const maximum = purpose === "creative" ? MAX_CREATIVE_BYTES : MAX_VERIFICATION_BYTES;
  if (file.size > maximum) return Response.json({ error: `File exceeds the ${maximum / 1024 / 1024} MB limit.` }, { status: 413 });
  const limited = await supabase.rpc("check_media_upload_rate");
  if (limited.error) return Response.json({ error: limited.error.message }, { status: 429 });
  if (purpose === "verification") {
    const { data: profile } = await supabase.from("profiles").select("owner_enabled").eq("id", user.id).maybeSingle();
    if (!profile?.owner_enabled) return Response.json({ error: "Owner mode is not enabled." }, { status: 403 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = validateUpload({ bytes, declaredMime: file.type, purpose });
    const env = readServerEnv();
    const admin = createAdminSupabaseClient();
    const bucket = env.MEDIA_PRIVATE_BUCKET;
    const bucketCheck = await admin.storage.getBucket(bucket);
    if (bucketCheck.error && bucketCheck.error.message.toLowerCase().includes("not found")) {
      const created = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 50 * 1024 * 1024 });
      if (created.error) throw created.error;
    } else if (bucketCheck.error) throw bucketCheck.error;

    const objectKey = `${user.id}/${purpose}/${randomUUID()}-${safeName(file.name)}`;
    const stored = await admin.storage.from(bucket).upload(objectKey, bytes, { contentType: detected.mimeType, upsert: false });
    if (stored.error) throw stored.error;
    const retentionDays = purpose === "creative" ? 365 : 180;
    const inserted = await admin.from("private_media_assets").insert({
      uploader_id: user.id,
      purpose: purpose === "verification" ? "owner_verification" : "creative",
      object_key: objectKey,
      original_name: safeName(file.name),
      declared_mime: file.type,
      detected_mime: detected.mimeType,
      byte_size: bytes.byteLength,
      sha256: detected.sha256,
      pixel_width: detected.width,
      pixel_height: detected.height,
      scan_status: "clean",
      scan_engine: "pixlwave-signature-and-eicar-v1",
      scan_completed_at: new Date().toISOString(),
      retention_until: new Date(Date.now() + retentionDays * 86_400_000).toISOString()
    }).select("id,original_name,detected_mime,byte_size,pixel_width,pixel_height,scan_status,retention_until").single();
    if (inserted.error) {
      await admin.storage.from(bucket).remove([objectKey]);
      throw inserted.error;
    }
    return Response.json({ asset: inserted.data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
