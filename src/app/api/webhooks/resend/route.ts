import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const trackedEvents = new Set(["email.sent", "email.delivered", "email.delivery_delayed", "email.bounced", "email.complained", "email.failed", "email.suppressed"]);

export async function POST(request: Request) {
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!id || !timestamp || !signature || !secret || secret === "change-me") return Response.json({ error: "Webhook verification is unavailable." }, { status: 503 });
  const payload = await request.text();
  let event: ReturnType<Resend["webhooks"]["verify"]>;
  try {
    event = new Resend().webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret: secret });
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  if (!trackedEvents.has(event.type) || !("email_id" in event.data)) return Response.json({ received: true, tracked: false });
  const { error } = await createAdminSupabaseClient().rpc("record_resend_delivery_event", {
    provider_event_id: id,
    provider_message: event.data.email_id,
    provider_event: event.type,
    event_occurred_at: event.created_at
  });
  if (error) return Response.json({ error: "Delivery event could not be recorded." }, { status: 503 });
  return Response.json({ received: true, tracked: true });
}
