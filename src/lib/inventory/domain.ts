import { z } from "zod";

export const keralaDistricts = [
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
  "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
] as const;

export const listingCategories = ["led", "theatre", "mobile"] as const;
export type ListingCategory = (typeof listingCategories)[number];

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const commonListing = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  locality: z.string().trim().min(2).max(120),
  district: z.enum(keralaDistricts),
  latitude: z.coerce.number().min(8.17).max(12.8),
  longitude: z.coerce.number().min(74.8).max(77.6),
  sourceProvider: z.enum(["mappls", "google", "manual"]),
  sourcePlaceId: z.string().trim().min(2).max(200),
  audienceEstimate: z.coerce.number().int().positive().max(100_000_000),
  audienceBasis: z.string().trim().min(10).max(500),
  adDurationSeconds: z.coerce.number().int().min(5).max(120),
  playsPerUnit: z.coerce.number().int().min(1).max(2000),
  operatingStart: z.string().regex(timePattern),
  operatingEnd: z.string().regex(timePattern),
  baseRatePaise: z.coerce.number().int().min(10_000).max(1_000_000_000),
  servicePromise: z.string().trim().min(20).max(1000)
}).superRefine((value, context) => {
  if (value.operatingStart >= value.operatingEnd) {
    context.addIssue({ code: "custom", path: ["operatingEnd"], message: "Operating end must be after the start." });
  }
});

const ledDetails = z.object({
  category: z.literal("led"),
  screenWidthPx: z.coerce.number().int().min(320).max(16_384),
  screenHeightPx: z.coerce.number().int().min(240).max(8_640),
  physicalWidthMetres: z.coerce.number().positive().max(100),
  physicalHeightMetres: z.coerce.number().positive().max(100),
  dailyCapacity: z.literal(1).default(1)
});

const theatreDetails = z.object({
  category: z.literal("theatre"),
  venueName: z.string().trim().min(2).max(160),
  auditoriumName: z.string().trim().min(1).max(80),
  slotsPerShow: z.coerce.number().int().min(1).max(50)
});

const mobileDetails = z.object({
  category: z.literal("mobile"),
  vehicleLabel: z.string().trim().min(2).max(120),
  rotatingSlots: z.coerce.number().int().min(1).max(30),
  routeName: z.string().trim().min(3).max(160),
  routeGeoJson: z.string().trim().min(20).max(100_000),
  customRouteAllowed: z.boolean().default(false)
}).superRefine((value, context) => {
  try {
    const geometry = JSON.parse(value.routeGeoJson) as { type?: string; coordinates?: unknown };
    if (geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) throw new Error();
  } catch {
    context.addIssue({ code: "custom", path: ["routeGeoJson"], message: "Route must be a GeoJSON LineString." });
  }
});

export const listingInputSchema = z.intersection(
  commonListing,
  z.discriminatedUnion("category", [ledDetails, theatreDetails, mobileDetails])
);
export type ListingInput = z.infer<typeof listingInputSchema>;

export type PublishedServiceSnapshot = Readonly<{
  listingId: string;
  rateRevisionId: string;
  category: ListingCategory;
  ratePaise: number;
  rateUnit: "day" | "show_slot" | "vehicle_day_slot";
  adDurationSeconds: number;
  playsPerUnit: number;
  operatingStart: string;
  operatingEnd: string;
  servicePromise: string;
  categoryDetails: Readonly<Record<string, unknown>>;
}>;

export function buildPublishedServiceSnapshot(input: {
  listingId: string;
  rateRevisionId: string;
  listing: ListingInput;
}): PublishedServiceSnapshot {
  const { listing } = input;
  const categoryDetails = listing.category === "led"
    ? { screenWidthPx: listing.screenWidthPx, screenHeightPx: listing.screenHeightPx, dailyCapacity: 1 }
    : listing.category === "theatre"
      ? { venueName: listing.venueName, auditoriumName: listing.auditoriumName, slotsPerShow: listing.slotsPerShow }
      : { vehicleLabel: listing.vehicleLabel, rotatingSlots: listing.rotatingSlots, routeName: listing.routeName, routeGeoJson: listing.routeGeoJson, customRouteAllowed: listing.customRouteAllowed };
  return Object.freeze({
    listingId: input.listingId,
    rateRevisionId: input.rateRevisionId,
    category: listing.category,
    ratePaise: listing.baseRatePaise,
    rateUnit: listing.category === "led" ? "day" : listing.category === "theatre" ? "show_slot" : "vehicle_day_slot",
    adDurationSeconds: listing.adDurationSeconds,
    playsPerUnit: listing.playsPerUnit,
    operatingStart: listing.operatingStart,
    operatingEnd: listing.operatingEnd,
    servicePromise: listing.servicePromise,
    categoryDetails: Object.freeze(categoryDetails)
  });
}

export type DateWindow = { startsAt: Date; endsAt: Date };
export function windowsOverlap(left: DateWindow, right: DateWindow) {
  return left.startsAt < right.endsAt && right.startsAt < left.endsAt;
}

export function hasSharedCapacity(capacity: number, requested: number, approved: readonly number[]) {
  return requested > 0 && approved.reduce((sum, quantity) => sum + quantity, 0) + requested <= capacity;
}

export function customRouteCompatible(input: {
  customRouteRequested: boolean;
  requestedRouteKey: string;
  approvedOverlaps: readonly { routeKey: string; quantity: number }[];
}) {
  if (input.customRouteRequested) return input.approvedOverlaps.length === 0;
  return input.approvedOverlaps.every((booking) => booking.quantity > 0 && booking.routeKey === input.requestedRouteKey);
}

export function serviceFitsOperatingWindow(durationSeconds: number, plays: number, operatingMinutes: number) {
  return durationSeconds > 0 && plays > 0 && durationSeconds * plays <= operatingMinutes * 60;
}

export function creativeFitsListing(input: {
  category: ListingCategory;
  creative: { kind: "image" | "video"; width: number; height: number; durationSeconds?: number };
  listing: { width: number; height: number; adDurationSeconds: number };
}) {
  const sameAspect = Math.abs(input.creative.width / input.creative.height - input.listing.width / input.listing.height) <= 0.02;
  if (!sameAspect || input.creative.width < input.listing.width || input.creative.height < input.listing.height) return false;
  return input.creative.kind === "image" || input.creative.durationSeconds === input.listing.adDurationSeconds;
}
