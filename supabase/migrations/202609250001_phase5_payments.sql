-- Phase 5: one gateway order per submitted cart, captured-money journal and manual refund evidence.
create table public.payment_orders (
  cart_id uuid primary key references public.booking_carts(id) on delete restrict,
  advertiser_id uuid not null references auth.users(id) on delete restrict,
  amount_paise bigint not null check(amount_paise > 0),
  currency text not null default 'INR' check(currency='INR'),
  provider_order_id text unique,
  receipt text not null unique,
  state text not null default 'creating' check(state in ('creating','ready','captured','exception')),
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  check((state='creating' and provider_order_id is null) or (state<>'creating' and provider_order_id is not null))
);

create table public.payment_captures (
  provider_payment_id text primary key,
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  provider_order_id text not null,
  amount_paise bigint not null check(amount_paise > 0),
  currency text not null check(char_length(currency)=3),
  captured_at timestamptz not null,
  provider_fee_paise bigint check(provider_fee_paise >= 0),
  provider_tax_paise bigint check(provider_tax_paise >= 0),
  outcome text not null check(outcome in ('allocated','exception')),
  reason text,
  recorded_at timestamptz not null default now()
);
create unique index payment_one_allocated_capture_per_cart on public.payment_captures(cart_id) where outcome='allocated';

create table public.payment_line_allocations (
  provider_payment_id text not null references public.payment_captures(provider_payment_id) on delete restrict,
  booking_line_id uuid not null references public.booking_lines(id) on delete restrict,
  amount_paise bigint not null check(amount_paise > 0),
  commission_bps integer not null default 1500 check(commission_bps=1500),
  provider_fee_paise bigint check(provider_fee_paise >= 0),
  primary key(provider_payment_id,booking_line_id)
);

create table public.payment_exceptions (
  provider_payment_id text primary key references public.payment_captures(provider_payment_id) on delete restrict,
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  reason text not null,
  status text not null default 'pending_manual' check(status in ('pending_manual','resolved')),
  created_at timestamptz not null default now()
);

create table public.payment_webhook_events (
  provider_event_id text primary key,
  event_type text not null,
  provider_payment_id text,
  received_at timestamptz not null default now()
);

