"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
function value(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
function fail(path: string, message: string): never { redirect(`${path}?error=${encodeURIComponent(message)}`); }

export async function addQuoteToCart(form: FormData) {
  const identity = await requireIdentity();
  if (!identity.advertiserEnabled) fail("/advertiser", "Advertiser mode is required.");
  const quoteId = value(form, "quoteId");
  const creativeAssetId = value(form, "creativeAssetId");
  if (!idSchema.safeParse(quoteId).success || !idSchema.safeParse(creativeAssetId).success) fail(`/quotes/${quoteId}`, "Choose a clean creative from your library.");
  const customRouteRequested = value(form, "customRouteRequested") === "true";
  let requestedRoute: unknown;
  const routeText = value(form, "requestedRoute");
  if (routeText) {
    try { requestedRoute = JSON.parse(routeText); } catch { fail(`/quotes/${quoteId}`, "The custom route must be valid GeoJSON."); }
  }
  const { data, error } = await (await createServerSupabaseClient()).rpc("add_quote_to_cart", {
    target_quote: quoteId,
    target_creative: creativeAssetId,
    configuration: { customRouteRequested, routeName: value(form, "routeName") || undefined, requestedRoute },
  });
  if (error || !data) fail(`/quotes/${quoteId}`, error?.message ?? "The quote could not be added to the cart.");
  redirect(`/cart?message=${encodeURIComponent("Quote added. Its price, service terms, units and creative are now frozen in this cart line.")}`);
}

export async function removeCartLine(form: FormData) {
  await requireIdentity();
  const lineId = value(form, "lineId");
  if (!idSchema.safeParse(lineId).success) fail("/cart", "Invalid cart line.");
  const { error } = await (await createServerSupabaseClient()).rpc("remove_open_cart_line", { target_line: lineId });
  if (error) fail("/cart", error.message);
  redirect(`/cart?message=${encodeURIComponent("Line removed from the open cart.")}`);
}

export async function submitCart(form: FormData) {
  await requireIdentity();
  const cartId = value(form, "cartId");
  if (!idSchema.safeParse(cartId).success) fail("/cart", "Invalid cart.");
  const { error } = await (await createServerSupabaseClient()).rpc("submit_booking_cart", { target_cart: cartId });
  if (error) fail("/cart", error.message);
  redirect(`/cart?message=${encodeURIComponent("Cart frozen for payment. Phase 5 will connect Razorpay; this phase accepts funding only through the restricted test harness.")}`);
}

export async function cancelBookingLine(form: FormData) {
  await requireIdentity();
  const lineId = value(form, "lineId");
  if (!idSchema.safeParse(lineId).success) fail("/bookings", "Invalid booking line.");
  const { error } = await (await createServerSupabaseClient()).rpc("cancel_booking_line", { target_line: lineId });
  if (error) fail("/bookings", error.message);
  redirect(`/bookings?message=${encodeURIComponent("Cancellation recorded. A 95% manual refund obligation is now pending; no money was moved automatically.")}`);
}
