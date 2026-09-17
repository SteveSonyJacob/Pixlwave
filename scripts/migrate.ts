import { Pool } from "pg";
import { migrate } from "../src/lib/database/migrations";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";
import { log } from "../src/lib/logging";

async function main() {
  loadLocalEnvFile();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await migrate(pool);
    log("info", "database.migrations.completed");
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
