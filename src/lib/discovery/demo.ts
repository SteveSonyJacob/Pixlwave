import "server-only";
import type { DiscoveryFilters, DiscoveryResult, PublishedListing, PublishedListingDetail } from "./data";

const sampleDate = "2026-09-01T00:00:00.000Z";
const routeGeoJson = JSON.stringify({ type: "LineString", coordinates: [[75.7701, 11.2479], [75.7804, 11.2588], [75.8005, 11.2708], [75.8205, 11.2929]] });

export function localDemoEnabled() {
  if (process.env.NODE_ENV !== "development") return false;
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname); }
  catch { return false; }
}

/** Illustrative records only. These IDs never exist in Supabase. */
export const demoListings: PublishedListing[] = [
  {
    id: "demo-led-kochi", is_demo: true, category: "led", title: "Demo LED screen · MG Road", description: "Illustrative roadside LED placement near central Kochi, shown to preview the listing layout and daily rate presentation.", locality: "MG Road, Kochi", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999,
    audience_estimate: 18000, audience_attribution: "Illustrative audience figure for interface preview only; no traffic measurement or delivery claim.", ad_duration_seconds: 10, plays_per_unit: 120, operating_start: "09:00", operating_end: "21:00", service_promise: "Sample whole-screen LED service for one selected day, with a 10-second creative played 120 times during operating hours.",
    category_details: { screenWidthPx: 1920, screenHeightPx: 1080, physicalWidthMetres: 6, physicalHeightMetres: 3.4, dailyCapacity: 1 }, currency: "INR", rate_unit: "day", current_rate_revision_id: "demo-rate-led", published_at: sampleDate, amount_paise: 1200000, rate_effective_at: sampleDate, cover_image_url: "/demo/led-screen.svg"
  },
  {
    id: "demo-theatre-trivandrum", is_demo: true, category: "theatre", title: "Demo theatre pre-show slot", description: "Illustrative cinema screen placement in Thiruvananthapuram for checking show selection, creative details, and slot pricing.", locality: "Palayam, Thiruvananthapuram", district: "Thiruvananthapuram", latitude: 8.5241, longitude: 76.9366,
    audience_estimate: 240, audience_attribution: "Illustrative per-show audience estimate for interface preview only; actual attendance is not guaranteed.", ad_duration_seconds: 15, plays_per_unit: 1, operating_start: "10:00", operating_end: "23:00", service_promise: "Sample 15-second pre-show placement for each selected published show slot.",
    category_details: { venueName: "Demo Cinema", auditoriumName: "Screen 2", slotsPerShow: 4 }, currency: "INR", rate_unit: "show_slot", current_rate_revision_id: "demo-rate-theatre", published_at: sampleDate, amount_paise: 350000, rate_effective_at: sampleDate, cover_image_url: "/demo/theatre-screen.svg"
  },
  {
    id: "demo-mobile-kozhikode", is_demo: true, category: "mobile", title: "Demo mobile billboard · Kozhikode", description: "Illustrative vehicle route through central Kozhikode for previewing the planned path and rotating daily slots.", locality: "Kozhikode city centre", district: "Kozhikode", latitude: 11.2588, longitude: 75.7804,
    audience_estimate: 12000, audience_attribution: "Illustrative route-wide audience estimate for interface preview only; no live tracking or reach guarantee.", ad_duration_seconds: 12, plays_per_unit: 80, operating_start: "10:00", operating_end: "20:00", service_promise: "Sample shared mobile display slot across a published planned route for each selected day.",
    category_details: { vehicleLabel: "Demo display van", rotatingSlots: 12, routeName: "Central Kozhikode loop", routeGeoJson, customRouteAllowed: true }, currency: "INR", rate_unit: "vehicle_day_slot", current_rate_revision_id: "demo-rate-mobile", published_at: sampleDate, amount_paise: 550000, rate_effective_at: sampleDate, cover_image_url: "/demo/mobile-billboard.svg"
  }
];

export function searchDemoInventory(filters: DiscoveryFilters, pageSize: number): DiscoveryResult {
  const term = filters.q?.trim().toLocaleLowerCase("en-IN") ?? "";
  const maxRupees = Number(filters.max);
  const matches = demoListings.filter((listing) =>
    (!term || [listing.title, listing.locality, listing.description].some((value) => value.toLocaleLowerCase("en-IN").includes(term))) &&
    (!filters.category || listing.category === filters.category) &&
    (!filters.district || listing.district === filters.district) &&
    (!Number.isFinite(maxRupees) || maxRupees <= 0 || listing.amount_paise <= Math.floor(maxRupees * 100))
  );
  const requested = Number(filters.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, Math.max(1, Math.ceil(matches.length / pageSize))) : 1;
  return { listings: matches.slice((page - 1) * pageSize, page * pageSize), total: matches.length, page, pageSize };
}

function futureDate(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function findDemoListing(id: string): PublishedListingDetail | null {
  const listing = demoListings.find((item) => item.id === id);
  if (!listing) return null;
  const shows = listing.category === "theatre" ? [7, 9, 12].map((days, index) => ({ id: `demo-show-${index + 1}`, starts_at: `${futureDate(days)}T13:00:00.000Z`, slots_total: 4 })) : [];
  const blackouts = listing.category === "led" ? [{ starts_on: futureDate(4), ends_on: futureDate(5), reason: "Sample blackout" }] : [];
  return { listing, shows, blackouts, media: [{ id: `demo-media-${listing.category}`, original_name: `${listing.category}-illustration.svg`, detected_mime: "image/svg+xml", pixel_width: 1200, pixel_height: 700, url: listing.cover_image_url }] };
}
