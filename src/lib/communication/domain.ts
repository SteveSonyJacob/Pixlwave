export type NotificationRole = "advertiser" | "owner" | "admin";
export type NotificationChannel = "in_app" | "email" | "sms";
export type NotificationEvent =
  | "payment.received"
  | "review.due"
  | "review.overdue_rejected"
  | "booking.decision"
  | "booking.cancelled"
  | "refund.pending_manual"
  | "refund.completed"
  | "campaign.scheduled_start"
  | "support.ticket.created"
  | "support.ticket.reply"
  | "support.ticket.admin_new"
  | "support.ticket.admin_reply"
  | "support.ticket.status";

export type NotificationTemplate = { subject: string; body: string; channels: NotificationChannel[] };

const templates: Record<NotificationEvent, NotificationTemplate> = {
  "payment.received": { subject: "Payment received — awaiting admin confirmation", body: "Payment was received. Inventory is not reserved until an administrator confirms the request.", channels: ["in_app", "email"] },
  "review.due": { subject: "Request review is due", body: "An administrator review deadline is approaching. Eligibility is calculated from the recorded deadline, not notification delivery time.", channels: ["in_app", "email"] },
  "review.overdue_rejected": { subject: "Request closed after review deadline", body: "The review deadline passed without confirmation. Check the request record for the recorded outcome.", channels: ["in_app", "email"] },
  "booking.decision": { subject: "Your request has an update", body: "An administrator recorded a decision. Open Pixlwave for the current status and terms.", channels: ["in_app", "email"] },
  "booking.cancelled": { subject: "Booking cancellation recorded", body: "The cancellation is recorded. Refund status, if applicable, is tracked separately.", channels: ["in_app", "email"] },
  "refund.pending_manual": { subject: "Manual refund is pending", body: "An administrator must complete the refund outside Pixlwave and record its reference before it is marked complete.", channels: ["in_app", "email"] },
  "refund.completed": { subject: "Refund marked complete", body: "An administrator recorded completion and the external refund reference is available in the request history.", channels: ["in_app", "email"] },
  "campaign.scheduled_start": { subject: "Campaign window is scheduled to start", body: "The scheduled campaign window has started. This notice does not claim observed playback or verified completion.", channels: ["in_app", "email"] },
  "support.ticket.created": { subject: "Support ticket received", body: "Your support ticket is open. Replies and status changes remain available in Pixlwave.", channels: ["in_app", "email"] },
  "support.ticket.reply": { subject: "New support reply", body: "A public reply was added to your support ticket. Private administrator notes are never included.", channels: ["in_app", "email"] },
  "support.ticket.admin_new": { subject: "New support ticket", body: "A customer opened a support ticket. Open the MFA-protected support queue to review it.", channels: ["in_app", "email"] },
  "support.ticket.admin_reply": { subject: "Customer replied to support", body: "A customer added a reply. Private administrator notes remain internal.", channels: ["in_app", "email"] },
  "support.ticket.status": { subject: "Support ticket status updated", body: "The status of your support ticket changed. Open Pixlwave to review its current state.", channels: ["in_app", "email"] }
};

export function templateFor(event: NotificationEvent) { return templates[event]; }

export function recipientsFor(event: NotificationEvent): NotificationRole[] {
  if (event === "review.due" || event === "refund.pending_manual") return ["admin"];
  if (event.startsWith("support.ticket.admin")) return ["admin"];
  if (event.startsWith("support.")) return ["advertiser", "admin"];
  if (event === "campaign.scheduled_start") return ["advertiser", "owner", "admin"];
  return ["advertiser", "admin"];
}

export function nextRetryAt(attempts: number, now = new Date()) {
  const bounded = Math.max(0, Math.min(attempts, 8));
  return new Date(now.getTime() + Math.min(2 ** bounded * 30_000, 3_600_000));
}
