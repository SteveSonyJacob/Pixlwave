-- Phase 4: frozen carts, trusted payment capture, admin-only decisions,
-- approval-time capacity allocation, cancellation and deadline refund tasks.

do $$ begin
  create type public.booking_cart_status as enum ('open','submitted','paid_review','partially_decided','decided');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_line_status as enum ('draft','paid_pending','approved','rejected','deadline_rejected','payment_ineligible','cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.refund_obligation_reason as enum ('admin_rejected','deadline_rejected','payment_ineligible','advertiser_cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.booking_carts (
  id uuid primary key default extensions.gen_random_uuid(),
  advertiser_id uuid not null references auth.users(id) on delete restrict,
  status public.booking_cart_status not null default 'open',
  currency text not null default 'INR' check (currency='INR'),
  total_amount_paise bigint not null default 0 check (total_amount_paise >= 0),
  submitted_at timestamptz,
  checkout_expires_at timestamptz,
  paid_at timestamptz,
  decision_due_at timestamptz,
  payment_adapter text,
  payment_reference text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status='open' and submitted_at is null and checkout_expires_at is null and paid_at is null and decision_due_at is null)
    or (status='submitted' and submitted_at is not null and checkout_expires_at>submitted_at and paid_at is null and decision_due_at is null)
    or (status in ('paid_review','partially_decided','decided') and submitted_at is not null and checkout_expires_at>submitted_at and paid_at is not null and decision_due_at=paid_at+interval '168 hours')),
  check ((paid_at is null and payment_adapter is null and payment_reference is null)
    or (paid_at is not null and payment_adapter is not null and payment_reference is not null))
);

create unique index if not exists booking_one_open_cart_per_advertiser
  on public.booking_carts(advertiser_id) where status='open';
create index if not exists booking_carts_advertiser on public.booking_carts(advertiser_id,created_at desc);
create index if not exists booking_carts_review_due on public.booking_carts(decision_due_at) where status in ('paid_review','partially_decided');

create table if not exists public.booking_lines (
  id uuid primary key default extensions.gen_random_uuid(),
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  quote_id uuid not null unique references public.quote_snapshots(id) on delete restrict,
  advertiser_id uuid not null references auth.users(id) on delete restrict,
  listing_id uuid not null references public.inventory_listings(id) on delete restrict,
  category public.listing_category not null,
  status public.booking_line_status not null default 'draft',
  requested_units jsonb not null check (jsonb_typeof(requested_units)='array' and jsonb_array_length(requested_units)>0),
  service_windows jsonb not null check (jsonb_typeof(service_windows)='array' and jsonb_array_length(service_windows)>0),
  quantity integer not null check (quantity between 1 and 1000),
  unit_amount_paise bigint not null check (unit_amount_paise between 10000 and 1000000000),
  paid_amount_paise bigint not null check (paid_amount_paise=unit_amount_paise*quantity),
  currency text not null check (currency='INR'),
  listing_snapshot jsonb not null,
  service_snapshot jsonb not null,
  creative_asset_id uuid not null references public.private_media_assets(id) on delete restrict,
  creative_snapshot jsonb not null,
  request_configuration jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  decision_due_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete restrict,
  decision_reason text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status='draft' and paid_at is null and decision_due_at is null and decided_at is null and cancelled_at is null)
    or (status='paid_pending' and paid_at is not null and decision_due_at=paid_at+interval '168 hours' and decided_at is null and cancelled_at is null)
    or (status in ('approved','rejected','deadline_rejected') and paid_at is not null and decision_due_at=paid_at+interval '168 hours' and decided_at is not null and decided_by is not null and cancelled_at is null)
    or (status='payment_ineligible' and paid_at is not null and decision_due_at=paid_at+interval '168 hours' and decided_at is not null and decided_by is null and cancelled_at is null)
    or (status='cancelled' and paid_at is not null and decision_due_at=paid_at+interval '168 hours' and cancelled_at is not null)),
  check (decision_reason is null or char_length(decision_reason) between 5 and 1000)
);

create index if not exists booking_lines_cart on public.booking_lines(cart_id,created_at);
create index if not exists booking_lines_admin_queue on public.booking_lines(status,decision_due_at) where status='paid_pending';
create index if not exists booking_lines_listing on public.booking_lines(listing_id,status);

