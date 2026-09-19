do $$ begin
  create type public.owner_verification_status as enum ('draft', 'submitted', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.listing_category as enum ('led', 'theatre', 'mobile');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.listing_status as enum ('draft', 'submitted', 'published', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.rate_unit as enum ('day', 'show_slot', 'vehicle_day_slot');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.private_media_purpose as enum ('owner_verification', 'creative');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.media_scan_status as enum ('quarantined', 'clean', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.private_media_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete restrict,
  purpose public.private_media_purpose not null,
  listing_id uuid,
  object_key text not null unique check (object_key !~ '(^|/)\.\.(/|$)'),
  original_name text not null check (char_length(original_name) between 1 and 200),
  declared_mime text not null,
  detected_mime text not null,
  byte_size bigint not null check (byte_size between 1 and 52428800),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  pixel_width integer check (pixel_width is null or pixel_width > 0),
  pixel_height integer check (pixel_height is null or pixel_height > 0),
  duration_seconds numeric(8,3) check (duration_seconds is null or duration_seconds > 0),
  scan_status public.media_scan_status not null default 'quarantined',
  scan_engine text,
  scan_completed_at timestamptz,
  rejection_reason text,
  retention_until timestamptz not null,
  created_at timestamptz not null default now(),
  check ((scan_status = 'clean' and scan_completed_at is not null and scan_engine is not null) or scan_status <> 'clean'),
  check ((scan_status = 'rejected' and rejection_reason is not null) or scan_status <> 'rejected')
);

create table if not exists public.owner_verifications (
  owner_id uuid primary key references auth.users(id) on delete restrict,
  status public.owner_verification_status not null default 'draft',
  legal_name text not null default '' check (char_length(legal_name) <= 160),
  business_type text check (business_type is null or char_length(business_type) <= 80),
  registration_last4 text check (registration_last4 is null or registration_last4 ~ '^[A-Za-z0-9]{4}$'),
  contact_phone text check (contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{7,14}$'),
  address text check (address is null or char_length(address) <= 500),
  document_asset_ids uuid[] not null default '{}',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'submitted' and submitted_at is not null) or status <> 'submitted'),
  check ((status in ('approved','rejected','suspended') and reviewed_at is not null and reviewed_by is not null) or status not in ('approved','rejected','suspended')),
  check ((status in ('rejected','suspended') and review_reason is not null) or status not in ('rejected','suspended'))
);

create table if not exists public.inventory_listings (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  category public.listing_category not null,
  status public.listing_status not null default 'draft',
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 20 and 2000),
  locality text not null check (char_length(locality) between 2 and 120),
  district text not null check (district in ('Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad')),
  state_code text not null default 'KL' check (state_code = 'KL'),
  country_code text not null default 'IN' check (country_code = 'IN'),
  latitude numeric(9,6) not null check (latitude between 8.17 and 12.8),
  longitude numeric(9,6) not null check (longitude between 74.8 and 77.6),
  location_provider text not null check (location_provider in ('mappls','google','manual')),
  provider_place_id text not null check (char_length(provider_place_id) between 2 and 200),
  audience_estimate integer not null check (audience_estimate between 1 and 100000000),
  audience_basis text not null check (char_length(audience_basis) between 10 and 500),
  audience_attribution text not null default 'Owner supplied; not independently verified',
  ad_duration_seconds integer not null check (ad_duration_seconds between 5 and 120),
  plays_per_unit integer not null check (plays_per_unit between 1 and 2000),
  operating_start time not null,
  operating_end time not null,
  timezone text not null default 'Asia/Kolkata' check (timezone = 'Asia/Kolkata'),
  service_promise text not null check (char_length(service_promise) between 20 and 1000),
  category_details jsonb not null default '{}'::jsonb,
  owner_base_rate_paise bigint not null check (owner_base_rate_paise between 10000 and 1000000000),
  currency text not null default 'INR' check (currency = 'INR'),
  rate_unit public.rate_unit not null,
  current_rate_revision_id uuid,
  approved_service_snapshot jsonb,
  submitted_at timestamptz,
  published_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  review_reason text,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (operating_end > operating_start),
  check (ad_duration_seconds * plays_per_unit <= extract(epoch from (operating_end - operating_start))),
  check ((category = 'led' and rate_unit = 'day') or (category = 'theatre' and rate_unit = 'show_slot') or (category = 'mobile' and rate_unit = 'vehicle_day_slot')),
  check ((status = 'submitted' and submitted_at is not null) or status <> 'submitted'),
  check ((status = 'published' and published_at is not null and current_rate_revision_id is not null and approved_service_snapshot is not null) or status <> 'published'),
  check ((status in ('rejected','suspended') and coalesce(review_reason, suspension_reason) is not null) or status not in ('rejected','suspended'))
);

