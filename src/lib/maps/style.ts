import type { StyleSpecification } from "maplibre-gl";

export const DEFAULT_OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

export function createOsmRasterStyle(tileUrl = DEFAULT_OSM_TILE_URL): StyleSpecification {
  return {
    version: 8,
    sources: {
      openstreetmap: {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>'
      }
    },
    layers: [{ id: "openstreetmap", type: "raster", source: "openstreetmap" }]
  };
}
