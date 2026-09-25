"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchRazorpayOrderPayments, fetchRazorpayPayment, fetchRazorpayRefund } from "@/lib/payments/razorpay";

function fail(message: string): never { redirect(`/admin/refunds?error=${encodeURIComponent(message)}`); }

export async function recordManualRefund(form: FormData) {
  const operator = await requireAdminMfa();
  const cartId = String(form.get("cartId") ?? "");
  const refundId = String(form.get("refundId") ?? "").trim();
  const proof = String(form.get("proof") ?? "").trim();
  const completedAt = String(form.get("completedAt") ?? "");
  const completedAtMs = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(completedAt) ? Date.parse(`${completedAt}+05:30`) : Number.NaN;
  const obligationIds = form.getAll("obligationId").map(String);
  if (!z.string().uuid().safeParse(cartId).success || !/^rfnd_[A-Za-z0-9]+$/.test(refundId) || proof.length < 8 ||
      !obligationIds.length || new Set(obligationIds).size !== obligationIds.length || obligationIds.some((id) => !z.string().uuid().safeParse(id).success) ||
      !Number.isFinite(completedAtMs) || completedAtMs > Date.now() + 300_000) fail("Enter a completed refund reference, time, proof and unique line selections.");
  const client = await createServerSupabaseClient();
  const { data: cart } = await client.from("booking_carts").select("id,payment_reference,total_amount_paise").eq("id", cartId).maybeSingle();
  if (!cart?.payment_reference) fail("Funded cart not found.");
  let refund: Awaited<ReturnType<typeof fetchRazorpayRefund>>;
  let payment: Awaited<ReturnType<typeof fetchRazorpayPayment>>;
  try {
    refund = await fetchRazorpayRefund(refundId);
    payment = await fetchRazorpayPayment(cart.payment_reference);
  } catch { fail("Razorpay could not verify these references. Check the provider dashboard and retry later."); }
  if (refund.status !== "processed" || refund.payment_id !== payment.id || payment.status !== "captured" ||
      payment.currency !== "INR" || Number(cart.total_amount_paise) !== payment.amount ||
      (refund.currency && refund.currency !== "INR") || payment.fee == null ||
      completedAtMs < refund.created_at * 1000) fail("Refund must be processed against this captured INR payment and its actual fee must be available.");
  const admin = createAdminSupabaseClient();
  const { error: feeError } = await admin.rpc("sync_razorpay_fee", { payment_id: payment.id, fee: payment.fee, tax: payment.tax ?? null });
  if (feeError) fail(`Gateway fee reconciliation failed: ${feeError.message}`);
  const { error } = await admin.rpc("record_manual_gateway_refund", {
    target_cart: cartId, refund_id: refund.id, payment_id: payment.id, refunded_amount: refund.amount,
    completed_time: new Date(completedAtMs).toISOString(), proof, obligation_ids: obligationIds, operator_id: operator.userId,
  });
  if (error) fail(error.message);
  redirect(`/admin/refunds?message=${encodeURIComponent("Processed Razorpay refund reconciled and recorded. Booking decisions remain unchanged.")}`);
}

export async function checkGatewayOrder(form: FormData) {
  await requireAdminMfa();
  const cartId = String(form.get("cartId") ?? "");
  if (!z.string().uuid().safeParse(cartId).success) fail("Invalid cart.");
  const client = await createServerSupabaseClient();
  const { data: order } = await client.from("payment_orders").select("provider_order_id").eq("cart_id", cartId).maybeSingle();
  if (!order?.provider_order_id) fail("This order needs provider receipt reconciliation first.");
  let payments: Awaited<ReturnType<typeof fetchRazorpayOrderPayments>>;
  try { payments = await fetchRazorpayOrderPayments(order.provider_order_id); }
  catch { fail("Razorpay order payments could not be fetched. Retry after checking the provider dashboard."); }
  const admin = createAdminSupabaseClient();
  for (const payment of payments) {
    if (payment.status !== "captured" || payment.order_id !== order.provider_order_id) continue;
    const { error } = await admin.rpc("note_missing_capture_webhook", { order_id: order.provider_order_id, payment_id: payment.id, amount: payment.amount, payment_currency: payment.currency });
    if (error) fail("A captured payment could not be added to the reconciliation queue.");
  }
  redirect(`/admin/refunds?message=${encodeURIComponent("Provider payments checked. Missing signed captures are flagged below; request original webhook redelivery before funding review.")}`);
}