create table if not exists public.booking_allocations (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_line_id uuid not null references public.booking_lines(id) on delete restrict,
  listing_id uuid not null references public.inventory_listings(id) on delete restrict,
  unit_key text not null check (char_length(unit_key) between 5 and 120),
  service_starts_at timestamptz not null,
  quantity integer not null check (quantity between 1 and 1000),
  amount_paise bigint not null check (amount_paise > 0),
  route_is_custom boolean not null default false,
  route_snapshot jsonb,
  allocated_at timestamptz not null default now(),
  released_at timestamptz,
  unique(booking_line_id,unit_key),
  check ((route_snapshot is null and not route_is_custom) or route_snapshot is not null)
);

create index if not exists booking_active_allocations
  on public.booking_allocations(listing_id,unit_key) where released_at is null;

create table if not exists public.booking_events (
  id uuid primary key default extensions.gen_random_uuid(),
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  booking_line_id uuid references public.booking_lines(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('cart.submitted','payment.captured','booking.approved','booking.rejected','booking.deadline_rejected','booking.payment_ineligible','booking.cancelled','admin.note')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_cart on public.booking_events(cart_id,created_at);

create table if not exists public.booking_admin_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_line_id uuid not null references public.booking_lines(id) on delete restrict,
  admin_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 2 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.refund_obligations (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_line_id uuid not null unique references public.booking_lines(id) on delete restrict,
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  advertiser_id uuid not null references auth.users(id) on delete restrict,
  reason public.refund_obligation_reason not null,
  gross_amount_paise bigint not null check (gross_amount_paise > 0),
  fee_amount_paise bigint not null default 0 check (fee_amount_paise >= 0),
  processing_charge_paise bigint not null default 0 check (processing_charge_paise >= 0),
  refund_amount_paise bigint not null check (refund_amount_paise >= 0),
  status text not null default 'pending_manual' check (status='pending_manual'),
  created_at timestamptz not null default now(),
  check (refund_amount_paise + fee_amount_paise + processing_charge_paise = gross_amount_paise),
  check ((reason='advertiser_cancelled' and processing_charge_paise=0)
    or (reason in ('admin_rejected','deadline_rejected','payment_ineligible') and fee_amount_paise=0))
);

drop trigger if exists booking_carts_set_updated_at on public.booking_carts;
create trigger booking_carts_set_updated_at before update on public.booking_carts
for each row execute function public.set_updated_at();
drop trigger if exists booking_lines_set_updated_at on public.booking_lines;
create trigger booking_lines_set_updated_at before update on public.booking_lines
for each row execute function public.set_updated_at();

create or replace function public.enforce_booking_line_immutability()
returns trigger language plpgsql set search_path='' as $$
declare cart public.booking_carts;
begin
  if tg_op='INSERT' then
    select * into cart from public.booking_carts where id=new.cart_id;
    if cart.id is null or cart.status<>'open' or new.status<>'draft' or cart.advertiser_id<>new.advertiser_id then raise exception 'booking lines can only be added to the advertiser open cart'; end if;
    return new;
  elsif tg_op='DELETE' then
    select * into cart from public.booking_carts where id=old.cart_id;
    if cart.status<>'open' or old.status<>'draft' then raise exception 'submitted booking line membership is immutable'; end if;
    return old;
  end if;
  if (new.cart_id,new.quote_id,new.advertiser_id,new.listing_id,new.category,new.requested_units,new.service_windows,new.quantity,new.unit_amount_paise,new.paid_amount_paise,new.currency,new.listing_snapshot,new.service_snapshot,new.creative_asset_id,new.creative_snapshot,new.request_configuration)
    is distinct from
    (old.cart_id,old.quote_id,old.advertiser_id,old.listing_id,old.category,old.requested_units,old.service_windows,old.quantity,old.unit_amount_paise,old.paid_amount_paise,old.currency,old.listing_snapshot,old.service_snapshot,old.creative_asset_id,old.creative_snapshot,old.request_configuration)
  then raise exception 'submitted booking snapshots are immutable'; end if;
  return new;
end;
$$;

drop trigger if exists booking_lines_immutable on public.booking_lines;
create trigger booking_lines_immutable before insert or update or delete on public.booking_lines
for each row execute function public.enforce_booking_line_immutability();

create or replace function public.refresh_booking_cart_status(target_cart uuid)
returns public.booking_cart_status security definer language plpgsql set search_path='' as $$
declare next_status public.booking_cart_status;
begin
  if exists(select 1 from public.booking_lines where cart_id=target_cart and status='paid_pending') then
    if exists(select 1 from public.booking_lines where cart_id=target_cart and status in ('approved','rejected','deadline_rejected','payment_ineligible','cancelled')) then next_status := 'partially_decided';
    else next_status := 'paid_review'; end if;
  else
    next_status := 'decided';
  end if;
  update public.booking_carts set status=next_status where id=target_cart and paid_at is not null;
  return next_status;
end;
$$;

create or replace function public.add_quote_to_cart(target_quote uuid, target_creative uuid, configuration jsonb default '{}'::jsonb)
returns public.booking_lines security definer language plpgsql set search_path='' as $$
declare q public.quote_snapshots; listing public.inventory_listings; asset public.private_media_assets; cart public.booking_carts; result public.booking_lines;
  unit jsonb; windows jsonb := '[]'::jsonb; starts_at timestamptz; show_row public.theatre_show_instances; approved jsonb;
  requested_custom boolean := coalesce((configuration->>'customRouteRequested')::boolean,false); requested_route jsonb;
  screen_width numeric; screen_height numeric; creative_ratio numeric; screen_ratio numeric;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and advertiser_enabled) then raise exception 'advertiser mode is required' using errcode='42501'; end if;
  select * into q from public.quote_snapshots where id=target_quote and requester_id=auth.uid() for share;
  if q.id is null then raise exception 'quote not found' using errcode='42501'; end if;
  select * into listing from public.inventory_listings where id=q.listing_id and status='published';
  if listing.id is null or listing.current_rate_revision_id<>q.rate_revision_id or q.expires_at<=now() then raise exception 'quote is no longer current'; end if;
  select * into asset from public.private_media_assets where id=target_creative and uploader_id=auth.uid() and purpose='creative' and scan_status='clean';
  if asset.id is null then raise exception 'a clean owned creative is required' using errcode='42501'; end if;
  if asset.detected_mime not in ('image/png','image/jpeg','video/mp4','video/webm') then raise exception 'creative media type is not supported'; end if;
  approved := coalesce(q.listing_snapshot->'approvedService',listing.approved_service_snapshot);
  if asset.detected_mime like 'video/%' and (asset.duration_seconds is null or abs(asset.duration_seconds-(approved->>'adDurationSeconds')::numeric) > 0.05) then
    raise exception 'video duration does not match the approved ad duration';
  end if;
  if q.category='led' and asset.detected_mime like 'image/%' then
    screen_width := (approved->'categoryDetails'->>'screenWidthPx')::numeric; screen_height := (approved->'categoryDetails'->>'screenHeightPx')::numeric;
    if asset.pixel_width is null or asset.pixel_height is null or asset.pixel_width<screen_width or asset.pixel_height<screen_height then raise exception 'creative resolution is below the approved screen resolution'; end if;
    creative_ratio := asset.pixel_width::numeric/asset.pixel_height; screen_ratio := screen_width/screen_height;
    if abs(creative_ratio-screen_ratio)>0.02 then raise exception 'creative aspect ratio does not match the approved screen'; end if;
  end if;
  if q.category='mobile' then
    requested_route := coalesce(configuration->'requestedRoute', (approved->'categoryDetails'->>'routeGeoJson')::jsonb);
    if requested_custom and coalesce((approved->'categoryDetails'->>'customRouteAllowed')::boolean,false) is not true then raise exception 'custom routes are not enabled for this vehicle'; end if;
    if requested_route is null or not public.valid_geojson_linestring(requested_route::text) then raise exception 'a valid GeoJSON LineString route is required'; end if;
    configuration := jsonb_build_object('customRouteRequested',requested_custom,'requestedRoute',requested_route,'routeName',nullif(trim(configuration->>'routeName'),''));
  else configuration := '{}'::jsonb; end if;

  for unit in select value from jsonb_array_elements(q.requested_units) loop
    if q.category='theatre' then
      select * into show_row from public.theatre_show_instances where id=(unit->>'showInstanceId')::uuid and listing_id=q.listing_id;
      if show_row.id is null then raise exception 'quoted theatre show no longer exists'; end if;
      starts_at := show_row.starts_at;
      windows := windows || jsonb_build_array(unit || jsonb_build_object('unitKey','show:'||(unit->>'showInstanceId'),'startsAt',starts_at,'capacity',show_row.slots_total));
    else
      starts_at := (((unit->>'date')::date + (approved->>'operatingStart')::time) at time zone 'Asia/Kolkata');
      windows := windows || jsonb_build_array(unit || jsonb_build_object('unitKey','date:'||(unit->>'date'),'startsAt',starts_at,'capacity',case when q.category='led' then 1 else (approved->'categoryDetails'->>'rotatingSlots')::integer end));
    end if;
  end loop;

  select * into cart from public.booking_carts where advertiser_id=auth.uid() and status='open' for update;
  if cart.id is null then
    insert into public.booking_carts(advertiser_id) values(auth.uid())
    on conflict(advertiser_id) where status='open' do update set advertiser_id=excluded.advertiser_id
    returning * into cart;
  end if;
  insert into public.booking_lines(cart_id,quote_id,advertiser_id,listing_id,category,requested_units,service_windows,quantity,unit_amount_paise,paid_amount_paise,currency,listing_snapshot,service_snapshot,creative_asset_id,creative_snapshot,request_configuration)
  values(cart.id,q.id,q.requester_id,q.listing_id,q.category,q.requested_units,windows,q.quantity,q.unit_amount_paise,q.total_amount_paise,q.currency,q.listing_snapshot,approved,asset.id,
    jsonb_build_object('assetId',asset.id,'name',asset.original_name,'mime',asset.detected_mime,'sha256',asset.sha256,'width',asset.pixel_width,'height',asset.pixel_height,'durationSeconds',asset.duration_seconds),configuration)
  returning * into result;
  update public.booking_carts set total_amount_paise=total_amount_paise+result.paid_amount_paise where id=cart.id;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata) values(auth.uid(),'booking.cart.line_added','booking_line',result.id::text,jsonb_build_object('cartId',cart.id,'quoteId',q.id));
  return result;
