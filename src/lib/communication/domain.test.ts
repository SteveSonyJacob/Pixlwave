import { describe, expect, it } from "vitest";
import { nextRetryAt, recipientsFor, templateFor } from "./domain";

describe("P03 communication contracts", () => {
  it("does not route raw review or support events to owners", () => {
    expect(recipientsFor("review.due")).toEqual(["admin"]);
    expect(recipientsFor("support.ticket.created")).not.toContain("owner");
  });

  it("uses exact paid-awaiting-review and scheduled-only wording", () => {
    expect(templateFor("payment.received").subject).toBe("Payment received — awaiting admin confirmation");
    const start = templateFor("campaign.scheduled_start").body.toLowerCase();
    expect(start).toContain("scheduled");
    expect(start).toContain("does not claim observed playback");
  });

  it("backs off retries with a one-hour cap", () => {
    const now = new Date("2026-10-12T10:00:00Z");
    expect(nextRetryAt(0, now).toISOString()).toBe("2026-10-12T10:00:30.000Z");
    expect(nextRetryAt(8, now).toISOString()).toBe("2026-10-12T11:00:00.000Z");
  });
});
