import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { ListingMediaManager, type ListingMediaAsset } from "@/components/listing-media-manager";
import { ListingStatusTracker } from "@/components/listing-status-tracker";
import { MessageBanner } from "@/components/message-banner";
import { Notice } from "@/components/ui/feedback";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadListingDraft } from "@/lib/inventory/draft-loader";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
type Details = Record<string, string | number | boolean | string[] | undefined>;
type RevisionPayload = Record<string, unknown> & { categoryDetails?: Details; blackouts?: Array<{ startsOn: string; endsOn: string; reason: string }> };

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const [{ id }, query, identity] = await Promise.all([params, searchParams, requireIdentity()]);
  const supabase = await createServerSupabaseClient();
  const [{ data: listing }, { data: blackouts }, { data: shows }, { data: replacement }, { data: events }] = await Promise.all([
    supabase.from("inventory_listings").select("*").eq("id", id).eq("owner_id", identity.userId).maybeSingle(),
    supabase.from("listing_blackouts").select("starts_on,ends_on,reason").eq("listing_id", id).order("starts_on"),
    supabase.from("theatre_show_instances").select("starts_at").eq("listing_id", id).order("starts_at"),
    supabase.from("inventory_listing_revisions").select("id,status,version,payload,review_reason").eq("listing_id", id).in("status", ["draft", "submitted", "rejected"]).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("listing_status_events").select("id,event_type,message,created_at").eq("listing_id", id).order("created_at", { ascending: false }).limit(20)
  ]);
  if (!listing) notFound();
  if (!["draft", "rejected", "published"].includes(listing.status)) redirect("/owner?error=This+listing+cannot+be+edited+in+its+current+state");
  if (replacement?.status === "submitted") redirect("/owner?error=The+replacement+revision+is+awaiting+administrator+review");
  const revisionPayload = replacement?.payload as RevisionPayload | undefined;
  const details = (revisionPayload?.categoryDetails ?? listing.category_details ?? {}) as Details;
  const draft = await loadListingDraft(identity.userId, { id, updatedAt: listing.updated_at });
  const initial = {
    id: listing.id, status: listing.status, category: (revisionPayload?.category ?? listing.category) as "led"|"theatre"|"mobile",
    title: String(revisionPayload?.title ?? listing.title), description: String(revisionPayload?.description ?? listing.description),
    locality: String(revisionPayload?.locality ?? listing.locality), district: String(revisionPayload?.district ?? listing.district),
    latitude: String(revisionPayload?.latitude ?? listing.latitude), longitude: String(revisionPayload?.longitude ?? listing.longitude),
    sourceProvider: String(revisionPayload?.sourceProvider ?? listing.location_provider), sourcePlaceId: String(revisionPayload?.sourcePlaceId ?? listing.provider_place_id),
    audienceEstimate: String(revisionPayload?.audienceEstimate ?? listing.audience_estimate), audienceBasis: String(revisionPayload?.audienceBasis ?? listing.audience_basis),
    adDurationSeconds: String(revisionPayload?.adDurationSeconds ?? listing.ad_duration_seconds), playsPerUnit: String(revisionPayload?.playsPerUnit ?? listing.plays_per_unit),
    operatingStart: String(revisionPayload?.operatingStart ?? listing.operating_start).slice(0,5), operatingEnd: String(revisionPayload?.operatingEnd ?? listing.operating_end).slice(0,5),
    baseRateRupees: Number(revisionPayload?.baseRatePaise ?? listing.owner_base_rate_paise) / 100, servicePromise: String(revisionPayload?.servicePromise ?? listing.service_promise),
    ...details,
    showStarts: Array.isArray(details.showStarts) ? details.showStarts : (shows ?? []).map((show) => show.starts_at),
    blackouts: revisionPayload?.blackouts?.map((blackout) => `${blackout.startsOn}|${blackout.endsOn}|${blackout.reason}`).join("\n") ?? (blackouts ?? []).map((blackout) => `${blackout.starts_on}|${blackout.ends_on}|${blackout.reason}`).join("\n")
  };
  let mediaQuery = supabase.from("private_media_assets").select("id,original_name,detected_mime,byte_size,pixel_width,pixel_height,scan_status,display_order").eq("listing_id", id).eq("purpose", "listing_media").is("removed_at", null);
  mediaQuery = replacement?.id ? mediaQuery.eq("listing_revision_id", replacement.id) : mediaQuery.is("listing_revision_id", null);
  const { data: listingMedia } = await mediaQuery.order("display_order").order("created_at");
  const media = listing.status === "published" && !replacement?.id
    ? <Notice>Save the replacement revision first. Reopen it from the owner workspace to upload replacement gallery images.</Notice>
    : <ListingMediaManager listingId={id} revisionId={replacement?.id} assets={(listingMedia ?? []) as ListingMediaAsset[]} />;
  return <main className="dashboard-shell listing-builder"><div className="dashboard-heading"><div><span className="eyebrow">{listing.status === "published" ? "Replacement revision" : "Edit draft"}</span><h1>{listing.title}</h1><p>{listing.status === "published" ? "Your published version stays live until an administrator approves this replacement. The published rate remains admin-controlled." : "Changes require administrator review before publication."}</p></div><Link className="button button-secondary button-small" href="/owner">Back to inventory</Link></div><MessageBanner error={query.error} />{replacement?.review_reason ? <MessageBanner error={replacement.review_reason} /> : null}<ListingForm key={draft?.id ?? replacement?.id ?? id} initial={initial} draft={draft} media={media} /><section className="panel-card listing-history-card"><span className="eyebrow">Persisted history</span><h2>Review status</h2><ListingStatusTracker listingId={id} events={events ?? []} /></section></main>;
}