alter table public.private_media_assets add constraint private_media_listing_fk
  foreign key (listing_id) references public.inventory_listings(id) on delete restrict;

create table if not exists public.listing_rate_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.inventory_listings(id) on delete restrict,
  amount_paise bigint not null check (amount_paise between 10000 and 1000000000),
  currency text not null default 'INR' check (currency = 'INR'),
  unit public.rate_unit not null,
  source text not null check (source in ('initial_owner','admin_change')),
  changed_by uuid not null references auth.users(id) on delete restrict,
  owner_discussion_note text not null check (char_length(owner_discussion_note) between 10 and 1000),
  reason text not null check (char_length(reason) between 5 and 500),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, effective_at, id)
);

alter table public.inventory_listings add constraint inventory_current_rate_fk
  foreign key (current_rate_revision_id) references public.listing_rate_revisions(id) on delete restrict;

create table if not exists public.listing_blackouts (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.inventory_listings(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  reason text not null check (char_length(reason) between 3 and 300),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.theatre_show_instances (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.inventory_listings(id) on delete cascade,
  starts_at timestamptz not null,
  slots_total integer not null check (slots_total between 1 and 50),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (listing_id, starts_at)
);

create table if not exists public.inventory_action_limits (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 1,
  primary key (actor_id, action)
);

create index if not exists inventory_listings_public_search on public.inventory_listings (category, district, locality) where status = 'published';
create index if not exists inventory_listings_owner on public.inventory_listings (owner_id, updated_at desc);
create index if not exists inventory_rate_history on public.listing_rate_revisions (listing_id, effective_at desc);
create index if not exists inventory_blackout_lookup on public.listing_blackouts (listing_id, starts_on, ends_on);
create index if not exists theatre_show_lookup on public.theatre_show_instances (listing_id, starts_at);
create index if not exists private_media_owner on public.private_media_assets (uploader_id, purpose, created_at desc);

create or replace view public.published_inventory with (security_barrier=true) as
select l.id,l.category,l.title,l.description,l.locality,l.district,l.latitude,l.longitude,
  l.audience_estimate,l.audience_attribution,l.ad_duration_seconds,l.plays_per_unit,
  l.operating_start,l.operating_end,l.service_promise,l.category_details,l.currency,l.rate_unit,
  l.current_rate_revision_id,l.published_at,r.amount_paise,r.effective_at as rate_effective_at
from public.inventory_listings l
join public.listing_rate_revisions r on r.id=l.current_rate_revision_id
where l.status='published';

drop trigger if exists owner_verifications_set_updated_at on public.owner_verifications;
create trigger owner_verifications_set_updated_at before update on public.owner_verifications
for each row execute function public.set_updated_at();

drop trigger if exists inventory_listings_set_updated_at on public.inventory_listings;
create trigger inventory_listings_set_updated_at before update on public.inventory_listings
for each row execute function public.set_updated_at();

create or replace function public.enforce_inventory_rate_limit(action_name text, maximum integer default 20, window_minutes integer default 1)
returns void security definer language plpgsql set search_path = '' as $$
declare current_attempts integer;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  insert into public.inventory_action_limits(actor_id, action, window_started_at, attempts)
  values (auth.uid(), action_name, now(), 1)
  on conflict (actor_id, action) do update set
    window_started_at = case when public.inventory_action_limits.window_started_at <= now() - make_interval(mins => window_minutes) then now() else public.inventory_action_limits.window_started_at end,
    attempts = case when public.inventory_action_limits.window_started_at <= now() - make_interval(mins => window_minutes) then 1 else public.inventory_action_limits.attempts + 1 end
  returning attempts into current_attempts;
  if current_attempts > maximum then raise exception 'rate limit exceeded' using errcode = 'P0001'; end if;
end;
$$;

create or replace function public.submit_owner_verification(input jsonb)
returns public.owner_verifications security definer language plpgsql set search_path = '' as $$
declare result public.owner_verifications; asset_ids uuid[]; asset_count integer; owner_enabled boolean;
begin
  perform public.enforce_inventory_rate_limit('owner.verification.submit', 5, 60);
  select p.owner_enabled into owner_enabled from public.profiles p where p.id = auth.uid();
  if not coalesce(owner_enabled, false) then raise exception 'owner mode is not enabled' using errcode = '42501'; end if;
  select coalesce(array_agg(value::uuid), '{}') into asset_ids from jsonb_array_elements_text(coalesce(input->'documentAssetIds','[]'::jsonb));
  select count(*) into asset_count from public.private_media_assets a where a.id = any(asset_ids) and a.uploader_id = auth.uid() and a.purpose = 'owner_verification' and a.scan_status = 'clean';
  if coalesce(array_length(asset_ids, 1), 0) = 0 or asset_count <> array_length(asset_ids, 1) then raise exception 'at least one clean verification document owned by this account is required'; end if;
  insert into public.owner_verifications(owner_id,status,legal_name,business_type,registration_last4,contact_phone,address,document_asset_ids,submitted_at,reviewed_at,reviewed_by,review_reason)
  values (auth.uid(),'submitted',trim(input->>'legalName'),nullif(trim(input->>'businessType'),''),upper(nullif(trim(input->>'registrationLast4'),'')),trim(input->>'contactPhone'),trim(input->>'address'),asset_ids,now(),null,null,null)
  on conflict (owner_id) do update set status='submitted',legal_name=excluded.legal_name,business_type=excluded.business_type,registration_last4=excluded.registration_last4,contact_phone=excluded.contact_phone,address=excluded.address,document_asset_ids=excluded.document_asset_ids,submitted_at=now(),reviewed_at=null,reviewed_by=null,review_reason=null
  where public.owner_verifications.status in ('draft','rejected')
  returning * into result;
  if result.owner_id is null then raise exception 'verification cannot be resubmitted in its current state'; end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'owner.verification.submitted','owner_verification',auth.uid()::text,jsonb_build_object('documentCount',asset_count));
  return result;
end;
$$;

create or replace function public.review_owner_verification(target_owner uuid, decision text, reason text default null)
returns public.owner_verifications security definer language plpgsql set search_path = '' as $$
declare result public.owner_verifications; next_status public.owner_verification_status;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode = '42501'; end if;
  perform public.enforce_inventory_rate_limit('admin.owner_verification.review', 60, 1);
  if decision not in ('approved','rejected','suspended') then raise exception 'invalid verification decision'; end if;
  if decision in ('rejected','suspended') and char_length(trim(coalesce(reason,''))) < 5 then raise exception 'a reason is required'; end if;
  next_status := decision::public.owner_verification_status;
  update public.owner_verifications set status=next_status,reviewed_at=now(),reviewed_by=auth.uid(),review_reason=nullif(trim(reason),'') where owner_id=target_owner returning * into result;
  if result.owner_id is null then raise exception 'owner verification not found'; end if;
  if next_status = 'suspended' then update public.inventory_listings set status='suspended',suspension_reason=coalesce(nullif(trim(reason),''),'Owner verification suspended') where owner_id=target_owner and status='published'; end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'owner.verification.'||decision,'owner_verification',target_owner::text,jsonb_build_object('reason',nullif(trim(reason),'')));
  return result;
