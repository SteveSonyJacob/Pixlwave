"use client";

import { useEffect, useRef } from "react";
import type { LineString } from "geojson";
import type { Map as MapLibreMap } from "maplibre-gl";
import { KERALA_BOUNDS } from "@/lib/maps/nominatim";
import { createOsmRasterStyle, DEFAULT_OSM_TILE_URL } from "@/lib/maps/style";

type Props = { latitude: number; longitude: number; locality: string; route?: unknown; demo?: boolean };

function publishedRoute(input: unknown): LineString | null {
  try {
    const value = typeof input === "string" ? JSON.parse(input) : input;
    if (!value || typeof value !== "object" || value.type !== "LineString" || !Array.isArray(value.coordinates) || value.coordinates.length < 2) return null;
    const coordinates = value.coordinates as unknown[];
    if (!coordinates.every((point) => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]))) return null;
    return { type: "LineString", coordinates: coordinates as number[][] };
  } catch { return null; }
}

export function PublishedLocationMap({ latitude, longitude, locality, route, demo = false }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("maplibre-gl").then(({ Map, Marker, NavigationControl, LngLatBounds, setWorkerUrl }) => {
      if (cancelled || !container.current) return;
      setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const map = new Map({
        container: container.current,
        style: createOsmRasterStyle(process.env.NEXT_PUBLIC_OSM_TILE_URL || DEFAULT_OSM_TILE_URL),
        center: [longitude, latitude],
        zoom: 12,
        maxBounds: [[KERALA_BOUNDS.west - 0.3, KERALA_BOUNDS.south - 0.3], [KERALA_BOUNDS.east + 0.3, KERALA_BOUNDS.north + 0.3]],
        attributionControl: { compact: true },
        cooperativeGestures: true
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      new Marker({ color: "#1268e8" }).setLngLat([longitude, latitude]).addTo(map);
      const geometry = publishedRoute(route);
      if (geometry) map.on("load", () => {
        map.addSource("published-route", { type: "geojson", data: { type: "Feature", geometry, properties: {} } });
        map.addLayer({ id: "published-route", type: "line", source: "published-route", paint: { "line-color": "#ff725e", "line-width": 4 } });
        const bounds = new LngLatBounds([longitude, latitude], [longitude, latitude]);
        for (const point of geometry.coordinates) bounds.extend([point[0], point[1]]);
        map.fitBounds(bounds, { padding: 36, maxZoom: 13, duration: 0 });
      });
      mapRef.current = map;
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [latitude, longitude, route]);

  return <div className="published-location-map" ref={container} role="region" aria-label={`Map showing the ${demo ? "sample" : "published"} location${route ? " and route" : ""} for ${locality}`} />;
}
