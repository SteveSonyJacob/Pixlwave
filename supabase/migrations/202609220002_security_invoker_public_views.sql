-- Public discovery views must evaluate permissions and RLS as their caller.
-- PostgreSQL views otherwise use the view owner's privileges, which Supabase's
-- security advisor correctly reports as SECURITY DEFINER behavior.
create or replace view public.published_inventory
with (security_barrier=true, security_invoker=true) as
select l.id,l.category,l.title,l.description,l.locality,l.district,l.latitude,l.longitude,
  l.audience_estimate,l.audience_attribution,l.ad_duration_seconds,l.plays_per_unit,
  l.operating_start,l.operating_end,l.service_promise,l.category_details,l.currency,l.rate_unit,
  l.current_rate_revision_id,l.published_at,r.amount_paise,r.effective_at as rate_effective_at
from public.inventory_listings l
join public.listing_rate_revisions r on r.id=l.current_rate_revision_id
where l.status='published';

create or replace view public.published_listing_media
with (security_barrier=true, security_invoker=true) as
select a.id, a.listing_id, a.original_name, a.detected_mime, a.pixel_width, a.pixel_height, a.created_at
from public.private_media_assets a
join public.inventory_listings l on l.id = a.listing_id
where l.status = 'published'
  and a.purpose = 'listing_media'
  and a.scan_status = 'clean';

-- Security-invoker views require callers to have narrowly scoped access to the
-- referenced columns. RLS still limits rows to the exact public projection.
grant select (
  id, category, status, title, description, locality, district, latitude, longitude,
  audience_estimate, audience_attribution, ad_duration_seconds, plays_per_unit,
  operating_start, operating_end, service_promise, category_details, currency,
  rate_unit, current_rate_revision_id, published_at
) on public.inventory_listings to anon;

grant select (id, listing_id, amount_paise, currency, effective_at)
on public.listing_rate_revisions to anon;

grant select (
  id, listing_id, purpose, original_name, detected_mime, pixel_width, pixel_height,
  scan_status, created_at
) on public.private_media_assets to anon;

drop policy if exists inventory_listings_public_read on public.inventory_listings;
create policy inventory_listings_public_read on public.inventory_listings
for select to anon, authenticated using (status = 'published');

drop policy if exists listing_rates_public_read on public.listing_rate_revisions;
create policy listing_rates_public_read on public.listing_rate_revisions
for select to anon, authenticated using (
  exists(
    select 1 from public.inventory_listings l
    where l.id = listing_id
      and l.status = 'published'
      and l.current_rate_revision_id = listing_rate_revisions.id
  )
);

drop policy if exists private_media_public_listing_read on public.private_media_assets;
create policy private_media_public_listing_read on public.private_media_assets
for select to anon, authenticated using (
  purpose = 'listing_media'
  and scan_status = 'clean'
  and exists(
    select 1 from public.inventory_listings l
    where l.id = listing_id and l.status = 'published'
  )
);

revoke all on public.published_inventory, public.published_listing_media from public;
grant select on public.published_inventory, public.published_listing_media to anon, authenticated, service_role;

comment on view public.published_inventory is
  'Security-invoker public projection of published inventory and its current rate revision.';
comment on view public.published_listing_media is
  'Security-invoker public metadata projection for clean media on published listings; object keys remain private.';
