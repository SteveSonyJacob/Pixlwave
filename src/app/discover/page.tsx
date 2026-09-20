import type { Metadata } from "next";
import Link from "next/link";
import { formatInr } from "@/lib/discovery/domain";
import { searchPublishedInventory, type PublishedListing } from "@/lib/discovery/data";
import { keralaDistricts } from "@/lib/inventory/domain";

export const metadata: Metadata = { title: "Discover media" };
type PageProps = { searchParams: Promise<{ q?: string; category?: string; district?: string; max?: string; date?: string }> };

const categoryName = { led: "LED / digital", theatre: "Theatre", mobile: "Mobile billboard" } as const;

export default async function DiscoverPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  let listings: PublishedListing[] = [];
  let error = "";
  try { listings = await searchPublishedInventory(filters); } catch (caught) { error = caught instanceof Error ? caught.message : "Discovery is unavailable."; }
  return <main className="dashboard-shell wide-dashboard discovery-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Kerala media discovery</span><h1>Find inventory with published prices</h1><p>Browse admin-approved service terms and create a 30-minute price snapshot before payment.</p></div></div>
    <form className="panel-card discovery-filters" method="get">
      <label>Search<input name="q" placeholder="Title, locality or description" defaultValue={filters.q} /></label>
      <label>Format<select name="category" defaultValue={filters.category ?? ""}><option value="">All formats</option><option value="led">LED / digital</option><option value="theatre">Theatre</option><option value="mobile">Mobile billboard</option></select></label>
      <label>District<select name="district" defaultValue={filters.district ?? ""}><option value="">All Kerala</option>{keralaDistricts.map((district) => <option key={district}>{district}</option>)}</select></label>
      <label>Maximum ₹ / unit<input name="max" type="number" min="100" step="100" defaultValue={filters.max} /></label>
      <label>Required date<input name="date" type="date" defaultValue={filters.date} /></label>
      <button className="button button-small">Apply filters</button>
    </form>
    <div className="result-heading"><b>{listings.length} published {listings.length === 1 ? "placement" : "placements"}</b><span>Quotes do not reserve inventory.</span></div>
    {error ? <div className="banner banner-error">{error}</div> : null}
    {listings.length ? <div className="discovery-grid">{listings.map((listing) => <article className="discovery-card" key={listing.id}>
      <div className={`discovery-card-visual format-${listing.category}`}><span>{listing.category === "led" ? "LED" : listing.category === "theatre" ? "SCREEN" : "MOBILE"}</span><small>{listing.locality}</small></div>
      <div className="discovery-card-body"><span className="inventory-kicker">{categoryName[listing.category]} · {listing.district}</span><h2>{listing.title}</h2><p>{listing.description}</p><dl className="discovery-facts"><div><dt>Audience estimate</dt><dd>{listing.audience_estimate.toLocaleString("en-IN")}</dd></div><div><dt>Service</dt><dd>{listing.plays_per_unit} plays · {listing.ad_duration_seconds}s</dd></div></dl><div className="discovery-price"><div><strong>{formatInr(listing.amount_paise)}</strong><small>per {listing.rate_unit.replaceAll("_", " ")}</small></div><Link className="button button-small" href={`/media/${listing.id}`}>View details</Link></div></div>
    </article>)}</div> : !error ? <div className="empty-state inventory-empty"><span>⌖</span><h2>No placements match</h2><p>Clear one or more filters, or try another Kerala district.</p><Link className="button button-secondary" href="/discover">Clear filters</Link></div> : null}
  </main>;
}
