import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createQuote } from "@/app/quotes/actions";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { MessageBanner } from "@/components/message-banner";
import { PublishedLocationMap } from "@/components/published-location-map";
import { formatInr } from "@/lib/discovery/domain";
import { getPublishedListing } from "@/lib/discovery/data";
import { googleMapsLocationUrl } from "@/lib/maps/google-maps-url";
import { ListingGallery } from "@/components/listing-gallery";
import { QuoteUnitSelector } from "@/components/quote-unit-selector";
import { getCurrentIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; q?: string; category?: string; district?: string; max?: string; page?: string; bbox?: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const result = await getPublishedListing((await params).id); return { title: result?.listing.title ?? "Media listing" }; }

export default async function MediaDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const result = await getPublishedListing(id);
  if (!result) notFound();
  const { listing, blackouts, shows, media } = result;
  const identity = await getCurrentIdentity();
  const { data: ownListing } = identity ? await (await createServerSupabaseClient()).from("inventory_listings").select("id").eq("id", id).eq("owner_id", identity.userId).maybeSingle() : { data: null };
  const details = listing.category_details;
  const backParams = new URLSearchParams();
  for (const key of ["q", "category", "district", "max", "page", "bbox"] as const) if (query[key]) backParams.set(key, query[key]);
  const backHref = `/discover${backParams.size ? `?${backParams}` : ""}`;
  const todayInIst = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const minDate = `${todayInIst.year}-${todayInIst.month}-${todayInIst.day}`;
  return <main className="dashboard-shell wide-dashboard media-detail">
    <div className="media-breadcrumb"><Link href={backHref}>← Back to results</Link><span>{listing.district} / {listing.locality}</span></div>
    <div className="media-hero">
      <ListingGallery listingId={id} title={listing.title} category={listing.category} media={media} />
      <aside className="quote-card panel-card"><span className="eyebrow">Published rate</span><h2>{formatInr(listing.amount_paise)}</h2><p>per {listing.rate_unit.replaceAll("_", " ")} · rate effective {new Date(listing.rate_effective_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p><MessageBanner error={query.error} />{ownListing ? <div className="form-stack"><p>This is your own screen. To schedule your campaign, request self-use dates in the owner workspace for admin approval.</p><Link className="button button-secondary button-small" href={`/owner/listings/${id}/edit`}>Request self-use dates</Link></div> : <form action={createQuote} className="form-stack"><fieldset><input type="hidden" name="listingId" value={id} /><input type="hidden" name="category" value={listing.category} />
        <QuoteUnitSelector category={listing.category} minDate={minDate} shows={shows} mobileSlots={Number(details.rotatingSlots ?? 30)} />
        </fieldset></form>}{!ownListing ? <small>Signing in is required. A quote freezes the displayed price and service terms; it does not reserve capacity.</small> : null}</aside>
    </div>
    <div className="media-content-grid"><article><span className="inventory-kicker">{listing.category} · {listing.locality}, {listing.district}</span><h1>{listing.title}</h1><p className="media-description">{listing.description}</p><section className="detail-section"><h2>Published service</h2><p>{listing.service_promise}</p><dl className="detail-facts"><div><dt>Ad duration</dt><dd>{listing.ad_duration_seconds} seconds</dd></div><div><dt>Plays per unit</dt><dd>{listing.plays_per_unit}</dd></div><div><dt>Operating hours</dt><dd>{String(listing.operating_start).slice(0,5)}–{String(listing.operating_end).slice(0,5)}</dd></div><div><dt>Audience estimate</dt><dd>{listing.audience_estimate.toLocaleString("en-IN")}</dd></div></dl><p className="small-note">{listing.audience_attribution}</p></section>
      <section className="detail-section"><h2>Format specifications</h2><dl className="detail-facts">{Object.entries(details).filter(([key]) => key !== "routeGeoJson" && key !== "showStarts").map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl></section>
      <AvailabilityCalendar category={listing.category} blackouts={blackouts} shows={shows} />
    </article><aside className="location-card panel-card"><span className="eyebrow">Published location</span><h2>{listing.locality}, {listing.district}</h2><PublishedLocationMap latitude={listing.latitude} longitude={listing.longitude} locality={listing.locality} route={details.routeGeoJson ?? details.route_geo_json} /><a className="button button-secondary button-small" href={googleMapsLocationUrl(listing.latitude, listing.longitude)} target="_blank" rel="noopener noreferrer">Open location in Google Maps ↗</a><p>Owner-submitted location reviewed before publication. Mobile routes show the published planned path.</p></aside></div>
  </main>;
}
