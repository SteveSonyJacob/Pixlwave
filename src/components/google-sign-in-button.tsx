"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function GoogleSignInButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setPending(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/account`;
      const { error: oauthError } = await createBrowserSupabaseClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (oauthError) throw oauthError;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to start Google sign-in.");
      setPending(false);
    }
  }

  return <div className="form-stack">
    <button className="button button-secondary button-full" type="button" onClick={signInWithGoogle} disabled={pending}>
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
    {error ? <p className="banner" role="alert">{error}</p> : null}
  </div>;
}
