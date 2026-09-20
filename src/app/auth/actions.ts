"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPhoneAuthEnabled } from "@/lib/auth/features";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function destination(formData: FormData) {
  const raw = field(formData, "next");
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
}

function applicationOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(configured).origin;
}

function authRedirect(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email: field(formData, "email"), password: field(formData, "password") });
  if (error) authRedirect("/auth/sign-in", "error", error.message);
  revalidatePath("/", "layout");
  redirect(destination(formData));
}

export async function signUpWithPassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (password.length < 12) authRedirect("/auth/sign-up", "error", "Use at least 12 characters.");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${applicationOrigin()}/auth/callback?next=/account`,
      data: { full_name: field(formData, "fullName"), business_name: field(formData, "businessName") }
    }
  });
  if (error) authRedirect("/auth/sign-up", "error", error.message);
  authRedirect("/auth/sign-in", "message", `Check ${email} to verify your account.`);
}

export async function sendPhoneOtp(formData: FormData) {
  if (!isPhoneAuthEnabled()) authRedirect("/auth/sign-in", "error", "Phone authentication is not enabled.");
  const supabase = await createServerSupabaseClient();
  const phone = field(formData, "phone");
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) authRedirect("/auth/sign-in", "error", "Use an international phone number such as +919876543210.");
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
  if (error) authRedirect("/auth/sign-in", "error", error.message);
  redirect(`/auth/verify-phone?phone=${encodeURIComponent(phone)}`);
}

export async function verifyPhoneOtp(formData: FormData) {
  if (!isPhoneAuthEnabled()) authRedirect("/auth/sign-in", "error", "Phone authentication is not enabled.");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ phone: field(formData, "phone"), token: field(formData, "token"), type: "sms" });
  if (error) authRedirect(`/auth/verify-phone?phone=${encodeURIComponent(field(formData, "phone"))}`, "error", error.message);
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function requestPasswordRecovery(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(field(formData, "email"), {
    redirectTo: `${applicationOrigin()}/auth/callback?next=/auth/update-password`
  });
  if (error) authRedirect("/auth/recovery", "error", error.message);
  authRedirect("/auth/sign-in", "message", "If the account exists, a recovery link has been sent.");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const password = field(formData, "password");
  if (password.length < 12) authRedirect("/auth/update-password", "error", "Use at least 12 characters.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) authRedirect("/auth/update-password", "error", error.message);
  authRedirect("/account", "message", "Password updated.");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");
  const { error } = await supabase.from("profiles").update({
    full_name: field(formData, "fullName"),
    business_name: field(formData, "businessName") || null
  }).eq("id", user.id);
  if (error) authRedirect("/account", "error", error.message);
  revalidatePath("/account");
  authRedirect("/account", "message", "Profile saved.");
}

export async function switchMode(formData: FormData) {
  const mode = field(formData, "mode");
  if (mode !== "advertiser" && mode !== "owner") authRedirect("/account", "error", "Invalid account mode.");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("select_account_mode", { requested_mode: mode });
  if (error) authRedirect("/account", "error", error.message);
  revalidatePath("/", "layout");
  redirect(mode === "owner" ? "/owner" : "/advertiser");
}
