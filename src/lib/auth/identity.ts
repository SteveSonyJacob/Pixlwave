import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AccountMode } from "@/lib/domain/access";

export type CurrentIdentity = {
  userId: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  businessName: string | null;
  selectedMode: AccountMode;
  advertiserEnabled: boolean;
  ownerEnabled: boolean;
  isAdmin: boolean;
};

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: admin }] = await Promise.all([
    supabase.from("profiles").select("full_name,business_name,selected_mode,advertiser_enabled,owner_enabled").eq("id", user.id).maybeSingle(),
    supabase.from("platform_admins").select("status").eq("user_id", user.id).eq("status", "active").maybeSingle()
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    fullName: profile?.full_name || user.user_metadata?.full_name || "Pixlwave user",
    businessName: profile?.business_name ?? null,
    selectedMode: profile?.selected_mode === "owner" ? "owner" : "advertiser",
    advertiserEnabled: profile?.advertiser_enabled !== false,
    ownerEnabled: profile?.owner_enabled !== false,
    isAdmin: admin?.status === "active"
  };
}

export async function requireIdentity() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/auth/sign-in?message=Please+sign+in+to+continue");
  return identity;
}

export async function requireAdminMfa() {
  const identity = await requireIdentity();
  if (!identity.isAdmin) redirect("/account?error=Administrator+access+is+required");
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== "aal2") redirect("/account/security?message=Complete+MFA+to+open+the+admin+console");
  return identity;
}
