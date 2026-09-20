create table if not exists public.quote_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete restrict,
  listing_id uuid not null references public.inventory_listings(id) on delete restrict,
  rate_revision_id uuid not null references public.listing_rate_revisions(id) on delete restrict,
  category public.listing_category not null,
  requested_units jsonb not null,
  quantity integer not null check (quantity between 1 and 1000),
  unit_amount_paise bigint not null check (unit_amount_paise between 10000 and 1000000000),
  total_amount_paise bigint not null check (total_amount_paise = unit_amount_paise * quantity),
  currency text not null check (currency = 'INR'),
  listing_snapshot jsonb not null,
  rate_effective_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(requested_units) = 'array'),
  check (expires_at > created_at)
);

create index if not exists quote_snapshots_requester on public.quote_snapshots (requester_id, created_at desc);
create index if not exists quote_snapshots_listing on public.quote_snapshots (listing_id, created_at desc);

create or replace view public.published_listing_media with (security_barrier=true) as
select a.id, a.listing_id, a.original_name, a.detected_mime, a.pixel_width, a.pixel_height, a.created_at
from public.private_media_assets a
join public.inventory_listings l on l.id = a.listing_id
where l.status = 'published'
  and a.purpose = 'listing_media'
  and a.scan_status = 'clean';

create or replace function public.create_quote_snapshot(target_listing uuid, units jsonb)
returns public.quote_snapshots
security definer
language plpgsql
set search_path = ''
as $$
declare
  listing public.inventory_listings;
  rate public.listing_rate_revisions;
  result public.quote_snapshots;
  unit jsonb;
  requested_date date;
  requested_quantity integer;
  total_quantity integer := 0;
  show_record public.theatre_show_instances;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists(select 1 from public.profiles p where p.id = auth.uid() and p.advertiser_enabled) then
    raise exception 'advertiser mode is required' using errcode = '42501';
  end if;
  if jsonb_typeof(units) <> 'array' or jsonb_array_length(units) = 0 then
    raise exception 'at least one explicit inventory unit is required';
  end if;

  select * into listing from public.inventory_listings
  where id = target_listing and status = 'published';
  if listing.id is null then raise exception 'published listing not found'; end if;
  select * into rate from public.listing_rate_revisions where id = listing.current_rate_revision_id;
  if rate.id is null then raise exception 'published rate not found'; end if;

  for unit in select value from jsonb_array_elements(units) loop
    if listing.category = 'theatre' then
      requested_quantity := coalesce((unit->>'quantity')::integer, 0);
      select * into show_record from public.theatre_show_instances
      where id = (unit->>'showInstanceId')::uuid
        and listing_id = listing.id
        and starts_at > now();
      if show_record.id is null then raise exception 'theatre show is not available'; end if;
      if requested_quantity < 1 or requested_quantity > show_record.slots_total then
        raise exception 'requested theatre quantity exceeds published capacity';
      end if;
    else
      requested_date := (unit->>'date')::date;
      requested_quantity := case when listing.category = 'led' then 1 else coalesce((unit->>'quantity')::integer, 0) end;
      if requested_date is null then raise exception 'an explicit inventory date is required'; end if;
      if requested_date < (now() at time zone 'Asia/Kolkata')::date then
        raise exception 'inventory dates must not be in the past';
      end if;
      if exists(select 1 from public.listing_blackouts b where b.listing_id = listing.id and requested_date between b.starts_on and b.ends_on) then
        raise exception 'requested date is blacked out';
      end if;
      if listing.category = 'mobile' and (requested_quantity < 1 or requested_quantity > coalesce((listing.category_details->>'rotatingSlots')::integer, 0)) then
        raise exception 'requested mobile quantity exceeds published capacity';
      end if;
    end if;
    total_quantity := total_quantity + requested_quantity;
  end loop;
  if total_quantity < 1 or total_quantity > 1000 then raise exception 'quote quantity is outside the supported range'; end if;

  insert into public.quote_snapshots(
    requester_id, listing_id, rate_revision_id, category, requested_units, quantity,
    unit_amount_paise, total_amount_paise, currency, listing_snapshot, rate_effective_at, expires_at
  ) values (
    auth.uid(), listing.id, rate.id, listing.category, units, total_quantity,
    rate.amount_paise, rate.amount_paise * total_quantity, rate.currency,
    jsonb_build_object(
      'title', listing.title, 'locality', listing.locality, 'district', listing.district,
      'rateUnit', listing.rate_unit, 'servicePromise', listing.service_promise,
      'approvedService', listing.approved_service_snapshot
    ), rate.effective_at, now() + interval '30 minutes'
  ) returning * into result;

  insert into public.audit_log(actor_id, action, subject_type, subject_id, metadata)
  values (auth.uid(), 'quote.snapshot.created', 'quote_snapshot', result.id::text,
    jsonb_build_object('listingId', listing.id, 'rateRevisionId', rate.id, 'quantity', total_quantity));
  return result;
end;
$$;

create or replace function public.quote_snapshot_is_current(target_quote uuid)
returns boolean
security definer
language sql
stable
set search_path = ''
as $$
  select exists(
    select 1
    from public.quote_snapshots q
    join public.inventory_listings l on l.id = q.listing_id
    where q.id = target_quote
      and q.requester_id = auth.uid()
      and q.expires_at > now()
      and l.status = 'published'
      and l.current_rate_revision_id = q.rate_revision_id
  );
$$;

alter table public.quote_snapshots enable row level security;
drop policy if exists quote_snapshots_read_own_or_admin on public.quote_snapshots;
create policy quote_snapshots_read_own_or_admin on public.quote_snapshots
for select to authenticated using (requester_id = auth.uid() or public.is_admin_aal2());

revoke all on public.quote_snapshots from anon, authenticated;
grant select on public.quote_snapshots to authenticated;
grant all on public.quote_snapshots to service_role;
revoke all on public.published_listing_media from public;
grant select on public.published_listing_media to anon, authenticated, service_role;
revoke all on function public.create_quote_snapshot(uuid,jsonb) from public;
grant execute on function public.create_quote_snapshot(uuid,jsonb) to authenticated, service_role;
revoke all on function public.quote_snapshot_is_current(uuid) from public;
grant execute on function public.quote_snapshot_is_current(uuid) to authenticated, service_role;

comment on table public.quote_snapshots is 'Immutable, pre-payment price and service snapshots. A quote never reserves inventory.';
comment on view public.published_listing_media is 'Metadata for clean listing media attached before publication; object bytes remain private and are served with short-lived URLs.';
