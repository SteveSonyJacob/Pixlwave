import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/config/env";

export function createAdminSupabaseClient() {
  const env = readServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
