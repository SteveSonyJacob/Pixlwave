import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerEnv } from "@/lib/config/env";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const { data: objectKey, error } = await supabase.rpc("remove_listing_media", { target_asset: id });
  if (error || typeof objectKey !== "string") return Response.json({ error: error?.message ?? "Listing media could not be removed." }, { status: error?.code === "42501" ? 403 : 400 });
  const removed = await createAdminSupabaseClient().storage.from(readServerEnv().MEDIA_PRIVATE_BUCKET).remove([objectKey]);
  if (removed.error) return Response.json({ error: "Media was removed from the listing but storage cleanup will be retried." }, { status: 202 });
  return new Response(null, { status: 204 });
}
