import { createClient } from "@supabase/supabase-js";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";
import { readServerEnv } from "../src/lib/config/env";

const fixtures = {
  advertiser: "advertiser@pixlwave.test",
  owner: "owner@pixlwave.test",
  admin: "admin@pixlwave.test"
} as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function signIn(email: string, password: string) {
  const env = readServerEnv();
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email}: sign-in failed: ${error.message}`);
  assert(data.user, `${email}: no authenticated user returned`);
  return { client, user: data.user };
}

async function testOrdinaryAccount(email: string, password: string) {
  const { client, user } = await signIn(email, password);
  const ownProfile = await client.from("profiles").select("id,selected_mode,advertiser_enabled,owner_enabled").eq("id", user.id).single();
  if (ownProfile.error) throw ownProfile.error;
  assert(ownProfile.data.advertiser_enabled && ownProfile.data.owner_enabled, `${email}: both account modes must be enabled`);

  const adminRows = await client.from("platform_admins").select("user_id");
  if (adminRows.error) throw adminRows.error;
  assert(adminRows.data.length === 0, `${email}: ordinary account could see an admin grant`);

  for (const mode of ["owner", "advertiser"] as const) {
    const switched = await client.rpc("select_account_mode", { requested_mode: mode });
    if (switched.error) throw switched.error;
    assert(switched.data === mode, `${email}: failed to switch to ${mode}`);
  }

  const aal2 = await client.rpc("is_admin_aal2", { subject: user.id });
  if (aal2.error) throw aal2.error;
  assert(aal2.data === false, `${email}: ordinary account unexpectedly passed admin AAL2`);
  await client.auth.signOut();
  console.log(`${email}: PASS (login, self-profile RLS, mode switching, admin denial, logout)`);
}

async function testAdminAccount(password: string) {
  const email = fixtures.admin;
  const { client, user } = await signIn(email, password);
  const grant = await client.from("platform_admins").select("status,mfa_required").eq("user_id", user.id).single();
  if (grant.error) throw grant.error;
  assert(grant.data.status === "active" && grant.data.mfa_required === true, `${email}: active MFA-required grant missing`);

  const isAdmin = await client.rpc("is_platform_admin", { subject: user.id });
  if (isAdmin.error) throw isAdmin.error;
  assert(isAdmin.data === true, `${email}: platform admin grant not recognized`);

  const aal2 = await client.rpc("is_admin_aal2", { subject: user.id });
  if (aal2.error) throw aal2.error;
  assert(aal2.data === false, `${email}: password-only session must not satisfy AAL2`);
  await client.auth.signOut();
  console.log(`${email}: PASS (separate grant present, password-only session blocked by AAL2, logout)`);
}

async function main() {
  loadLocalEnvFile();
  const env = readServerEnv();
  assert(env.APP_ENV !== "production", "Acceptance fixtures must never run against production.");
  const password = process.env.FIXTURE_PASSWORD;
  assert(password && password.length >= 12, "FIXTURE_PASSWORD must contain at least 12 characters.");

  const invalid = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const invalidResult = await invalid.auth.signInWithPassword({ email: fixtures.advertiser, password: `${password}-wrong` });
  assert(invalidResult.error, "Invalid password unexpectedly succeeded.");
  console.log("invalid password: PASS");

  await testOrdinaryAccount(fixtures.advertiser, password);
  await testOrdinaryAccount(fixtures.owner, password);
  await testAdminAccount(password);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
