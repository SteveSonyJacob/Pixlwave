import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { searchPublishedInventory, type PublishedListing } from "@/lib/discovery/data";
import { discoveryHref, discoveryParams, parseDiscoveryFilters, type RawDiscoveryFilters } from "@/lib/discovery/filters";
import { keralaDistricts } from "@/lib/inventory/domain";
import { ListingCard } from "@/components/listing-card";
import { Button, LinkButton } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Discover media" };
type PageProps = { searchParams: Promise<RawDiscoveryFilters> };


export default async function DiscoverPage({ searchParams }: PageProps) {
  const filters = parseDiscoveryFilters(await searchParams);
  let listings: PublishedListing[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 12;
  let error = "";
  try { ({ listings, total, page, pageSize } = await searchPublishedInventory(filters)); } catch (caught) { error = caught instanceof Error ? caught.message : "Discovery is unavailable."; }
  const searchState = discoveryParams(filters, { bbox: true });
  const pageHref = (nextPage: number) => discoveryHref("/discover", { ...filters, page: String(nextPage) }, { page: true, bbox: true });
  const detailHref = (id: string) => { const params = discoveryParams({ ...filters, page: page > 1 ? String(page) : undefined }, { page: true, bbox: true }); return `/media/${id}${params.size ? `?${params}` : ""}`; };
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  return <main className="dashboard-shell wide-dashboard discovery-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Kerala media discovery</span><h1>Find inventory with published prices</h1><p>Browse admin-approved service terms and create a 30-minute price snapshot before payment.</p></div></div>
    <Form action="/discover" key={searchState.toString()} className="panel-card discovery-filters">
      {filters.bbox ? <input type="hidden" name="bbox" value={filters.bbox} /> : null}
      <TextField id="discover-search" label="Search" name="q" placeholder="Title, locality or description" defaultValue={filters.q} />
      <SelectField id="discover-format" label="Format" name="category" defaultValue={filters.category ?? ""}><option value="">All formats</option><option value="led">LED / digital</option><option value="theatre">Theatre</option><option value="mobile">Mobile billboard</option></SelectField>
      <SelectField id="discover-district" label="District" name="district" defaultValue={filters.district ?? ""}><option value="">All Kerala</option>{keralaDistricts.map((district) => <option key={district}>{district}</option>)}</SelectField>
      <TextField id="discover-budget" label="Maximum ₹ / unit" name="max" type="number" min="100" step="100" defaultValue={filters.max} />
      <Button type="submit">Apply filters</Button>
    </Form>
    <div className="discovery-view-links"><Link href={discoveryHref("/map", filters, { bbox: true })}>Explore these results on the map →</Link>{filters.bbox ? <Link href={discoveryHref("/discover", { ...filters, bbox: undefined })}>Clear map area</Link> : null}</div>
    <div className="result-heading"><b>{error ? "Results unavailable" : total ? `Showing ${start}–${end} of ${total} published placements` : "No placements match"}</b><span>Availability is checked when you request a quote. Quotes do not reserve inventory.</span></div>
    {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
    {listings.length ? <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} href={detailHref(listing.id)} />)}</div> : !error ? <EmptyState title="No placements match" description="Clear one or more filters, or try another Kerala district."><LinkButton variant="secondary" href="/discover">Clear filters</LinkButton></EmptyState> : null}
    {!error && total > pageSize ? <nav className="discovery-pagination" aria-label="Discovery pages"><span>Page {page} of {Math.ceil(total / pageSize)}</span><div>{page > 1 ? <Link className="button button-secondary button-small" href={pageHref(page - 1)}>Previous</Link> : null}{page * pageSize < total ? <Link className="button button-secondary button-small" href={pageHref(page + 1)}>Next</Link> : null}</div></nav> : null}
  </main>;
}
