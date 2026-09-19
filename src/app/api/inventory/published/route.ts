import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingCategories } from "@/lib/inventory/domain";

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const category = parameters.get("category");
  const district = parameters.get("district")?.trim();
  let query = (await createServerSupabaseClient()).from("published_inventory")
    .select("id,category,title,description,locality,district,latitude,longitude,audience_estimate,audience_attribution,ad_duration_seconds,plays_per_unit,operating_start,operating_end,service_promise,category_details,currency,rate_unit,current_rate_revision_id,published_at,amount_paise,rate_effective_at")
    .order("published_at", { ascending: false }).limit(100);
  if (category && listingCategories.includes(category as (typeof listingCategories)[number])) query = query.eq("category", category);
  if (district) query = query.eq("district", district);
  const { data, error } = await query;
  if (error) return Response.json({ error: "Published inventory is unavailable." }, { status: 503 });
  return Response.json({ inventory: data, availability: "Capacity is confirmed only when admin approves a paid request." });
}
