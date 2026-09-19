"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/identity";
import { listingInputSchema } from "@/lib/inventory/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  if (category === "led") return { screenWidthPx: Number(text(form,"screenWidthPx")), screenHeightPx: Number(text(form,"screenHeightPx")), physicalWidthMetres: Number(text(form,"physicalWidthMetres")), physicalHeightMetres: Number(text(form,"physicalHeightMetres")), dailyCapacity: 1 };
  if (category === "theatre") return { venueName: text(form,"venueName"), auditoriumName: text(form,"auditoriumName"), slotsPerShow: Number(text(form,"slotsPerShow")), showStarts: text(form,"showStarts").split(/\r?\n/).map((value) => value.trim()).filter(Boolean) };
  return { vehicleLabel: text(form,"vehicleLabel"), rotatingSlots: Number(text(form,"rotatingSlots")), routeName: text(form,"routeName"), routeGeoJson: text(form,"routeGeoJson"), customRouteAllowed: form.get("customRouteAllowed") === "on" };
}

function parseListingForm(form: FormData, errorPath: string) {
  const category = text(form,"category");
  const common = {
    category, title: text(form,"title"), description: text(form,"description"), locality: text(form,"locality"), district: text(form,"district"),
    latitude: text(form,"latitude"), longitude: text(form,"longitude"), sourceProvider: text(form,"sourceProvider"), sourcePlaceId: text(form,"sourcePlaceId"),
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
