create or replace function public.check_media_upload_rate()
returns void security definer language plpgsql set search_path = '' as $$
begin perform public.enforce_inventory_rate_limit('media.upload', 12, 1); end;
$$;

create or replace function public.check_map_search_rate()
returns void security definer language plpgsql set search_path = '' as $$
begin perform public.enforce_inventory_rate_limit('maps.search', 30, 1); end;
$$;

revoke all on function public.check_media_upload_rate(),public.check_map_search_rate() from public;
grant execute on function public.check_media_upload_rate(),public.check_map_search_rate() to authenticated,service_role;

comment on function public.check_media_upload_rate() is 'Authenticated per-account rate limit for private media intake.';
comment on function public.check_map_search_rate() is 'Authenticated per-account rate limit for server-side map provider queries.';
