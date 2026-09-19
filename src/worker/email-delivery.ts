import type { Pool } from "pg";
import { readResendConfiguration, ResendDeliveryError, sendResendEmail } from "../lib/communication/resend";
import type { NotificationEvent } from "../lib/communication/domain";
import type { OutboxEvent } from "./outbox";

type DeliveryRow = { id: string; status: string; template_key: NotificationEvent; payload: Record<string, unknown>; email: string | null };

export async function deliverEmail(pool: Pool, event: OutboxEvent) {
  const deliveryId = typeof event.payload.deliveryId === "string" ? event.payload.deliveryId : event.aggregate_id;
  if (deliveryId !== event.aggregate_id) throw new Error("Email event aggregate does not match its delivery payload.");
  const selected = await pool.query<DeliveryRow>(`
    select n.id,n.status,n.template_key,n.payload,u.email
    from public.notification_deliveries n join auth.users u on u.id=n.recipient_id
    where n.id=$1 and n.channel='email'
  `, [deliveryId]);
  const delivery = selected.rows[0];
  if (!delivery) throw new Error("Email notification delivery was not found.");
  if (["sent", "delivered", "bounced", "suppressed"].includes(delivery.status)) return;
  if (!delivery.email) {
    await pool.query("update public.notification_deliveries set status='suppressed',attempts=attempts+1,last_error='recipient has no email address' where id=$1", [delivery.id]);
    return;
  }
  try {
    const result = await sendResendEmail({ to: delivery.email, templateKey: delivery.template_key, payload: delivery.payload, deliveryId }, readResendConfiguration());
    await pool.query("update public.notification_deliveries set status='sent',provider_message_id=$2,attempts=attempts+1,sent_at=now(),last_error=null where id=$1", [delivery.id, result.providerMessageId]);
  } catch (error) {
    const retryable = !(error instanceof ResendDeliveryError) || error.retryable;
    const message = error instanceof Error ? error.message : "Resend delivery failed.";
    await pool.query("update public.notification_deliveries set status=$2::public.notification_delivery_status,attempts=attempts+1,last_error=left($3,1000) where id=$1", [delivery.id, retryable ? "queued" : "failed", message]);
    if (retryable) throw error;
  }
}
