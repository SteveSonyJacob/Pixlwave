import type { Metadata } from "next";
import { InventoryMap } from "@/components/inventory-map";
import { localDemoEnabled } from "@/lib/discovery/demo";

export const metadata: Metadata = { title: "Kerala advertising map", description: "Browse published LED, theatre and mobile advertising inventory across Kerala." };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demo = localDemoEnabled() && (await searchParams).demo === "1";
  return <main className="map-page">
    <header className="map-page-heading"><span className="eyebrow">Kerala inventory</span><h1>{demo ? "Sample media on the map" : "Find media on the map"}</h1><p>{demo ? "Illustrative points and a planned route for local interface review. These listings are not bookable." : "Browse published locations and owner-approved mobile routes. Prices come from listing rate revisions—not map traffic or demand."}</p></header>
    <InventoryMap demo={demo} />
  </main>;
}
