import { describe, expect, it } from "vitest";
import { isQuoteCurrent, quoteQuantity, quoteRequestSchema, quoteTotalPaise } from "./domain";

const listingId = "f69519f2-d67f-4c79-b99e-af6559b643b8";

describe("P03 discovery quote rules", () => {
  it("quotes explicit LED days and never derives quantity from a date range", () => {
    const request = quoteRequestSchema.parse({ category: "led", listingId, units: [{ date: "2026-10-12" }, { date: "2026-10-14" }] });
    expect(quoteQuantity(request)).toBe(2);
    expect(quoteTotalPaise(125_000, request)).toBe(250_000);
  });

  it("sums shared theatre and mobile capacity units", () => {
    const request = quoteRequestSchema.parse({ category: "theatre", listingId, units: [
      { showInstanceId: "0fb4d84f-0d47-45d9-9e29-ef7b0664f0fb", quantity: 2 },
      { showInstanceId: "494898cd-5bc9-41c8-94f0-ab1e740ff4c5", quantity: 3 }
    ] });
    expect(quoteQuantity(request)).toBe(5);
  });

  it("rejects malformed or empty selections", () => {
    expect(quoteRequestSchema.safeParse({ category: "led", listingId, units: [] }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ category: "mobile", listingId, units: [{ date: "12/10/2026", quantity: 1 }] }).success).toBe(false);
  });

  it("invalidates a quote when it expires, the rate changes, or the listing is unpublished", () => {
    const base = { expiresAt: "2026-10-12T10:30:00Z", quotedRateRevisionId: "rate-1", currentRateRevisionId: "rate-1", listingPublished: true };
    expect(isQuoteCurrent(base, new Date("2026-10-12T10:00:00Z"))).toBe(true);
    expect(isQuoteCurrent({ ...base, currentRateRevisionId: "rate-2" }, new Date("2026-10-12T10:00:00Z"))).toBe(false);
    expect(isQuoteCurrent(base, new Date("2026-10-12T10:31:00Z"))).toBe(false);
    expect(isQuoteCurrent({ ...base, listingPublished: false }, new Date("2026-10-12T10:00:00Z"))).toBe(false);
  });
});