end;
$$;

create or replace function public.create_inventory_listing(input jsonb)
returns public.inventory_listings security definer language plpgsql set search_path = '' as $$
declare result public.inventory_listings; chosen_category public.listing_category; chosen_unit public.rate_unit; verification_ok boolean; item jsonb;
begin
  perform public.enforce_inventory_rate_limit('owner.listing.create', 20, 60);
  select exists(select 1 from public.owner_verifications where owner_id=auth.uid() and status='approved') into verification_ok;
  if not verification_ok then raise exception 'approved owner verification is required' using errcode = '42501'; end if;
  chosen_category := (input->>'category')::public.listing_category;
  chosen_unit := case chosen_category when 'led' then 'day'::public.rate_unit when 'theatre' then 'show_slot'::public.rate_unit else 'vehicle_day_slot'::public.rate_unit end;
  insert into public.inventory_listings(owner_id,category,title,description,locality,district,latitude,longitude,location_provider,provider_place_id,audience_estimate,audience_basis,ad_duration_seconds,plays_per_unit,operating_start,operating_end,service_promise,category_details,owner_base_rate_paise,rate_unit)
  values (auth.uid(),chosen_category,trim(input->>'title'),trim(input->>'description'),trim(input->>'locality'),input->>'district',(input->>'latitude')::numeric,(input->>'longitude')::numeric,input->>'sourceProvider',trim(input->>'sourcePlaceId'),(input->>'audienceEstimate')::integer,trim(input->>'audienceBasis'),(input->>'adDurationSeconds')::integer,(input->>'playsPerUnit')::integer,(input->>'operatingStart')::time,(input->>'operatingEnd')::time,trim(input->>'servicePromise'),coalesce(input->'categoryDetails','{}'::jsonb),(input->>'baseRatePaise')::bigint,chosen_unit)
  returning * into result;
  for item in select value from jsonb_array_elements(coalesce(input->'blackouts','[]'::jsonb)) loop
    insert into public.listing_blackouts(listing_id,starts_on,ends_on,reason,created_by) values (result.id,(item->>'startsOn')::date,(item->>'endsOn')::date,trim(item->>'reason'),auth.uid());
  end loop;
  if chosen_category = 'theatre' then
    for item in select value from jsonb_array_elements(coalesce(input->'categoryDetails'->'showStarts','[]'::jsonb)) loop
      insert into public.theatre_show_instances(listing_id,starts_at,slots_total,created_by) values (result.id,(item#>>'{}')::timestamptz,(input->'categoryDetails'->>'slotsPerShow')::integer,auth.uid());
    end loop;
  end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'inventory.listing.created','inventory_listing',result.id::text,jsonb_build_object('category',chosen_category,'ownerBaseRatePaise',result.owner_base_rate_paise));
  return result;
end;
$$;

create or replace function public.submit_inventory_listing(target_listing uuid)
returns public.inventory_listings security definer language plpgsql set search_path = '' as $$
declare result public.inventory_listings;
begin
  perform public.enforce_inventory_rate_limit('owner.listing.submit', 20, 60);
  update public.inventory_listings set status='submitted',submitted_at=now(),review_reason=null,reviewed_at=null,reviewed_by=null where id=target_listing and owner_id=auth.uid() and status in ('draft','rejected') returning * into result;
  if result.id is null then raise exception 'listing is not editable by this owner'; end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'inventory.listing.submitted','inventory_listing',target_listing::text,'{}');
  return result;
