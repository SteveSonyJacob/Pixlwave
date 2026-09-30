import pg from "pg";
import { readFile } from "node:fs/promises";

process.loadEnvFile(".env.local");
const version = "202609280001_listing_revisions_resumable_media.sql";
const direct = new URL(process.env.DATABASE_URL);
const projectRef = direct.hostname.startsWith("db.") ? direct.hostname.split(".")[1] : null;
if (!projectRef || !direct.hostname.endsWith(".supabase.co")) throw new Error("Refusing deployment: DATABASE_URL is not a linked Supabase database.");
const database = new URL(direct);
database.hostname = "aws-0-ap-south-1.pooler.supabase.com";
database.port = "5432";
database.username = `postgres.${projectRef}`;
const pool = new pg.Pool({ connectionString: database.href, max: 1, connectionTimeoutMillis: 10_000 });
try {
  const previous = await pool.query("select 1 from public.pixlwave_schema_migrations where version='202609270001_owner_listing_drafts.sql'");
  if (!previous.rowCount) throw new Error("Required owner draft migration is not deployed.");
  const applied = await pool.query("select 1 from public.pixlwave_schema_migrations where version=$1", [version]);
  if (!applied.rowCount) {
    const sql = await readFile(new URL(`../supabase/migrations/${version}`, import.meta.url), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.pixlwave_schema_migrations(version) values ($1)", [version]);
      await client.query("commit");
    } catch (error) { await client.query("rollback"); throw error; }
    finally { client.release(); }
  }
  await pool.query("notify pgrst, 'reload schema'");
  const verified = await pool.query(`select
    to_regclass('public.inventory_listing_revisions')::text as revisions,
    to_regclass('public.media_upload_sessions')::text as uploads,
    to_regclass('public.listing_status_events')::text as events,
    (select relrowsecurity from pg_class where oid='public.inventory_listing_revisions'::regclass) as revision_rls,
    has_function_privilege('anon','public.save_inventory_listing_revision(uuid,jsonb)','execute') as anon_save,
    has_function_privilege('authenticated','public.save_inventory_listing_revision(uuid,jsonb)','execute') as owner_save,
    has_function_privilege('authenticated','public.review_inventory_listing_revision(uuid,text,text)','execute') as review_callable
  `);
  const state = verified.rows[0];
  if (state.revisions !== "inventory_listing_revisions" || state.uploads !== "media_upload_sessions" || state.events !== "listing_status_events" || !state.revision_rls || state.anon_save || !state.owner_save || !state.review_callable) {
    throw new Error(`Unexpected FP02 security state: ${JSON.stringify(state)}`);
  }
  console.log(`FP02 database verified: migration=${version}, revision RLS=${state.revision_rls}, anonymous revision save=${state.anon_save}, authenticated revision save=${state.owner_save}.`);
} finally { await pool.end(); }

const api = new URL("/rest/v1/inventory_listing_revisions?select=id&limit=1", process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonHeaders = { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}` };
const serviceHeaders = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
const statusApi = new URL("/rest/v1/listing_status_events?select=id&limit=0", process.env.NEXT_PUBLIC_SUPABASE_URL);
let schema;
for (let attempt = 0; attempt < 12; attempt += 1) {
  schema = await fetch(statusApi, { headers: serviceHeaders });
  if (schema.ok) break;
  await new Promise((resolve) => setTimeout(resolve, 2500));
}
if (!schema?.ok) throw new Error(`FP02 PostgREST schema unavailable (${schema?.status ?? "no response"}).`);
const read = await fetch(api, { headers: anonHeaders });
if (read.ok || ![401,403].includes(read.status)) throw new Error(`Anonymous revision read returned unexpected status ${read.status}.`);
console.log(`FP02 API verified: schema visible to service role; anonymous revision read rejected (${read.status}).`);
