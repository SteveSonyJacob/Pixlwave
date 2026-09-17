import { Pool } from "pg";
import { migrate } from "../src/lib/database/migrations";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";

async function resetWithAuthStubs(pool: Pool) {
  await pool.query("drop schema if exists public cascade; drop schema if exists auth cascade; drop schema if exists extensions cascade; create schema public; create schema auth; create schema extensions");
  await pool.query(`
    do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
    create table auth.users (
      id uuid primary key,
      email text,
      phone text,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid stable language sql as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function auth.jwt() returns jsonb stable language sql as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
    $$;
  `);
}

async function main() {
  loadLocalEnvFile();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for migration tests.");
  const parsed = new URL(databaseUrl);
  if (!parsed.pathname.toLowerCase().includes("pixlwave_test")) {
    throw new Error("Refusing destructive migration test: database name must include pixlwave_test.");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
  await resetWithAuthStubs(pool);
  await migrate(pool, "202609150001_foundation_accounts.sql");
  const userId = "10000000-0000-0000-0000-000000000001";
  await pool.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,'prior@example.test',$2)", [userId, { full_name: "Prior Revision" }]);
  const profile = await pool.query("select full_name, selected_mode from public.profiles where id = $1", [userId]);
  if (profile.rows[0]?.full_name !== "Prior Revision") throw new Error("Profile trigger failed on representative prior revision.");
  await migrate(pool);
  const outbox = await pool.query("insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload,dedupe_key) values ('foundation.healthcheck','system',$1,'{}','migration-test') returning id", [userId]);
  if (!outbox.rows[0]?.id) throw new Error("Upgrade migration did not create outbox.");

  await resetWithAuthStubs(pool);
  await migrate(pool);
  const count = await pool.query("select count(*)::int as count from public.pixlwave_schema_migrations");
  if (count.rows[0]?.count !== 2) throw new Error("Fresh database did not apply every migration.");
  console.log("Migration tests passed: prior-revision upgrade and empty-database replay.");
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
