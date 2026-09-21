import type { Metadata } from "next";
import { InventoryMap } from "@/components/inventory-map";

export const metadata: Metadata = { title: "Kerala advertising map", description: "Browse published LED, theatre and mobile advertising inventory across Kerala." };

export default function MapPage() {
  return <main className="map-page">
    <header className="map-page-heading"><span className="eyebrow">Kerala inventory</span><h1>Find media on the map</h1><p>Browse published locations and owner-approved mobile routes. Prices come from listing rate revisions—not map traffic or demand.</p></header>
    <InventoryMap />
  </main>;
}