end;
$$;

create or replace function public.update_inventory_listing(target_listing uuid, input jsonb)
returns public.inventory_listings security definer language plpgsql set search_path = '' as $$
declare result public.inventory_listings; expected_category public.listing_category; item jsonb;
begin
  perform public.enforce_inventory_rate_limit('owner.listing.update', 30, 60);
  expected_category := (input->>'category')::public.listing_category;
  update public.inventory_listings set
    title=trim(input->>'title'),description=trim(input->>'description'),locality=trim(input->>'locality'),district=input->>'district',
    latitude=(input->>'latitude')::numeric,longitude=(input->>'longitude')::numeric,location_provider=input->>'sourceProvider',provider_place_id=trim(input->>'sourcePlaceId'),
    audience_estimate=(input->>'audienceEstimate')::integer,audience_basis=trim(input->>'audienceBasis'),ad_duration_seconds=(input->>'adDurationSeconds')::integer,
    plays_per_unit=(input->>'playsPerUnit')::integer,operating_start=(input->>'operatingStart')::time,operating_end=(input->>'operatingEnd')::time,
    service_promise=trim(input->>'servicePromise'),category_details=coalesce(input->'categoryDetails','{}'::jsonb),owner_base_rate_paise=(input->>'baseRatePaise')::bigint,
    review_reason=null
  where id=target_listing and owner_id=auth.uid() and category=expected_category and status in ('draft','rejected') returning * into result;
  if result.id is null then raise exception 'listing is not editable by this owner'; end if;
  delete from public.listing_blackouts where listing_id=target_listing;
  delete from public.theatre_show_instances where listing_id=target_listing;
  for item in select value from jsonb_array_elements(coalesce(input->'blackouts','[]'::jsonb)) loop
    insert into public.listing_blackouts(listing_id,starts_on,ends_on,reason,created_by) values (result.id,(item->>'startsOn')::date,(item->>'endsOn')::date,trim(item->>'reason'),auth.uid());
  end loop;
  if expected_category='theatre' then
    for item in select value from jsonb_array_elements(coalesce(input->'categoryDetails'->'showStarts','[]'::jsonb)) loop
      insert into public.theatre_show_instances(listing_id,starts_at,slots_total,created_by) values (result.id,(item#>>'{}')::timestamptz,(input->'categoryDetails'->>'slotsPerShow')::integer,auth.uid());
    end loop;
  end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'inventory.listing.updated','inventory_listing',target_listing::text,jsonb_build_object('category',expected_category,'ownerBaseRatePaise',result.owner_base_rate_paise));
  return result;
end;
$$;

create or replace function public.review_inventory_listing(target_listing uuid, decision text, reason text default null)
returns public.inventory_listings security definer language plpgsql set search_path = '' as $$
declare result public.inventory_listings; rate_id uuid; verification_ok boolean;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode = '42501'; end if;
  perform public.enforce_inventory_rate_limit('admin.listing.review', 100, 1);
  if decision not in ('published','rejected') then raise exception 'invalid listing decision'; end if;
  if decision='rejected' and char_length(trim(coalesce(reason,''))) < 5 then raise exception 'a rejection reason is required'; end if;
  select exists(select 1 from public.inventory_listings l join public.owner_verifications v on v.owner_id=l.owner_id where l.id=target_listing and v.status='approved') into verification_ok;
  if not verification_ok then raise exception 'owner verification must be approved'; end if;
  if decision='published' then
    select id into rate_id from public.listing_rate_revisions where listing_id=target_listing order by effective_at desc limit 1;
    if rate_id is null then
      insert into public.listing_rate_revisions(listing_id,amount_paise,unit,source,changed_by,owner_discussion_note,reason)
      select id,owner_base_rate_paise,rate_unit,'initial_owner',auth.uid(),'Initial rate submitted by owner and reviewed during publication.','Initial listing publication' from public.inventory_listings where id=target_listing and status='submitted' returning id into rate_id;
    end if;
    update public.inventory_listings l set status='published',published_at=coalesce(published_at,now()),reviewed_at=now(),reviewed_by=auth.uid(),review_reason=null,suspension_reason=null,current_rate_revision_id=rate_id,
      approved_service_snapshot=jsonb_build_object('listingId',l.id,'rateRevisionId',rate_id,'category',l.category,'ratePaise',l.owner_base_rate_paise,'rateUnit',l.rate_unit,'adDurationSeconds',l.ad_duration_seconds,'playsPerUnit',l.plays_per_unit,'operatingStart',l.operating_start,'operatingEnd',l.operating_end,'servicePromise',l.service_promise,'categoryDetails',l.category_details)
      where l.id=target_listing and l.status='submitted' returning * into result;
  else
    update public.inventory_listings set status='rejected',reviewed_at=now(),reviewed_by=auth.uid(),review_reason=trim(reason) where id=target_listing and status='submitted' returning * into result;
  end if;
  if result.id is null then raise exception 'listing is not awaiting review'; end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'inventory.listing.'||decision,'inventory_listing',target_listing::text,jsonb_build_object('reason',nullif(trim(reason),''),'rateRevisionId',rate_id));
  return result;
