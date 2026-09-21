import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildNominatimUrl, parseNominatimResults, type MapPlace } from "@/lib/maps/nominatim";

const cache = new Map<string, { expiresAt: number; places: MapPlace[] }>();
let requestQueue = Promise.resolve();
let nextRequestAt = 0;

function throttlePublicNominatim() {
  const scheduled = requestQueue.then(async () => {
    const wait = Math.max(0, nextRequestAt - Date.now());
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    nextRequestAt = Date.now() + 1100;
  });
  requestQueue = scheduled.catch(() => undefined);
  return scheduled;
}

async function searchOpenStreetMap(query: string) {
  const key = query.toLocaleLowerCase("en-IN");
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.places;
  const endpoint = process.env.OSM_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search";
  if (new URL(endpoint).hostname === "nominatim.openstreetmap.org") await throttlePublicNominatim();
  const response = await fetch(buildNominatimUrl(endpoint, query, process.env.MAPS_CONTACT_EMAIL), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-IN,en;q=0.9",
      "User-Agent": `Pixlwave/0.1 (+${process.env.NEXT_PUBLIC_APP_URL ?? "https://pixlwave.in"})`
    },
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) throw new Error(`OpenStreetMap search returned ${response.status}.`);
  const places = parseNominatimResults(await response.json());
  cache.set(key, { expiresAt: Date.now() + 60 * 60 * 1000, places });
  if (cache.size > 100) cache.delete(cache.keys().next().value as string);
  return places;
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
    const places = await searchOpenStreetMap(query);
    return Response.json({ provider: "openstreetmap", places }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch {
    return Response.json({ error: "Location search is temporarily unavailable. Place the pin manually.", manualPinAllowed: true }, { status: 503 });
  }
}
