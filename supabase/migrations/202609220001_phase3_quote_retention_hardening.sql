-- Harden Phase 3 quote construction without rewriting an already-applied migration.
-- Explicit booking units must be unique, and theatre shows must respect the same
-- published blackouts used by discovery and the availability calendar.
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
  unit_key text;
  seen_units text[] := '{}';
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
  if jsonb_array_length(units) > 31 then
    raise exception 'a quote supports at most 31 explicit inventory units';
  end if;

  select * into listing from public.inventory_listings
  where id = target_listing and status = 'published';
  if listing.id is null then raise exception 'published listing not found'; end if;
  select * into rate from public.listing_rate_revisions where id = listing.current_rate_revision_id;
  if rate.id is null then raise exception 'published rate not found'; end if;

  for unit in select value from jsonb_array_elements(units) loop
    if listing.category = 'theatre' then
      requested_quantity := coalesce((unit->>'quantity')::integer, 0);
      unit_key := unit->>'showInstanceId';
      if unit_key is null or unit_key = any(seen_units) then
        raise exception 'each theatre show must appear only once in a quote';
      end if;
      select * into show_record from public.theatre_show_instances
      where id = unit_key::uuid
        and listing_id = listing.id
        and starts_at > now();
      if show_record.id is null then raise exception 'theatre show is not available'; end if;
      requested_date := (show_record.starts_at at time zone 'Asia/Kolkata')::date;
      if exists(select 1 from public.listing_blackouts b where b.listing_id = listing.id and requested_date between b.starts_on and b.ends_on) then
        raise exception 'theatre show date is blacked out';
      end if;
      if requested_quantity < 1 or requested_quantity > show_record.slots_total then
        raise exception 'requested theatre quantity exceeds published capacity';
      end if;
    else
      requested_date := (unit->>'date')::date;
      if requested_date is null then raise exception 'an explicit inventory date is required'; end if;
      unit_key := requested_date::text;
      if unit_key = any(seen_units) then
        raise exception 'each inventory date must appear only once in a quote';
      end if;
      requested_quantity := case when listing.category = 'led' then 1 else coalesce((unit->>'quantity')::integer, 0) end;
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
    seen_units := array_append(seen_units, unit_key);
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

comment on function public.create_quote_snapshot(uuid,jsonb) is
  'Creates an immutable 30-minute quote from unique explicit units, enforcing current publication, blackouts and published capacity.';

-- Expired attachment rows are atomically moved into this service-only queue
-- before object storage is touched. A storage outage therefore leaves durable,
-- retryable work rather than an inaccessible orphan or an unaudited deletion.
create table if not exists public.media_retention_cleanup_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  asset_id uuid not null unique,
  object_key text check (object_key is null or object_key !~ '(^|/)\.\.(/|$)'),
  retention_until timestamptz not null,
  status text not null default 'pending' check (status in ('pending','deleted')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  last_attempt_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (status = 'pending' and object_key is not null and deleted_at is null)
    or (status = 'deleted' and object_key is null and deleted_at is not null)
  )
);

create index if not exists media_retention_cleanup_pending
  on public.media_retention_cleanup_jobs(created_at)
  where status = 'pending';

alter table public.media_retention_cleanup_jobs enable row level security;
revoke all on public.media_retention_cleanup_jobs from public, anon, authenticated;
grant all on public.media_retention_cleanup_jobs to service_role;

comment on table public.media_retention_cleanup_jobs is
  'Durable service-only queue and deletion evidence for expired private media objects.';

create table if not exists public.media_retention_cleanup_state (
  singleton boolean primary key default true check (singleton),
  last_started_at timestamptz not null default '-infinity'::timestamptz
);

insert into public.media_retention_cleanup_state(singleton) values(true)
on conflict(singleton) do nothing;

alter table public.media_retention_cleanup_state enable row level security;
revoke all on public.media_retention_cleanup_state from public, anon, authenticated;
grant all on public.media_retention_cleanup_state to service_role;

comment on table public.media_retention_cleanup_state is
  'Singleton durable schedule gate ensuring automatic private-media cleanup starts no more than once every seven days across worker restarts.';
