import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSessionIdleExpired } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || url.includes("change-me") || key === "change-me") return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // getClaims validates and refreshes the cookie-backed session when required.
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) {
    const idleMinutes = Number(process.env.AUTH_SESSION_IDLE_MINUTES ?? "60");
    const activity = request.cookies.get("pixlwave-last-activity")?.value;
    const lastActivity = activity ? Number(activity) : null;
    if (isSessionIdleExpired(lastActivity, Date.now(), idleMinutes)) {
      await supabase.auth.signOut({ scope: "local" });
      response.cookies.delete("pixlwave-last-activity");
    } else {
      response.cookies.set("pixlwave-last-activity", String(Date.now()), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: idleMinutes * 60
      });
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
