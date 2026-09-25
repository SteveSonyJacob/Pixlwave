import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { captureEventSchema, failedEventSchema, readRazorpayConfig, verifyWebhookSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let secret: string;
  try { secret = readRazorpayConfig().webhookSecret; } catch { return Response.json({ error: "Webhook unavailable." }, { status: 503 }); }
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"), secret)) return Response.json({ error: "Invalid signature." }, { status: 401 });
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!eventId || eventId.length < 8 || eventId.length > 200) return Response.json({ error: "Event ID required." }, { status: 400 });
  let payload: { event?: string };
  try { payload = JSON.parse(raw) as { event?: string }; } catch { return Response.json({ error: "Invalid event body." }, { status: 400 }); }
  if (payload.event === "payment.failed") {
    const failed = failedEventSchema.safeParse(payload);
    if (!failed.success || failed.data.payload.payment.entity.status !== "failed") return Response.json({ error: "Invalid failure event." }, { status: 400 });
    const payment = failed.data.payload.payment.entity;
    const { error } = await createAdminSupabaseClient().rpc("record_razorpay_failure", {
      event_id: eventId, payment_id: payment.id, order_id: payment.order_id,
      event_time: new Date(failed.data.created_at * 1000).toISOString(),
    });
    if (error) return Response.json({ error: "Failure event could not be recorded; Razorpay should retry." }, { status: 503 });
    return Response.json({ received: true, outcome: "failed" });
  }
  if (payload.event !== "payment.captured") return Response.json({ received: true, ignored: true });
  const parsed = captureEventSchema.safeParse(payload);
  if (!parsed.success || parsed.data.payload.payment.entity.status !== "captured") return Response.json({ error: "Invalid capture event." }, { status: 400 });
  const payment = parsed.data.payload.payment.entity;
  const { data, error } = await createAdminSupabaseClient().rpc("record_razorpay_capture", {
    event_id: eventId, payment_id: payment.id, order_id: payment.order_id, amount: payment.amount,
    payment_currency: payment.currency, event_time: new Date(parsed.data.created_at * 1000).toISOString(),
    fee: payment.fee ?? null, tax: payment.tax ?? null,
  });
  if (error) return Response.json({ error: "Capture could not be recorded; Razorpay should retry." }, { status: 503 });
  return Response.json({ received: true, outcome: data });
}
