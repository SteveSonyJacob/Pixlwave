import { keralaDistricts } from "@/lib/inventory/domain";
import { KERALA_BOUNDS } from "@/lib/maps/nominatim";

export type RawDiscoveryFilters = Record<string, string | string[] | undefined>;
export type DiscoveryFilters = {
  q?: string;
  category?: "led" | "theatre" | "mobile";
  district?: string;
  max?: string;
  page?: string;
  bbox?: string;
};

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function parseBbox(value: string | undefined) {
  if (!value) return undefined;
  const parts = value.split(",");
  if (parts.length !== 4) return undefined;
  const [west, south, east, north] = parts.map(Number);
  if (![west, south, east, north].every(Number.isFinite)
    || west >= east || south >= north
    || west < KERALA_BOUNDS.west - 0.3 || east > KERALA_BOUNDS.east + 0.3
    || south < KERALA_BOUNDS.south - 0.3 || north > KERALA_BOUNDS.north + 0.3) return undefined;
  return [west, south, east, north].map((part) => part.toFixed(4)).join(",");
}

export function parseDiscoveryFilters(raw: RawDiscoveryFilters): DiscoveryFilters {
  const q = single(raw.q)?.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().replace(/\s+/g, " ").slice(0, 80);
  const category = single(raw.category);
  const district = single(raw.district);
  const maxValue = Number(single(raw.max));
  const max = Number.isSafeInteger(maxValue) && maxValue >= 100 && maxValue <= 10_000_000 ? String(maxValue) : undefined;
  const pageValue = Number(single(raw.page));
  const page = Number.isSafeInteger(pageValue) && pageValue > 1 && pageValue < 100_000 ? String(pageValue) : undefined;
  return {
    ...(q ? { q } : {}),
    ...(category === "led" || category === "theatre" || category === "mobile" ? { category } : {}),
    ...(district && keralaDistricts.includes(district as (typeof keralaDistricts)[number]) ? { district } : {}),
    ...(max ? { max } : {}),
    ...(page ? { page } : {}),
    ...(parseBbox(single(raw.bbox)) ? { bbox: parseBbox(single(raw.bbox)) } : {})
  };
}

export function discoveryParams(filters: DiscoveryFilters, options: { page?: boolean; bbox?: boolean } = {}) {
  const params = new URLSearchParams();
  for (const key of ["q", "category", "district", "max"] as const) if (filters[key]) params.set(key, filters[key]);
  if (options.bbox && filters.bbox) params.set("bbox", filters.bbox);
  if (options.page && filters.page) params.set("page", filters.page);
  return params;
}

export function discoveryHref(route: "/discover" | "/map", filters: DiscoveryFilters, options: { page?: boolean; bbox?: boolean } = {}) {
  const params = discoveryParams(filters, options);
  return `${route}${params.size ? `?${params}` : ""}`;
}
