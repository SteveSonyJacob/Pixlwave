-- Incomplete owner form checkpoints never become public inventory implicitly.
create table public.owner_listing_drafts (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.inventory_listings(id) on delete cascade,
  base_updated_at timestamptz,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 262144),
  step smallint not null check (step between 0 and 3),
  revision bigint not null default 1 check (revision > 0),
  status text not null default 'active' check (status in ('active', 'committed', 'discarded')),
  result_listing_id uuid references public.inventory_listings(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((listing_id is null) = (base_updated_at is null)),
  check ((status = 'committed') = (result_listing_id is not null))
);
create unique index owner_listing_drafts_active_listing on public.owner_listing_drafts(owner_id, listing_id)
  where status = 'active' and listing_id is not null;
create index owner_listing_drafts_resume on public.owner_listing_drafts(owner_id, updated_at desc) where status = 'active';
alter table public.owner_listing_drafts enable row level security;
create policy owner_listing_drafts_read on public.owner_listing_drafts for select to authenticated using (owner_id = auth.uid());
revoke all on public.owner_listing_drafts from public, anon, authenticated;
grant select on public.owner_listing_drafts to authenticated;
grant all on public.owner_listing_drafts to service_role;

create function public.save_owner_listing_draft(
  target_draft uuid, expected_revision bigint, draft_payload jsonb, draft_step integer,
  target_listing uuid default null, expected_listing_updated_at timestamptz default null
) returns public.owner_listing_drafts
language plpgsql security definer set search_path = '' as $$
declare saved public.owner_listing_drafts; listing public.inventory_listings;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p join public.owner_verifications v on v.owner_id = p.id
    where p.id = auth.uid() and p.owner_enabled and v.status = 'approved'
  ) then raise exception 'Approved owner access required.' using errcode = '42501'; end if;
  if target_draft is null or expected_revision is null or expected_revision < 0 or draft_step is null or draft_step not between 0 and 3
    or draft_payload is null or jsonb_typeof(draft_payload) <> 'object' or octet_length(draft_payload::text) > 262144
    or ((target_listing is null) <> (expected_listing_updated_at is null)) then
    raise exception 'Invalid draft checkpoint.' using errcode = '22023';
  end if;
  perform public.enforce_inventory_rate_limit('owner.draft.save', 120, 1);
  -- Serialize this owner's draft writes, including first saves from two tabs.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 270001));
  if target_listing is not null then
    select * into listing from public.inventory_listings where id = target_listing and owner_id = auth.uid() for update;
    if listing.id is null or listing.status not in ('draft', 'rejected') then
      raise exception 'Listing is no longer editable.' using errcode = '42501';
    end if;
    if listing.updated_at is distinct from expected_listing_updated_at then
      raise exception 'The listing changed. Reload before saving.' using errcode = '40001';
    end if;
  end if;
  select * into saved from public.owner_listing_drafts where id = target_draft for update;
  if saved.id is null then
    if expected_revision <> 0 or exists (
      select 1 from public.owner_listing_drafts where owner_id = auth.uid() and listing_id = target_listing and status = 'active'
    ) then raise exception 'Another draft exists. Reload to continue.' using errcode = '40001'; end if;
    if (select count(*) from public.owner_listing_drafts where owner_id = auth.uid() and status = 'active') >= 100 then
      raise exception 'Finish an existing draft before starting another.' using errcode = '54000';
    end if;
    insert into public.owner_listing_drafts(id, owner_id, listing_id, base_updated_at, payload, step)
    values (target_draft, auth.uid(), target_listing, expected_listing_updated_at, draft_payload, draft_step)
    returning * into saved;
    return saved;
  end if;
  if saved.owner_id <> auth.uid() then raise exception 'Draft is unavailable.' using errcode = '42501'; end if;
  if saved.status <> 'active' or saved.listing_id is distinct from target_listing or saved.base_updated_at is distinct from expected_listing_updated_at then
    raise exception 'This draft changed or was already completed. Reload to continue.' using errcode = '40001';
  end if;
  -- A lost response may be retried with the same revision and exact snapshot.
  if saved.revision = expected_revision + 1 and saved.payload = draft_payload and saved.step = draft_step then return saved; end if;
  if saved.revision <> expected_revision then
    raise exception 'This draft was changed in another tab. Reload to continue.' using errcode = '40001';
  end if;
  update public.owner_listing_drafts set payload = draft_payload, step = draft_step,
    revision = revision + 1, updated_at = clock_timestamp() where id = target_draft returning * into saved;
  return saved;
end;
$$;

create function public.commit_owner_listing_draft(target_draft uuid, expected_revision bigint, listing_input jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved public.owner_listing_drafts; listing public.inventory_listings; result public.inventory_listings;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p join public.owner_verifications v on v.owner_id = p.id
    where p.id = auth.uid() and p.owner_enabled and v.status = 'approved'
  ) then raise exception 'Approved owner access required.' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 270001));
  select * into saved from public.owner_listing_drafts where id = target_draft and owner_id = auth.uid() for update;
  if saved.id is null then raise exception 'Draft is unavailable.' using errcode = '42501'; end if;
  if expected_revision is null or saved.revision <> expected_revision then
    raise exception 'This draft changed. Reload before completing it.' using errcode = '40001';
  end if;
  if saved.status = 'committed' then return saved.result_listing_id; end if;
  if saved.status <> 'active' then raise exception 'Draft was discarded.' using errcode = '40001'; end if;
  if saved.listing_id is null then
    result := public.create_inventory_listing(listing_input);
  else
    select * into listing from public.inventory_listings where id = saved.listing_id and owner_id = auth.uid() for update;
    if listing.id is null or listing.status not in ('draft', 'rejected') then
      raise exception 'Listing is no longer editable.' using errcode = '42501';
    end if;
    if listing.updated_at is distinct from saved.base_updated_at then
      raise exception 'The listing changed. Reload before completing it.' using errcode = '40001';
    end if;
    result := public.update_inventory_listing(saved.listing_id, listing_input);
  end if;
  update public.owner_listing_drafts set status = 'committed', result_listing_id = result.id, updated_at = clock_timestamp()
    where id = target_draft;
  return result.id;
end;
$$;
revoke all on function public.save_owner_listing_draft(uuid,bigint,jsonb,integer,uuid,timestamptz), public.commit_owner_listing_draft(uuid,bigint,jsonb) from public, anon;
grant execute on function public.save_owner_listing_draft(uuid,bigint,jsonb,integer,uuid,timestamptz), public.commit_owner_listing_draft(uuid,bigint,jsonb) to authenticated;

create function public.discard_owner_listing_draft(target_draft uuid, expected_revision bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare saved public.owner_listing_drafts;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 270001));
  select * into saved from public.owner_listing_drafts where id = target_draft and owner_id = auth.uid() for update;
  if saved.id is null then raise exception 'Draft is unavailable.' using errcode = '42501'; end if;
  if expected_revision is null or saved.revision <> expected_revision or saved.status = 'committed' then
    raise exception 'Draft changed. Reload before discarding.' using errcode = '40001';
  end if;
  update public.owner_listing_drafts set status = 'discarded', updated_at = clock_timestamp() where id = target_draft;
end;
$$;
revoke all on function public.discard_owner_listing_draft(uuid,bigint) from public, anon;
grant execute on function public.discard_owner_listing_draft(uuid,bigint) to authenticated;

notify pgrst, 'reload schema';
