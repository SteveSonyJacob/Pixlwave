create or replace function public.record_razorpay_capture(event_id text, payment_id text, order_id text, amount bigint, payment_currency text, event_time timestamptz, fee bigint default null, tax bigint default null)
returns text security definer language plpgsql set search_path='' as $$
declare ord public.payment_orders; cart public.booking_carts; capture_outcome text; capture_reason text;
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
    capture_outcome:='exception'; capture_reason:='Captured amount or currency differs from the server-priced order.';
  elsif cart.status<>'submitted' or exists(select 1 from public.payment_captures c where c.cart_id=ord.cart_id and c.outcome='allocated') then
    capture_outcome:='exception'; capture_reason:='Extra capture or checkout already funded.';
  else capture_outcome:='allocated'; end if;
  insert into public.payment_captures(provider_payment_id,cart_id,provider_order_id,amount_paise,currency,captured_at,provider_fee_paise,provider_tax_paise,outcome,reason)
  values(payment_id,ord.cart_id,order_id,amount,payment_currency,event_time,fee,tax,capture_outcome,capture_reason);
  update public.payment_reconciliation_alerts set status='event_received',resolved_at=now()
  where provider_payment_id=payment_id and status='missing_webhook';
  if capture_outcome='exception' then
    insert into public.payment_exceptions(provider_payment_id,cart_id,reason) values(payment_id,ord.cart_id,capture_reason);
    update public.payment_orders set state='exception' where cart_id=ord.cart_id and state='ready';
    return capture_outcome;
  end if;
  insert into public.payment_line_allocations(provider_payment_id,booking_line_id,amount_paise)
  select payment_id,id,paid_amount_paise from public.booking_lines where cart_id=ord.cart_id and status='draft';
  if (select coalesce(sum(amount_paise),0) from public.payment_line_allocations where provider_payment_id=payment_id)<>amount then
    raise exception 'booking line allocation does not equal capture';
  end if;
  perform public.record_trusted_cart_payment(ord.cart_id,payment_id,event_time,'razorpay');
  update public.payment_orders set state='captured' where cart_id=ord.cart_id;
  if fee is not null then perform public.sync_razorpay_fee(payment_id,fee,tax); end if;
  return capture_outcome;
end;
$$;
