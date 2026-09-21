begin;

update public.inventory_listings
set location_provider = 'openstreetmap'
where location_provider in ('mappls', 'google');

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select constraint_row.conname
    from pg_constraint constraint_row
    join pg_class table_row on table_row.oid = constraint_row.conrelid
    join pg_namespace schema_row on schema_row.oid = table_row.relnamespace
    where schema_row.nspname = 'public'
      and table_row.relname = 'inventory_listings'
      and pg_get_constraintdef(constraint_row.oid) ilike '%location_provider%'
  loop
    execute format('alter table public.inventory_listings drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.inventory_listings
  add constraint inventory_listings_location_provider_check
  check (location_provider in ('openstreetmap', 'manual'));

commit;
