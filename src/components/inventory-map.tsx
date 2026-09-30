"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { KERALA_BOUNDS } from "@/lib/maps/nominatim";
import { createOsmRasterStyle, DEFAULT_OSM_TILE_URL } from "@/lib/maps/style";
import { keralaDistricts } from "@/lib/inventory/domain";
import type { DiscoveryFilters } from "@/lib/discovery/filters";
import { googleMapsLocationUrl } from "@/lib/maps/google-maps-url";

type InventoryItem = {
  id: string;
  category: "led" | "theatre" | "mobile";
  title: string;
  description: string;
  locality: string;
  district: string;
  latitude: number;
  longitude: number;
  category_details: Record<string, unknown> | null;
  rate_unit: string;
  amount_paise: number;
};

const categoryLabels = { led: "LED screens", theatre: "Theatre slots", mobile: "Mobile media" } as const;

function formatRate(item: InventoryItem) {
  const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.amount_paise / 100);
  return `${amount} / ${item.rate_unit.replaceAll("_", " ")}`;
}

function points(items: InventoryItem[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(item.longitude), Number(item.latitude)] },
      properties: { id: item.id, title: item.title, category: item.category, locality: item.locality, district: item.district, rate: formatRate(item) }
    }))
  };
}

function routes(items: InventoryItem[]): FeatureCollection<LineString> {
  const features = items.flatMap((item): Feature<LineString>[] => {
    if (item.category !== "mobile") return [];
    const encoded = item.category_details?.routeGeoJson ?? item.category_details?.route_geo_json;
    try {
      const geometry = typeof encoded === "string" ? JSON.parse(encoded) : encoded;
      if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) return [];
      return [{ type: "Feature", geometry, properties: { id: item.id, title: item.title } }];
    } catch {
      return [];
    }
  });
  return { type: "FeatureCollection", features };
}

function updateMapData(map: MapLibreMap, items: InventoryItem[]) {
  (map.getSource("inventory-points") as GeoJSONSource | undefined)?.setData(points(items));
  (map.getSource("inventory-routes") as GeoJSONSource | undefined)?.setData(routes(items));
}

