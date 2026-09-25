import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingCategories } from "@/lib/inventory/domain";
import { demoListings, localDemoEnabled } from "@/lib/discovery/demo";

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  if (localDemoEnabled() && parameters.get("demo") === "1") return Response.json({ inventory: demoListings, hasMore: false, demo: true });
  const category = parameters.get("category");
  const district = parameters.get("district")?.trim();
  const requestedPage = Number(parameters.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage < 100000 ? requestedPage : 1;
  const pageSize = 500;
  let query = (await createServerSupabaseClient()).from("published_inventory")
    .select("id,category,title,description,locality,district,latitude,longitude,audience_estimate,audience_attribution,ad_duration_seconds,plays_per_unit,operating_start,operating_end,service_promise,category_details,currency,rate_unit,current_rate_revision_id,published_at,amount_paise,rate_effective_at")
    .order("published_at", { ascending: false }).order("id").range((page - 1) * pageSize, page * pageSize - 1);
  if (category && listingCategories.includes(category as (typeof listingCategories)[number])) query = query.eq("category", category);
  if (district) query = query.eq("district", district);
  const { data, error } = await query;
  if (error?.code === "PGRST103") return Response.json({ inventory: [], hasMore: false, availability: "Capacity is confirmed only when admin approves a paid request." });
  if (error) return Response.json({ error: "Published inventory is unavailable." }, { status: 503 });
  return Response.json({ inventory: data, hasMore: (data?.length ?? 0) === pageSize, availability: "Capacity is confirmed only when admin approves a paid request." });
}
