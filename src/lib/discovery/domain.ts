import { z } from "zod";

export const discoveryCategories = ["led", "theatre", "mobile"] as const;
export type DiscoveryCategory = (typeof discoveryCategories)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");
const uuid = z.string().uuid();

export const quoteRequestSchema = z.discriminatedUnion("category", [
  z.object({ category: z.literal("led"), listingId: uuid, units: z.array(z.object({ date: isoDate })).min(1).max(31) }),
  z.object({ category: z.literal("theatre"), listingId: uuid, units: z.array(z.object({ showInstanceId: uuid, quantity: z.number().int().min(1).max(50) })).min(1).max(31) }),
  z.object({ category: z.literal("mobile"), listingId: uuid, units: z.array(z.object({ date: isoDate, quantity: z.number().int().min(1).max(30) })).min(1).max(31) })
]);

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export function quoteQuantity(request: QuoteRequest) {
  return request.category === "led" ? request.units.length : request.units.reduce((total, unit) => total + unit.quantity, 0);
}

export function quoteTotalPaise(unitAmountPaise: number, request: QuoteRequest) {
  if (!Number.isSafeInteger(unitAmountPaise) || unitAmountPaise < 0) throw new Error("A valid unit price is required.");
  return unitAmountPaise * quoteQuantity(request);
}

export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}

export function isQuoteCurrent(input: { expiresAt: string; quotedRateRevisionId: string; currentRateRevisionId: string | null; listingPublished: boolean }, now = new Date()) {
  return input.listingPublished && input.quotedRateRevisionId === input.currentRateRevisionId && new Date(input.expiresAt).getTime() > now.getTime();
}
