import pg from "pg";

process.loadEnvFile(".env.local");
const direct = new URL(process.env.DATABASE_URL);
const projectRef = direct.hostname.split(".")[1];
const database = new URL(direct);
if (direct.hostname.startsWith("db.") && projectRef) {
  database.hostname = "aws-0-ap-south-1.pooler.supabase.com";
  database.port = "5432";
  database.username = `postgres.${projectRef}`;
}

const pool = new pg.Pool({ connectionString: database.href, max: 1, connectionTimeoutMillis: 10_000 });
try {
  const result = await pool.query(`
    select
      exists(select 1 from public.pixlwave_schema_migrations where version='202609270001_owner_listing_drafts.sql') as migration,
      to_regclass('public.owner_listing_drafts')::text as table_name,
      (select relrowsecurity from pg_class where oid='public.owner_listing_drafts'::regclass) as rls,
      has_function_privilege('anon','public.save_owner_listing_draft(uuid,bigint,jsonb,integer,uuid,timestamptz)','execute') as anon_save,
      has_function_privilege('authenticated','public.save_owner_listing_draft(uuid,bigint,jsonb,integer,uuid,timestamptz)','execute') as authenticated_save
  `);
  const status = result.rows[0];
  if (!status?.migration || status.table_name !== "owner_listing_drafts" || !status.rls || status.anon_save || !status.authenticated_save) {
    throw new Error(`Unexpected database security state: ${JSON.stringify(status)}`);
  }
  await pool.query("notify pgrst, 'reload schema'");
  console.log(`Database verified: migration=${status.migration}, table=${status.table_name}, RLS=${status.rls}, anonymous save=${status.anon_save}, authenticated save=${status.authenticated_save}.`);
} finally {
  await pool.end();
}

const apiUrl = new URL("/rest/v1/owner_listing_drafts?select=id&limit=1", process.env.NEXT_PUBLIC_SUPABASE_URL);
const headers = { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}` };
const read = await fetch(apiUrl, { headers });
if (read.ok || ![401, 403].includes(read.status)) throw new Error(`Anonymous draft read returned an unexpected status (${read.status}).`);
const serviceHeaders = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
const schemaRead = await fetch(new URL("/rest/v1/owner_listing_drafts?select=id&limit=0", process.env.NEXT_PUBLIC_SUPABASE_URL), { headers: serviceHeaders });
if (!schemaRead.ok) throw new Error(`PostgREST draft projection unavailable (${schemaRead.status}).`);

const rpc = await fetch(new URL("/rest/v1/rpc/save_owner_listing_draft", process.env.NEXT_PUBLIC_SUPABASE_URL), {
  method: "POST", headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ target_draft: "40000000-0000-0000-0000-000000000001", expected_revision: 0, draft_payload: {}, draft_step: 0 })
});
if (rpc.ok) throw new Error("Anonymous RPC unexpectedly saved a draft.");
console.log(`Supabase API verified: draft projection available; anonymous read rejected (${read.status}) and anonymous save rejected (${rpc.status}).`);
