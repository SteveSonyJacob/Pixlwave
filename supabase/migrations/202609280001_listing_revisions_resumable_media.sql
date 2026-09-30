-- FP02: reviewed replacement revisions and resumable listing-media uploads.
-- Booking, payment, rate ownership and capacity semantics are intentionally unchanged.

create table public.inventory_listing_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.inventory_listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 262144),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, version),
  check ((status = 'submitted' and submitted_at is not null) or status <> 'submitted'),
  check ((status in ('approved','rejected') and reviewed_at is not null and reviewed_by is not null) or status not in ('approved','rejected')),
  check ((status = 'rejected' and review_reason is not null) or status <> 'rejected')
);
create unique index inventory_listing_revision_open on public.inventory_listing_revisions(listing_id)
  where status in ('draft','submitted');
create index inventory_listing_revision_owner on public.inventory_listing_revisions(owner_id, updated_at desc);
create trigger inventory_listing_revisions_set_updated_at before update on public.inventory_listing_revisions
for each row execute function public.set_updated_at();

alter table public.private_media_assets
  add column listing_revision_id uuid references public.inventory_listing_revisions(id) on delete restrict,
  add column display_order integer not null default 0 check (display_order >= 0),
  add column removed_at timestamptz;
create index private_media_listing_order on public.private_media_assets(listing_id, listing_revision_id, display_order, created_at)
  where purpose = 'listing_media' and removed_at is null;

create table public.media_upload_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose = 'listing'),
  listing_id uuid not null references public.inventory_listings(id) on delete cascade,
  listing_revision_id uuid references public.inventory_listing_revisions(id) on delete cascade,
  object_key text not null unique check (object_key !~ '(^|/)\.\.(/|$)'),
  original_name text not null check (char_length(original_name) between 1 and 200),
  declared_mime text not null check (declared_mime in ('image/png','image/jpeg')),
  expected_bytes bigint not null check (expected_bytes between 1 and 52428800),
  status text not null default 'issued' check (status in ('issued','finalized','failed','abandoned')),
  error_message text check (error_message is null or char_length(error_message) <= 500),
  expires_at timestamptz not null,
  finalized_asset_id uuid references public.private_media_assets(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'finalized') = (finalized_asset_id is not null))
);
create index media_upload_sessions_owner on public.media_upload_sessions(uploader_id, created_at desc);
create trigger media_upload_sessions_set_updated_at before update on public.media_upload_sessions
for each row execute function public.set_updated_at();

create table public.listing_status_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.inventory_listings(id) on delete cascade,
  revision_id uuid references public.inventory_listing_revisions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 3 and 80),
  message text not null check (char_length(message) between 3 and 500),
  created_at timestamptz not null default now()
);
create index listing_status_events_owner on public.listing_status_events(owner_id, created_at desc);
create index listing_status_events_listing on public.listing_status_events(listing_id, created_at desc);

alter table public.inventory_listing_revisions enable row level security;
alter table public.media_upload_sessions enable row level security;
alter table public.listing_status_events enable row level security;

create policy inventory_listing_revisions_read on public.inventory_listing_revisions for select to authenticated
  using (owner_id = auth.uid() or public.is_admin_aal2());
create policy media_upload_sessions_read on public.media_upload_sessions for select to authenticated
  using (uploader_id = auth.uid() or public.is_admin_aal2());
create policy listing_status_events_read on public.listing_status_events for select to authenticated
  using (owner_id = auth.uid() or public.is_admin_aal2());

revoke all on public.inventory_listing_revisions, public.media_upload_sessions, public.listing_status_events from public, anon, authenticated;
grant select on public.inventory_listing_revisions, public.media_upload_sessions, public.listing_status_events to authenticated;
grant all on public.inventory_listing_revisions, public.media_upload_sessions, public.listing_status_events to service_role;

