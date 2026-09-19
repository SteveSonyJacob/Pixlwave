import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
};

export type DiscoveryFilters = { q?: string; category?: string; district?: string; max?: string; date?: string };

const columns = "id,category,title,description,locality,district,latitude,longitude,audience_estimate,audience_attribution,ad_duration_seconds,plays_per_unit,operating_start,operating_end,service_promise,category_details,currency,rate_unit,current_rate_revision_id,published_at,amount_paise,rate_effective_at";

export async function searchPublishedInventory(filters: DiscoveryFilters) {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("published_inventory").select(columns).order("published_at", { ascending: false }).limit(100);
  if (["led", "theatre", "mobile"].includes(filters.category ?? "")) query = query.eq("category", filters.category!);
  if (filters.district) query = query.eq("district", filters.district);
  const maxRupees = Number(filters.max);
  if (Number.isFinite(maxRupees) && maxRupees > 0) query = query.lte("amount_paise", Math.floor(maxRupees * 100));
  const { data, error } = await query;
  if (error) throw new Error("Published inventory is temporarily unavailable.");
  let listings = (data ?? []) as unknown as PublishedListing[];
  if (filters.q?.trim()) {
    const term = filters.q.trim().toLocaleLowerCase("en-IN").slice(0, 80);
    listings = listings.filter((listing) => [listing.title, listing.locality, listing.description].some((value) => value.toLocaleLowerCase("en-IN").includes(term)));
  }
  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date) && listings.length) {
    const ids = listings.map((listing) => listing.id);
    const { data: blackouts } = await supabase.from("listing_blackouts").select("listing_id").in("listing_id", ids).lte("starts_on", filters.date).gte("ends_on", filters.date);
    const unavailable = new Set((blackouts ?? []).map((blackout) => blackout.listing_id));
    listings = listings.filter((listing) => !unavailable.has(listing.id));
  }
  return listings;
}

export async function getFeaturedInventory() {
  const listings = await searchPublishedInventory({});
  return listings.slice(0, 3);
}

export async function getPublishedListing(id: string) {
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
    media: media ?? []
  };
}
