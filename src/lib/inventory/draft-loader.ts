import "server-only";
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { draftPayloadSchema, type DraftContext } from "./drafts";

export async function loadListingDraft(ownerId: string, listing?: { id: string; updatedAt: string }, draftId?: string): Promise<DraftContext | undefined> {
  if (draftId && !z.uuid().safeParse(draftId).success) notFound();
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("owner_listing_drafts").select("id,revision,listing_id,base_updated_at,payload,step,status,result_listing_id").eq("owner_id", ownerId);
  if (draftId) query = query.eq("id", draftId);
  else if (listing) query = query.eq("listing_id", listing.id).eq("status", "active");
  // Even new forms check migration availability; never claim autosave is active without its table.
  else query = query.eq("id", randomUUID());
  const { data, error } = await query.maybeSingle();
  if (error && !draftId && ["42P01", "PGRST205"].includes(error.code)) return undefined;
  if (error) throw new Error("Draft storage is unavailable. Please try again later.");
  if (draftId && !data) notFound();
  if (data?.status === "committed") redirect(`/owner/listings/${data.result_listing_id}/edit`);
  if (data?.status === "discarded") notFound();
  if (data) {
    if (data.listing_id !== (listing?.id ?? null)) notFound();
    const payload = draftPayloadSchema.safeParse(data.payload);
    if (!payload.success) throw new Error("The saved draft cannot be loaded. Contact support before editing it.");
    return { id: data.id, revision: Number(data.revision), listingId: data.listing_id, baseUpdatedAt: data.base_updated_at, step: data.step, payload: payload.data, stale: Boolean(listing && data.base_updated_at !== listing.updatedAt) };
  }
  return { id: randomUUID(), revision: 0, listingId: listing?.id ?? null, baseUpdatedAt: listing?.updatedAt ?? null, step: 0 };
}
