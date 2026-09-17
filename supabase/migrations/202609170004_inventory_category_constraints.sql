create or replace function public.valid_geojson_linestring(raw text)
returns boolean immutable language plpgsql set search_path = '' as $$
declare geometry jsonb;
begin
  geometry := raw::jsonb;
  return geometry->>'type'='LineString'
    and jsonb_typeof(geometry->'coordinates')='array'
    and jsonb_array_length(geometry->'coordinates') >= 2;
exception when others then return false;
end;
$$;

create or replace function public.valid_inventory_category_details(category public.listing_category, details jsonb)
returns boolean immutable language plpgsql set search_path = '' as $$
begin
  if jsonb_typeof(details) <> 'object' then return false; end if;
  if category='led' then
    return coalesce((details->>'screenWidthPx')::integer between 320 and 16384
      and (details->>'screenHeightPx')::integer between 240 and 8640
      and (details->>'physicalWidthMetres')::numeric > 0
      and (details->>'physicalHeightMetres')::numeric > 0
      and (details->>'dailyCapacity')::integer = 1,false);
  elsif category='theatre' then
    return coalesce(char_length(trim(details->>'venueName')) between 2 and 160
      and char_length(trim(details->>'auditoriumName')) between 1 and 80
      and (details->>'slotsPerShow')::integer between 1 and 50
      and jsonb_typeof(details->'showStarts')='array'
      and jsonb_array_length(details->'showStarts') >= 1,false);
  elsif category='mobile' then
    return coalesce(char_length(trim(details->>'vehicleLabel')) between 2 and 120
      and (details->>'rotatingSlots')::integer between 1 and 30
      and char_length(trim(details->>'routeName')) between 3 and 160
      and jsonb_typeof(details->'customRouteAllowed')='boolean'
      and public.valid_geojson_linestring(details->>'routeGeoJson'),false);
  end if;
  return false;
exception when others then return false;
end;
$$;

alter table public.inventory_listings
  add constraint inventory_category_details_valid check (public.valid_inventory_category_details(category,category_details));

alter table public.owner_verifications
  add constraint owner_verification_submitted_fields check (
    status='draft' or (
      char_length(trim(legal_name)) between 2 and 160
      and char_length(trim(coalesce(business_type,''))) between 2 and 80
      and registration_last4 ~ '^[A-Za-z0-9]{4}$'
      and contact_phone ~ '^\+[1-9][0-9]{7,14}$'
      and char_length(trim(coalesce(address,''))) between 10 and 500
      and coalesce(array_length(document_asset_ids,1),0) >= 1
    )
  );

revoke all on function public.valid_geojson_linestring(text),public.valid_inventory_category_details(public.listing_category,jsonb) from public;
grant execute on function public.valid_geojson_linestring(text),public.valid_inventory_category_details(public.listing_category,jsonb) to service_role;

notify pgrst, 'reload schema';
