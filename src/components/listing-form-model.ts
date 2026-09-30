import { z } from "zod";
import { listingInputSchema, type ListingCategory } from "@/lib/inventory/domain";

const textFields = [
  "title", "description", "locality", "district", "latitude", "longitude", "sourceProvider", "sourcePlaceId",
  "pincode", "facingDirection", "trafficType", "visibility", "facilities",
  "audienceEstimate", "audienceBasis", "adDurationSeconds", "playsPerUnit", "operatingStart", "operatingEnd",
  "baseRateRupees", "servicePromise", "screenWidthPx", "screenHeightPx", "physicalWidthMetres", "physicalHeightMetres",
  "pixelPitch", "venueName", "auditoriumName", "slotsPerShow", "showStarts", "vehicleLabel", "rotatingSlots", "routeName", "routeGeoJson", "blackouts"
] as const;
type TextFieldName = (typeof textFields)[number];
export type ListingFormValues = Record<TextFieldName, string> & { category: ListingCategory; customRouteAllowed: boolean };
export type InitialListing = Record<string, string | number | boolean | string[] | undefined> & { id?: string; category?: ListingCategory; status?: string };

export function listingDefaults(initial?: InitialListing): ListingFormValues {
  const values = Object.fromEntries(textFields.map((key) => {
    const value = initial?.[key];
    return [key, Array.isArray(value) ? value.join("\n") : String(value ?? "")];
  })) as Record<TextFieldName, string>;
  return {
    ...values, category: initial?.category ?? "led", customRouteAllowed: initial?.customRouteAllowed === true,
    sourceProvider: initial?.sourceProvider === "openstreetmap" ? "openstreetmap" : "manual",
    sourcePlaceId: values.sourcePlaceId || "manual-pin",
    trafficType: values.trafficType || "high", visibility: values.visibility || "day_night"
  };
}

const nonemptyLines = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

// Adapt browser strings to the existing action contract without changing domain rules.
export const listingFormSchema = z.object({
  ...Object.fromEntries(textFields.map((key) => [key, z.string()])) as Record<TextFieldName, z.ZodString>,
  category: z.enum(["led", "theatre", "mobile"]), customRouteAllowed: z.boolean()
}).superRefine((value, context) => {
  const parsed = listingInputSchema.safeParse({ ...value, facilities: value.facilities.split(/[,\n]/).map((item) => item.trim()).filter(Boolean), baseRatePaise: Math.round(Number(value.baseRateRupees) * 100), dailyCapacity: 1 });
  if (!parsed.success) for (const issue of parsed.error.issues) {
    context.addIssue({ code: "custom", path: issue.path[0] === "baseRatePaise" ? ["baseRateRupees"] : issue.path, message: issue.message });
  }
  if (value.category === "theatre") {
    const shows = nonemptyLines(value.showStarts);
    if (!shows.length || shows.some((show) => !z.iso.datetime({ offset: true }).safeParse(show).success)) {
      context.addIssue({ code: "custom", path: ["showStarts"], message: "Enter at least one show start with a date, time and timezone, one per line." });
    }
  }
  for (const line of nonemptyLines(value.blackouts)) {
    const parts = line.split("|").map((part) => part.trim());
    const [start, end, reason] = parts;
    if (parts.length !== 3 || !z.iso.date().safeParse(start).success || !z.iso.date().safeParse(end).success || start > end || !reason) {
      context.addIssue({ code: "custom", path: ["blackouts"], message: "Use start date|end date|reason for every range, with the end on or after the start." });
      break;
    }
  }
});

export function fieldsForStep(step: number, category: ListingCategory): (keyof ListingFormValues)[] {
  if (step === 0) return ["category", "title", "description", "locality", "district", "pincode", "latitude", "longitude", "sourceProvider", "sourcePlaceId"];
  if (step === 1) return ["facingDirection", "trafficType", "visibility", "facilities", "audienceEstimate", "audienceBasis", "adDurationSeconds", "playsPerUnit", ...(category === "led"
    ? ["screenWidthPx", "screenHeightPx", "physicalWidthMetres", "physicalHeightMetres", "pixelPitch"] as const
    : category === "theatre" ? ["venueName", "auditoriumName", "slotsPerShow", "showStarts"] as const
      : ["vehicleLabel", "rotatingSlots", "routeName", "routeGeoJson", "customRouteAllowed"] as const)];
  return ["baseRateRupees", "operatingStart", "operatingEnd", "servicePromise", "blackouts"];
}

export function listingFormData(values: ListingFormValues, listingId?: string) {
  const form = new FormData();
  for (const key of textFields) form.set(key, values[key]);
  form.set("category", values.category);
  if (values.customRouteAllowed) form.set("customRouteAllowed", "on");
  if (listingId) form.set("listingId", listingId);
  return form;
}
