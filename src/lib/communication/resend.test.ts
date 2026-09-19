import { describe, expect, it, vi } from "vitest";
import { renderNotificationEmail, sendResendEmail, type ResendConfiguration } from "./resend";

const config: ResendConfiguration = { APP_EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_testing", RESEND_FROM: "Pixlwave <notifications@example.com>", NEXT_PUBLIC_APP_URL: "https://pixlwave.example" };

describe("Resend application delivery", () => {
  it("escapes customer-controlled ticket labels and links to the scoped thread", () => {
    const email = renderNotificationEmail("support.ticket.reply", { ticketId: "ticket-1", subject: "<script>unsafe</script>" }, config.NEXT_PUBLIC_APP_URL);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain("https://pixlwave.example/support/ticket-1");
  });

  it("uses the delivery id as a stable Resend idempotency key", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null });
    const result = await sendResendEmail({ to: "recipient@example.com", templateKey: "support.ticket.created", payload: { ticketId: "ticket-1" }, deliveryId: "delivery-1" }, config, { emails: { send } } as never);
    expect(result.providerMessageId).toBe("email-1");
    expect(send.mock.calls[0]?.[1]).toEqual({ idempotencyKey: "notification/delivery-1" });
  });
});
