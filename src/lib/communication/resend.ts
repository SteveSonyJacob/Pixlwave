import { Resend } from "resend";
import { z } from "zod";
import { templateFor, type NotificationEvent } from "./domain";

const resendEnvSchema = z.object({
  APP_EMAIL_PROVIDER: z.literal("resend"),
  RESEND_API_KEY: z.string().startsWith("re_").min(8).refine((value) => value !== "change-me", "must be configured"),
  RESEND_FROM: z.string().min(5).refine((value) => /<[^<>\s]+@[^<>\s]+>$/.test(value) || /^[^\s@]+@[^\s@]+$/.test(value), "must contain a sender email"),
  NEXT_PUBLIC_APP_URL: z.url()
});

export type ResendConfiguration = z.infer<typeof resendEnvSchema>;
type ResendClient = Pick<Resend, "emails">;

export function readResendConfiguration(source: Record<string, string | undefined> = process.env) {
  const parsed = resendEnvSchema.safeParse(source);
  if (!parsed.success) throw new Error(`Invalid Resend configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return parsed.data;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function renderNotificationEmail(templateKey: NotificationEvent, payload: Record<string, unknown>, appUrl: string) {
  const template = templateFor(templateKey);
  const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : null;
  const adminTemplate = templateKey === "support.ticket.admin_new" || templateKey === "support.ticket.admin_reply";
  const link = ticketId ? new URL(`${adminTemplate ? "/admin/support/" : "/support/"}${ticketId}`, appUrl).toString() : appUrl;
  const context = typeof payload.subject === "string" ? payload.subject.slice(0, 160) : null;
  const text = `${template.body}${context ? `\n\nTicket: ${context}` : ""}\n\nOpen Pixlwave: ${link}`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#10233d"><h1 style="font-size:22px">${escapeHtml(template.subject)}</h1><p>${escapeHtml(template.body)}</p>${context ? `<p><strong>Ticket:</strong> ${escapeHtml(context)}</p>` : ""}<p><a href="${escapeHtml(link)}">Open Pixlwave</a></p><p style="font-size:12px;color:#68798b">Delivery timing does not change any review deadline, booking state, or campaign state.</p></div>`;
  return { subject: template.subject, text, html };
}

export async function sendResendEmail(input: { to: string; templateKey: NotificationEvent; payload: Record<string, unknown>; deliveryId: string }, configuration: ResendConfiguration, client: ResendClient = new Resend(configuration.RESEND_API_KEY)) {
  const content = renderNotificationEmail(input.templateKey, input.payload, configuration.NEXT_PUBLIC_APP_URL);
  const response = await client.emails.send({
    from: configuration.RESEND_FROM,
    to: [input.to],
    subject: content.subject,
    text: content.text,
    html: content.html,
    tags: [{ name: "category", value: input.templateKey.replaceAll(".", "-") }]
  }, { idempotencyKey: `notification/${input.deliveryId}` });
  if (response.error || !response.data) {
    const status = response.error && "statusCode" in response.error ? Number(response.error.statusCode) : 500;
    throw new ResendDeliveryError(`Resend rejected the message with HTTP ${status}.`, status === 408 || status === 409 || status === 429 || status >= 500);
  }
  return { providerMessageId: response.data.id };
}

export class ResendDeliveryError extends Error {
  constructor(message: string, readonly retryable: boolean) { super(message); }
}
