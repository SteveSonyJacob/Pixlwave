import { describe, expect, it } from "vitest";
import { fieldsForStep, listingDefaults, listingFormData, listingFormSchema } from "./listing-form-model";
import { listingInputSchema } from "@/lib/inventory/domain";

const led = listingDefaults({
  category: "led", title: "MG Road LED screen", description: "Whole-screen daily placement in central Kochi.",
  locality: "Kochi", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999,
  pincode: "682016", facingDirection: "North toward MG Road", trafficType: "high", visibility: "day_night", facilities: "Power backup, Smart CMS",
  audienceEstimate: 20000, audienceBasis: "Manual footfall count in June 2026.",
  adDurationSeconds: 10, playsPerUnit: 120, operatingStart: "09:00", operatingEnd: "21:00",
  baseRateRupees: 12000.25, servicePromise: "One advertiser receives the whole screen for the published day.",
  screenWidthPx: 1920, screenHeightPx: 1080, physicalWidthMetres: 6, physicalHeightMetres: 3.4, pixelPitch: "P6 (6 mm)"
});

describe("owner listing wizard action compatibility", () => {
  it("retains all steps and serializes the existing action field names and currency units", () => {
    const validated = listingFormSchema.parse(led);
    const form = listingFormData(validated, "listing-id");
    expect(form.get("listingId")).toBe("listing-id");
    expect(form.get("title")).toBe(led.title);
    expect(form.get("screenWidthPx")).toBe("1920");
    expect(form.get("baseRateRupees")).toBe("12000.25");
    const payload = listingInputSchema.parse({ ...Object.fromEntries(form), facilities: String(form.get("facilities")).split(",").map((value) => value.trim()), baseRatePaise: Math.round(Number(form.get("baseRateRupees")) * 100), dailyCapacity: 1 });
    expect(payload.baseRatePaise).toBe(1200025);
    expect(payload.category === "led" && payload.dailyCapacity).toBe(1);
  });

  it("validates the current step independently from incomplete later steps", () => {
    const partial = listingDefaults({ title: led.title, description: led.description, locality: led.locality, district: led.district, pincode: led.pincode, latitude: led.latitude, longitude: led.longitude });
    const result = listingFormSchema.safeParse(partial);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.filter((issue) => fieldsForStep(0, "led").includes(issue.path[0] as keyof typeof led))).toHaveLength(0);
      expect(result.error.issues.some((issue) => issue.path[0] === "baseRateRupees")).toBe(true);
    }
  });

  it("rejects empty coordinates and invalid operating hours before calling an action", () => {
    for (const override of [{ latitude: "" }, { longitude: "" }, { operatingEnd: "08:00" }]) {
      expect(listingFormSchema.safeParse({ ...led, ...override }).success).toBe(false);
    }
  });

  it("does not silently drop malformed blackout lines", () => {
    for (const blackouts of ["2026-10-12|2026-10-11|Maintenance", "2026-02-30|2026-03-01|Maintenance", "2026-10-12|2026-10-13|"]) {
      expect(listingFormSchema.safeParse({ ...led, blackouts }).success).toBe(false);
    }
    expect(listingFormSchema.safeParse({ ...led, blackouts: "2026-10-12|2026-10-12|Maintenance\n" }).success).toBe(true);
  });

  it("preserves theatre show instants with explicit timezones and rejects ambiguous times", () => {
    const theatre = { ...led, category: "theatre" as const, venueName: "City cinema", auditoriumName: "Screen 1", slotsPerShow: "4", showStarts: "2026-10-12T18:30:00+05:30" };
    expect(listingFormSchema.safeParse(theatre).success).toBe(true);
    expect(listingFormData(theatre).get("showStarts")).toBe(theatre.showStarts);
    expect(listingFormSchema.safeParse({ ...theatre, showStarts: "2026-10-12T18:30:00" }).success).toBe(false);
    expect(listingFormSchema.safeParse({ ...theatre, showStarts: "" }).success).toBe(false);
  });

  it("preserves mobile route consent using the existing checkbox contract", () => {
    const mobile = { ...led, category: "mobile" as const, vehicleLabel: "Vehicle 1", rotatingSlots: "4", routeName: "Kochi route", routeGeoJson: '{"type":"LineString","coordinates":[[76.27,9.97],[76.30,10.01]]}', customRouteAllowed: true };
    expect(listingFormSchema.safeParse(mobile).success).toBe(true);
    expect(listingFormData(mobile).get("customRouteAllowed")).toBe("on");
    expect(listingFormData({ ...mobile, customRouteAllowed: false }).has("customRouteAllowed")).toBe(false);
    expect(fieldsForStep(1, "mobile")).not.toContain("screenWidthPx");
  });

  it("loads saved show arrays and normalizes legacy map providers for editing", () => {
    const initial = listingDefaults({ category: "theatre", showStarts: ["2026-10-12T13:00:00Z", "2026-10-13T13:00:00Z"], sourceProvider: "google" });
    expect(initial.showStarts).toBe("2026-10-12T13:00:00Z\n2026-10-13T13:00:00Z");
    expect(initial.sourceProvider).toBe("manual");
  });
});
