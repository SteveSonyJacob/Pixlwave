import { z } from "zod";

export const HOURS_192_MS = 192 * 60 * 60 * 1000;
export const HOURS_168_MS = 168 * 60 * 60 * 1000;

export const cartConfigurationSchema = z.object({
  customRouteRequested: z.coerce.boolean().default(false),
  routeName: z.string().trim().max(160).optional(),
  requestedRoute: z.unknown().optional(),
});

export function paymentDeadlines(capturedAt: Date) {
  const value = capturedAt.getTime();
  if (!Number.isFinite(value)) throw new Error("A valid capture time is required.");
  return {
    reviewDueAt: new Date(value + HOURS_168_MS),
    earliestServiceAt: new Date(value + HOURS_192_MS),
  };
}

export function serviceMeetsPaymentNotice(capturedAt: Date, serviceStartsAt: Date) {
  return serviceStartsAt.getTime() >= paymentDeadlines(capturedAt).earliestServiceAt.getTime();
}

export function canActBeforeReviewDeadline(reviewDueAt: Date, now = new Date()) {
  return now.getTime() < reviewDueAt.getTime();
}

export function cancellationAmounts(grossAmountPaise: number) {
  if (!Number.isSafeInteger(grossAmountPaise) || grossAmountPaise <= 0) throw new Error("A positive paid amount is required.");
  const feeAmountPaise = Math.floor((grossAmountPaise * 5 + 50) / 100);
  return { feeAmountPaise, refundAmountPaise: grossAmountPaise - feeAmountPaise };
}

export function inclusiveIsoDates(start: string, end: string, maximum = 31) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  const startMs = pattern.test(start) ? Date.parse(`${start}T00:00:00.000Z`) : Number.NaN;
  const endMs = pattern.test(end) ? Date.parse(`${end}T00:00:00.000Z`) : Number.NaN;
  const days = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs ? Math.floor((endMs - startMs) / 86_400_000) + 1 : 0;
  if (days < 1 || days > maximum) throw new Error(`Choose an inclusive date range of 1 to ${maximum} days.`);
  return Array.from({ length: days }, (_, index) => new Date(startMs + index * 86_400_000).toISOString().slice(0, 10));
}

export function rollupCartStatus(statuses: readonly string[]) {
  if (!statuses.length || statuses.every((status) => status === "draft")) return "open" as const;
  const pending = statuses.filter((status) => status === "paid_pending").length;
  if (pending === statuses.length) return "paid_review" as const;
  if (pending > 0) return "partially_decided" as const;
  return "decided" as const;
}