end;
$$;

create or replace function public.change_published_rate(target_listing uuid, new_amount_paise bigint, discussion_note text, reason text)
returns public.listing_rate_revisions security definer language plpgsql set search_path = '' as $$
declare result public.listing_rate_revisions; listing_unit public.rate_unit; old_amount bigint;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode = '42501'; end if;
  perform public.enforce_inventory_rate_limit('admin.rate.change', 40, 60);
  if new_amount_paise < 10000 or new_amount_paise > 1000000000 then raise exception 'rate outside allowed range'; end if;
  if char_length(trim(discussion_note)) < 10 or char_length(trim(reason)) < 5 then raise exception 'owner discussion and reason are required'; end if;
  select rate_unit,owner_base_rate_paise into listing_unit,old_amount from public.inventory_listings where id=target_listing and status='published' for update;
  if listing_unit is null then raise exception 'published listing not found'; end if;
  insert into public.listing_rate_revisions(listing_id,amount_paise,unit,source,changed_by,owner_discussion_note,reason) values (target_listing,new_amount_paise,listing_unit,'admin_change',auth.uid(),trim(discussion_note),trim(reason)) returning * into result;
  update public.inventory_listings set owner_base_rate_paise=new_amount_paise,current_rate_revision_id=result.id where id=target_listing;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'inventory.rate.changed','inventory_listing',target_listing::text,jsonb_build_object('oldAmountPaise',old_amount,'newAmountPaise',new_amount_paise,'rateRevisionId',result.id,'reason',trim(reason)));
  return result;
end;
$$;

