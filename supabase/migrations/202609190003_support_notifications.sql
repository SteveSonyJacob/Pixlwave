do $$ begin
  create type public.support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_channel as enum ('in_app', 'email', 'sms');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_delivery_status as enum ('queued', 'sent', 'delivered', 'failed', 'bounced', 'suppressed');
exception when duplicate_object then null;
end $$;

create table if not exists public.support_tickets (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete restrict,
  listing_id uuid references public.inventory_listings(id) on delete restrict,
  booking_reference text check (booking_reference is null or char_length(booking_reference) between 3 and 120),
  subject text not null check (char_length(subject) between 5 and 160),
  status public.support_ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  check ((status = 'resolved' and resolved_at is not null) or status <> 'resolved'),
  check ((status = 'closed' and closed_at is not null) or status <> 'closed')
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete restrict,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 2 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_.-]{2,120}$'),
  recipient_id uuid not null references auth.users(id) on delete restrict,
  channel public.notification_channel not null,
  template_key text not null check (template_key ~ '^[a-z][a-z0-9_.-]{2,120}$'),
  payload jsonb not null default '{}'::jsonb,
  status public.notification_delivery_status not null default 'queued',
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_key, recipient_id, channel),
  check ((status = 'delivered' and delivered_at is not null) or status <> 'delivered')
);

create table if not exists public.notification_provider_events (
  id text primary key check (char_length(id) between 3 and 200),
  provider text not null check (provider = 'resend'),
  provider_message_id text not null,
  event_type text not null check (event_type in ('email.sent','email.delivered','email.delivery_delayed','email.bounced','email.complained','email.failed','email.suppressed')),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_requester on public.support_tickets(requester_id, updated_at desc);
create index if not exists support_tickets_admin_queue on public.support_tickets(status, updated_at desc);
create index if not exists support_messages_thread on public.support_ticket_messages(ticket_id, created_at);
create index if not exists notifications_recipient on public.notification_deliveries(recipient_id, read_at, created_at desc);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();
drop trigger if exists notification_deliveries_set_updated_at on public.notification_deliveries;
create trigger notification_deliveries_set_updated_at before update on public.notification_deliveries
for each row execute function public.set_updated_at();

create or replace function public.enqueue_notification(target_recipient uuid, target_event_key text, target_template_key text, target_payload jsonb)
returns void security definer language plpgsql set search_path = '' as $$
declare email_delivery uuid;
begin
  insert into public.notification_deliveries(event_key,recipient_id,channel,template_key,payload,status,delivered_at)
  values(target_event_key,target_recipient,'in_app',target_template_key,target_payload,'delivered',now())
  on conflict do nothing;
  insert into public.notification_deliveries(event_key,recipient_id,channel,template_key,payload,status)
  values(target_event_key,target_recipient,'email',target_template_key,target_payload,'queued')
  on conflict do nothing returning id into email_delivery;
  if email_delivery is null then
    select id into email_delivery from public.notification_deliveries where event_key=target_event_key and recipient_id=target_recipient and channel='email';
  end if;
  insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload,dedupe_key)
  values('communication.email.requested','notification_delivery',email_delivery,jsonb_build_object('deliveryId',email_delivery),'communication.email/'||email_delivery)
  on conflict(dedupe_key) do nothing;
end;
$$;

create or replace function public.record_resend_delivery_event(provider_event_id text, provider_message text, provider_event text, event_occurred_at timestamptz)
returns boolean security definer language plpgsql set search_path = '' as $$
declare inserted_count integer;
begin
  if provider_event not in ('email.sent','email.delivered','email.delivery_delayed','email.bounced','email.complained','email.failed','email.suppressed') then return false; end if;
  insert into public.notification_provider_events(id,provider,provider_message_id,event_type,occurred_at)
  values(provider_event_id,'resend',provider_message,provider_event,event_occurred_at)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;
  update public.notification_deliveries set
    status = case
      when provider_event='email.delivered' then 'delivered'::public.notification_delivery_status
      when provider_event='email.bounced' then 'bounced'::public.notification_delivery_status
      when provider_event in ('email.complained','email.suppressed') then 'suppressed'::public.notification_delivery_status
      when provider_event='email.failed' then 'failed'::public.notification_delivery_status
      else 'sent'::public.notification_delivery_status end,
    sent_at = case when provider_event in ('email.sent','email.delivered') then coalesce(sent_at,event_occurred_at) else sent_at end,
    delivered_at = case when provider_event='email.delivered' then event_occurred_at else delivered_at end,
    last_error = case when provider_event in ('email.bounced','email.complained','email.failed','email.suppressed') then provider_event else last_error end
  where provider_message_id=provider_message and channel='email';
  return true;
end;
$$;

create or replace function public.create_support_ticket(input jsonb)
returns public.support_tickets
security definer language plpgsql set search_path = '' as $$
declare result public.support_tickets; target_listing uuid; admin_record record;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  target_listing := nullif(input->>'listingId','')::uuid;
  if target_listing is not null and not exists(select 1 from public.inventory_listings l where l.id=target_listing and (l.status='published' or l.owner_id=auth.uid())) then
    raise exception 'listing is not available for this ticket';
  end if;
  insert into public.support_tickets(requester_id,listing_id,booking_reference,subject)
  values(auth.uid(),target_listing,nullif(trim(input->>'bookingReference'),''),trim(input->>'subject')) returning * into result;
  insert into public.support_ticket_messages(ticket_id,author_id,body,is_internal)
  values(result.id,auth.uid(),trim(input->>'message'),false);

  perform public.enqueue_notification(auth.uid(),'support.ticket.created.'||result.id,'support.ticket.created',jsonb_build_object('ticketId',result.id,'subject',result.subject));
  for admin_record in select user_id from public.platform_admins where status='active' loop
    perform public.enqueue_notification(admin_record.user_id,'support.ticket.admin.'||result.id,'support.ticket.admin_new',jsonb_build_object('ticketId',result.id,'subject',result.subject));
  end loop;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata)
  values(auth.uid(),'support.ticket.created','support_ticket',result.id::text,jsonb_build_object('listingId',target_listing));
  return result;