create or replace function public.record_listing_status_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare status_value text; event_message text;
begin
  if tg_op = 'INSERT' then
    status_value := new.status::text;
  elsif old.status is not distinct from new.status then
    return new;
  else
    status_value := new.status::text;
  end if;
  event_message := case status_value
    when 'draft' then 'Listing draft created.'
    when 'submitted' then 'Listing submitted for administrator review.'
    when 'published' then 'Listing approved and published.'
    when 'rejected' then coalesce(nullif(new.review_reason,''), 'Listing changes requested by the administrator.')
    when 'suspended' then coalesce(nullif(new.suspension_reason,''), 'Listing suspended by the administrator.')
    else 'Listing status updated.' end;
  insert into public.listing_status_events(listing_id, owner_id, actor_id, event_type, message)
  values (new.id, new.owner_id, auth.uid(), 'listing.' || status_value, event_message);
  return new;
end;
$$;
drop trigger if exists inventory_listing_status_event on public.inventory_listings;
create trigger inventory_listing_status_event after insert or update of status on public.inventory_listings
for each row execute function public.record_listing_status_event();

create or replace function public.record_listing_revision_status_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare event_message text;
begin
  if tg_op <> 'INSERT' and old.status is not distinct from new.status then return new; end if;
  event_message := case new.status
    when 'draft' then 'Replacement revision saved privately.'
    when 'submitted' then 'Replacement revision submitted for administrator review.'
    when 'approved' then 'Replacement revision approved and published.'
    when 'rejected' then coalesce(nullif(new.review_reason,''), 'Replacement revision needs changes.')
    else 'Replacement revision updated.' end;
  insert into public.listing_status_events(listing_id, revision_id, owner_id, actor_id, event_type, message)
  values (new.listing_id, new.id, new.owner_id, auth.uid(), 'revision.' || new.status, event_message);
  return new;
end;
$$;
drop trigger if exists inventory_listing_revision_status_event on public.inventory_listing_revisions;
create trigger inventory_listing_revision_status_event after insert or update of status on public.inventory_listing_revisions
for each row execute function public.record_listing_revision_status_event();

insert into public.listing_status_events(listing_id, owner_id, event_type, message, created_at)
select l.id, l.owner_id, 'listing.' || l.status::text,
  case l.status when 'published' then 'Listing approved and published.' when 'submitted' then 'Listing submitted for administrator review.'
    when 'rejected' then coalesce(l.review_reason,'Listing changes requested by the administrator.')
    when 'suspended' then coalesce(l.suspension_reason,'Listing suspended by the administrator.') else 'Listing draft created.' end,
  coalesce(l.reviewed_at, l.submitted_at, l.created_at)
from public.inventory_listings l
where not exists (select 1 from public.listing_status_events e where e.listing_id = l.id);

create or replace function public.save_inventory_listing_revision(target_listing uuid, input jsonb)
returns public.inventory_listing_revisions language plpgsql security definer set search_path = '' as $$
declare listing public.inventory_listings; result public.inventory_listing_revisions; next_version integer;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  perform public.enforce_inventory_rate_limit('owner.listing.revision.save', 40, 60);
  select * into listing from public.inventory_listings where id=target_listing and owner_id=auth.uid() for update;
  if listing.id is null or listing.status <> 'published' then raise exception 'Only a published listing can receive a replacement revision.' using errcode='42501'; end if;
  if input is null or jsonb_typeof(input) <> 'object' or octet_length(input::text) > 262144 then raise exception 'Invalid listing revision.' using errcode='22023'; end if;
  if input->>'category' is distinct from listing.category::text then raise exception 'Listing category cannot change.' using errcode='22023'; end if;
  if (input->>'baseRatePaise')::bigint is distinct from listing.owner_base_rate_paise then
    raise exception 'Published rates can be changed only by an administrator after owner discussion.' using errcode='42501';
  end if;
  select * into result from public.inventory_listing_revisions
    where listing_id=target_listing and owner_id=auth.uid() and status in ('draft','rejected') order by version desc limit 1 for update;
  if result.id is null then
    select coalesce(max(version),0)+1 into next_version from public.inventory_listing_revisions where listing_id=target_listing;
    insert into public.inventory_listing_revisions(listing_id,owner_id,version,payload)
    values(target_listing,auth.uid(),next_version,input) returning * into result;
  else
    update public.inventory_listing_revisions set payload=input,status='draft',submitted_at=null,reviewed_at=null,reviewed_by=null,review_reason=null
    where id=result.id returning * into result;
  end if;
  return result;
