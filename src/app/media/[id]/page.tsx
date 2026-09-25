import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createQuote } from "@/app/quotes/actions";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { MessageBanner } from "@/components/message-banner";
import { PublishedLocationMap } from "@/components/published-location-map";
import { formatInr } from "@/lib/discovery/domain";
import { getPublishedListing } from "@/lib/discovery/data";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; q?: string; category?: string; district?: string; max?: string; page?: string; demo?: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const result = await getPublishedListing((await params).id); return { title: result?.listing.title ?? "Media listing" }; }

export default async function MediaDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const result = await getPublishedListing(id);
  if (!result) notFound();
  const { listing, blackouts, shows, media } = result;
  const details = listing.category_details;
  const backParams = new URLSearchParams();
  for (const key of ["q", "category", "district", "max", "page"] as const) if (query[key]) backParams.set(key, query[key]);
  if (listing.is_demo) backParams.set("demo", "1");
  const backHref = `/discover${backParams.size ? `?${backParams}` : ""}`;
  const todayInIst = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const minDate = `${todayInIst.year}-${todayInIst.month}-${todayInIst.day}`;
  return <main className="dashboard-shell wide-dashboard media-detail">
    {listing.is_demo ? <div className="demo-callout"><div><b>Illustrative demo listing</b><p>This placement, its rate, audience figure, availability, and image are samples for local design review. Quotes and bookings are disabled.</p></div><Link className="button button-secondary button-small" href="/discover">View real inventory</Link></div> : null}
    <div className="media-breadcrumb"><Link href={backHref}>← Back to results</Link><span>{listing.district} / {listing.locality}</span></div>
    <div className="media-hero">
      <div className="media-gallery">{media.length ? media.map((asset, index) => <Image key={asset.id} src={asset.url ?? `/api/inventory/${id}/media/${asset.id}`} alt={`${listing.title} — ${asset.original_name}`} width={900} height={600} priority={index === 0} unoptimized />) : <div className={`media-placeholder format-${listing.category}`}><b>{listing.category.toUpperCase()}</b><span>Owner photography is pending</span></div>}</div>
      <aside className="quote-card panel-card"><span className="eyebrow">{listing.is_demo ? "Sample rate" : "Published rate"}</span><h2>{formatInr(listing.amount_paise)}</h2><p>per {listing.rate_unit.replaceAll("_", " ")}{listing.is_demo ? " · illustrative price" : ` · rate effective ${new Date(listing.rate_effective_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}</p><MessageBanner error={query.error} /><form action={listing.is_demo ? undefined : createQuote} className="form-stack"><fieldset className="demo-quote-fields" disabled={listing.is_demo}><input type="hidden" name="listingId" value={id} /><input type="hidden" name="category" value={listing.category} />
        {listing.category === "theatre" ? <>{shows.length ? <><label>Shows (select one or more)<select name="showInstanceIds" required multiple size={Math.min(6, Math.max(2, shows.length))}>{shows.map((show) => <option key={show.id} value={show.id}>{new Date(show.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} · {show.slots_total} {listing.is_demo ? "sample" : "published"} slots</option>)}</select></label><label>Slots per selected show<input name="quantity" type="number" min="1" max="50" defaultValue="1" required /></label></> : <p>No upcoming published shows are available for a quote.</p>}</> : <><div className="two-fields"><label>Start date<input name="startDate" type="date" min={minDate} required /></label><label>End date (inclusive)<input name="endDate" type="date" min={minDate} required /></label></div>{listing.category === "mobile" ? <label>Rotating slots per date<input name="quantity" type="number" min="1" max={Number(details.rotatingSlots ?? 30)} defaultValue="1" required /></label> : null}</>}
        <button className="button" disabled={listing.category === "theatre" && !shows.length}>{listing.is_demo ? "Demo quote unavailable" : "Create 30-minute quote"}</button></fieldset></form><small>{listing.is_demo ? "Use a real published listing to create a server-priced quote." : "Signing in is required. A quote freezes the displayed price and service terms; it does not reserve capacity."}</small></aside>
    </div>
    <div className="media-content-grid"><article><span className="inventory-kicker">{listing.category} · {listing.locality}, {listing.district}</span><h1>{listing.title}</h1><p className="media-description">{listing.description}</p><section className="detail-section"><h2>{listing.is_demo ? "Sample service" : "Published service"}</h2><p>{listing.service_promise}</p><dl className="detail-facts"><div><dt>Ad duration</dt><dd>{listing.ad_duration_seconds} seconds</dd></div><div><dt>Plays per unit</dt><dd>{listing.plays_per_unit}</dd></div><div><dt>Operating hours</dt><dd>{String(listing.operating_start).slice(0,5)}–{String(listing.operating_end).slice(0,5)}</dd></div><div><dt>Audience estimate</dt><dd>{listing.audience_estimate.toLocaleString("en-IN")}</dd></div></dl><p className="small-note">{listing.audience_attribution}</p></section>
      <section className="detail-section"><h2>Format specifications</h2><dl className="detail-facts">{Object.entries(details).filter(([key]) => key !== "routeGeoJson" && key !== "showStarts").map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl></section>
      <AvailabilityCalendar category={listing.category} blackouts={blackouts} shows={shows} demo={listing.is_demo} />
    </article><aside className="location-card panel-card"><span className="eyebrow">{listing.is_demo ? "Sample location" : "Published location"}</span><h2>{listing.locality}, {listing.district}</h2><PublishedLocationMap latitude={listing.latitude} longitude={listing.longitude} locality={listing.locality} route={details.routeGeoJson ?? details.route_geo_json} demo={listing.is_demo} /><p>{listing.is_demo ? "Approximate demo point and planned route for interface preview." : "Owner-submitted location reviewed before publication. Mobile routes show the published planned path."}</p></aside></div>
  </main>;
}
