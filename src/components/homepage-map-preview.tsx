"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { KERALA_BOUNDS } from "@/lib/maps/nominatim";
import { createOsmRasterStyle, DEFAULT_OSM_TILE_URL } from "@/lib/maps/style";

type PreviewListing = {
  id: string;
  category: "led" | "theatre" | "mobile";
  title: string;
  locality: string;
  district: string;
  latitude: number;
  longitude: number;
};

const categoryColors = { led: "#1268e8", theatre: "#13b987", mobile: "#ff725e" } as const;

export function HomepageMapPreview({ listings }: { listings: PreviewListing[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void import("maplibre-gl").then(({ Map, Marker, NavigationControl, Popup, setWorkerUrl }) => {
      if (cancelled || !containerRef.current) return;
      try {
        setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const map = new Map({
          container: containerRef.current,
          style: createOsmRasterStyle(process.env.NEXT_PUBLIC_OSM_TILE_URL || DEFAULT_OSM_TILE_URL),
          center: [76.2711, 10.1632],
          zoom: 6.25,
          maxBounds: [[KERALA_BOUNDS.west - 0.3, KERALA_BOUNDS.south - 0.3], [KERALA_BOUNDS.east + 0.3, KERALA_BOUNDS.north + 0.3]],
          attributionControl: { compact: true },
          cooperativeGestures: true
        });
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");
        map.on("error", () => setMapError("Map tiles are unavailable. Open the full map to browse locations."));
        map.on("load", () => {
          for (const listing of listings.slice(0, 12)) {
            const markerElement = document.createElement("button");
            markerElement.type = "button";
            markerElement.className = "map-preview-marker";
            markerElement.style.setProperty("--marker-color", categoryColors[listing.category]);
            markerElement.setAttribute("aria-label", `${listing.title}, ${listing.locality}`);
            const content = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = listing.title;
            const location = document.createElement("p");
            location.textContent = `${listing.locality}, ${listing.district}`;
            const link = document.createElement("a");
            link.href = `/media/${encodeURIComponent(listing.id)}`;
            link.textContent = "View billboard →";
            link.className = "map-popup-link";
            content.append(title, location, link);
            new Marker({ element: markerElement, anchor: "center" })
              .setLngLat([listing.longitude, listing.latitude])
              .setPopup(new Popup({ offset: 14 }).setDOMContent(content))
              .addTo(map);
          }
        });
        mapRef.current = map;
      } catch {
        setMapError("This device cannot display the map. Open the full map to browse locations.");
      }
    }).catch(() => { if (!cancelled) setMapError("The map could not load. Open the full map to browse locations."); });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [listings]);

  return <div className="map-cta-preview">
    <div className="map-preview-map" ref={containerRef} role="region" aria-label={`Interactive Kerala map with ${listings.length} live billboard locations`} />
    <div className="map-preview-label"><span>Live Locations</span><b>{listings.length}</b></div>
    {mapError ? <div className="map-preview-error" role="status">{mapError}</div> : null}
  </div>;
}
