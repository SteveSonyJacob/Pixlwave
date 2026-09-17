import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pool } from "pg";

export async function migrationFiles() {
  const directory = path.join(process.cwd(), "supabase", "migrations");
  return (await fs.readdir(directory)).filter((name) => name.endsWith(".sql")).sort().map((name) => path.join(directory, name));
}

export async function migrate(pool: Pool, through?: string) {
  await pool.query("create table if not exists public.pixlwave_schema_migrations (version text primary key, applied_at timestamptz not null default now())");
  const files = await migrationFiles();
  for (const file of files) {
    const version = path.basename(file);
    if (through && version > through) continue;
    const applied = await pool.query("select 1 from public.pixlwave_schema_migrations where version = $1", [version]);
    if (applied.rowCount) continue;
    const sql = await fs.readFile(file, "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.pixlwave_schema_migrations(version) values ($1)", [version]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally { client.release(); }
  }
}
