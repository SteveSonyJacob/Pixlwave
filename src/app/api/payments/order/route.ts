import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createRazorpayOrder, readRazorpayConfig } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let configuredOrigin: string;
  try { configuredOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").origin; } catch { return Response.json({ error: "Application URL is not configured." }, { status: 503 }); }
  if (!origin || origin !== configuredOrigin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  let keyId: string;
  try { keyId = readRazorpayConfig().keyId; } catch { return Response.json({ error: "Sandbox checkout is not configured." }, { status: 503 }); }
  const body = z.object({ cartId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid cart." }, { status: 400 });
  const client = await createServerSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to pay." }, { status: 401 });
  const { data: cart } = await client.from("booking_carts").select("id,status,advertiser_id,total_amount_paise,checkout_expires_at").eq("id", body.data.cartId).eq("advertiser_id", user.id).maybeSingle();
  if (!cart || cart.status !== "submitted" || new Date(cart.checkout_expires_at).getTime() <= Date.now()) return Response.json({ error: "Checkout expired. Prepare a fresh quote." }, { status: 409 });
  const admin = createAdminSupabaseClient();
  const { data: claim, error: claimError } = await admin.rpc("claim_cart_payment_order", { target_cart: cart.id });
  if (claimError || !claim) return Response.json({ error: "Checkout could not be claimed." }, { status: 409 });
  const orderClaim = claim.order;
  if (orderClaim.state === "ready") return Response.json({ keyId, orderId: orderClaim.provider_order_id, amount: orderClaim.amount_paise, currency: "INR", cartId: cart.id });
  // The creating claim is durable. An uncertain provider response must be reconciled, never blindly retried.
  if (!claim.created) return Response.json({ error: "Order creation is pending reconciliation. Contact support before retrying." }, { status: 409 });
  try {
    const order = await createRazorpayOrder({ amount: Number(orderClaim.amount_paise), receipt: orderClaim.receipt, cartId: cart.id });
    const { data: attached, error } = await admin.rpc("attach_cart_payment_order", { target_cart: cart.id, provider_id: order.id, provider_amount: order.amount, provider_currency: order.currency, provider_receipt: order.receipt });
    if (error || !attached) throw new Error("Gateway order could not be attached to the cart.");
    return Response.json({ keyId, orderId: order.id, amount: order.amount, currency: "INR", cartId: cart.id });
  } catch {
    return Response.json({ error: "Order creation requires reconciliation. Contact support; no new order will be issued automatically." }, { status: 503 });
  }
}
