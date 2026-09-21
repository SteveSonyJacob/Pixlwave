import { describe, expect, it } from "vitest";
import { buildNominatimUrl, inKerala, parseNominatimResults } from "./nominatim";

describe("OpenStreetMap location search", () => {
  it("constrains requests to Kerala and avoids autocomplete parameters", () => {
    const url = buildNominatimUrl("https://nominatim.openstreetmap.org/search", "MG Road");
    expect(url.searchParams.get("q")).toBe("MG Road, Kerala, India");
    expect(url.searchParams.get("bounded")).toBe("1");
    expect(url.searchParams.get("countrycodes")).toBe("in");
    expect(url.searchParams.has("autocomplete")).toBe(false);
  });

  it("normalizes valid Kerala results and rejects out-of-bounds results", () => {
    const places = parseNominatimResults([
      { place_id: 42, display_name: "MG Road, Kochi", lat: "9.9816", lon: "76.2999", address: { city: "Kochi", state_district: "Ernakulam District" } },
      { place_id: 99, display_name: "Outside Kerala", lat: "19.076", lon: "72.8777", address: { city: "Mumbai" } }
    ]);
    expect(places).toEqual([expect.objectContaining({ provider: "openstreetmap", placeId: "42", locality: "Kochi", district: "Ernakulam" })]);
  });

  it("accepts Kerala bounds only", () => {
    expect(inKerala(10.1, 76.3)).toBe(true);
    expect(inKerala(13.1, 76.3)).toBe(false);
  });
});
