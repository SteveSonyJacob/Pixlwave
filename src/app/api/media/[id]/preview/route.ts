import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerEnv } from "@/lib/config/env";
import { SIGNED_DOWNLOAD_SECONDS } from "@/lib/media/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const asset = await supabase.from("private_media_assets").select("object_key,purpose,scan_status").eq("id", id).maybeSingle();
  if (asset.error || !asset.data || !["creative", "listing_media"].includes(asset.data.purpose)) return Response.json({ error: "Media not found." }, { status: 404 });
  if (asset.data.scan_status !== "clean") return Response.json({ error: "Media remains quarantined." }, { status: 409 });
  const env = readServerEnv();
  const signed = await createAdminSupabaseClient().storage.from(env.MEDIA_PRIVATE_BUCKET).createSignedUrl(asset.data.object_key, SIGNED_DOWNLOAD_SECONDS);
  if (signed.error) return Response.json({ error: "A safe preview could not be created." }, { status: 503 });
  return NextResponse.redirect(signed.data.signedUrl);
}
