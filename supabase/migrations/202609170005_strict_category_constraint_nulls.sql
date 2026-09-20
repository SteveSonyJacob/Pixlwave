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

notify pgrst, 'reload schema';
