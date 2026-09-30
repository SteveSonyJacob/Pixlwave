import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next") ?? "/account";
  const next = requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") && !/[\u0000-\u001f]/.test(requested) ? requested : "/account";
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next === "/owner" || next.startsWith("/owner/")) await supabase.rpc("select_account_mode", { requested_mode: "owner" });
      if (next === "/advertiser" || next.startsWith("/advertiser/")) await supabase.rpc("select_account_mode", { requested_mode: "advertiser" });
      return NextResponse.redirect(new URL(next, request.url));
    }
  }
  return NextResponse.redirect(new URL("/auth/sign-in?error=Verification+link+is+invalid+or+expired", request.url));
}
