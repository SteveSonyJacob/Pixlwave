import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { receiptDocument } from "@/lib/payments/receipt";

export async function GET(_request: Request, context: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await context.params;
  if (!z.string().uuid().safeParse(cartId).success) return new Response(null, { status: 404 });
  const client = await createServerSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return new Response(null, { status: 401 });
  const { data: cart } = await client.from("booking_carts").select("id,advertiser_id,total_amount_paise,currency,paid_at,payment_reference").eq("id", cartId).eq("advertiser_id", user.id).maybeSingle();
  if (!cart?.paid_at || !cart.payment_reference) return new Response(null, { status: 404 });
  const { data: lines } = await client.from("booking_lines").select("id,category,listing_snapshot,requested_units,quantity,unit_amount_paise,paid_amount_paise").eq("cart_id", cartId).order("created_at");
  if (!lines?.length || lines.reduce((sum, line) => sum + Number(line.paid_amount_paise), 0) !== Number(cart.total_amount_paise)) return new Response(null, { status: 503 });
  const html = receiptDocument("Payment receipt", [
    { label: "Cart", value: cart.id }, { label: "Payment reference", value: cart.payment_reference },
    { label: "Captured (IST)", value: new Date(cart.paid_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Currency", value: cart.currency },
  ], lines.map((line) => ({ description: `${(line.listing_snapshot as { title?: string }).title ?? line.category} · ${line.quantity} unit(s) at ₹${(Number(line.unit_amount_paise) / 100).toFixed(2)} · ${JSON.stringify(line.requested_units)}`, amountPaise: Number(line.paid_amount_paise) })));
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="pixlwave-payment-${cartId}.html"`, "Cache-Control": "private, no-store" } });
}
