import type { Metadata } from "next";
import { InventoryMap } from "@/components/inventory-map";
import { getMapInventory, type PublishedListing } from "@/lib/discovery/data";
import { discoveryHref, parseDiscoveryFilters, type RawDiscoveryFilters } from "@/lib/discovery/filters";

export const metadata: Metadata = { title: "Kerala advertising map", description: "Browse published LED, theatre and mobile advertising inventory across Kerala." };

export default async function MapPage({ searchParams }: { searchParams: Promise<RawDiscoveryFilters> }) {
  const filters = parseDiscoveryFilters(await searchParams);
  let listings: PublishedListing[] = [];
  let total = 0;
  let truncated = false;
  let error = "";
  try { ({ listings, total, truncated } = await getMapInventory(filters)); } catch { error = "Published locations are temporarily unavailable."; }
  return <main className="map-page">
    <header className="map-page-heading"><span className="eyebrow">Kerala inventory</span><h1>Find media on the map</h1><p>Browse published locations and owner-approved mobile routes. Prices come from listing rate revisions—not map traffic or demand.</p></header>
    <InventoryMap listings={listings} filters={filters} total={total} truncated={truncated} error={error} listHref={discoveryHref("/discover", filters, { bbox: true })} />
  </main>;
}