end;
$$;

create or replace function public.remove_open_cart_line(target_line uuid)
returns void security definer language plpgsql set search_path='' as $$
declare line public.booking_lines; cart public.booking_carts;
begin
  select c.* into cart from public.booking_carts c join public.booking_lines l on l.cart_id=c.id where l.id=target_line and c.advertiser_id=auth.uid() and c.status='open' for update of c;
  if cart.id is null then raise exception 'editable cart line not found' using errcode='42501'; end if;
  select * into line from public.booking_lines where id=target_line and cart_id=cart.id and status='draft' for update;
  if line.id is null then raise exception 'editable cart line not found' using errcode='42501'; end if;
  delete from public.booking_lines where id=line.id;
  update public.booking_carts set total_amount_paise=total_amount_paise-line.paid_amount_paise where id=cart.id;
end;
$$;

create or replace function public.submit_booking_cart(target_cart uuid)
returns public.booking_carts security definer language plpgsql set search_path='' as $$
declare result public.booking_carts; quote_expiry timestamptz; invalid_lines integer;
begin
  select * into result from public.booking_carts where id=target_cart and advertiser_id=auth.uid() and status='open' for update;
  if result.id is null then raise exception 'open non-empty cart not found' using errcode='42501'; end if;
  select min(q.expires_at),count(*) filter(where q.expires_at<=now() or i.status<>'published' or i.current_rate_revision_id<>q.rate_revision_id)
  into quote_expiry,invalid_lines
  from public.booking_lines l join public.quote_snapshots q on q.id=l.quote_id join public.inventory_listings i on i.id=l.listing_id
  where l.cart_id=target_cart and l.status='draft';
  if quote_expiry is null then raise exception 'open non-empty cart not found' using errcode='42501'; end if;
  if invalid_lines>0 then raise exception 'a quote expired or its published rate changed; refresh the affected line'; end if;
  update public.booking_carts set status='submitted',submitted_at=now(),checkout_expires_at=quote_expiry
  where id=target_cart and advertiser_id=auth.uid() and status='open'
    and exists(select 1 from public.booking_lines where cart_id=target_cart and status='draft') returning * into result;
  if result.id is null then raise exception 'open non-empty cart not found' using errcode='42501'; end if;
  insert into public.booking_events(cart_id,actor_id,event_type,payload) values(result.id,auth.uid(),'cart.submitted',jsonb_build_object('amountPaise',result.total_amount_paise));
  return result;
