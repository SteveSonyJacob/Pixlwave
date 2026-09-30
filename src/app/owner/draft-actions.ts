"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkpointSchema, draftError, type DraftSaveResult } from "@/lib/inventory/drafts";
import { z } from "zod";

export async function saveListingCheckpoint(input: unknown): Promise<DraftSaveResult> {
  const parsed = checkpointSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: "invalid", message: "Some draft fields exceed the allowed size or format. Check your entries before retrying." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return draftError("42501");
  const value = parsed.data;
  // RPC repeats ownership/verification checks and performs a locked revision comparison.
  const { data, error } = await supabase.rpc("save_owner_listing_draft", {
    target_draft: value.id, expected_revision: value.revision, draft_payload: value.payload, draft_step: value.step,
    target_listing: value.listingId, expected_listing_updated_at: value.baseUpdatedAt
  });
  if (error) return draftError(error.code);
  if (!data || !Number.isSafeInteger(Number(data.revision))) return draftError();
  return { ok: true, revision: Number(data.revision) };
}

export async function discardListingCheckpoint(input: unknown): Promise<DraftSaveResult> {
  const parsed = z.object({ id: z.uuid(), revision: z.number().int().positive() }).strict().safeParse(input);
  if (!parsed.success) return { ok: false, kind: "invalid", message: "The draft could not be discarded." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return draftError("42501");
  const { error } = await supabase.rpc("discard_owner_listing_draft", { target_draft: parsed.data.id, expected_revision: parsed.data.revision });
  if (error) return draftError(error.code);
  return { ok: true, revision: parsed.data.revision };
}
