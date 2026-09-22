"use server";

import { redirect } from "next/navigation";
import { requireIdentity } from "@/lib/auth/identity";
import { inclusiveIsoDates } from "@/lib/booking/domain";
import { quoteRequestSchema } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function quoteError(listingId: string, message: string): never {
  redirect(`/media/${listingId}?error=${encodeURIComponent(message)}`);
}

export async function createQuote(form: FormData) {
  const listingId = String(form.get("listingId") ?? "");
  const category = String(form.get("category") ?? "");
  const identity = await requireIdentity();
  if (!identity.advertiserEnabled) quoteError(listingId, "Advertiser mode is required to create a quote.");

  let input: unknown;
  if (category === "theatre") {
    input = { category, listingId, units: form.getAll("showInstanceIds").map((showInstanceId) => ({ showInstanceId: String(showInstanceId), quantity: Number(form.get("quantity")) })) };
  } else {
    const start = String(form.get("startDate") ?? "");
    const end = String(form.get("endDate") ?? start);
    let dates: string[];
    try { dates = inclusiveIsoDates(start, end); } catch (error) { quoteError(listingId, error instanceof Error ? error.message : "Choose a valid date range."); }
    input = category === "mobile"
      ? { category, listingId, units: dates.map((date) => ({ date, quantity: Number(form.get("quantity")) })) }
      : { category, listingId, units: dates.map((date) => ({ date })) };
  }

  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) quoteError(listingId, parsed.error.issues[0]?.message ?? "Choose a valid inventory unit.");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_quote_snapshot", { target_listing: listingId, units: parsed.data.units });
  if (error || !data) quoteError(listingId, error?.message ?? "Quote could not be created.");
  redirect(`/quotes/${data.id}`);
}
