import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// Full integration test against an isolated local Docker database. Never use
// DATABASE_URL from .env.local: test-migrations intentionally drops schemas.
const container = process.env.PIXLWAVE_TEST_CONTAINER || "pixlwave-test-db";
const database = `pixlwave_test_full_${randomUUID().replaceAll("-", "")}`;
const dockerEnv = JSON.parse(execFileSync("docker", ["inspect", "--format", "{{json .Config.Env}}", container], { encoding: "utf8" }));
const setting = (name) => dockerEnv.find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
const user = setting("POSTGRES_USER") || "postgres";
const password = setting("POSTGRES_PASSWORD");
if (!password) throw new Error("The local Docker test database has no configured POSTGRES_PASSWORD.");
const databaseUrl = new URL(`postgresql://${encodeURIComponent(user)}@127.0.0.1:${process.env.PIXLWAVE_TEST_PORT || "5432"}/${database}`);
databaseUrl.password = password;

let created = false;
try {
  execFileSync("docker", ["exec", container, "createdb", "-U", user, database], { stdio: "ignore" });
  created = true;
  const result = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/test-migrations.ts"], {
    stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl.href }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  if (created) execFileSync("docker", ["exec", container, "dropdb", "-U", user, database], { stdio: "ignore" });
}
