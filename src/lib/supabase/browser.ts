"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey || url.includes("change-me") || publishableKey === "change-me") {
    throw new Error("Supabase public configuration is missing or invalid. Check .env.local.");
  }
  return createBrowserClient(url, publishableKey);
}
