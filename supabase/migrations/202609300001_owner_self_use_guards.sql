-- Keep an owner's own inventory out of paid checkout. Published self-use dates
-- travel through the existing administrator-reviewed listing revision workflow.

create or replace function public.guard_owner_quote()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.listing_id::text, 300001));
  if exists (select 1 from public.inventory_listings i where i.id = new.listing_id and i.owner_id = new.requester_id) then
    raise exception 'You cannot buy advertising on your own listing. Request self-use dates from the owner workspace.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger quote_no_owner_self_checkout before insert on public.quote_snapshots
for each row execute function public.guard_owner_quote();

create or replace function public.guard_booking_line_checkout()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.listing_id::text, 300001));
  if exists (select 1 from public.inventory_listings i where i.id = new.listing_id and i.owner_id = new.advertiser_id) then
    raise exception 'You cannot buy advertising on your own listing. Request self-use dates from the owner workspace.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.listing_blackouts b
    cross join lateral jsonb_array_elements(new.service_windows) as w(value)
    where b.listing_id = new.listing_id
      and ((w.value->>'startsAt')::timestamptz at time zone 'Asia/Kolkata')::date between b.starts_on and b.ends_on
  ) then
    raise exception 'A requested service date is unavailable. Refresh the quote.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger booking_line_no_self_checkout before insert on public.booking_lines
for each row execute function public.guard_booking_line_checkout();

create or replace function public.assert_cart_checkout_allowed(target_cart uuid, target_advertiser uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare listing_key uuid;
begin
  for listing_key in select distinct l.listing_id from public.booking_lines l where l.cart_id = target_cart order by l.listing_id loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(listing_key::text, 300001));
  end loop;
  if exists (
    select 1 from public.booking_lines l join public.inventory_listings i on i.id = l.listing_id
    where l.cart_id = target_cart and (i.owner_id = target_advertiser or l.advertiser_id = i.owner_id)
  ) then
    raise exception 'You cannot buy advertising on your own listing. Request self-use dates from the owner workspace.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.booking_lines l
    cross join lateral jsonb_array_elements(l.service_windows) as w(value)
    join public.listing_blackouts b on b.listing_id = l.listing_id
    where l.cart_id = target_cart
      and ((w.value->>'startsAt')::timestamptz at time zone 'Asia/Kolkata')::date between b.starts_on and b.ends_on
  ) then
    raise exception 'A requested service date is unavailable. Refresh the cart.' using errcode = '23514';
  end if;
end;
$$;
revoke all on function public.assert_cart_checkout_allowed(uuid,uuid) from public, anon, authenticated;

create or replace function public.guard_cart_submission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'submitted' and old.status is distinct from new.status then
    perform public.assert_cart_checkout_allowed(new.id, new.advertiser_id);
  end if;
  return new;
end;
$$;
create trigger cart_no_self_checkout before update of status on public.booking_carts
for each row execute function public.guard_cart_submission();

create or replace function public.guard_payment_order_checkout()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.assert_cart_checkout_allowed(new.cart_id, new.advertiser_id);
  return new;
end;
$$;
create trigger payment_order_no_self_checkout before insert on public.payment_orders
for each row execute function public.guard_payment_order_checkout();

create or replace function public.guard_paid_booking_blackout()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.listing_id::text, 300001));
  if exists (
    select 1 from public.booking_lines l
    join public.booking_carts c on c.id = l.cart_id
    cross join lateral jsonb_array_elements(l.service_windows) as w(value)
    where l.listing_id = new.listing_id
      and (l.status in ('paid_pending', 'approved') or (c.status = 'submitted' and c.checkout_expires_at > now()))
      and ((w.value->>'startsAt')::timestamptz at time zone 'Asia/Kolkata')::date between new.starts_on and new.ends_on
  ) then
    raise exception 'Unavailable dates overlap an active checkout or paid booking. Resolve it before approving self-use.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger blackout_protect_paid_bookings before insert or update of listing_id, starts_on, ends_on on public.listing_blackouts
for each row execute function public.guard_paid_booking_blackout();

notify pgrst, 'reload schema';
