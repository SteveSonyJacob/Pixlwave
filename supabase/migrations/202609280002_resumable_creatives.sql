-- Permit signed resumable uploads for advertiser creatives as well as listing images.
-- Session rows remain readable only by their uploader or an AAL2 administrator;
-- only the service role may create or finalize them after route-level checks.
alter table public.media_upload_sessions
  drop constraint if exists media_upload_sessions_purpose_check,
  drop constraint if exists media_upload_sessions_declared_mime_check;

alter table public.media_upload_sessions
  alter column listing_id drop not null,
  add constraint media_upload_sessions_purpose_check check (purpose in ('listing', 'creative')),
  add constraint media_upload_sessions_declared_mime_check check (
    declared_mime in ('image/png', 'image/jpeg', 'video/mp4', 'video/webm')
  ),
  add constraint media_upload_sessions_target_check check (
    (purpose = 'listing' and listing_id is not null and declared_mime in ('image/png', 'image/jpeg'))
    or (purpose = 'creative' and listing_id is null and listing_revision_id is null)
  );

comment on table public.media_upload_sessions is
  'Short-lived signed resumable upload intents for private listing images and advertiser creatives. Finalization validates uploaded bytes before creating a clean asset.';

-- The API validates bytes first. A service-only transaction locks the session,
-- rechecks current access and commits the asset together with the session result.
create or replace function public.finalize_private_upload(target_session uuid, target_uploader uuid, validated_metadata jsonb)
returns public.private_media_assets language plpgsql security definer set search_path='' as $$
declare upload public.media_upload_sessions; result public.private_media_assets; listing public.inventory_listings;
  revision public.inventory_listing_revisions; next_order integer := 0;
begin
  select * into upload from public.media_upload_sessions where id=target_session and uploader_id=target_uploader for update;
  if upload.id is null then raise exception 'Upload session unavailable.' using errcode='42501'; end if;
  if upload.status='finalized' then
    select * into result from public.private_media_assets where id=upload.finalized_asset_id;
    return result;
  end if;
  if upload.status<>'issued' or upload.expires_at<=now() then raise exception 'Upload session expired or closed.' using errcode='22023'; end if;
  if validated_metadata is null or jsonb_typeof(validated_metadata)<>'object'
    or validated_metadata->>'mime' is distinct from upload.declared_mime
    or (validated_metadata->>'bytes')::bigint is distinct from upload.expected_bytes
    or coalesce(validated_metadata->>'sha256','') !~ '^[a-f0-9]{64}$' then
    raise exception 'Validated metadata does not match upload intent.' using errcode='22023';
  end if;
  if upload.purpose='creative' then
    if not exists(select 1 from public.profiles where id=target_uploader and advertiser_enabled) then
      raise exception 'Advertiser access required.' using errcode='42501';
    end if;
  else
    -- Replacement review locks revision before listing; use the same order here.
    if upload.listing_revision_id is not null then
      select * into revision from public.inventory_listing_revisions where id=upload.listing_revision_id
        and listing_id=upload.listing_id and owner_id=target_uploader for update;
      if revision.id is null or revision.status not in ('draft','rejected') then
        raise exception 'Replacement revision is no longer editable.' using errcode='42501';
      end if;
    end if;
    select * into listing from public.inventory_listings where id=upload.listing_id and owner_id=target_uploader for update;
    if listing.id is null or not (
      (upload.listing_revision_id is null and listing.status in ('draft','rejected'))
      or (upload.listing_revision_id is not null and listing.status='published')
    ) then raise exception 'Listing is no longer editable.' using errcode='42501'; end if;
    select coalesce(max(a.display_order),-1)+1 into next_order from public.private_media_assets a
      where a.listing_id=upload.listing_id and a.listing_revision_id is not distinct from upload.listing_revision_id
      and a.purpose='listing_media' and a.removed_at is null;
  end if;
  insert into public.private_media_assets(uploader_id,purpose,listing_id,listing_revision_id,object_key,original_name,
    declared_mime,detected_mime,byte_size,sha256,pixel_width,pixel_height,scan_status,scan_engine,scan_completed_at,retention_until,display_order)
  values(target_uploader,case when upload.purpose='listing' then 'listing_media'::public.private_media_purpose else 'creative'::public.private_media_purpose end,
    upload.listing_id,upload.listing_revision_id,upload.object_key,upload.original_name,upload.declared_mime,validated_metadata->>'mime',
    upload.expected_bytes,validated_metadata->>'sha256',(validated_metadata->>'width')::integer,(validated_metadata->>'height')::integer,
    'clean','pixlwave-signature-and-eicar-v1',now(),now()+interval '365 days',next_order) returning * into result;
  update public.media_upload_sessions set status='finalized',finalized_asset_id=result.id where id=upload.id;
  return result;
end;
$$;

-- Mark rejection before removing bytes. Concurrent finalization either commits
-- first (and this returns no path) or observes a closed session.
create or replace function public.reject_private_upload(target_session uuid, target_uploader uuid, rejection text)
returns text language plpgsql security definer set search_path='' as $$
declare upload public.media_upload_sessions;
begin
  select * into upload from public.media_upload_sessions where id=target_session and uploader_id=target_uploader for update;
  if upload.id is null or upload.status='finalized' then return null; end if;
  update public.media_upload_sessions set status='failed',error_message=left(rejection,500) where id=upload.id;
  return upload.object_key;
end;
$$;

revoke all on function public.finalize_private_upload(uuid,uuid,jsonb),public.reject_private_upload(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.finalize_private_upload(uuid,uuid,jsonb),public.reject_private_upload(uuid,uuid,text) to service_role;

notify pgrst, 'reload schema';
