export const REVIEW_WINDOW_HOURS = 168;
export const MINIMUM_SERVICE_NOTICE_HOURS = 192;

export function addHours(timestamp: Date, hours: number) {
  return new Date(timestamp.getTime() + hours * 60 * 60 * 1000);
}

export function deadlinesFromPayment(paymentSucceededAt: Date) {
  return {
    reviewAndCancellationCutoff: addHours(paymentSucceededAt, REVIEW_WINDOW_HOURS),
    earliestServiceStart: addHours(paymentSucceededAt, MINIMUM_SERVICE_NOTICE_HOURS)
  };
}

export function isBeforeReviewCutoff(paymentSucceededAt: Date, eventAt: Date) {
  return eventAt.getTime() < deadlinesFromPayment(paymentSucceededAt).reviewAndCancellationCutoff.getTime();
}

export function isServiceStartAllowed(paymentSucceededAt: Date, serviceStartsAt: Date) {
  return serviceStartsAt.getTime() >= deadlinesFromPayment(paymentSucceededAt).earliestServiceStart.getTime();
}

export function cancellationAmounts(lineAmountPaise: number) {
  assertPaise(lineAmountPaise);
  const retainedFeePaise = Math.floor((lineAmountPaise * 5 + 50) / 100);
  return { refundPaise: lineAmountPaise - retainedFeePaise, retainedFeePaise };
}

export function rejectionOrOwnerFailureRefund(lineAmountPaise: number, allocatedActualGatewayCostPaise: number) {
  assertPaise(lineAmountPaise);
  assertPaise(allocatedActualGatewayCostPaise);
  const processingDeductionPaise = Math.min(lineAmountPaise, allocatedActualGatewayCostPaise);
  return { refundPaise: lineAmountPaise - processingDeductionPaise, processingDeductionPaise };
}

export function completedServiceShares(lineAmountPaise: number) {
  assertPaise(lineAmountPaise);
  const ownerSharePaise = Math.floor((lineAmountPaise * 85 + 50) / 100);
  return { ownerSharePaise, grossPlatformCommissionPaise: lineAmountPaise - ownerSharePaise };
}

function assertPaise(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Money must be a non-negative integer number of paise.");
}
