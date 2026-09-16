do $$ begin
  create type public.outbox_status as enum ('available', 'processing', 'completed', 'dead');
exception when duplicate_object then null;
end $$;

create table if not exists public.outbox_events (
  id uuid primary key default extensions.gen_random_uuid(),
  topic text not null check (topic ~ '^[a-z][a-z0-9_.-]{2,100}$'),
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status public.outbox_status not null default 'available',
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 8 check (max_attempts between 1 and 50),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  processed_at timestamptz,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  check ((status = 'completed' and processed_at is not null) or status <> 'completed')
);

create index if not exists outbox_available_work on public.outbox_events (available_at, created_at)
where status = 'available';
create index if not exists outbox_stale_locks on public.outbox_events (locked_at)
where status = 'processing';

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id text not null,
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'audit records are append-only' using errcode = '42501'; end;
$$;

drop trigger if exists audit_log_immutable on public.audit_log;
create trigger audit_log_immutable before update or delete on public.audit_log
for each row execute function public.prevent_audit_mutation();

alter table public.outbox_events enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log for select to authenticated using (public.is_admin_aal2());

revoke all on public.outbox_events from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;
grant all on public.outbox_events to service_role;
grant all on public.audit_log to service_role;
grant select on public.audit_log to authenticated;

comment on table public.outbox_events is 'Durable, deduplicated application events. Workers may notify or schedule but never move refund or payout money.';
comment on table public.audit_log is 'Append-only privileged action evidence; secrets and raw personal data are forbidden in metadata.';