end;
$$;

create or replace function public.submit_inventory_listing_revision(target_revision uuid)
returns public.inventory_listing_revisions language plpgsql security definer set search_path = '' as $$
declare result public.inventory_listing_revisions;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  perform public.enforce_inventory_rate_limit('owner.listing.revision.submit', 20, 60);
  update public.inventory_listing_revisions set status='submitted',submitted_at=now(),review_reason=null,reviewed_at=null,reviewed_by=null
  where id=target_revision and owner_id=auth.uid() and status in ('draft','rejected') returning * into result;
  if result.id is null then raise exception 'Listing revision is not editable by this owner.'; end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata)
  values(auth.uid(),'inventory.listing.revision.submitted','inventory_listing_revision',result.id::text,jsonb_build_object('listingId',result.listing_id,'version',result.version));
  return result;
end;
$$;

create or replace function public.review_inventory_listing_revision(target_revision uuid, decision text, reason text default null)
returns public.inventory_listing_revisions language plpgsql security definer set search_path = '' as $$
declare result public.inventory_listing_revisions; listing public.inventory_listings; input jsonb; item jsonb; clean_media integer;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode='42501'; end if;
  if decision not in ('approved','rejected') then raise exception 'invalid revision decision'; end if;
  if decision='rejected' and char_length(trim(coalesce(reason,''))) < 5 then raise exception 'a rejection reason is required'; end if;
  select * into result from public.inventory_listing_revisions where id=target_revision and status='submitted' for update;
  if result.id is null then raise exception 'listing revision is not awaiting review'; end if;
  if decision='rejected' then
    update public.inventory_listing_revisions set status='rejected',reviewed_at=now(),reviewed_by=auth.uid(),review_reason=trim(reason)
      where id=result.id returning * into result;
  else
    select * into listing from public.inventory_listings where id=result.listing_id and status='published' for update;
    if listing.id is null then raise exception 'published listing not found'; end if;
    input := result.payload;
    if input->>'category' is distinct from listing.category::text or (input->>'baseRatePaise')::bigint is distinct from listing.owner_base_rate_paise then
      raise exception 'category and published rate cannot be changed through a replacement revision';
    end if;
    update public.inventory_listings l set
      title=trim(input->>'title'),description=trim(input->>'description'),locality=trim(input->>'locality'),district=input->>'district',
      latitude=(input->>'latitude')::numeric,longitude=(input->>'longitude')::numeric,location_provider=input->>'sourceProvider',provider_place_id=trim(input->>'sourcePlaceId'),
      audience_estimate=(input->>'audienceEstimate')::integer,audience_basis=trim(input->>'audienceBasis'),ad_duration_seconds=(input->>'adDurationSeconds')::integer,
      plays_per_unit=(input->>'playsPerUnit')::integer,operating_start=(input->>'operatingStart')::time,operating_end=(input->>'operatingEnd')::time,
      service_promise=trim(input->>'servicePromise'),category_details=coalesce(input->'categoryDetails','{}'::jsonb),reviewed_at=now(),reviewed_by=auth.uid(),review_reason=null,
      approved_service_snapshot=jsonb_build_object('listingId',l.id,'rateRevisionId',l.current_rate_revision_id,'category',l.category,'ratePaise',l.owner_base_rate_paise,'rateUnit',l.rate_unit,'adDurationSeconds',(input->>'adDurationSeconds')::integer,'playsPerUnit',(input->>'playsPerUnit')::integer,'operatingStart',input->>'operatingStart','operatingEnd',input->>'operatingEnd','servicePromise',trim(input->>'servicePromise'),'categoryDetails',coalesce(input->'categoryDetails','{}'::jsonb))
    where l.id=listing.id;
    delete from public.listing_blackouts where listing_id=listing.id;
    delete from public.theatre_show_instances where listing_id=listing.id;
    for item in select value from jsonb_array_elements(coalesce(input->'blackouts','[]'::jsonb)) loop
      insert into public.listing_blackouts(listing_id,starts_on,ends_on,reason,created_by)
      values(listing.id,(item->>'startsOn')::date,(item->>'endsOn')::date,trim(item->>'reason'),auth.uid());
    end loop;
    if listing.category='theatre' then
      for item in select value from jsonb_array_elements(coalesce(input->'categoryDetails'->'showStarts','[]'::jsonb)) loop
        insert into public.theatre_show_instances(listing_id,starts_at,slots_total,created_by)
        values(listing.id,(item#>>'{}')::timestamptz,(input->'categoryDetails'->>'slotsPerShow')::integer,auth.uid());
      end loop;
    end if;
    select count(*) into clean_media from public.private_media_assets where listing_revision_id=result.id and purpose='listing_media' and scan_status='clean' and removed_at is null;
    if clean_media > 0 then
      update public.private_media_assets set removed_at=now() where listing_id=listing.id and listing_revision_id is null and purpose='listing_media' and removed_at is null;
      update public.private_media_assets set listing_revision_id=null where listing_revision_id=result.id and removed_at is null;
    end if;
    update public.inventory_listing_revisions set status='approved',reviewed_at=now(),reviewed_by=auth.uid(),review_reason=null
      where id=result.id returning * into result;
  end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata)
  values(auth.uid(),'inventory.listing.revision.'||decision,'inventory_listing_revision',result.id::text,jsonb_build_object('listingId',result.listing_id,'version',result.version,'reason',nullif(trim(reason),'')));
  return result;
end;
$$;

create or replace function public.reorder_listing_media(asset_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare asset_count integer; owned_count integer;
begin
  if auth.uid() is null or asset_ids is null or cardinality(asset_ids)=0 or cardinality(asset_ids)>20 then raise exception 'Invalid media order.' using errcode='22023'; end if;
  select count(*), count(*) filter (where a.uploader_id=auth.uid() and a.removed_at is null and a.purpose='listing_media' and (
    (a.listing_revision_id is null and exists(select 1 from public.inventory_listings l where l.id=a.listing_id and l.owner_id=auth.uid() and l.status in ('draft','rejected')))
    or exists(select 1 from public.inventory_listing_revisions r where r.id=a.listing_revision_id and r.owner_id=auth.uid() and r.status in ('draft','rejected'))
  )) into asset_count, owned_count from public.private_media_assets a where a.id=any(asset_ids);
  if asset_count <> cardinality(asset_ids) or owned_count <> asset_count then raise exception 'Media order contains an unavailable asset.' using errcode='42501'; end if;
  update public.private_media_assets a set display_order=o.ordinality-1
  from unnest(asset_ids) with ordinality as o(id,ordinality) where a.id=o.id;
end;
$$;

create or replace function public.remove_listing_media(target_asset uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare asset public.private_media_assets;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  select * into asset from public.private_media_assets where id=target_asset and uploader_id=auth.uid() and purpose='listing_media' and removed_at is null for update;
  if asset.id is null or not (
    (asset.listing_revision_id is null and exists(select 1 from public.inventory_listings l where l.id=asset.listing_id and l.owner_id=auth.uid() and l.status in ('draft','rejected')))
    or exists(select 1 from public.inventory_listing_revisions r where r.id=asset.listing_revision_id and r.owner_id=auth.uid() and r.status in ('draft','rejected'))
  ) then raise exception 'Listing media is not removable.' using errcode='42501'; end if;
  update public.private_media_assets set removed_at=now() where id=asset.id;
  return asset.object_key;
end;
$$;

create or replace function public.require_listing_media_before_publish()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status='published' and old.status is distinct from new.status and not exists(
    select 1 from public.private_media_assets a where a.listing_id=new.id and a.listing_revision_id is null and a.purpose='listing_media' and a.scan_status='clean' and a.removed_at is null
  ) then raise exception 'At least one validated listing image is required before publication.'; end if;
  return new;
end;
$$;
drop trigger if exists inventory_listing_requires_media on public.inventory_listings;
create trigger inventory_listing_requires_media before update of status on public.inventory_listings
for each row execute function public.require_listing_media_before_publish();

-- Allow autosave checkpoints against a published listing; commit creates a reviewed replacement revision.
create or replace function public.save_owner_listing_draft(
  target_draft uuid, expected_revision bigint, draft_payload jsonb, draft_step integer,
  target_listing uuid default null, expected_listing_updated_at timestamptz default null
) returns public.owner_listing_drafts
language plpgsql security definer set search_path = '' as $$
declare saved public.owner_listing_drafts; listing public.inventory_listings;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p join public.owner_verifications v on v.owner_id=p.id where p.id=auth.uid() and p.owner_enabled and v.status='approved'
  ) then raise exception 'Approved owner access required.' using errcode='42501'; end if;
  if target_draft is null or expected_revision is null or expected_revision < 0 or draft_step is null or draft_step not between 0 and 3
    or draft_payload is null or jsonb_typeof(draft_payload)<>'object' or octet_length(draft_payload::text)>262144
    or ((target_listing is null) <> (expected_listing_updated_at is null)) then raise exception 'Invalid draft checkpoint.' using errcode='22023'; end if;
  perform public.enforce_inventory_rate_limit('owner.draft.save',120,1);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,270001));
  if target_listing is not null then
    select * into listing from public.inventory_listings where id=target_listing and owner_id=auth.uid() for update;
    if listing.id is null or listing.status not in ('draft','rejected','published') then raise exception 'Listing is no longer editable.' using errcode='42501'; end if;
    if listing.updated_at is distinct from expected_listing_updated_at then raise exception 'The listing changed. Reload before saving.' using errcode='40001'; end if;
  end if;
  select * into saved from public.owner_listing_drafts where id=target_draft for update;
  if saved.id is null then
    if expected_revision<>0 or exists(select 1 from public.owner_listing_drafts where owner_id=auth.uid() and listing_id=target_listing and status='active') then raise exception 'Another draft exists. Reload to continue.' using errcode='40001'; end if;
    if (select count(*) from public.owner_listing_drafts where owner_id=auth.uid() and status='active')>=100 then raise exception 'Finish an existing draft before starting another.' using errcode='54000'; end if;
    insert into public.owner_listing_drafts(id,owner_id,listing_id,base_updated_at,payload,step)
    values(target_draft,auth.uid(),target_listing,expected_listing_updated_at,draft_payload,draft_step) returning * into saved;
    return saved;
  end if;
  if saved.owner_id<>auth.uid() then raise exception 'Draft is unavailable.' using errcode='42501'; end if;
  if saved.status<>'active' or saved.listing_id is distinct from target_listing or saved.base_updated_at is distinct from expected_listing_updated_at then raise exception 'This draft changed or was already completed. Reload to continue.' using errcode='40001'; end if;
  if saved.revision=expected_revision+1 and saved.payload=draft_payload and saved.step=draft_step then return saved; end if;
  if saved.revision<>expected_revision then raise exception 'This draft was changed in another tab. Reload to continue.' using errcode='40001'; end if;
  update public.owner_listing_drafts set payload=draft_payload,step=draft_step,revision=revision+1,updated_at=clock_timestamp() where id=target_draft returning * into saved;
  return saved;