end;
$$;

create or replace function public.reply_support_ticket(target_ticket uuid, message_body text, internal_note boolean default false)
returns public.support_ticket_messages
security definer language plpgsql set search_path = '' as $$
declare ticket public.support_tickets; result public.support_ticket_messages; admin_user boolean; notification_recipient uuid; admin_record record;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  admin_user := public.is_admin_aal2();
  select * into ticket from public.support_tickets where id=target_ticket;
  if ticket.id is null or (ticket.requester_id<>auth.uid() and not admin_user) then raise exception 'ticket not found' using errcode='42501'; end if;
  if ticket.status='closed' then raise exception 'closed tickets cannot receive replies'; end if;
  if internal_note and not admin_user then raise exception 'internal notes require administrator AAL2' using errcode='42501'; end if;
  insert into public.support_ticket_messages(ticket_id,author_id,body,is_internal)
  values(ticket.id,auth.uid(),trim(message_body),internal_note) returning * into result;
  update public.support_tickets set status=case when admin_user and status='open' then 'in_progress'::public.support_ticket_status else status end where id=ticket.id;
  if not internal_note then
    notification_recipient := case when admin_user then ticket.requester_id else null end;
    if notification_recipient is not null then
      perform public.enqueue_notification(notification_recipient,'support.reply.'||result.id,'support.ticket.reply',jsonb_build_object('ticketId',ticket.id,'subject',ticket.subject));
    else
      for admin_record in select user_id from public.platform_admins where status='active' loop
        perform public.enqueue_notification(admin_record.user_id,'support.reply.admin.'||result.id,'support.ticket.admin_reply',jsonb_build_object('ticketId',ticket.id,'subject',ticket.subject));
      end loop;
    end if;
  end if;
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata)
  values(auth.uid(),case when internal_note then 'support.ticket.internal_note' else 'support.ticket.reply' end,'support_ticket',ticket.id::text,jsonb_build_object('messageId',result.id));
  return result;
end;
$$;

create or replace function public.set_support_ticket_status(target_ticket uuid, next_status public.support_ticket_status)
returns public.support_tickets
security definer language plpgsql set search_path = '' as $$
declare result public.support_tickets;
begin
  if not public.is_admin_aal2() then raise exception 'administrator AAL2 required' using errcode='42501'; end if;
  update public.support_tickets set status=next_status,
    resolved_at=case when next_status='resolved' then now() else resolved_at end,
    closed_at=case when next_status='closed' then now() else closed_at end
  where id=target_ticket returning * into result;
  if result.id is null then raise exception 'ticket not found'; end if;
  perform public.enqueue_notification(result.requester_id,'support.status.'||result.id||'.'||next_status,'support.ticket.status',jsonb_build_object('ticketId',result.id,'subject',result.subject,'status',next_status));
  insert into public.audit_log(actor_id,action,subject_type,subject_id,metadata)
  values(auth.uid(),'support.ticket.status_changed','support_ticket',result.id::text,jsonb_build_object('status',next_status));
  return result;
end;
$$;

create or replace function public.mark_notification_read(target_notification uuid)
returns void security definer language plpgsql set search_path = '' as $$
begin
  update public.notification_deliveries set read_at=coalesce(read_at,now()) where id=target_notification and recipient_id=auth.uid() and channel='in_app';
end;
$$;

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_provider_events enable row level security;
create policy support_tickets_scoped_read on public.support_tickets for select to authenticated using(requester_id=auth.uid() or public.is_admin_aal2());
create policy support_messages_scoped_read on public.support_ticket_messages for select to authenticated using(
  exists(select 1 from public.support_tickets t where t.id=ticket_id and ((t.requester_id=auth.uid() and not is_internal) or public.is_admin_aal2()))
);
create policy notifications_recipient_read on public.notification_deliveries for select to authenticated using(recipient_id=auth.uid() or public.is_admin_aal2());

revoke all on public.support_tickets,public.support_ticket_messages,public.notification_deliveries,public.notification_provider_events from anon,authenticated;
grant select on public.support_tickets,public.support_ticket_messages,public.notification_deliveries to authenticated;
grant all on public.support_tickets,public.support_ticket_messages,public.notification_deliveries,public.notification_provider_events to service_role;
revoke all on function public.create_support_ticket(jsonb),public.reply_support_ticket(uuid,text,boolean),public.set_support_ticket_status(uuid,public.support_ticket_status),public.mark_notification_read(uuid) from public;
grant execute on function public.create_support_ticket(jsonb),public.reply_support_ticket(uuid,text,boolean),public.set_support_ticket_status(uuid,public.support_ticket_status),public.mark_notification_read(uuid) to authenticated,service_role;
revoke all on function public.enqueue_notification(uuid,text,text,jsonb),public.record_resend_delivery_event(text,text,text,timestamptz) from public;
grant execute on function public.record_resend_delivery_event(text,text,text,timestamptz) to service_role;

comment on table public.support_ticket_messages is 'Ticket replies. Internal notes are visible only to AAL2 administrators and are never routed to owners or requesters.';
comment on table public.notification_deliveries is 'Per-recipient, per-channel delivery ledger. Delivery status is independent of booking or campaign state.';
