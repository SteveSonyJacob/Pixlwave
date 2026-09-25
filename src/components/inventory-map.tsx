"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { KERALA_BOUNDS } from "@/lib/maps/nominatim";
import { createOsmRasterStyle, DEFAULT_OSM_TILE_URL } from "@/lib/maps/style";

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
  is_demo?: boolean;
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

export function InventoryMap({ demo = false }: { demo?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const visibleRef = useRef<InventoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [category, setCategory] = useState<"all" | InventoryItem["category"]>("all");
  const [district, setDistrict] = useState("all");
  const [message, setMessage] = useState(demo ? "Loading demo inventory…" : "Loading published inventory…");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (mobileView === "map") mapRef.current?.resize();
  }, [mobileView]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const all: InventoryItem[] = [];
        let page = 1;
        while (true) {
          const response = await fetch(`/api/inventory/published?page=${page}${demo ? "&demo=1" : ""}`, { signal: controller.signal });
          const body = await response.json() as { inventory?: InventoryItem[]; hasMore?: boolean; error?: string };
          if (!response.ok) throw new Error(body.error || "Published inventory is unavailable.");
          all.push(...(body.inventory ?? []));
          setInventory([...all]);
          setMessage(demo ? `${all.length} illustrative demo location(s). Quotes and bookings are disabled.` : `${all.length} published location(s). Availability is confirmed only after admin approval.`);
          if (!body.hasMore) break;
          page += 1;
        }
      } catch { if (!controller.signal.aborted) { setLoadFailed(true); setMessage("Published inventory is temporarily unavailable."); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [demo]);

  const districts = useMemo(() => [...new Set(inventory.map((item) => item.district))].sort(), [inventory]);
  const visible = useMemo(() => inventory.filter((item) => (category === "all" || item.category === category) && (district === "all" || item.district === district)), [inventory, category, district]);

  useEffect(() => {
    visibleRef.current = visible;
    if (mapRef.current?.isStyleLoaded()) updateMapData(mapRef.current, visible);
  }, [visible]);

  useEffect(() => {
    let cancelled = false;
    void import("maplibre-gl").then(({ Map, NavigationControl, Popup, setWorkerUrl }) => {
      if (cancelled || !containerRef.current) return;
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
        link.href = `/media/${encodeURIComponent(String(properties.id ?? ""))}${String(properties.id ?? "").startsWith("demo-") ? "?demo=1" : ""}`;
        link.textContent = "View details →";
        link.className = "map-popup-link";
        content.append(title, details, link);
        new Popup({ offset: 14 }).setLngLat(feature.geometry.coordinates as [number, number]).setDOMContent(content).addTo(map);
      });
      for (const layer of ["inventory-clusters", "inventory-locations"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function focus(item: InventoryItem) {
    setSelectedId(item.id);
    if (window.matchMedia("(max-width: 800px)").matches) setMobileView("map");
    mapRef.current?.flyTo({ center: [Number(item.longitude), Number(item.latitude)], zoom: 14, essential: true });
  }

  return <div className="map-browser">
    <div className="map-view-switch" role="group" aria-label="Inventory view"><button type="button" aria-pressed={mobileView === "list"} onClick={() => setMobileView("list")}>List</button><button type="button" aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}>Map</button></div>
    <aside className={`map-sidebar ${mobileView === "map" ? "mobile-view-hidden" : ""}`}>
      <div className="map-filters">
        <label>Media type<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="all">All media</option><option value="led">LED screens</option><option value="theatre">Theatre slots</option><option value="mobile">Mobile media</option></select></label>
        <label>District<select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">All districts</option>{districts.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <p className="map-status" role="status">{message}</p>
      <div className="map-results">{visible.map((item) => <div className={`map-result ${selectedId === item.id ? "selected" : ""}`} key={item.id}><button type="button" aria-pressed={selectedId === item.id} onClick={() => focus(item)}>{item.is_demo ? <span className="demo-badge">Demo listing</span> : null}<span className={`map-category map-category-${item.category}`}>{categoryLabels[item.category]}</span><strong>{item.title}</strong><small>{item.locality}, {item.district}</small><b>{formatRate(item)}</b></button><Link href={`/media/${item.id}${item.is_demo ? "?demo=1" : ""}`}>View details →</Link></div>)}{!visible.length && !loading ? <div className="map-empty">{loadFailed ? "Listings could not be loaded. Try again later." : "No published listings match these filters."}</div> : null}</div>
    </aside>
    <div className={`inventory-map ${mobileView === "list" ? "mobile-view-hidden" : ""}`} ref={containerRef} role="region" aria-label={`Map of ${demo ? "sample" : "published"} advertising inventory across Kerala`} />
  </div>;
}
