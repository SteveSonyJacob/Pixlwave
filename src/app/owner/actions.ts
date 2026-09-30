"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/identity";
import { listingInputSchema } from "@/lib/inventory/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { draftError, draftPayloadSchema, type DraftSaveResult } from "@/lib/inventory/drafts";
import { listingFormData, listingFormSchema } from "@/components/listing-form-model";

function text(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
function go(path: string, kind: "message" | "error", value: string): never { redirect(`${path}?${kind}=${encodeURIComponent(value)}`); }

const verificationSchema = z.object({
  legalName: z.string().min(2).max(160), businessType: z.string().min(2).max(80),
  registrationLast4: z.string().regex(/^[A-Za-z0-9]{4}$/), contactPhone: z.string().regex(/^\+[1-9][0-9]{7,14}$/),
  address: z.string().min(10).max(500), documentAssetIds: z.array(z.uuid()).min(1)
});

export async function submitOwnerVerification(form: FormData) {
  await requireIdentity();
  const parsed = verificationSchema.safeParse({ legalName: text(form,"legalName"), businessType: text(form,"businessType"), registrationLast4: text(form,"registrationLast4"), contactPhone: text(form,"contactPhone"), address: text(form,"address"), documentAssetIds: text(form,"documentAssetId").split(",").filter(Boolean) });
  if (!parsed.success) go("/owner", "error", parsed.error.issues[0]?.message ?? "Check the verification form.");
  const { error } = await (await createServerSupabaseClient()).rpc("submit_owner_verification", { input: parsed.data });
  if (error) go("/owner", "error", error.message);
  revalidatePath("/owner");
  go("/owner", "message", "Verification submitted for admin review.");
}

function categoryDetails(form: FormData, category: string) {
  const shared = { pincode: text(form,"pincode"), facingDirection: text(form,"facingDirection"), trafficType: text(form,"trafficType"), visibility: text(form,"visibility"), facilities: text(form,"facilities").split(/[,\n]/).map((value) => value.trim()).filter(Boolean) };
  if (category === "led") return { ...shared, screenWidthPx: Number(text(form,"screenWidthPx")), screenHeightPx: Number(text(form,"screenHeightPx")), physicalWidthMetres: Number(text(form,"physicalWidthMetres")), physicalHeightMetres: Number(text(form,"physicalHeightMetres")), pixelPitch: text(form,"pixelPitch"), dailyCapacity: 1 };
  if (category === "theatre") return { ...shared, venueName: text(form,"venueName"), auditoriumName: text(form,"auditoriumName"), slotsPerShow: Number(text(form,"slotsPerShow")), showStarts: text(form,"showStarts").split(/\r?\n/).map((value) => value.trim()).filter(Boolean) };
  return { ...shared, vehicleLabel: text(form,"vehicleLabel"), rotatingSlots: Number(text(form,"rotatingSlots")), routeName: text(form,"routeName"), routeGeoJson: text(form,"routeGeoJson"), customRouteAllowed: form.get("customRouteAllowed") === "on" };
}

function parseListingForm(form: FormData, errorPath: string) {
  const category = text(form,"category");
  const common = {
    category, title: text(form,"title"), description: text(form,"description"), locality: text(form,"locality"), district: text(form,"district"),
    latitude: text(form,"latitude"), longitude: text(form,"longitude"), sourceProvider: text(form,"sourceProvider"), sourcePlaceId: text(form,"sourcePlaceId"),
    pincode: text(form,"pincode"), facingDirection: text(form,"facingDirection"), trafficType: text(form,"trafficType"), visibility: text(form,"visibility"), facilities: text(form,"facilities").split(/[,\n]/).map((value) => value.trim()).filter(Boolean),
    audienceEstimate: text(form,"audienceEstimate"), audienceBasis: text(form,"audienceBasis"), adDurationSeconds: text(form,"adDurationSeconds"), playsPerUnit: text(form,"playsPerUnit"),
    operatingStart: text(form,"operatingStart"), operatingEnd: text(form,"operatingEnd"), baseRatePaise: Math.round(Number(text(form,"baseRateRupees")) * 100), servicePromise: text(form,"servicePromise")
  };
  const parsed = listingInputSchema.safeParse({ ...common, ...categoryDetails(form, category) });
  if (!parsed.success) go(errorPath, "error", `${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}`);
  return { ...parsed.data, categoryDetails: categoryDetails(form, category), blackouts: text(form,"blackouts").split(/\r?\n/).map((line) => { const [startsOn,endsOn,reason] = line.split("|").map((value) => value?.trim()); return { startsOn, endsOn, reason }; }).filter((item) => item.startsOn && item.endsOn && item.reason) };
}

export async function createListing(form: FormData) {
  const identity = await requireIdentity();
  if (!identity.ownerEnabled) go("/owner", "error", "Owner mode is not enabled.");
  const payload = parseListingForm(form, "/owner/listings/new");
  const { data, error } = await (await createServerSupabaseClient()).rpc("create_inventory_listing", { input: payload });
  if (error) go("/owner/listings/new", "error", error.message);
  const id = (data as { id?: string } | null)?.id;
  revalidatePath("/owner");
  go("/owner", "message", id ? `Draft ${id.slice(0,8)} created. Submit it when ready.` : "Listing draft created.");
}

export async function updateListing(form: FormData) {
  await requireIdentity();
  const listingId = text(form,"listingId");
  if (!z.uuid().safeParse(listingId).success) go("/owner", "error", "Invalid listing.");
  const path = `/owner/listings/${listingId}/edit`;
  const payload = parseListingForm(form, path);
  const { error } = await (await createServerSupabaseClient()).rpc("update_inventory_listing", { target_listing: listingId, input: payload });
  if (error) go(path, "error", error.message);
  revalidatePath("/owner");
  go("/owner", "message", "Listing draft updated.");
}

export async function submitListing(form: FormData) {
  await requireIdentity();
  const listingId = text(form,"listingId");
  if (!z.uuid().safeParse(listingId).success) go("/owner", "error", "Invalid listing.");
  const { error } = await (await createServerSupabaseClient()).rpc("submit_inventory_listing", { target_listing: listingId });
  if (error) go("/owner", "error", error.message);
  revalidatePath("/owner");
  go("/owner", "message", "Listing submitted for admin review.");
}

export async function submitListingRevision(form: FormData) {
  await requireIdentity();
  const revisionId = text(form, "revisionId");
  if (!z.uuid().safeParse(revisionId).success) go("/owner", "error", "Invalid listing revision.");
  const { error } = await (await createServerSupabaseClient()).rpc("submit_inventory_listing_revision", { target_revision: revisionId });
  if (error) go("/owner", "error", error.message);
  revalidatePath("/owner"); revalidatePath("/admin");
  go("/owner", "message", "Replacement revision submitted. The current published listing remains live during review.");
}

export async function reorderListingMedia(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireIdentity();
  const parsed = z.object({ assetIds: z.array(z.uuid()).min(1).max(20) }).strict().safeParse(input);
  if (!parsed.success || new Set(parsed.data.assetIds).size !== parsed.data.assetIds.length) return { ok: false, message: "Choose a valid image order." };
  const { error } = await (await createServerSupabaseClient()).rpc("reorder_listing_media", { asset_ids: parsed.data.assetIds });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/owner");
  return { ok: true };
}

export async function completeListingDraft(input: unknown): Promise<DraftSaveResult> {
  const parsed = z.object({ id: z.uuid(), revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }).strict().safeParse(input);
  if (!parsed.success) return { ok: false, kind: "invalid", message: "Save your draft checkpoint before completing it." };
  const identity = await requireIdentity();
  const supabase = await createServerSupabaseClient();
  const { data: draft, error: readError } = await supabase.from("owner_listing_drafts")
    .select("payload,listing_id,revision").eq("id", parsed.data.id).eq("owner_id", identity.userId).maybeSingle();
  if (readError || !draft) return draftError(readError?.code ?? "42501");
  if (Number(draft.revision) !== parsed.data.revision) return draftError("40001");
  const checkpoint = draftPayloadSchema.safeParse(draft.payload);
  const full = checkpoint.success ? listingFormSchema.safeParse(checkpoint.data) : null;
  if (!full?.success) return { ok: false, kind: "invalid", message: "Complete all required listing details before saving to inventory." };
  const path = draft.listing_id ? `/owner/listings/${draft.listing_id}/edit` : `/owner/listings/new?draft=${parsed.data.id}`;
  const payload = parseListingForm(listingFormData(full.data, draft.listing_id ?? undefined), path);
  const { error } = await supabase.rpc("commit_owner_listing_draft", { target_draft: parsed.data.id, expected_revision: parsed.data.revision, listing_input: payload });
  if (error) return draftError(error.code);
  revalidatePath("/owner");
  go("/owner", "message", "Listing draft saved. Add photos and submit it when ready.");
}
