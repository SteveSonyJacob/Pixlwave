-- Auth-capable fixture users are created through `npm run seed:auth` so the script
-- remains compatible with the Auth schema managed by the pinned Supabase release.
-- This harmless event exercises the durable worker after local startup.
insert into public.outbox_events (topic, aggregate_type, aggregate_id, payload, dedupe_key)
values ('foundation.healthcheck', 'system', '00000000-0000-0000-0000-000000000000', '{"source":"supabase-seed"}', 'seed:foundation-healthcheck')
on conflict (dedupe_key) do nothing;
