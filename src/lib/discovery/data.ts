import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { demoListings, findDemoListing, localDemoEnabled, searchDemoInventory } from "./demo";
import type { DiscoveryCategory } from "./domain";

export type PublishedListing = {
  id: string;
  category: DiscoveryCategory;
  title: string;
  description: string;
  locality: string;
  district: string;
  latitude: number;
  longitude: number;
  audience_estimate: number;
  audience_attribution: string;
  ad_duration_seconds: number;
  plays_per_unit: number;
  operating_start: string;
  operating_end: string;
  service_promise: string;
  category_details: Record<string, unknown>;
  currency: "INR";
  rate_unit: "day" | "show_slot" | "vehicle_day_slot";
  current_rate_revision_id: string;
  published_at: string;
  amount_paise: number;
  rate_effective_at: string;
  cover_asset_id?: string;
  cover_image_url?: string;
  is_demo?: boolean;
};

export type DiscoveryFilters = { q?: string; category?: string; district?: string; max?: string; page?: string; demo?: string };
export const DISCOVERY_PAGE_SIZE = 12;
export type DiscoveryResult = { listings: PublishedListing[]; total: number; page: number; pageSize: number };
export type PublishedMedia = { id: string; original_name: string; detected_mime: string | null; pixel_width: number | null; pixel_height: number | null; url?: string };
export type PublishedListingDetail = { listing: PublishedListing; blackouts: { starts_on: string; ends_on: string; reason: string }[]; shows: { id: string; starts_at: string; slots_total: number }[]; media: PublishedMedia[] };

const columns = "id,category,title,description,locality,district,latitude,longitude,audience_estimate,audience_attribution,ad_duration_seconds,plays_per_unit,operating_start,operating_end,service_promise,category_details,currency,rate_unit,current_rate_revision_id,published_at,amount_paise,rate_effective_at";

export async function searchPublishedInventory(filters: DiscoveryFilters, pageSize = DISCOVERY_PAGE_SIZE): Promise<DiscoveryResult> {
  if (localDemoEnabled() && filters.demo === "1") return searchDemoInventory(filters, pageSize);
  const supabase = await createServerSupabaseClient();
  const requestedPage = Number(filters.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage < 100000 ? requestedPage : 1;
  const from = (page - 1) * pageSize;
  let query = supabase.from("published_inventory").select(columns, { count: "exact" }).order("published_at", { ascending: false }).order("id").range(from, from + pageSize - 1);
  if (["led", "theatre", "mobile"].includes(filters.category ?? "")) query = query.eq("category", filters.category!);
  if (filters.district) query = query.eq("district", filters.district);
  const maxRupees = Number(filters.max);
  if (Number.isFinite(maxRupees) && maxRupees > 0) query = query.lte("amount_paise", Math.floor(maxRupees * 100));
  const term = filters.q?.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().replace(/\s+/g, " ").slice(0, 80);
  if (term) query = query.or(`title.ilike.*${term}*,locality.ilike.*${term}*,description.ilike.*${term}*`);
  const { data, count, error } = await query;
  if (error?.code === "PGRST103" && page > 1) return searchPublishedInventory({ ...filters, page: "1" }, pageSize);
  if (error) throw new Error("Published inventory is temporarily unavailable.");
  if (count && !data?.length && page > 1) return searchPublishedInventory({ ...filters, page: String(Math.ceil(count / pageSize)) }, pageSize);
  const listings = (data ?? []) as unknown as PublishedListing[];
  if (listings.length) {
    const { data: media } = await supabase.from("published_listing_media").select("id,listing_id").in("listing_id", listings.map((listing) => listing.id)).order("created_at");
    const firstMedia = new Map<string, string>();
    for (const asset of media ?? []) if (!firstMedia.has(asset.listing_id)) firstMedia.set(asset.listing_id, asset.id);
    for (const listing of listings) listing.cover_asset_id = firstMedia.get(listing.id);
  }
  return { listings, total: count ?? 0, page, pageSize };
}

export async function getFeaturedInventory() {
  try {
    const { listings } = await searchPublishedInventory({}, 3);
    return listings.length || !localDemoEnabled() ? listings : demoListings.slice(0, 3);
  } catch (error) {
    if (localDemoEnabled()) return demoListings.slice(0, 3);
    throw error;
  }
}

export async function getPublishedListing(id: string): Promise<PublishedListingDetail | null> {
  if (localDemoEnabled()) {
    const demo = findDemoListing(id);
    if (demo) return demo;
  }
  const supabase = await createServerSupabaseClient();
  const [{ data: listing }, { data: blackouts }, { data: shows }, { data: media }] = await Promise.all([
    supabase.from("published_inventory").select(columns).eq("id", id).maybeSingle(),
    supabase.from("listing_blackouts").select("starts_on,ends_on,reason").eq("listing_id", id).order("starts_on"),
    supabase.from("theatre_show_instances").select("id,starts_at,slots_total").eq("listing_id", id).gt("starts_at", new Date().toISOString()).order("starts_at").limit(60),
    supabase.from("published_listing_media").select("id,original_name,detected_mime,pixel_width,pixel_height").eq("listing_id", id).order("created_at")
  ]);
  if (!listing) return null;
  return {
    listing: listing as unknown as PublishedListing,
    blackouts: blackouts ?? [],
    shows: shows ?? [],
    media: (media ?? []) as PublishedMedia[]
  };
}
