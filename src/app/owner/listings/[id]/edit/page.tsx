import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
type Details = Record<string, string | number | boolean | string[] | undefined>;

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const [{ id }, query, identity] = await Promise.all([params, searchParams, requireIdentity()]);
  const supabase = await createServerSupabaseClient();
  const [{ data: listing }, { data: blackouts }, { data: shows }] = await Promise.all([
    supabase.from("inventory_listings").select("*").eq("id", id).eq("owner_id", identity.userId).maybeSingle(),
    supabase.from("listing_blackouts").select("starts_on,ends_on,reason").eq("listing_id", id).order("starts_on"),
    supabase.from("theatre_show_instances").select("starts_at").eq("listing_id", id).order("starts_at")
  ]);
  if (!listing) notFound();
  if (listing.status !== "draft" && listing.status !== "rejected") redirect("/owner?error=Only+draft+or+rejected+listings+can+be+edited");
  const details = (listing.category_details ?? {}) as Details;
  const initial = {
    id: listing.id, category: listing.category as "led"|"theatre"|"mobile", title: listing.title, description: listing.description,
    locality: listing.locality, district: listing.district, latitude: listing.latitude, longitude: listing.longitude,
    sourceProvider: listing.location_provider, sourcePlaceId: listing.provider_place_id,
    audienceEstimate: listing.audience_estimate, audienceBasis: listing.audience_basis,
    adDurationSeconds: listing.ad_duration_seconds, playsPerUnit: listing.plays_per_unit,
    operatingStart: String(listing.operating_start).slice(0,5), operatingEnd: String(listing.operating_end).slice(0,5),
    baseRateRupees: Number(listing.owner_base_rate_paise) / 100, servicePromise: listing.service_promise,
    ...details,
    showStarts: (shows ?? []).map((show) => show.starts_at),
    blackouts: (blackouts ?? []).map((blackout) => `${blackout.starts_on}|${blackout.ends_on}|${blackout.reason}`).join("\n")
  };
  return <main className="dashboard-shell listing-builder"><div className="dashboard-heading"><div><span className="eyebrow">Edit draft</span><h1>{listing.title}</h1><p>Changes require a fresh admin review. Published listings and rates cannot be edited by owners.</p></div><Link className="button button-secondary button-small" href="/owner">Back to inventory</Link></div><MessageBanner error={query.error} /><ListingForm initial={initial} /></main>;
}