create table public.payment_failed_attempts (
  provider_payment_id text primary key,
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  provider_order_id text not null,
  failed_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create table public.payment_reconciliation_alerts (
  provider_payment_id text primary key,
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  provider_order_id text not null,
  amount_paise bigint not null check(amount_paise > 0),
  status text not null default 'missing_webhook' check(status in ('missing_webhook','event_received')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.refund_obligations drop constraint if exists refund_obligations_status_check;
alter table public.refund_obligations add constraint refund_obligations_status_check check(status in ('pending_manual','refunded'));

create table public.manual_refund_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  cart_id uuid not null references public.booking_carts(id) on delete restrict,
  provider_payment_id text not null references public.payment_captures(provider_payment_id) on delete restrict,
  provider_refund_id text not null unique,
  amount_paise bigint not null check(amount_paise > 0),
  currency text not null default 'INR' check(currency='INR'),
  evidence text not null check(char_length(evidence) between 8 and 2000),
  completed_at timestamptz not null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now()
);
create table public.manual_refund_allocations (
  transaction_id uuid not null references public.manual_refund_transactions(id) on delete restrict,
  obligation_id uuid not null unique references public.refund_obligations(id) on delete restrict,
  amount_paise bigint not null check(amount_paise > 0),
  primary key(transaction_id,obligation_id)
);

create or replace function public.protect_payment_capture_snapshot()
returns trigger security definer language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'captured payment records cannot be deleted'; end if;
  if new.provider_payment_id<>old.provider_payment_id or new.cart_id<>old.cart_id or new.provider_order_id<>old.provider_order_id
    or new.amount_paise<>old.amount_paise or new.currency<>old.currency or new.captured_at<>old.captured_at
    or new.outcome<>old.outcome or new.reason is distinct from old.reason or new.recorded_at<>old.recorded_at
    or (old.provider_fee_paise is not null and new.provider_fee_paise is distinct from old.provider_fee_paise)
    or (old.provider_tax_paise is not null and new.provider_tax_paise is distinct from old.provider_tax_paise) then
    raise exception 'captured payment snapshot is immutable';
  end if;
  return new;
end;
$$;
create trigger payment_capture_snapshot before update or delete on public.payment_captures
for each row execute function public.protect_payment_capture_snapshot();

create or replace function public.protect_payment_line_snapshot()
returns trigger security definer language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'payment line allocations cannot be deleted'; end if;
  if new.provider_payment_id<>old.provider_payment_id or new.booking_line_id<>old.booking_line_id
    or new.amount_paise<>old.amount_paise or new.commission_bps<>old.commission_bps
    or (old.provider_fee_paise is not null and new.provider_fee_paise is distinct from old.provider_fee_paise) then
    raise exception 'payment line allocation is immutable';
  end if;
  return new;
end;
$$;
create trigger payment_line_snapshot before update or delete on public.payment_line_allocations
for each row execute function public.protect_payment_line_snapshot();

create or replace function public.reject_manual_refund_change()
returns trigger security definer language plpgsql set search_path='' as $$
begin
  raise exception 'completed refund records are append-only';
end;
$$;
create trigger manual_refund_transaction_append_only before update or delete on public.manual_refund_transactions
for each row execute function public.reject_manual_refund_change();
create trigger manual_refund_allocation_append_only before update or delete on public.manual_refund_allocations
for each row execute function public.reject_manual_refund_change();

create or replace function public.apply_known_gateway_fee_to_refund()
returns trigger security definer language plpgsql set search_path='' as $$
declare actual_fee bigint;
begin
  if new.reason='advertiser_cancelled' then return new; end if;
  select a.provider_fee_paise into actual_fee from public.payment_line_allocations a
  join public.payment_captures c on c.provider_payment_id=a.provider_payment_id
  where a.booking_line_id=new.booking_line_id and c.outcome='allocated';
  if actual_fee is not null then
    new.processing_charge_paise:=actual_fee;
    new.refund_amount_paise:=new.gross_amount_paise-actual_fee;
  end if;
  return new;
end;
$$;
create trigger refund_apply_known_gateway_fee before insert on public.refund_obligations
for each row execute function public.apply_known_gateway_fee_to_refund();

create or replace function public.claim_cart_payment_order(target_cart uuid)
returns jsonb security definer language plpgsql set search_path='' as $$
declare cart public.booking_carts; result public.payment_orders; created boolean := false;
begin
  select * into cart from public.booking_carts where id=target_cart for update;
  if cart.id is null or cart.status<>'submitted' or cart.total_amount_paise<=0 or cart.checkout_expires_at<=now() then
    raise exception 'submitted checkout is unavailable or expired';
  end if;
  if (select coalesce(sum(paid_amount_paise),0) from public.booking_lines where cart_id=cart.id and status='draft')<>cart.total_amount_paise then
    raise exception 'frozen booking lines do not match the cart total';
  end if;
  if exists(select 1 from public.booking_lines l cross join lateral jsonb_array_elements(l.service_windows) as service_window(value)
    where l.cart_id=cart.id and (service_window.value->>'startsAt')::timestamptz<now()+interval '192 hours') then
    raise exception 'checkout can no longer meet the 192-hour payment notice';
  end if;
  insert into public.payment_orders(cart_id,advertiser_id,amount_paise,receipt)
  values(cart.id,cart.advertiser_id,cart.total_amount_paise,'pw-'||replace(cart.id::text,'-',''))
  on conflict(cart_id) do nothing returning * into result;
  if result.cart_id is not null then created:=true;
  else select * into result from public.payment_orders where cart_id=target_cart; end if;
  return jsonb_build_object('order',to_jsonb(result),'created',created);
end;
$$;

create or replace function public.attach_cart_payment_order(target_cart uuid, provider_id text, provider_amount bigint, provider_currency text, provider_receipt text)
returns public.payment_orders security definer language plpgsql set search_path='' as $$
declare result public.payment_orders;
begin
  select * into result from public.payment_orders where cart_id=target_cart for update;
  if result.cart_id is null or result.state<>'creating' or provider_id !~ '^order_[A-Za-z0-9]+$'
    or result.amount_paise<>provider_amount or provider_currency<>'INR' or result.receipt<>provider_receipt then
    raise exception 'gateway order does not match the frozen cart';
  end if;
  update public.payment_orders set provider_order_id=provider_id,state='ready',ready_at=now() where cart_id=target_cart returning * into result;
  return result;
end;
$$;

create or replace function public.note_missing_capture_webhook(order_id text, payment_id text, amount bigint, payment_currency text)
returns void security definer language plpgsql set search_path='' as $$
declare ord public.payment_orders;
begin
  select * into ord from public.payment_orders where provider_order_id=order_id for update;
  if ord.cart_id is null or payment_id !~ '^pay_[A-Za-z0-9]+$' or amount<=0 or payment_currency<>'INR' then
    raise exception 'invalid provider reconciliation result';
  end if;
  if exists(select 1 from public.payment_captures where provider_payment_id=payment_id) then return; end if;
  insert into public.payment_reconciliation_alerts(provider_payment_id,cart_id,provider_order_id,amount_paise)
  values(payment_id,ord.cart_id,order_id,amount) on conflict(provider_payment_id) do nothing;
end;
$$;

create or replace function public.record_razorpay_failure(event_id text, payment_id text, order_id text, event_time timestamptz)
returns text security definer language plpgsql set search_path='' as $$
declare ord public.payment_orders;
begin
  if event_id is null or char_length(event_id)<8 or payment_id !~ '^pay_[A-Za-z0-9]+$' or event_time>now()+interval '5 minutes' then
    raise exception 'invalid failed payment metadata';
  end if;
  insert into public.payment_webhook_events(provider_event_id,event_type,provider_payment_id)
  values(event_id,'payment.failed',payment_id) on conflict do nothing;
  if not found then return 'duplicate_event'; end if;
  select * into ord from public.payment_orders where provider_order_id=order_id for update;
  if ord.cart_id is null then raise exception 'unknown gateway order'; end if;
  insert into public.payment_failed_attempts(provider_payment_id,cart_id,provider_order_id,failed_at)
  values(payment_id,ord.cart_id,order_id,event_time) on conflict(provider_payment_id) do nothing;
  return 'failed';
end;
$$;

create or replace function public.record_razorpay_capture(event_id text, payment_id text, order_id text, amount bigint, payment_currency text, event_time timestamptz, fee bigint default null, tax bigint default null)
returns text security definer language plpgsql set search_path='' as $$
declare ord public.payment_orders; cart public.booking_carts; outcome text; reason text;
begin
  if event_id is null or char_length(event_id)<8 or payment_id !~ '^pay_[A-Za-z0-9]+$' or event_time>now()+interval '5 minutes'
    or amount<=0 or fee<0 or tax<0 then raise exception 'invalid captured payment metadata'; end if;
  insert into public.payment_webhook_events(provider_event_id,event_type,provider_payment_id)
  values(event_id,'payment.captured',payment_id) on conflict do nothing;
  if not found then return 'duplicate_event'; end if;
  select * into ord from public.payment_orders where provider_order_id=order_id;
  if ord.cart_id is null then raise exception 'unknown gateway order'; end if;
  select * into cart from public.booking_carts where id=ord.cart_id for update;
  select * into ord from public.payment_orders where cart_id=cart.id for update;
  if exists(select 1 from public.payment_captures where provider_payment_id=payment_id) then return 'duplicate_payment'; end if;
  if ord.amount_paise<>amount or payment_currency<>'INR' then
    outcome:='exception'; reason:='Captured amount or currency differs from the server-priced order.';
  elsif cart.status<>'submitted' or exists(select 1 from public.payment_captures where cart_id=ord.cart_id and outcome='allocated') then
    outcome:='exception'; reason:='Extra capture or checkout already funded.';
  else outcome:='allocated'; end if;
  insert into public.payment_captures(provider_payment_id,cart_id,provider_order_id,amount_paise,currency,captured_at,provider_fee_paise,provider_tax_paise,outcome,reason)
  values(payment_id,ord.cart_id,order_id,amount,payment_currency,event_time,fee,tax,outcome,reason);
  update public.payment_reconciliation_alerts set status='event_received',resolved_at=now()
  where provider_payment_id=payment_id and status='missing_webhook';
  if outcome='exception' then
    insert into public.payment_exceptions(provider_payment_id,cart_id,reason) values(payment_id,ord.cart_id,reason);
    update public.payment_orders set state='exception' where cart_id=ord.cart_id and state='ready';
    return outcome;
  end if;
  insert into public.payment_line_allocations(provider_payment_id,booking_line_id,amount_paise)
  select payment_id,id,paid_amount_paise from public.booking_lines where cart_id=ord.cart_id and status='draft';
  if (select coalesce(sum(amount_paise),0) from public.payment_line_allocations where provider_payment_id=payment_id)<>amount then
    raise exception 'booking line allocation does not equal capture';
  end if;
  perform public.record_trusted_cart_payment(ord.cart_id,payment_id,event_time,'razorpay');
  update public.payment_orders set state='captured' where cart_id=ord.cart_id;
  if fee is not null then perform public.sync_razorpay_fee(payment_id,fee,tax); end if;
  return outcome;
end;
$$;

create or replace function public.sync_razorpay_fee(payment_id text, fee bigint, tax bigint)
returns void security definer language plpgsql set search_path='' as $$
declare cap public.payment_captures;
begin
  select * into cap from public.payment_captures where provider_payment_id=payment_id and outcome='allocated' for update;
  if cap.provider_payment_id is null or fee is null or fee<0 or tax<0 then raise exception 'invalid provider processing charge'; end if;
  if cap.provider_fee_paise is not null and cap.provider_fee_paise<>fee then raise exception 'provider fee changed; reconcile manually'; end if;
  if cap.provider_tax_paise is not null and cap.provider_tax_paise<>tax then raise exception 'provider tax changed; reconcile manually'; end if;
  if exists(select 1 from public.manual_refund_allocations a join public.refund_obligations r on r.id=a.obligation_id where r.cart_id=cap.cart_id) then
    raise exception 'completed refunds prevent fee changes';
  end if;
  update public.payment_captures set provider_fee_paise=fee,provider_tax_paise=tax where provider_payment_id=payment_id;
  with apportioned as (
    select a.booking_line_id,
      floor(fee::numeric*a.amount_paise/cap.amount_paise)::bigint as base_fee,
      row_number() over(order by a.booking_line_id) as rank
    from public.payment_line_allocations a where a.provider_payment_id=payment_id
  ), total as (select fee-sum(base_fee) as remainder from apportioned)
  update public.payment_line_allocations a set provider_fee_paise=x.base_fee+case when x.rank<=(select remainder from total) then 1 else 0 end
  from apportioned x where a.provider_payment_id=payment_id and a.booking_line_id=x.booking_line_id;
  update public.refund_obligations r set processing_charge_paise=a.provider_fee_paise,
    refund_amount_paise=r.gross_amount_paise-a.provider_fee_paise
  from public.payment_line_allocations a
  where a.provider_payment_id=payment_id and a.booking_line_id=r.booking_line_id
    and r.reason<>'advertiser_cancelled' and r.status='pending_manual';
end;
$$;

create or replace function public.record_manual_gateway_refund(target_cart uuid, refund_id text, payment_id text, refunded_amount bigint, completed_time timestamptz, proof text, obligation_ids uuid[], operator_id uuid)
returns public.manual_refund_transactions security definer language plpgsql set search_path='' as $$
declare result public.manual_refund_transactions; cap public.payment_captures; selected_count integer; selected_sum bigint; expected_count integer;
begin
  if not exists(select 1 from public.platform_admins where user_id=operator_id and status='active') then raise exception 'active administrator required' using errcode='42501'; end if;
  if refund_id !~ '^rfnd_[A-Za-z0-9]+$' or char_length(trim(proof))<8 or completed_time>now()+interval '5 minutes'
    or refunded_amount<=0 or obligation_ids is null or array_length(obligation_ids,1) is null then raise exception 'completed refund evidence is incomplete'; end if;
  select * into cap from public.payment_captures where provider_payment_id=payment_id and cart_id=target_cart and outcome='allocated' for update;
  if cap.provider_payment_id is null or cap.provider_fee_paise is null then raise exception 'captured payment and actual gateway fee must be reconciled first'; end if;
  if completed_time<cap.captured_at then raise exception 'refund completion precedes the captured payment'; end if;
  perform 1 from public.refund_obligations where id=any(obligation_ids) and cart_id=target_cart for update;
  select count(*),coalesce(sum(refund_amount_paise),0) into selected_count,selected_sum
  from public.refund_obligations where id=any(obligation_ids) and cart_id=target_cart and status='pending_manual';
  expected_count:=array_length(obligation_ids,1);
  if selected_count<>expected_count or selected_sum<>refunded_amount or refunded_amount>cap.amount_paise then raise exception 'refund allocations do not match the completed transaction'; end if;
  insert into public.manual_refund_transactions(cart_id,provider_payment_id,provider_refund_id,amount_paise,evidence,completed_at,recorded_by)
  values(target_cart,payment_id,refund_id,refunded_amount,trim(proof),completed_time,operator_id) returning * into result;
  insert into public.manual_refund_allocations(transaction_id,obligation_id,amount_paise)
  select result.id,id,refund_amount_paise from public.refund_obligations where id=any(obligation_ids);
  update public.refund_obligations set status='refunded' where id=any(obligation_ids);
  perform public.enqueue_notification((select advertiser_id from public.booking_carts where id=target_cart),
    'refund.completed.'||result.id,'refund.completed',
    jsonb_build_object('cartId',target_cart,'refundTransactionId',result.id,'refundReference',refund_id,'amountPaise',refunded_amount));
  return result;
end;
$$;

alter table public.payment_orders enable row level security;
alter table public.payment_captures enable row level security;
alter table public.payment_line_allocations enable row level security;
alter table public.payment_exceptions enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.payment_failed_attempts enable row level security;
alter table public.payment_reconciliation_alerts enable row level security;
alter table public.manual_refund_transactions enable row level security;
alter table public.manual_refund_allocations enable row level security;
create policy payment_orders_read on public.payment_orders for select to authenticated using(advertiser_id=auth.uid() or public.is_admin_aal2());
create policy payment_captures_read on public.payment_captures for select to authenticated using(exists(select 1 from public.booking_carts c where c.id=cart_id and c.advertiser_id=auth.uid()) or public.is_admin_aal2());
create policy payment_allocations_read on public.payment_line_allocations for select to authenticated using(exists(select 1 from public.booking_lines l where l.id=booking_line_id and l.advertiser_id=auth.uid()) or public.is_admin_aal2());
create policy payment_exceptions_admin on public.payment_exceptions for select to authenticated using(public.is_admin_aal2());
create policy payment_reconciliation_admin on public.payment_reconciliation_alerts for select to authenticated using(public.is_admin_aal2());
create policy manual_refunds_read on public.manual_refund_transactions for select to authenticated using(exists(select 1 from public.booking_carts c where c.id=cart_id and c.advertiser_id=auth.uid()) or public.is_admin_aal2());
create policy manual_refund_allocations_read on public.manual_refund_allocations for select to authenticated using(exists(select 1 from public.manual_refund_transactions t join public.booking_carts c on c.id=t.cart_id where t.id=transaction_id and c.advertiser_id=auth.uid()) or public.is_admin_aal2());
revoke all on public.payment_orders,public.payment_captures,public.payment_line_allocations,public.payment_exceptions,public.payment_webhook_events,public.payment_failed_attempts,public.payment_reconciliation_alerts,public.manual_refund_transactions,public.manual_refund_allocations from public,anon,authenticated;
grant select on public.payment_orders,public.payment_captures,public.payment_line_allocations,public.payment_exceptions,public.payment_reconciliation_alerts,public.manual_refund_transactions,public.manual_refund_allocations to authenticated;
grant all on public.payment_orders,public.payment_captures,public.payment_line_allocations,public.payment_exceptions,public.payment_webhook_events,public.payment_failed_attempts,public.payment_reconciliation_alerts,public.manual_refund_transactions,public.manual_refund_allocations to service_role;
revoke all on function public.protect_payment_capture_snapshot(),public.protect_payment_line_snapshot(),public.reject_manual_refund_change(),public.apply_known_gateway_fee_to_refund(),public.claim_cart_payment_order(uuid),public.attach_cart_payment_order(uuid,text,bigint,text,text),public.note_missing_capture_webhook(text,text,bigint,text),public.record_razorpay_failure(text,text,text,timestamptz),public.record_razorpay_capture(text,text,text,bigint,text,timestamptz,bigint,bigint),public.sync_razorpay_fee(text,bigint,bigint),public.record_manual_gateway_refund(uuid,text,text,bigint,timestamptz,text,uuid[],uuid) from public;
grant execute on function public.claim_cart_payment_order(uuid),public.attach_cart_payment_order(uuid,text,bigint,text,text),public.note_missing_capture_webhook(text,text,bigint,text),public.record_razorpay_failure(text,text,text,timestamptz),public.record_razorpay_capture(text,text,text,bigint,text,timestamptz,bigint,bigint),public.sync_razorpay_fee(text,bigint,bigint),public.record_manual_gateway_refund(uuid,text,text,bigint,timestamptz,text,uuid[],uuid) to service_role;