end;
$$;

create or replace function public.record_trusted_cart_payment(target_cart uuid, external_reference text, captured_at timestamptz, adapter text)
returns public.booking_carts security definer language plpgsql set search_path='' as $$
declare result public.booking_carts; line public.booking_lines; service_window jsonb; admin_record record; payment_eligible boolean; failure_reason text;
begin
  if adapter not in ('p04_fixture','razorpay') then raise exception 'unrecognized payment adapter'; end if;
  if adapter='p04_fixture' and (lower(current_database()) not like '%test%' or current_setting('app.p04_fixture_funding',true)<>'enabled') then raise exception 'fixture funding is restricted to an explicitly enabled test database' using errcode='42501'; end if;
  if captured_at > now()+interval '5 minutes' and adapter<>'p04_fixture' then raise exception 'capture time cannot be in the future'; end if;
  if char_length(trim(external_reference))<8 then raise exception 'payment reference is required'; end if;
  select * into result from public.booking_carts where id=target_cart for update;
  if result.id is null then raise exception 'cart not found' using errcode='42501'; end if;
  if result.status<>'submitted' then
    if result.payment_reference=external_reference and result.paid_at=captured_at then return result; end if;
    raise exception 'cart is not awaiting trusted payment capture';
  end if;
  if exists(select 1 from public.booking_lines where cart_id=target_cart and status<>'draft') then raise exception 'cart contains a non-draft line'; end if;
  update public.booking_carts set status='paid_review',paid_at=captured_at,decision_due_at=captured_at+interval '168 hours',payment_adapter=adapter,payment_reference=trim(external_reference) where id=target_cart returning * into result;
  update public.booking_lines set status='paid_pending',paid_at=captured_at,decision_due_at=captured_at+interval '168 hours' where cart_id=target_cart;
  insert into public.booking_events(cart_id,event_type,payload) values(target_cart,'payment.captured',jsonb_build_object('capturedAt',captured_at,'adapter',adapter,'reference',external_reference,'amountPaise',result.total_amount_paise));
  perform public.enqueue_notification(result.advertiser_id,'payment.received.'||result.id,'payment.received',jsonb_build_object('cartId',result.id,'decisionDueAt',result.decision_due_at));
  for admin_record in select user_id from public.platform_admins where status='active' loop
    perform public.enqueue_notification(admin_record.user_id,'payment.received.admin.'||result.id,'payment.received',jsonb_build_object('cartId',result.id,'decisionDueAt',result.decision_due_at));
  end loop;
  for line in select * from public.booking_lines where cart_id=target_cart for update loop
    payment_eligible := captured_at<=result.checkout_expires_at;
    failure_reason := case when payment_eligible then null else 'Trusted capture arrived after the accepted checkout snapshot expired.' end;
    for service_window in select value from jsonb_array_elements(line.service_windows) order by value->>'unitKey' loop
      if (service_window->>'startsAt')::timestamptz < captured_at+interval '192 hours' then payment_eligible := false; failure_reason := 'Trusted capture occurred too late for the 192-hour service notice.'; exit; end if;
    end loop;
    if not payment_eligible then
      update public.booking_lines set status='payment_ineligible',decided_at=captured_at,decision_reason=failure_reason where id=line.id returning * into line;
      perform public.create_rejection_refund(line,'payment_ineligible');
      insert into public.booking_events(cart_id,booking_line_id,event_type,payload) values(line.cart_id,line.id,'booking.payment_ineligible',jsonb_build_object('capturedAt',captured_at,'checkoutExpiredAt',result.checkout_expires_at,'earliestServiceAt',captured_at+interval '192 hours','reason',failure_reason));
      perform public.enqueue_notification(line.advertiser_id,'booking.decision.'||line.id,'booking.decision',jsonb_build_object('bookingLineId',line.id,'status',line.status));
    end if;
  end loop;
  perform public.refresh_booking_cart_status(target_cart);
  select * into result from public.booking_carts where id=target_cart;
  return result;