export function InventoryMap({ listings, filters, total, truncated, error, listHref }: { listings: InventoryItem[]; filters: DiscoveryFilters; total: number; truncated: boolean; error: string; listHref: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const visibleRef = useRef<InventoryItem[]>(listings);
  const [mapError, setMapError] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (mobileView === "map") mapRef.current?.resize();
  }, [mobileView]);

  useEffect(() => {
    visibleRef.current = listings;
    if (mapRef.current?.isStyleLoaded()) updateMapData(mapRef.current, listings);
  }, [listings]);

  useEffect(() => {
    if (!filters.bbox || !mapRef.current) return;
    const [west, south, east, north] = filters.bbox.split(",").map(Number);
    mapRef.current.fitBounds([[west, south], [east, north]], { padding: 36, duration: 0 });
  }, [filters.bbox]);

  useEffect(() => {
    let cancelled = false;
    void import("maplibre-gl").then(({ Map, NavigationControl, Popup, setWorkerUrl }) => {
      if (cancelled || !containerRef.current) return;
      try {
      setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const map = new Map({
        container: containerRef.current,
        style: createOsmRasterStyle(process.env.NEXT_PUBLIC_OSM_TILE_URL || DEFAULT_OSM_TILE_URL),
        center: [76.2711, 10.1632],
        zoom: 6.3,
        maxBounds: [[KERALA_BOUNDS.west - 0.3, KERALA_BOUNDS.south - 0.3], [KERALA_BOUNDS.east + 0.3, KERALA_BOUNDS.north + 0.3]],
        attributionControl: { compact: true },
        cooperativeGestures: true
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      if (filters.bbox) {
        const [west, south, east, north] = filters.bbox.split(",").map(Number);
        map.fitBounds([[west, south], [east, north]], { padding: 36, duration: 0 });
      }
      map.on("error", () => setMapError("The map tiles could not load. Use the results list to open a placement."));
      map.on("load", () => {
        map.addSource("inventory-routes", { type: "geojson", data: routes(visibleRef.current) });
        map.addLayer({ id: "inventory-routes", type: "line", source: "inventory-routes", paint: { "line-color": "#ff725e", "line-width": 4, "line-opacity": 0.8 } });
        map.addSource("inventory-points", { type: "geojson", data: points(visibleRef.current), cluster: true, clusterMaxZoom: 13, clusterRadius: 48 });
        map.addLayer({ id: "inventory-clusters", type: "circle", source: "inventory-points", filter: ["has", "point_count"], paint: { "circle-color": "#1268e8", "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 30], "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } });
        map.addLayer({ id: "inventory-cluster-count", type: "symbol", source: "inventory-points", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 }, paint: { "text-color": "#ffffff" } });
        map.addLayer({ id: "inventory-locations", type: "circle", source: "inventory-points", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["match", ["get", "category"], "mobile", "#ff725e", "theatre", "#13b987", "#1268e8"], "circle-radius": 9, "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } });
      });
      map.on("click", "inventory-clusters", async (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ["inventory-clusters"] })[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        const zoom = await (map.getSource("inventory-points") as GeoJSONSource).getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (feature.geometry as Point).coordinates as [number, number], zoom });
      });
      map.on("click", "inventory-locations", (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const properties = feature.properties ?? {};
        setSelectedId(String(properties.id ?? ""));
        const content = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = String(properties.title ?? "Media listing");
        const details = document.createElement("p");
        details.textContent = `${properties.locality}, ${properties.district} · ${properties.rate}`;
        const link = document.createElement("a");
        link.href = `/media/${encodeURIComponent(String(properties.id ?? ""))}`;
        link.textContent = "View details →";
        link.className = "map-popup-link";
        const item = visibleRef.current.find((entry) => entry.id === String(properties.id ?? ""));
        const googleLink = document.createElement("a");
        if (item) {
          googleLink.href = googleMapsLocationUrl(item.latitude, item.longitude);
          googleLink.textContent = "Open in Google Maps ↗";
          googleLink.className = "map-popup-link";
          googleLink.target = "_blank";
          googleLink.rel = "noopener noreferrer";
        }
        content.append(title, details, link);
        if (item) content.append(googleLink);
        new Popup({ offset: 14 }).setLngLat(feature.geometry.coordinates as [number, number]).setDOMContent(content).addTo(map);
      });
      for (const layer of ["inventory-clusters", "inventory-locations"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }
      mapRef.current = map;
      } catch { setMapError("This device cannot display the map. The results list remains available."); }
    }).catch(() => { if (!cancelled) setMapError("The map could not load. The results list remains available."); });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // The map itself lives for this component mount; URL filter changes only replace its GeoJSON data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("inventory-locations")) return;
    map.setPaintProperty("inventory-locations", "circle-radius", ["case", ["==", ["get", "id"], selectedId ?? ""], 14, 9]);
  }, [selectedId]);

  function focus(item: InventoryItem) {
    setSelectedId(item.id);
    if (window.matchMedia("(max-width: 800px)").matches) setMobileView("map");
    mapRef.current?.flyTo({ center: [Number(item.longitude), Number(item.latitude)], zoom: 14, essential: true });
  }

  function searchThisArea() {
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return;
    const params = new URLSearchParams(window.location.search);
    params.set("bbox", [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].map((value) => value.toFixed(4)).join(","));
    params.delete("page");
    router.push(`/map?${params}`);
  }

  return <div className="map-browser">
    <div className="map-view-switch" role="group" aria-label="Inventory view"><button type="button" aria-pressed={mobileView === "list"} onClick={() => setMobileView("list")}>List</button><button type="button" aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}>Map</button></div>
    <aside className={`map-sidebar ${mobileView === "map" ? "mobile-view-hidden" : ""}`}>
      <form action="/map" key={JSON.stringify(filters)} className="map-filters">
        {filters.bbox ? <input type="hidden" name="bbox" value={filters.bbox} /> : null}
        <label>Search<input name="q" defaultValue={filters.q ?? ""} placeholder="Place or screen" /></label>
        <label>Media type<select name="category" defaultValue={filters.category ?? ""}><option value="">All media</option><option value="led">LED screens</option><option value="theatre">Theatre slots</option><option value="mobile">Mobile media</option></select></label>
        <label>District<select name="district" defaultValue={filters.district ?? ""}><option value="">All districts</option>{keralaDistricts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Maximum ₹ / unit<input name="max" type="number" min="100" max="10000000" step="1" defaultValue={filters.max ?? ""} placeholder="Any rate" /></label>
        <button className="button button-small" type="submit">Apply filters</button>
      </form>
      <p className="map-status" role="status">{error || `${listings.length} of ${total} published location(s). ${truncated ? "Narrow the filters to see all locations. " : ""}Payment alone does not reserve capacity.`} <Link href={listHref}>View text results →</Link></p>
      <div className="map-results">{listings.map((item) => <div className={`map-result ${selectedId === item.id ? "selected" : ""}`} key={item.id}><button type="button" aria-pressed={selectedId === item.id} onClick={() => focus(item)}><span className={`map-category map-category-${item.category}`}>{categoryLabels[item.category]}</span><strong>{item.title}</strong><small>{item.locality}, {item.district}</small><b>{formatRate(item)}</b></button><div className="map-result-links"><Link href={`/media/${item.id}`}>View details →</Link><a href={googleMapsLocationUrl(item.latitude, item.longitude)} target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div>)}{!listings.length ? <div className="map-empty">{error || "No published listings match these filters."}</div> : null}</div>
    </aside>
    <div className={`inventory-map-shell ${mobileView === "list" ? "mobile-view-hidden" : ""}`}><div className="inventory-map" ref={containerRef} role="region" aria-label="Map of published advertising inventory across Kerala" />{mapError ? <div className="map-failure" role="alert">{mapError} <Link href={listHref}>View results</Link></div> : <button type="button" className="button button-small map-search-area" onClick={searchThisArea}>Search this area</button>}</div>
  </div>;
}
