import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatInr } from "@/lib/discovery/domain";
import { searchPublishedInventory, type DiscoveryFilters, type PublishedListing } from "@/lib/discovery/data";
import { localDemoEnabled } from "@/lib/discovery/demo";
import { keralaDistricts } from "@/lib/inventory/domain";

export const metadata: Metadata = { title: "Discover media" };
type PageProps = { searchParams: Promise<DiscoveryFilters> };

const categoryName = { led: "LED / digital", theatre: "Theatre", mobile: "Mobile billboard" } as const;

export default async function DiscoverPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  let listings: PublishedListing[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 12;
  let error = "";
  try { ({ listings, total, page, pageSize } = await searchPublishedInventory(filters)); } catch (caught) { error = caught instanceof Error ? caught.message : "Discovery is unavailable."; }
  const searchState = new URLSearchParams();
  for (const key of ["q", "category", "district", "max"] as const) if (filters[key]) searchState.set(key, filters[key]);
  const isDemo = localDemoEnabled() && filters.demo === "1";
  if (isDemo) searchState.set("demo", "1");
  const pageHref = (nextPage: number) => { const params = new URLSearchParams(searchState); params.set("page", String(nextPage)); return `/discover?${params}`; };
  const detailHref = (id: string) => { const params = new URLSearchParams(searchState); if (page > 1) params.set("page", String(page)); return `/media/${id}${params.size ? `?${params}` : ""}`; };
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  return <main className="dashboard-shell wide-dashboard discovery-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Kerala media discovery</span><h1>{isDemo ? "Explore sample media" : "Find inventory with published prices"}</h1><p>{isDemo ? "Illustrative local listings for reviewing the interface. These placements are not available to book." : "Browse admin-approved service terms and create a 30-minute price snapshot before payment."}</p></div></div>
    {isDemo ? <div className="demo-callout"><div><b>Local demo only</b><p>Sample names, prices, audience figures, images, and availability. No Supabase records are created.</p></div><Link className="button button-secondary button-small" href="/discover">View real inventory</Link></div> : null}
    <form className="panel-card discovery-filters" method="get">
      {isDemo ? <input type="hidden" name="demo" value="1" /> : null}
      <label>Search<input name="q" placeholder="Title, locality or description" defaultValue={filters.q} /></label>
      <label>Format<select name="category" defaultValue={filters.category ?? ""}><option value="">All formats</option><option value="led">LED / digital</option><option value="theatre">Theatre</option><option value="mobile">Mobile billboard</option></select></label>
      <label>District<select name="district" defaultValue={filters.district ?? ""}><option value="">All Kerala</option>{keralaDistricts.map((district) => <option key={district}>{district}</option>)}</select></label>
      <label>Maximum ₹ / unit<input name="max" type="number" min="100" step="100" defaultValue={filters.max} /></label>
      <button className="button button-small">Apply filters</button>
    </form>
    <div className="result-heading"><b>{error ? "Results unavailable" : total ? `Showing ${start}–${end} of ${total} ${isDemo ? "sample" : "published"} placements` : "No placements match"}</b><span>{isDemo ? "Demo listings cannot create quotes or bookings." : "Availability is checked when you request a quote. Quotes do not reserve inventory."}</span></div>
    {error ? <div className="banner banner-error">{error}</div> : null}
    {listings.length ? <div className="discovery-grid">{listings.map((listing) => <article className="discovery-card" key={listing.id}>
      <div className={`discovery-card-visual format-${listing.category}`}>{listing.cover_image_url || listing.cover_asset_id ? <Image src={listing.cover_image_url ?? `/api/inventory/${listing.id}/media/${listing.cover_asset_id}`} alt={`${listing.title} at ${listing.locality}`} width={800} height={450} unoptimized /> : null}<span>{listing.category === "led" ? "LED" : listing.category === "theatre" ? "SCREEN" : "MOBILE"}</span><small>{listing.locality}</small></div>
      <div className="discovery-card-body">{listing.is_demo ? <span className="demo-badge">Demo listing</span> : null}<span className="inventory-kicker">{categoryName[listing.category]} · {listing.district}</span><h2>{listing.title}</h2><p>{listing.description}</p><dl className="discovery-facts"><div><dt>Audience estimate</dt><dd>{listing.audience_estimate.toLocaleString("en-IN")}</dd></div><div><dt>Service</dt><dd>{listing.plays_per_unit} plays · {listing.ad_duration_seconds}s</dd></div></dl><div className="discovery-price"><div><strong>{formatInr(listing.amount_paise)}</strong><small>per {listing.rate_unit.replaceAll("_", " ")}</small></div><Link className="button button-small" href={detailHref(listing.id)}>View details</Link></div></div>
    </article>)}</div> : !error ? <div className="empty-state inventory-empty"><span>⌖</span><h2>No placements match</h2><p>Clear one or more filters, or try another Kerala district.</p><Link className="button button-secondary" href={isDemo ? "/discover?demo=1" : "/discover"}>Clear filters</Link>{!isDemo && localDemoEnabled() ? <Link className="button button-secondary" href="/discover?demo=1">Preview demo listings</Link> : null}</div> : null}
    {!error && total > pageSize ? <nav className="discovery-pagination" aria-label="Discovery pages"><span>Page {page} of {Math.ceil(total / pageSize)}</span><div>{page > 1 ? <Link className="button button-secondary button-small" href={pageHref(page - 1)}>Previous</Link> : null}{page * pageSize < total ? <Link className="button button-secondary button-small" href={pageHref(page + 1)}>Next</Link> : null}</div></nav> : null}
  </main>;
}
