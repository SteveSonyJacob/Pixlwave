"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function text(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
function go(kind: "message" | "error", value: string): never { redirect(`/admin?${kind}=${encodeURIComponent(value)}`); }
function uuid(form: FormData, name: string) { const value = text(form,name); if (!z.uuid().safeParse(value).success) go("error","Invalid record identifier."); return value; }

export async function reviewOwner(form: FormData) {
  await requireAdminMfa();
  const decision = text(form,"decision");
  if (!["approved","rejected","suspended"].includes(decision)) go("error","Invalid verification decision.");
  const { error } = await (await createServerSupabaseClient()).rpc("review_owner_verification", { target_owner: uuid(form,"ownerId"), decision, reason: text(form,"reason") || null });
  if (error) go("error",error.message);
  revalidatePath("/admin"); revalidatePath("/owner");
  go("message",`Owner verification ${decision}.`);
}

export async function reviewListing(form: FormData) {
  await requireAdminMfa();
  const decision = text(form,"decision");
  if (!["published","rejected"].includes(decision)) go("error","Invalid listing decision.");
  const { error } = await (await createServerSupabaseClient()).rpc("review_inventory_listing", { target_listing: uuid(form,"listingId"), decision, reason: text(form,"reason") || null });
  if (error) go("error",error.message);
  revalidatePath("/admin"); revalidatePath("/owner"); revalidatePath("/api/inventory/published");
  go("message",`Listing ${decision}.`);
}

export async function changeRate(form: FormData) {
  await requireAdminMfa();
  const amount = Math.round(Number(text(form,"rateRupees")) * 100);
  if (!Number.isInteger(amount) || amount < 10000) go("error","Enter a valid rate of at least ₹100.");
  const { error } = await (await createServerSupabaseClient()).rpc("change_published_rate", { target_listing: uuid(form,"listingId"), new_amount_paise: amount, discussion_note: text(form,"discussionNote"), reason: text(form,"reason") });
  if (error) go("error",error.message);
  revalidatePath("/admin"); revalidatePath("/owner"); revalidatePath("/api/inventory/published");
  go("message","Published rate changed with an audit revision.");
}

export async function suspendListing(form: FormData) {
  await requireAdminMfa();
  const { error } = await (await createServerSupabaseClient()).rpc("suspend_inventory_listing", { target_listing: uuid(form,"listingId"), reason: text(form,"reason") });
  if (error) go("error",error.message);
  revalidatePath("/admin"); revalidatePath("/owner"); revalidatePath("/api/inventory/published");
  go("message","Listing suspended and removed from public inventory.");
}
