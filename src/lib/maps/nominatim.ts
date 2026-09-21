import { keralaDistricts } from "../inventory/domain";

export const KERALA_BOUNDS = {
  south: 8.17,
  west: 74.8,
  north: 12.8,
  east: 77.6
} as const;

export type MapPlace = {
  provider: "openstreetmap" | "manual";
  placeId: string;
  label: string;
  locality: string;
  district: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  place_id?: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string | undefined>;
};

export function inKerala(latitude: number, longitude: number) {
  return latitude >= KERALA_BOUNDS.south && latitude <= KERALA_BOUNDS.north
    && longitude >= KERALA_BOUNDS.west && longitude <= KERALA_BOUNDS.east;
}

function normalizeDistrict(value: string) {
  const candidate = value.replace(/\s+district$/i, "").trim().toLocaleLowerCase("en-IN");
  return keralaDistricts.find((district) => district.toLocaleLowerCase("en-IN") === candidate) ?? "";
}

export function parseNominatimResults(value: unknown): MapPlace[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((rawValue) => {
    const raw = rawValue as NominatimResult;
    const latitude = Number(raw.lat);
    const longitude = Number(raw.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !inKerala(latitude, longitude)) return [];
    const address = raw.address ?? {};
    const locality = address.city ?? address.town ?? address.municipality ?? address.village ?? address.suburb ?? address.county ?? "";
    const district = normalizeDistrict(address.state_district ?? address.county ?? address.district ?? "");
    const placeId = String(raw.place_id ?? "").trim();
    if (!placeId) return [];
    return [{
      provider: "openstreetmap" as const,
      placeId,
      label: String(raw.display_name || locality || "Kerala location"),
      locality,
      district,
      latitude,
      longitude
    }];
  }).slice(0, 6);
}

export function buildNominatimUrl(endpoint: string, query: string, contactEmail?: string) {
  const url = new URL(endpoint);
  url.searchParams.set("q", `${query}, Kerala, India`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("viewbox", `${KERALA_BOUNDS.west},${KERALA_BOUNDS.north},${KERALA_BOUNDS.east},${KERALA_BOUNDS.south}`);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("limit", "6");
  if (contactEmail) url.searchParams.set("email", contactEmail);
  return url;
}