end;
$$;

create or replace function public.create_rejection_refund(line public.booking_lines, reason public.refund_obligation_reason)
returns public.refund_obligations security definer language plpgsql set search_path='' as $$
declare result public.refund_obligations; admin_record record;
begin
  insert into public.refund_obligations(booking_line_id,cart_id,advertiser_id,reason,gross_amount_paise,refund_amount_paise)
  values(line.id,line.cart_id,line.advertiser_id,reason,line.paid_amount_paise,line.paid_amount_paise)
  on conflict(booking_line_id) do update set booking_line_id=excluded.booking_line_id returning * into result;
  for admin_record in select user_id from public.platform_admins where status='active' loop
    perform public.enqueue_notification(admin_record.user_id,'refund.pending.'||line.id,'refund.pending_manual',jsonb_build_object('bookingLineId',line.id,'refundAmountPaise',result.refund_amount_paise,'reason',reason));
  end loop;
  return result;
end;
$$;

create or replace function public.decide_booking_line(target_line uuid, decision text, reason text, agreed_route jsonb default null)
returns public.booking_lines security definer language plpgsql set search_path='' as $$
declare line public.booking_lines; service_window jsonb; used integer; capacity integer; unit_quantity integer; key text; chosen_route jsonb; custom_requested boolean; existing_custom jsonb; admin_record record;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode='42501'; end if;
  if decision not in ('approved','rejected') then raise exception 'invalid booking decision'; end if;
  if char_length(trim(coalesce(reason,'')))<5 then raise exception 'a decision reason is required'; end if;
  select * into line from public.booking_lines where id=target_line for update;
  if line.id is null or line.status<>'paid_pending' then raise exception 'paid pending booking line not found'; end if;
  if now()>=line.decision_due_at then
    update public.booking_lines set status='deadline_rejected',decided_at=now(),decided_by=auth.uid(),decision_reason='Review deadline passed before a decision was recorded.' where id=line.id returning * into line;
    perform public.create_rejection_refund(line,'deadline_rejected');
    insert into public.booking_events(cart_id,booking_line_id,actor_id,event_type,payload) values(line.cart_id,line.id,auth.uid(),'booking.deadline_rejected',jsonb_build_object('deadline',line.decision_due_at));
    perform public.enqueue_notification(line.advertiser_id,'booking.deadline.'||line.id,'review.overdue_rejected',jsonb_build_object('bookingLineId',line.id));
    perform public.refresh_booking_cart_status(line.cart_id); return line;
  end if;
  if decision='rejected' then
    update public.booking_lines set status='rejected',decided_at=now(),decided_by=auth.uid(),decision_reason=trim(reason) where id=line.id returning * into line;
    perform public.create_rejection_refund(line,'admin_rejected');
    insert into public.booking_events(cart_id,booking_line_id,actor_id,event_type,payload) values(line.cart_id,line.id,auth.uid(),'booking.rejected',jsonb_build_object('reason',trim(reason)));
  else
    custom_requested := coalesce((line.request_configuration->>'customRouteRequested')::boolean,false);
    if line.category='mobile' then
      chosen_route := case when custom_requested then agreed_route else line.request_configuration->'requestedRoute' end;
      if chosen_route is null or not public.valid_geojson_linestring(chosen_route::text) then raise exception 'admin must record a valid owner-agreed route'; end if;
      if not custom_requested and agreed_route is not null and not public.valid_geojson_linestring(agreed_route::text) then raise exception 'owner-agreed route must be a valid GeoJSON LineString'; end if;
    end if;
    for service_window in select value from jsonb_array_elements(line.service_windows) order by value->>'unitKey' loop
      key := service_window->>'unitKey'; capacity := (service_window->>'capacity')::integer;
      unit_quantity := case when line.category='led' then 1 else (service_window->>'quantity')::integer end;
      perform pg_advisory_xact_lock(hashtextextended(line.listing_id::text||':'||key,0));
      select coalesce(sum(quantity),0) into used from public.booking_allocations where listing_id=line.listing_id and unit_key=key and released_at is null;
      if used+unit_quantity>capacity then raise exception 'requested inventory capacity is no longer available'; end if;
      if line.category='mobile' then
        select route_snapshot into existing_custom from public.booking_allocations where listing_id=line.listing_id and unit_key=key and released_at is null and route_is_custom limit 1;
        if custom_requested and used>0 then raise exception 'custom route requires no other approved booking on the date'; end if;
        if not custom_requested then chosen_route := case when existing_custom is null then line.request_configuration->'requestedRoute' else coalesce(agreed_route,line.request_configuration->'requestedRoute') end; end if;
        if not custom_requested and existing_custom is not null and existing_custom<>chosen_route then raise exception 'shared booking must use the committed custom route'; end if;
      end if;
      insert into public.booking_allocations(booking_line_id,listing_id,unit_key,service_starts_at,quantity,amount_paise,route_is_custom,route_snapshot)
      values(line.id,line.listing_id,key,(service_window->>'startsAt')::timestamptz,unit_quantity,line.unit_amount_paise*unit_quantity,custom_requested,chosen_route);
    end loop;
    update public.booking_lines set status='approved',decided_at=now(),decided_by=auth.uid(),decision_reason=trim(reason) where id=line.id returning * into line;
    insert into public.booking_events(cart_id,booking_line_id,actor_id,event_type,payload) values(line.cart_id,line.id,auth.uid(),'booking.approved',jsonb_build_object('reason',trim(reason),'route',chosen_route));
  end if;
  perform public.enqueue_notification(line.advertiser_id,'booking.decision.'||line.id,'booking.decision',jsonb_build_object('bookingLineId',line.id,'status',line.status));
  perform public.refresh_booking_cart_status(line.cart_id);
  return line;
