import { describe, expect, it } from "vitest";
import { discoveryHref, parseDiscoveryFilters } from "./filters";
import { googleMapsLocationUrl } from "@/lib/maps/google-maps-url";

describe("deep-linked discovery", () => {
  it("normalizes supported filters and preserves them between list and map", () => {
    const filters = parseDiscoveryFilters({
      q: "  MG Road, Kochi  ", category: "led", district: "Ernakulam", max: "12000", page: "3",
      bbox: "76.1000,9.8000,76.5000,10.2000"
    });
    expect(filters).toEqual({ q: "MG Road Kochi", category: "led", district: "Ernakulam", max: "12000", page: "3", bbox: "76.1000,9.8000,76.5000,10.2000" });
    const map = new URL(discoveryHref("/map", filters, { bbox: true }), "https://pixlwave.test");
    expect(map.searchParams.get("bbox")).toBe(filters.bbox);
    expect(map.searchParams.has("page")).toBe(false);
    expect(map.searchParams.get("category")).toBe("led");
  });

  it("drops malformed or unsupported filters before querying", () => {
    expect(parseDiscoveryFilters({ category: "hoarding", district: "Atlantis", max: "Infinity", page: "-1", bbox: "0,0,180,90" })).toEqual({});
  });

  it("uses Google's required Maps URL fields for exact screen coordinates", () => {
    const url = new URL(googleMapsLocationUrl(9.9816, 76.2999));
    expect(url.origin).toBe("https://www.google.com");
    expect(url.pathname).toBe("/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("9.9816,76.2999");
  });
});