end;
$$;

create or replace function public.commit_owner_listing_draft(target_draft uuid, expected_revision bigint, listing_input jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved public.owner_listing_drafts; listing public.inventory_listings; result public.inventory_listings; replacement public.inventory_listing_revisions;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p join public.owner_verifications v on v.owner_id=p.id where p.id=auth.uid() and p.owner_enabled and v.status='approved'
  ) then raise exception 'Approved owner access required.' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,270001));
  select * into saved from public.owner_listing_drafts where id=target_draft and owner_id=auth.uid() for update;
  if saved.id is null then raise exception 'Draft is unavailable.' using errcode='42501'; end if;
  if expected_revision is null or saved.revision<>expected_revision then raise exception 'This draft changed. Reload before completing it.' using errcode='40001'; end if;
  if saved.status='committed' then return saved.result_listing_id; end if;
  if saved.status<>'active' then raise exception 'Draft was discarded.' using errcode='40001'; end if;
  if saved.listing_id is null then result:=public.create_inventory_listing(listing_input);
  else
    select * into listing from public.inventory_listings where id=saved.listing_id and owner_id=auth.uid() for update;
    if listing.id is null or listing.status not in ('draft','rejected','published') then raise exception 'Listing is no longer editable.' using errcode='42501'; end if;
    if listing.updated_at is distinct from saved.base_updated_at then raise exception 'The listing changed. Reload before completing it.' using errcode='40001'; end if;
    if listing.status='published' then replacement:=public.save_inventory_listing_revision(saved.listing_id,listing_input); result:=listing;
    else result:=public.update_inventory_listing(saved.listing_id,listing_input); end if;
  end if;
  update public.owner_listing_drafts set status='committed',result_listing_id=result.id,updated_at=clock_timestamp() where id=target_draft;
  return result.id;
