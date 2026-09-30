import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerEnv } from "@/lib/config/env";
import { validateUpload } from "@/lib/media/validation";

export const runtime = "nodejs";
const assetColumns = "id,original_name,detected_mime,byte_size,pixel_width,pixel_height,duration_seconds,scan_status,display_order";

export async function POST(request: Request) {
  const parsed = z.object({ sessionId: z.uuid() }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Upload session is required." }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const { data: session, error: sessionError } = await supabase.from("media_upload_sessions").select("*").eq("id", parsed.data.sessionId).eq("uploader_id", user.id).maybeSingle();
  if (sessionError) return Response.json({ error: "Upload session could not be loaded." }, { status: 503 });
  if (!session) return Response.json({ error: "Upload session not found." }, { status: 404 });
  const admin = createAdminSupabaseClient();
  if (session.status === "finalized" && session.finalized_asset_id) {
    const { data: asset } = await admin.from("private_media_assets").select(assetColumns).eq("id", session.finalized_asset_id).maybeSingle();
    return asset ? Response.json({ asset }) : Response.json({ error: "Finalized media is unavailable." }, { status: 503 });
  }
  if (session.status !== "issued" || new Date(session.expires_at).getTime() <= Date.now()) return Response.json({ error: "Upload session expired or cannot be finalized." }, { status: 409 });
  if (session.purpose !== "listing" && session.purpose !== "creative") return Response.json({ error: "Unsupported upload purpose." }, { status: 400 });
  const bucket = readServerEnv().MEDIA_PRIVATE_BUCKET;
  const downloaded = await admin.storage.from(bucket).download(session.object_key);
  if (downloaded.error || !downloaded.data) return Response.json({ error: "Uploaded object is unavailable. Retry when the upload has completed." }, { status: 503 });
  let detected: ReturnType<typeof validateUpload>;
  try {
    if (downloaded.data.size !== Number(session.expected_bytes)) throw new Error("Uploaded size does not match the requested file.");
    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    detected = validateUpload({ bytes, declaredMime: session.declared_mime, purpose: session.purpose });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload validation failed.";
    const rejected = await admin.rpc("reject_private_upload", { target_session: session.id, target_uploader: user.id, rejection: message });
    if (rejected.error) return Response.json({ error: "Validation could not be recorded. Retry later." }, { status: 503 });
    if (rejected.data) await admin.storage.from(bucket).remove([rejected.data]);
    return Response.json({ error: message }, { status: 400 });
  }
  const result = await admin.rpc("finalize_private_upload", {
    target_session: session.id, target_uploader: user.id,
    validated_metadata: { mime: detected.mimeType, bytes: Number(session.expected_bytes), sha256: detected.sha256, width: detected.width, height: detected.height }
  });
  if (result.error || !result.data) {
    const conflict = result.error && ["42501", "22023"].includes(result.error.code);
    return Response.json({ error: conflict ? "Upload access changed or the session expired. Start a new upload from the current page." : "Validation passed but saving needs a retry. Your uploaded file has been retained." }, { status: conflict ? 409 : 503 });
  }
  // Return only the public shape of this private asset, never its object key/hash.
  const { data: asset } = await admin.from("private_media_assets").select(assetColumns).eq("id", result.data.id).maybeSingle();
  return asset ? Response.json({ asset }, { status: 201 }) : Response.json({ error: "Media was saved. Retry to retrieve the result." }, { status: 503 });
}
