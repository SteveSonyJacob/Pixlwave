import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createQuote } from "@/app/quotes/actions";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { MessageBanner } from "@/components/message-banner";
import { formatInr } from "@/lib/discovery/domain";
import { getPublishedListing } from "@/lib/discovery/data";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const result = await getPublishedListing((await params).id); return { title: result?.listing.title ?? "Media listing" }; }

export default async function MediaDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const result = await getPublishedListing(id);
  if (!result) notFound();
  const { listing, blackouts, shows, media } = result;
  const details = listing.category_details;
  return <main className="dashboard-shell wide-dashboard media-detail">
    <div className="media-breadcrumb"><Link href="/discover">← All media</Link><span>{listing.district} / {listing.locality}</span></div>
    <div className="media-hero">
      <div className="media-gallery">{media.length ? media.map((asset, index) => <Image key={asset.id} src={`/api/inventory/${id}/media/${asset.id}`} alt={`${listing.title} — ${asset.original_name}`} width={900} height={600} priority={index === 0} unoptimized />) : <div className={`media-placeholder format-${listing.category}`}><b>{listing.category.toUpperCase()}</b><span>Owner photography is pending</span></div>}</div>
      <aside className="quote-card panel-card"><span className="eyebrow">Published rate</span><h2>{formatInr(listing.amount_paise)}</h2><p>per {listing.rate_unit.replaceAll("_", " ")} · rate effective {new Date(listing.rate_effective_at).toLocaleDateString("en-IN")}</p><MessageBanner error={query.error} /><form action={createQuote} className="form-stack"><input type="hidden" name="listingId" value={id} /><input type="hidden" name="category" value={listing.category} />
        {listing.category === "theatre" ? <><label>Show<select name="showInstanceId" required defaultValue=""><option value="" disabled>Select a future show</option>{shows.map((show) => <option key={show.id} value={show.id}>{new Date(show.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} · {show.slots_total} published slots</option>)}</select></label><label>Slots<input name="quantity" type="number" min="1" max="50" defaultValue="1" required /></label></> : <><label>Inventory date<input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>{listing.category === "mobile" ? <label>Rotating slots<input name="quantity" type="number" min="1" max={Number(details.rotatingSlots ?? 30)} defaultValue="1" required /></label> : null}</>}
        <button className="button">Create 30-minute quote</button></form><small>Signing in is required. A quote freezes the displayed price and service terms; it does not reserve capacity.</small></aside>
    </div>
    <div className="media-content-grid"><article><span className="inventory-kicker">{listing.category} · {listing.locality}, {listing.district}</span><h1>{listing.title}</h1><p className="media-description">{listing.description}</p><section className="detail-section"><h2>Published service</h2><p>{listing.service_promise}</p><dl className="detail-facts"><div><dt>Ad duration</dt><dd>{listing.ad_duration_seconds} seconds</dd></div><div><dt>Plays per unit</dt><dd>{listing.plays_per_unit}</dd></div><div><dt>Operating hours</dt><dd>{String(listing.operating_start).slice(0,5)}–{String(listing.operating_end).slice(0,5)}</dd></div><div><dt>Audience estimate</dt><dd>{listing.audience_estimate.toLocaleString("en-IN")}</dd></div></dl><p className="small-note">{listing.audience_attribution}</p></section>
      <section className="detail-section"><h2>Format specifications</h2><dl className="detail-facts">{Object.entries(details).filter(([key]) => key !== "routeGeoJson" && key !== "showStarts").map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl></section>
      <AvailabilityCalendar category={listing.category} blackouts={blackouts} shows={shows} />
    </article><aside className="location-card panel-card"><span className="eyebrow">Published location</span><h2>{listing.locality}, {listing.district}</h2><div className="coordinate-map"><span>●</span><small>{listing.latitude}, {listing.longitude}</small></div><p>Exact coordinates are owner-submitted and admin-reviewed. Provider map tiles and route rendering remain subject to the configured Kerala map provider.</p></aside></div>
  </main>;
}
