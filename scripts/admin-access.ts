import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";

async function main() {
  loadLocalEnvFile();
  const [action, userId, operatorId] = process.argv.slice(2);
  if (!['grant', 'suspend'].includes(action) || !userId) {
    throw new Error("Usage: tsx scripts/admin-access.ts <grant|suspend> <user-uuid> [operator-uuid]");
  }
  if (process.env.APP_ENV === "production" && !operatorId) throw new Error("Production changes require the operator UUID for audit attribution.");
  const supabase = createAdminSupabaseClient();
  const status = action === "grant" ? "active" : "suspended";
  const { error } = await supabase.from("platform_admins").upsert({
  user_id: userId,
  status,
  mfa_required: true,
  granted_by: operatorId || null,
  granted_at: new Date().toISOString(),
  suspended_at: action === "suspend" ? new Date().toISOString() : null
});
  if (error) throw error;
  const { error: auditError } = await supabase.from("audit_log").insert({
  actor_id: operatorId || null,
  action: `platform_admin.${action}`,
  subject_type: "user",
  subject_id: userId,
  metadata: { mfa_required: true, source: "admin-access-script" }
});
  if (auditError) throw auditError;
  console.log(`Platform admin access ${status} for ${userId}. MFA is still required at sign-in.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
