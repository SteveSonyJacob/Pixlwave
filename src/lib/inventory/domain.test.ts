import { describe, expect, it } from "vitest";
import {
  buildPublishedServiceSnapshot,
  creativeFitsListing,
  customRouteCompatible,
  hasSharedCapacity,
  listingInputSchema,
  serviceFitsOperatingWindow,
  windowsOverlap
} from "./domain";

const led = {
  category: "led" as const,
  title: "MG Road LED screen",
  description: "A whole-screen daily placement with audited service promises.",
  locality: "Kochi", district: "Ernakulam" as const, latitude: 9.9816, longitude: 76.2999,
  sourceProvider: "mappls" as const, sourcePlaceId: "mmi-123", audienceEstimate: 20_000,
  audienceBasis: "Owner estimate based on a June 2026 manual footfall count.",
  adDurationSeconds: 10, playsPerUnit: 120, operatingStart: "09:00", operatingEnd: "21:00",
  baseRatePaise: 1_200_000, servicePromise: "One exclusive advertiser receives the whole screen for the published day.",
  screenWidthPx: 1920, screenHeightPx: 1080, physicalWidthMetres: 6, physicalHeightMetres: 3.4, dailyCapacity: 1 as const
};

describe("P02 inventory rules", () => {
  it("validates approved service values and preserves immutable paid terms", () => {
    expect(listingInputSchema.parse(led).category).toBe("led");
    const snapshot = buildPublishedServiceSnapshot({ listingId: "listing-1", rateRevisionId: "rate-1", listing: led });
    const edited = { ...led, baseRatePaise: 1_500_000, playsPerUnit: 150 };
    expect(edited.baseRatePaise).not.toBe(snapshot.ratePaise);
    expect(snapshot.ratePaise).toBe(1_200_000);
    expect(snapshot.playsPerUnit).toBe(120);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("rejects invalid operating and service capacity", () => {
    expect(listingInputSchema.safeParse({ ...led, operatingEnd: "08:00" }).success).toBe(false);
    expect(serviceFitsOperatingWindow(30, 1000, 60)).toBe(false);
    expect(serviceFitsOperatingWindow(10, 120, 720)).toBe(true);
  });

  it("checks blackout overlap and shared show or rotating-slot capacity", () => {
    const requested = { startsAt: new Date("2026-10-10T10:00:00Z"), endsAt: new Date("2026-10-10T11:00:00Z") };
    expect(windowsOverlap(requested, { startsAt: new Date("2026-10-10T10:30:00Z"), endsAt: new Date("2026-10-10T12:00:00Z") })).toBe(true);
    expect(hasSharedCapacity(4, 2, [1, 1])).toBe(true);
    expect(hasSharedCapacity(4, 2, [2, 1])).toBe(false);
  });

  it("allows a custom mobile route only without approved overlap", () => {
    expect(customRouteCompatible({ customRouteRequested: true, requestedRouteKey: "custom", approvedOverlaps: [] })).toBe(true);
    expect(customRouteCompatible({ customRouteRequested: true, requestedRouteKey: "custom", approvedOverlaps: [{ routeKey: "published", quantity: 1 }] })).toBe(false);
    expect(customRouteCompatible({ customRouteRequested: false, requestedRouteKey: "published", approvedOverlaps: [{ routeKey: "published", quantity: 1 }] })).toBe(true);
  });

  it("requires creative resolution, aspect and exact video duration", () => {
    const listing = { width: 1920, height: 1080, adDurationSeconds: 10 };
    expect(creativeFitsListing({ category: "led", creative: { kind: "video", width: 1920, height: 1080, durationSeconds: 10 }, listing })).toBe(true);
    expect(creativeFitsListing({ category: "led", creative: { kind: "video", width: 1280, height: 720, durationSeconds: 10 }, listing })).toBe(false);
    expect(creativeFitsListing({ category: "led", creative: { kind: "video", width: 1920, height: 1080, durationSeconds: 15 }, listing })).toBe(false);
  });
});
