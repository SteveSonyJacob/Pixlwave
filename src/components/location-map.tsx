"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import { KERALA_BOUNDS, inKerala } from "@/lib/maps/nominatim";
import { createOsmRasterStyle, DEFAULT_OSM_TILE_URL } from "@/lib/maps/style";

type Coordinate = { latitude: number; longitude: number };

export function LocationMap({ coordinate, onChange }: { coordinate?: Coordinate; onChange: (coordinate: Coordinate) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const changeRef = useRef(onChange);
  const coordinateRef = useRef(coordinate);
  const latitude = coordinate?.latitude;
  const longitude = coordinate?.longitude;

  useEffect(() => { changeRef.current = onChange; }, [onChange]);
  useEffect(() => { coordinateRef.current = coordinate; }, [coordinate]);

  useEffect(() => {
    let cancelled = false;
    void import("maplibre-gl").then(({ Map, Marker, NavigationControl, setWorkerUrl }) => {
      if (cancelled || !containerRef.current) return;
      setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const current = coordinateRef.current;
      const map = new Map({
        container: containerRef.current,
        style: createOsmRasterStyle(process.env.NEXT_PUBLIC_OSM_TILE_URL || DEFAULT_OSM_TILE_URL),
        center: current ? [current.longitude, current.latitude] : [76.2711, 10.1632],
        zoom: current ? 14 : 6.4,
        maxBounds: [[KERALA_BOUNDS.west - 0.3, KERALA_BOUNDS.south - 0.3], [KERALA_BOUNDS.east + 0.3, KERALA_BOUNDS.north + 0.3]],
        attributionControl: { compact: true },
        cooperativeGestures: true
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.on("click", (event) => {
        const next = { latitude: event.lngLat.lat, longitude: event.lngLat.lng };
        if (inKerala(next.latitude, next.longitude)) changeRef.current(next);
      });
      mapRef.current = map;
      if (current && inKerala(current.latitude, current.longitude)) {
        const marker = new Marker({ color: "#1268e8", draggable: true })
          .setLngLat([current.longitude, current.latitude]).addTo(map);
        marker.on("dragend", () => {
          const point = marker.getLngLat();
          if (inKerala(point.lat, point.lng)) changeRef.current({ latitude: point.lat, longitude: point.lng });
        });
        markerRef.current = marker;
      }
    });
    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (latitude == null || longitude == null || !inKerala(latitude, longitude) || !mapRef.current) return;
    if (!markerRef.current) {
      void import("maplibre-gl").then(({ Marker }) => {
        if (!mapRef.current || markerRef.current) return;
        const marker = new Marker({ color: "#1268e8", draggable: true })
          .setLngLat([longitude, latitude]).addTo(mapRef.current);
        marker.on("dragend", () => {
          const point = marker.getLngLat();
          if (inKerala(point.lat, point.lng)) changeRef.current({ latitude: point.lat, longitude: point.lng });
        });
        markerRef.current = marker;
      });
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
    mapRef.current.flyTo({ center: [longitude, latitude], zoom: Math.max(mapRef.current.getZoom(), 13), essential: true });
  }, [latitude, longitude]);

  return <div className="location-map" ref={containerRef} role="region" aria-label="Interactive Kerala map. Click or drag the marker to set the listing location." />;
}
