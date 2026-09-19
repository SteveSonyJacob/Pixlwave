-- Phase 3 extends the Phase 2 private-media pipeline with listing photography.
-- PostgreSQL requires a newly-added enum value to be committed before it is used,
-- so this intentionally lives in its own migration.
alter type public.private_media_purpose add value if not exists 'listing_media';

-- Phase 2 already scoped these rows to published listings for anon users, but did
-- not grant anon SELECT. Public availability calendars need both protections.
grant select on public.listing_blackouts, public.theatre_show_instances to anon;
