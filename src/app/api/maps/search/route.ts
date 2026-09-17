import { createServerSupabaseClient } from "@/lib/supabase/server";

type Place = { provider: "mappls" | "google"; placeId: string; label: string; locality: string; district: string; latitude: number; longitude: number };

function inKerala(latitude: number, longitude: number) {
  return latitude >= 8.17 && latitude <= 12.8 && longitude >= 74.8 && longitude <= 77.6;
}

async function mappls(query: string): Promise<Place[]> {
  const endpoint = process.env.MAPPLS_SEARCH_URL;
  const token = process.env.MAPPLS_ACCESS_TOKEN;
  if (!endpoint || !token || token === "change-me") throw new Error("Mappls is not configured.");
  const url = new URL(endpoint);
  url.searchParams.set("query", `${query}, Kerala`);
  url.searchParams.set("region", "IND");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Mappls returned ${response.status}.`);
  const body = await response.json() as { suggestedLocations?: Array<Record<string, unknown>> };
  return (body.suggestedLocations ?? []).flatMap((raw) => {
    const latitude = Number(raw.latitude ?? raw.lat);
    const longitude = Number(raw.longitude ?? raw.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !inKerala(latitude, longitude)) return [];
    return [{ provider: "mappls" as const, placeId: String(raw.eLoc ?? raw.placeId ?? ""), label: String(raw.placeName ?? raw.placeAddress ?? query), locality: String(raw.placeName ?? query), district: String(raw.district ?? ""), latitude, longitude }];
  }).slice(0, 6);
}

async function google(query: string): Promise<Place[]> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!key || key === "change-me") throw new Error("Google fallback is not configured.");
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", `${query}, Kerala, India`);
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Google returned ${response.status}.`);
  const body = await response.json() as { results?: Array<{ place_id: string; formatted_address: string; geometry: { location: { lat: number; lng: number } }; address_components: Array<{ long_name: string; types: string[] }> }> };
  return (body.results ?? []).flatMap((raw) => {
    const { lat: latitude, lng: longitude } = raw.geometry.location;
    if (!inKerala(latitude, longitude)) return [];
    const component = (type: string) => raw.address_components.find((item) => item.types.includes(type))?.long_name ?? "";
    return [{ provider: "google" as const, placeId: raw.place_id, label: raw.formatted_address, locality: component("locality") || component("sublocality"), district: component("administrative_area_level_2"), latitude, longitude }];
  }).slice(0, 6);
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const limited = await supabase.rpc("check_map_search_rate");
  if (limited.error) return Response.json({ error: limited.error.message }, { status: 429 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 120) return Response.json({ error: "Enter 3–120 characters." }, { status: 400 });
  try {
    const primary = await mappls(query);
    if (primary.length) return Response.json({ provider: "mappls", places: primary });
  } catch (primaryError) {
    try {
      const fallback = await google(query);
      return Response.json({ provider: "google", places: fallback, warning: primaryError instanceof Error ? primaryError.message : "Mappls unavailable." });
    } catch {
      return Response.json({ error: primaryError instanceof Error ? primaryError.message : "Location providers unavailable.", manualPinAllowed: true }, { status: 503 });
    }
  }
  return Response.json({ provider: "mappls", places: [] });
}
