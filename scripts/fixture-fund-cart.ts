import { Pool } from "pg";
import { z } from "zod";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";

async function main() {
  loadLocalEnvFile();
  if (process.env.P04_FIXTURE_FUNDING_ENABLED !== "true") throw new Error("Set P04_FIXTURE_FUNDING_ENABLED=true explicitly for this test-only command.");
  const cartId = z.string().uuid().parse(process.argv[2]);
  const capturedAt = process.argv[3] ? z.iso.datetime({ offset: true }).parse(process.argv[3]) : new Date().toISOString();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const parsed = new URL(databaseUrl);
  if (!parsed.pathname.toLowerCase().includes("test")) throw new Error("Refusing fixture funding: database name must include test.");
  const pool = new Pool({ connectionString: databaseUrl, max: 1, application_name: "pixlwave-p04-fixture-funder" });
  try {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select set_config('app.p04_fixture_funding','enabled',true)");
      const result = await client.query("select id,status,paid_at,decision_due_at,total_amount_paise from public.record_trusted_cart_payment($1,$2,$3,'p04_fixture')", [cartId, `p04-fixture-${cartId}`, capturedAt]);
      await client.query("commit");
      console.log(JSON.stringify(result.rows[0], null, 2));
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
