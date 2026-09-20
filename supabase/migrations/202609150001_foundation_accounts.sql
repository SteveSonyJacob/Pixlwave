create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.account_mode as enum ('advertiser', 'owner');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.admin_status as enum ('active', 'suspended');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  business_name text check (business_name is null or char_length(business_name) <= 160),
  selected_mode public.account_mode not null default 'advertiser',
  advertiser_enabled boolean not null default true,
  owner_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  status public.admin_status not null default 'active',
  mfa_required boolean not null default true check (mfa_required),
  granted_by uuid references auth.users(id) on delete restrict,
  granted_at timestamptz not null default now(),
  suspended_at timestamptz,
  check ((status = 'active' and suspended_at is null) or status = 'suspended')
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger security definer language plpgsql set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'business_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_platform_admin(subject uuid default auth.uid())
returns boolean stable security definer language sql set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = subject and status = 'active' and mfa_required = true
  );
$$;

create or replace function public.is_admin_aal2(subject uuid default auth.uid())
returns boolean stable security definer language sql set search_path = '' as $$
  select public.is_platform_admin(subject) and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.select_account_mode(requested_mode public.account_mode)
returns public.account_mode security definer language plpgsql set search_path = '' as $$
declare selected public.account_mode;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  update public.profiles
  set selected_mode = requested_mode
  where id = auth.uid()
    and ((requested_mode = 'advertiser' and advertiser_enabled) or (requested_mode = 'owner' and owner_enabled))
  returning selected_mode into selected;
  if selected is null then raise exception 'account mode is not enabled' using errcode = '42501'; end if;
  return selected;
end;
$$;

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin_aal2());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists admins_read_self_or_admin on public.platform_admins;
create policy admins_read_self_or_admin on public.platform_admins for select to authenticated
using (user_id = auth.uid() or public.is_admin_aal2());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, business_name) on public.profiles to authenticated;
grant all on public.profiles to service_role;

revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to authenticated;
grant all on public.platform_admins to service_role;

revoke all on function public.select_account_mode(public.account_mode) from public;
grant execute on function public.select_account_mode(public.account_mode) to authenticated, service_role;
revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated, service_role;
revoke all on function public.is_admin_aal2(uuid) from public;
grant execute on function public.is_admin_aal2(uuid) to authenticated, service_role;

comment on table public.platform_admins is 'Separately provisioned platform privilege. Never derived from advertiser/owner mode or user metadata.';
comment on function public.select_account_mode(public.account_mode) is 'Switches an individual between enabled advertiser and owner modes without granting admin authority.';
