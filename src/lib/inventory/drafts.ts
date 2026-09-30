import { z } from "zod";
import { listingDefaults, type ListingFormValues } from "@/components/listing-form-model";

// Checkpoints deliberately allow incomplete values; final save uses the full listing schema.
export const draftPayloadSchema = z.object({
  ...Object.fromEntries(Object.keys(listingDefaults()).filter((key) => key !== "category" && key !== "customRouteAllowed")
    .map((key) => [key, z.string().max(key === "routeGeoJson" ? 100000 : 12000)])) as Record<Exclude<keyof ListingFormValues, "category" | "customRouteAllowed">, z.ZodString>,
  category: z.enum(["led", "theatre", "mobile"]), customRouteAllowed: z.boolean()
}).strict().refine((value) => new TextEncoder().encode(JSON.stringify(value)).length <= 240000, "Draft is too large.");

export const checkpointSchema = z.object({
  id: z.uuid(), revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  listingId: z.uuid().nullable(), baseUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
  payload: draftPayloadSchema, step: z.number().int().min(0).max(3)
}).strict().refine((value) => (value.listingId === null) === (value.baseUpdatedAt === null), "Invalid listing reference.");

export type DraftContext = { id: string; revision: number; listingId: string | null; baseUpdatedAt: string | null; step: number; payload?: ListingFormValues; stale?: boolean };
export type DraftSaveResult = { ok: true; revision: number } | { ok: false; kind: "conflict" | "unavailable" | "invalid"; message: string };

export function draftError(code?: string): DraftSaveResult & { ok: false } {
  if (code === "40001" || code === "23505") return { ok: false, kind: "conflict", message: "This draft or listing changed in another session. Reload the saved version before continuing." };
  if (code === "42501") return { ok: false, kind: "unavailable", message: "Your session or owner access changed. Sign in again and check that this listing is still editable." };
  return { ok: false, kind: "unavailable", message: "Draft could not be saved. Keep this page open and retry." };
}
