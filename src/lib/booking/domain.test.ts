import { describe, expect, it } from "vitest";
import { canActBeforeReviewDeadline, cancellationAmounts, inclusiveIsoDates, paymentDeadlines, rollupCartStatus, serviceMeetsPaymentNotice } from "./domain";

describe("Phase 4 booking policy", () => {
  const paidAt = new Date("2026-10-01T04:30:00.000Z"); // 10:00 IST

  it("keeps the exact 168 and 192 hour instants", () => {
    const deadlines = paymentDeadlines(paidAt);
    expect(deadlines.reviewDueAt.toISOString()).toBe("2026-10-08T04:30:00.000Z");
    expect(deadlines.earliestServiceAt.toISOString()).toBe("2026-10-09T04:30:00.000Z");
    expect(canActBeforeReviewDeadline(deadlines.reviewDueAt, new Date("2026-10-08T04:29:59.999Z"))).toBe(true);
    expect(canActBeforeReviewDeadline(deadlines.reviewDueAt, deadlines.reviewDueAt)).toBe(false);
    expect(serviceMeetsPaymentNotice(paidAt, new Date("2026-10-09T04:29:59.999Z"))).toBe(false);
    expect(serviceMeetsPaymentNotice(paidAt, deadlines.earliestServiceAt)).toBe(true);
  });

  it("rounds the five-percent cancellation fee once per line", () => {
    expect(cancellationAmounts(1_000_000)).toEqual({ feeAmountPaise: 50_000, refundAmountPaise: 950_000 });
    expect(cancellationAmounts(101)).toEqual({ feeAmountPaise: 5, refundAmountPaise: 96 });
  });

  it("rolls independent line decisions into cart state", () => {
    expect(rollupCartStatus(["paid_pending", "paid_pending"])).toBe("paid_review");
    expect(rollupCartStatus(["approved", "paid_pending"])).toBe("partially_decided");
    expect(rollupCartStatus(["approved", "rejected", "cancelled"])).toBe("decided");
  });

  it("expands inclusive LED/mobile date ranges without silent partial units", () => {
    expect(inclusiveIsoDates("2026-10-09", "2026-10-11")).toEqual(["2026-10-09", "2026-10-10", "2026-10-11"]);
    expect(() => inclusiveIsoDates("2026-10-11", "2026-10-09")).toThrow(/inclusive date range/);
    expect(() => inclusiveIsoDates("2026-10-01", "2026-11-01")).toThrow(/1 to 31 days/);
  });
});