end;
$$;

create or replace function public.cancel_booking_line(target_line uuid)
returns public.booking_lines security definer language plpgsql set search_path='' as $$
declare line public.booking_lines; fee bigint; refund bigint; admin_record record;
begin
  select * into line from public.booking_lines where id=target_line and advertiser_id=auth.uid() for update;
  if line.id is null or line.status not in ('paid_pending','approved') then raise exception 'cancellable booking line not found' using errcode='42501'; end if;
  if now()>=line.decision_due_at then raise exception 'the 168-hour cancellation window has closed'; end if;
  fee := floor((line.paid_amount_paise*5+50)::numeric/100); refund := line.paid_amount_paise-fee;
  update public.booking_allocations set released_at=now() where booking_line_id=line.id and released_at is null;
  update public.booking_lines set status='cancelled',cancelled_at=now(),decision_reason='Advertiser cancelled within the 168-hour window.' where id=line.id returning * into line;
  insert into public.refund_obligations(booking_line_id,cart_id,advertiser_id,reason,gross_amount_paise,fee_amount_paise,refund_amount_paise)
  values(line.id,line.cart_id,line.advertiser_id,'advertiser_cancelled',line.paid_amount_paise,fee,refund);
  insert into public.booking_events(cart_id,booking_line_id,actor_id,event_type,payload) values(line.cart_id,line.id,auth.uid(),'booking.cancelled',jsonb_build_object('feeAmountPaise',fee,'refundAmountPaise',refund));
  perform public.enqueue_notification(line.advertiser_id,'booking.cancelled.'||line.id,'booking.cancelled',jsonb_build_object('bookingLineId',line.id,'refundAmountPaise',refund,'feeAmountPaise',fee));
  for admin_record in select user_id from public.platform_admins where status='active' loop
    perform public.enqueue_notification(admin_record.user_id,'refund.pending.'||line.id,'refund.pending_manual',jsonb_build_object('bookingLineId',line.id,'refundAmountPaise',refund,'reason','advertiser_cancelled'));
  end loop;
  perform public.refresh_booking_cart_status(line.cart_id); return line;
