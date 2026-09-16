import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";

const fixtures = [
  { email: "advertiser@pixlwave.test", fullName: "Asha Advertiser", admin: false },
  { email: "owner@pixlwave.test", fullName: "Omar Owner", admin: false },
  { email: "admin@pixlwave.test", fullName: "Anu Admin", admin: true }
];

async function main() {
  loadLocalEnvFile();
  if (!['local', 'test'].includes(process.env.APP_ENV ?? '')) throw new Error("Fixture accounts are allowed only in local/test environments.");
  const password = process.env.FIXTURE_PASSWORD;
  if (!password || password.length < 12) throw new Error("Set a non-committed FIXTURE_PASSWORD with at least 12 characters.");
  const supabase = createAdminSupabaseClient();
  for (const fixture of fixtures) {
  const { data, error } = await supabase.auth.admin.createUser({ email: fixture.email, password, email_confirm: true, user_metadata: { full_name: fixture.fullName, fixture: true } });
  if (error && !error.message.toLowerCase().includes("already")) throw error;
  const userId = data.user?.id;
  if (fixture.admin && userId) {
    const { error: grantError } = await supabase.from("platform_admins").upsert({ user_id: userId, status: "active", mfa_required: true });
    if (grantError) throw grantError;
  }
    console.log(`${fixture.email}: ${error ? "already exists" : "created"}${fixture.admin ? " (admin; MFA enrollment still required)" : ""}`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
