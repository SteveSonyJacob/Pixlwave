import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/config/env";
import { SIGNED_DOWNLOAD_SECONDS } from "@/lib/media/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ ticketId: string; assetId: string }> }) {
  const { ticketId, assetId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const { data: ticket } = await supabase.from("support_tickets").select("id").eq("id", ticketId).maybeSingle();
  if (!ticket) return Response.json({ error: "Support ticket not found." }, { status: 404 });
  const { data: asset } = await supabase.from("private_media_assets").select("object_key,scan_status").eq("id", assetId).eq("support_ticket_id", ticketId).eq("purpose", "support_attachment").maybeSingle();
  if (!asset) return Response.json({ error: "Attachment not found." }, { status: 404 });
  if (asset.scan_status !== "clean") return Response.json({ error: "Attachment remains quarantined." }, { status: 409 });
  const signed = await createAdminSupabaseClient().storage.from(readServerEnv().MEDIA_PRIVATE_BUCKET).createSignedUrl(asset.object_key, SIGNED_DOWNLOAD_SECONDS);
  if (signed.error) return Response.json({ error: "Attachment is temporarily unavailable." }, { status: 503 });
  return NextResponse.redirect(signed.data.signedUrl);
}