end;
$$;

create or replace function public.add_booking_admin_note(target_line uuid, note_body text)
returns public.booking_admin_notes security definer language plpgsql set search_path='' as $$
declare result public.booking_admin_notes; target_cart uuid;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode='42501'; end if;
  if char_length(trim(note_body))<2 then raise exception 'note is too short'; end if;
  select cart_id into target_cart from public.booking_lines where id=target_line;
  if target_cart is null then raise exception 'booking line not found'; end if;
  insert into public.booking_admin_notes(booking_line_id,admin_id,body) values(target_line,auth.uid(),trim(note_body)) returning * into result;
  insert into public.booking_events(cart_id,booking_line_id,actor_id,event_type,payload) values(target_cart,target_line,auth.uid(),'admin.note',jsonb_build_object('noteId',result.id));
  return result;
end;
$$;

create or replace function public.send_booking_review_reminders(effective_now timestamptz default now(), batch_size integer default 100)
returns integer security definer language plpgsql set search_path='' as $$
declare line public.booking_lines; admin_record record; sent integer := 0;
begin
  for line in select * from public.booking_lines where status='paid_pending' and decision_due_at>effective_now and decision_due_at<=effective_now+interval '24 hours' order by decision_due_at limit greatest(1,least(batch_size,500)) loop
    for admin_record in select user_id from public.platform_admins where status='active' loop
      perform public.enqueue_notification(admin_record.user_id,'review.due.'||line.id,'review.due',jsonb_build_object('bookingLineId',line.id,'decisionDueAt',line.decision_due_at));
    end loop; sent := sent+1;
  end loop; return sent;
end;
$$;

