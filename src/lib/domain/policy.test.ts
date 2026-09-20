import { describe, expect, it } from "vitest";
import { cancellationAmounts, completedServiceShares, deadlinesFromPayment, isBeforeReviewCutoff, isServiceStartAllowed, rejectionOrOwnerFailureRefund } from "./policy";

describe("confirmed Pixlwave policy contracts", () => {
  const payment = new Date("2026-10-01T04:30:00.000Z"); // 10:00 IST

  it("keeps the exact 168/192-hour boundaries", () => {
    const deadlines = deadlinesFromPayment(payment);
    expect(deadlines.reviewAndCancellationCutoff.toISOString()).toBe("2026-10-08T04:30:00.000Z");
    expect(deadlines.earliestServiceStart.toISOString()).toBe("2026-10-09T04:30:00.000Z");
    expect(isBeforeReviewCutoff(payment, new Date("2026-10-08T04:29:59.999Z"))).toBe(true);
    expect(isBeforeReviewCutoff(payment, new Date("2026-10-08T04:30:00.000Z"))).toBe(false);
    expect(isServiceStartAllowed(payment, new Date("2026-10-09T04:29:59.999Z"))).toBe(false);
    expect(isServiceStartAllowed(payment, new Date("2026-10-09T04:30:00.000Z"))).toBe(true);
  });

  it("applies the confirmed cancellation, rejection and completed-service examples", () => {
    expect(cancellationAmounts(1_000_000)).toEqual({ refundPaise: 950_000, retainedFeePaise: 50_000 });
    expect(rejectionOrOwnerFailureRefund(400_000, 9_440)).toEqual({ refundPaise: 390_560, processingDeductionPaise: 9_440 });
    expect(completedServiceShares(1_000_000)).toEqual({ ownerSharePaise: 850_000, grossPlatformCommissionPaise: 150_000 });
  });

  it("rounds the 5% fee once per line, half up", () => {
    expect(cancellationAmounts(11)).toEqual({ refundPaise: 10, retainedFeePaise: 1 });
  });
});
