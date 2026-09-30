import pg from "pg";
import { readFile } from "node:fs/promises";

process.loadEnvFile(".env.local");
const versions = ["202609280002_resumable_creatives.sql", "202609280003_payment_capture_outcome_fix.sql"];
const direct = new URL(process.env.DATABASE_URL);
const projectRef = direct.hostname.startsWith("db.") ? direct.hostname.split(".")[1] : null;
if (!projectRef || !direct.hostname.endsWith(".supabase.co")) throw new Error("Refusing deployment: DATABASE_URL is not a linked Supabase database.");
const database = new URL(direct);
database.hostname = "aws-0-ap-south-1.pooler.supabase.com";
database.port = "5432";
database.username = `postgres.${projectRef}`;
const pool = new pg.Pool({ connectionString: database.href, max: 1, connectionTimeoutMillis: 10_000 });
try {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(928004)");
    const prior = await client.query("select 1 from public.pixlwave_schema_migrations where version='202609280001_listing_revisions_resumable_media.sql'");
    if (!prior.rowCount) throw new Error("Required FP02 resumable-media migration is not deployed.");
    for (const version of versions) {
      const applied = await client.query("select 1 from public.pixlwave_schema_migrations where version=$1", [version]);
      if (applied.rowCount) continue;
      await client.query(await readFile(new URL(`../supabase/migrations/${version}`, import.meta.url), "utf8"));
      await client.query("insert into public.pixlwave_schema_migrations(version) values($1)", [version]);
    }
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; }
  finally { client.release(); }
  const state = (await pool.query(`select
    (select is_nullable='YES' from information_schema.columns where table_schema='public' and table_name='media_upload_sessions' and column_name='listing_id') as creative_target,
    (select relrowsecurity from pg_class where oid='public.media_upload_sessions'::regclass) as session_rls,
    has_function_privilege('anon','public.finalize_private_upload(uuid,uuid,jsonb)','execute') as anon_finalize,
    has_function_privilege('authenticated','public.finalize_private_upload(uuid,uuid,jsonb)','execute') as browser_finalize,
    has_function_privilege('service_role','public.finalize_private_upload(uuid,uuid,jsonb)','execute') as server_finalize,
    position('capture_outcome' in pg_get_functiondef('public.record_razorpay_capture(text,text,text,bigint,text,timestamptz,bigint,bigint)'::regprocedure))>0 as capture_fix
  `)).rows[0];
  if (!state.creative_target || !state.session_rls || state.anon_finalize || state.browser_finalize || !state.server_finalize || !state.capture_fix) throw new Error("Unexpected upload/payment deployment security state.");
  console.log("Approved FP04/FP05 migrations deployed and verified: private upload sessions, service-only atomic finalization, payment capture correction.");
} finally { await pool.end(); }
