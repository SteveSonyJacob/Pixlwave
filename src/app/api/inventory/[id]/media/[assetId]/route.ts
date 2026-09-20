import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerEnv } from "@/lib/config/env";
import { SIGNED_DOWNLOAD_SECONDS } from "@/lib/media/validation";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: published } = await supabase.from("published_inventory").select("id").eq("id", id).maybeSingle();
  if (!published) return Response.json({ error: "Published listing not found." }, { status: 404 });

  const admin = createAdminSupabaseClient();
  const { data: asset } = await admin.from("private_media_assets").select("object_key").eq("id", assetId).eq("listing_id", id).eq("purpose", "listing_media").eq("scan_status", "clean").maybeSingle();
  if (!asset) return Response.json({ error: "Listing image not found." }, { status: 404 });
  const signed = await admin.storage.from(readServerEnv().MEDIA_PRIVATE_BUCKET).createSignedUrl(asset.object_key, SIGNED_DOWNLOAD_SECONDS);
  if (signed.error) return Response.json({ error: "Listing image is temporarily unavailable." }, { status: 503 });
  return NextResponse.redirect(signed.data.signedUrl);
}