end;
$$;

create or replace view public.published_listing_media
with (security_barrier=true, security_invoker=true) as
select a.id,a.listing_id,a.original_name,a.detected_mime,a.pixel_width,a.pixel_height,a.created_at,a.display_order
from public.private_media_assets a join public.inventory_listings l on l.id=a.listing_id
where l.status='published' and a.purpose='listing_media' and a.scan_status='clean' and a.listing_revision_id is null and a.removed_at is null;

drop policy if exists private_media_public_listing_read on public.private_media_assets;
create policy private_media_public_listing_read on public.private_media_assets for select to anon,authenticated using (
  purpose='listing_media' and scan_status='clean' and listing_revision_id is null and removed_at is null
  and exists(select 1 from public.inventory_listings l where l.id=listing_id and l.status='published')
);
grant select (id,listing_id,purpose,original_name,detected_mime,pixel_width,pixel_height,scan_status,created_at,display_order,listing_revision_id,removed_at)
  on public.private_media_assets to anon;
revoke all on public.published_listing_media from public;
grant select on public.published_listing_media to anon,authenticated,service_role;

revoke all on function public.save_inventory_listing_revision(uuid,jsonb), public.submit_inventory_listing_revision(uuid),
  public.review_inventory_listing_revision(uuid,text,text), public.reorder_listing_media(uuid[]), public.remove_listing_media(uuid) from public,anon;
grant execute on function public.save_inventory_listing_revision(uuid,jsonb), public.submit_inventory_listing_revision(uuid),
  public.reorder_listing_media(uuid[]), public.remove_listing_media(uuid) to authenticated,service_role;
grant execute on function public.review_inventory_listing_revision(uuid,text,text) to authenticated,service_role;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='listing_status_events'
  ) then alter publication supabase_realtime add table public.listing_status_events; end if;
end $$;

notify pgrst, 'reload schema';