create or replace function public.suspend_inventory_listing(target_listing uuid, reason text)
returns public.inventory_listings security definer language plpgsql set search_path = '' as $$
declare result public.inventory_listings;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode = '42501'; end if;
  if char_length(trim(reason)) < 5 then raise exception 'a suspension reason is required'; end if;
  update public.inventory_listings set status='suspended',suspension_reason=trim(reason),reviewed_at=now(),reviewed_by=auth.uid() where id=target_listing and status='published' returning * into result;
  if result.id is null then raise exception 'published listing not found'; end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values (auth.uid(),'inventory.listing.suspended','inventory_listing',target_listing::text,jsonb_build_object('reason',trim(reason)));
  return result;
end;
$$;

alter table public.owner_verifications enable row level security;
alter table public.inventory_listings enable row level security;
alter table public.listing_rate_revisions enable row level security;
alter table public.listing_blackouts enable row level security;
alter table public.theatre_show_instances enable row level security;
alter table public.private_media_assets enable row level security;
alter table public.inventory_action_limits enable row level security;

drop policy if exists owner_verification_read_scoped on public.owner_verifications;
create policy owner_verification_read_scoped on public.owner_verifications for select to authenticated using (owner_id=auth.uid() or public.is_admin_aal2());
drop policy if exists inventory_listings_public_or_scoped on public.inventory_listings;
create policy inventory_listings_public_or_scoped on public.inventory_listings for select to authenticated using (owner_id=auth.uid() or public.is_admin_aal2());
drop policy if exists listing_rates_public_or_scoped on public.listing_rate_revisions;
create policy listing_rates_public_or_scoped on public.listing_rate_revisions for select to authenticated using (exists(select 1 from public.inventory_listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin_aal2())));
drop policy if exists listing_blackouts_public_or_scoped on public.listing_blackouts;
create policy listing_blackouts_public_or_scoped on public.listing_blackouts for select to anon,authenticated using (exists(select 1 from public.inventory_listings l where l.id=listing_id and (l.status='published' or l.owner_id=auth.uid() or public.is_admin_aal2())));
drop policy if exists theatre_shows_public_or_scoped on public.theatre_show_instances;
create policy theatre_shows_public_or_scoped on public.theatre_show_instances for select to anon,authenticated using (exists(select 1 from public.inventory_listings l where l.id=listing_id and (l.status='published' or l.owner_id=auth.uid() or public.is_admin_aal2())));
drop policy if exists private_media_read_scoped on public.private_media_assets;
create policy private_media_read_scoped on public.private_media_assets for select to authenticated using (uploader_id=auth.uid() or public.is_admin_aal2());

revoke all on public.owner_verifications,public.inventory_listings,public.listing_rate_revisions,public.listing_blackouts,public.theatre_show_instances,public.private_media_assets,public.inventory_action_limits from anon,authenticated;
grant select on public.inventory_listings,public.listing_rate_revisions,public.listing_blackouts,public.theatre_show_instances to authenticated;
revoke all on public.published_inventory from public;
grant select on public.published_inventory to anon,authenticated,service_role;
grant select on public.owner_verifications,public.private_media_assets to authenticated;
grant all on public.owner_verifications,public.inventory_listings,public.listing_rate_revisions,public.listing_blackouts,public.theatre_show_instances,public.private_media_assets,public.inventory_action_limits to service_role;

revoke all on function public.submit_owner_verification(jsonb),public.review_owner_verification(uuid,text,text),public.create_inventory_listing(jsonb),public.update_inventory_listing(uuid,jsonb),public.submit_inventory_listing(uuid),public.review_inventory_listing(uuid,text,text),public.change_published_rate(uuid,bigint,text,text),public.suspend_inventory_listing(uuid,text),public.enforce_inventory_rate_limit(text,integer,integer) from public;
grant execute on function public.submit_owner_verification(jsonb),public.create_inventory_listing(jsonb),public.update_inventory_listing(uuid,jsonb),public.submit_inventory_listing(uuid) to authenticated,service_role;
grant execute on function public.review_owner_verification(uuid,text,text),public.review_inventory_listing(uuid,text,text),public.change_published_rate(uuid,bigint,text,text),public.suspend_inventory_listing(uuid,text) to authenticated,service_role;
grant execute on function public.enforce_inventory_rate_limit(text,integer,integer) to service_role;

comment on table public.inventory_listings is 'Kerala inventory source of truth. Only published rows are public; owner rates become immutable revisions at publication.';
comment on table public.private_media_assets is 'Private, signature-validated and scanned owner documents or advertiser creatives. Downloads are short-lived and authorization scoped.';
comment on column public.inventory_listings.approved_service_snapshot is 'Admin-approved listing terms. Paid-line snapshots copy this version in P04/P05 and are never mutated by later listing edits.';
