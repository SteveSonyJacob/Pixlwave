import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { receiptDocument } from "@/lib/payments/receipt";

export async function GET(_request: Request, context: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await context.params;
  if (!z.string().uuid().safeParse(transactionId).success) return new Response(null, { status: 404 });
  const client = await createServerSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return new Response(null, { status: 401 });
  const { data: transaction } = await client.from("manual_refund_transactions").select("id,cart_id,provider_refund_id,amount_paise,currency,completed_at").eq("id", transactionId).maybeSingle();
  if (!transaction) return new Response(null, { status: 404 });
  const { data: cart } = await client.from("booking_carts").select("id").eq("id", transaction.cart_id).eq("advertiser_id", user.id).maybeSingle();
  if (!cart) return new Response(null, { status: 404 });
  const { data: allocations } = await client.from("manual_refund_allocations").select("obligation_id,amount_paise").eq("transaction_id", transaction.id);
  if (!allocations?.length || allocations.reduce((sum, item) => sum + Number(item.amount_paise), 0) !== Number(transaction.amount_paise)) return new Response(null, { status: 503 });
  const { data: obligations } = await client.from("refund_obligations").select("id,booking_line_id,reason").in("id", allocations.map((item) => item.obligation_id));
  const byId = new Map((obligations ?? []).map((item) => [item.id, item]));
  const html = receiptDocument("Completed refund confirmation", [
    { label: "Cart", value: transaction.cart_id }, { label: "Razorpay refund", value: transaction.provider_refund_id },
    { label: "Completed (IST)", value: new Date(transaction.completed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Currency", value: transaction.currency },
  ], allocations.map((item) => ({ description: `${byId.get(item.obligation_id)?.reason ?? "Refund"} · booking ${byId.get(item.obligation_id)?.booking_line_id ?? item.obligation_id}`, amountPaise: Number(item.amount_paise) })));
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="pixlwave-refund-${transactionId}.html"`, "Cache-Control": "private, no-store" } });
}