create or replace function public.expire_booking_review_deadlines(effective_now timestamptz default now(), batch_size integer default 100)
returns integer security definer language plpgsql set search_path='' as $$
declare line public.booking_lines; expired integer := 0;
begin
  for line in select * from public.booking_lines where status='paid_pending' and decision_due_at<=effective_now order by decision_due_at limit greatest(1,least(batch_size,500)) for update skip locked loop
    update public.booking_lines set status='deadline_rejected',decided_at=effective_now,decided_by=(select user_id from public.platform_admins where status='active' order by granted_at limit 1),decision_reason='Automatically rejected after the 168-hour admin review deadline.' where id=line.id returning * into line;
    if line.decided_by is null then raise exception 'an active administrator is required for deadline audit ownership'; end if;
    perform public.create_rejection_refund(line,'deadline_rejected');
    insert into public.booking_events(cart_id,booking_line_id,event_type,payload) values(line.cart_id,line.id,'booking.deadline_rejected',jsonb_build_object('deadline',line.decision_due_at,'processedAt',effective_now));
    perform public.enqueue_notification(line.advertiser_id,'booking.deadline.'||line.id,'review.overdue_rejected',jsonb_build_object('bookingLineId',line.id));
    perform public.refresh_booking_cart_status(line.cart_id); expired := expired+1;
  end loop; return expired;
end;
$$;

alter table public.booking_carts enable row level security;
alter table public.booking_lines enable row level security;
alter table public.booking_allocations enable row level security;
alter table public.booking_events enable row level security;
alter table public.booking_admin_notes enable row level security;
alter table public.refund_obligations enable row level security;

create policy booking_carts_scoped_read on public.booking_carts for select to authenticated using(advertiser_id=auth.uid() or public.is_admin_aal2());
create policy booking_lines_scoped_read on public.booking_lines for select to authenticated using(advertiser_id=auth.uid() or public.is_admin_aal2());
create policy booking_allocations_scoped_read on public.booking_allocations for select to authenticated using(public.is_admin_aal2() or exists(select 1 from public.booking_lines l where l.id=booking_line_id and l.advertiser_id=auth.uid()));
create policy booking_events_scoped_read on public.booking_events for select to authenticated using(public.is_admin_aal2() or exists(select 1 from public.booking_carts c where c.id=cart_id and c.advertiser_id=auth.uid() and event_type<>'admin.note'));
create policy booking_admin_notes_admin_read on public.booking_admin_notes for select to authenticated using(public.is_admin_aal2());
create policy refund_obligations_scoped_read on public.refund_obligations for select to authenticated using(advertiser_id=auth.uid() or public.is_admin_aal2());

revoke all on public.booking_carts,public.booking_lines,public.booking_allocations,public.booking_events,public.booking_admin_notes,public.refund_obligations from public,anon,authenticated;
grant select on public.booking_carts,public.booking_lines,public.booking_allocations,public.booking_events,public.refund_obligations to authenticated;
grant select on public.booking_admin_notes to authenticated;
grant all on public.booking_carts,public.booking_lines,public.booking_allocations,public.booking_events,public.booking_admin_notes,public.refund_obligations to service_role;

revoke all on function public.enforce_booking_line_immutability(),public.refresh_booking_cart_status(uuid),public.create_rejection_refund(public.booking_lines,public.refund_obligation_reason),public.add_quote_to_cart(uuid,uuid,jsonb),public.remove_open_cart_line(uuid),public.submit_booking_cart(uuid),public.record_trusted_cart_payment(uuid,text,timestamptz,text),public.decide_booking_line(uuid,text,text,jsonb),public.cancel_booking_line(uuid),public.add_booking_admin_note(uuid,text),public.send_booking_review_reminders(timestamptz,integer),public.expire_booking_review_deadlines(timestamptz,integer) from public;
grant execute on function public.add_quote_to_cart(uuid,uuid,jsonb),public.remove_open_cart_line(uuid),public.submit_booking_cart(uuid),public.decide_booking_line(uuid,text,text,jsonb),public.cancel_booking_line(uuid),public.add_booking_admin_note(uuid,text) to authenticated,service_role;
grant execute on function public.record_trusted_cart_payment(uuid,text,timestamptz,text),public.send_booking_review_reminders(timestamptz,integer),public.expire_booking_review_deadlines(timestamptz,integer) to service_role;

comment on table public.booking_carts is 'One upfront-payment group. Membership becomes immutable at submission; additions use a new open cart.';
comment on table public.booking_lines is 'Immutable quote, service and creative snapshots. Paid-pending lines reserve no capacity.';
comment on table public.booking_allocations is 'Capacity written only by the atomic admin approval transaction and released by a winning cancellation.';
comment on table public.refund_obligations is 'Manual refund work only. Phase 4 creates obligations and never moves money.';

notify pgrst, 'reload schema';
