"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function IdentifierLinking({ hasEmail, hasPhone }: { hasEmail: boolean; hasPhone: boolean }) {
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [stage, setStage] = useState<"phone" | "verify">("phone");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function sendPhoneChange() {
    setMessage("");
    try {
      const { error } = await createBrowserSupabaseClient().auth.updateUser({ phone });
      if (error) throw error;
      setStage("verify"); setMessage("A verification code was sent. The number is linked only after verification.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send verification code."); }
  }

  async function verifyPhoneChange() {
    setMessage("");
    try {
      const { error } = await createBrowserSupabaseClient().auth.verifyOtp({ phone, token, type: "phone_change" });
      if (error) throw error;
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to verify this number."); }
  }

  async function linkEmail() {
    setMessage("");
    if (password.length < 12) { setMessage("Use at least 12 characters for the new password."); return; }
    try {
      const { error } = await createBrowserSupabaseClient().auth.updateUser(
        { email, password },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` }
      );
      if (error) throw error;
      setMessage("Check the new address to finish verification. It is not linked until that confirmation succeeds.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start email verification."); }
  }

  return <section className="panel-card">
    <div className="panel-title"><div><span className="eyebrow">Verified identifiers</span><h2>Sign-in methods</h2></div><span className="status status-ok">Supabase Auth</span></div>
    <div className="identifier-list"><span><b>Email</b>{hasEmail ? "Verified account identifier" : "Not linked"}</span><span><b>Phone</b>{hasPhone ? "Verified account identifier" : "Not linked"}</span></div>
    {!hasPhone && <div className="inline-form">
      {stage === "phone" ? <><input aria-label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91…" /><button className="button button-small" onClick={sendPhoneChange}>Link phone</button></> : <><input aria-label="Phone verification code" value={token} onChange={(event) => setToken(event.target.value)} placeholder="6-digit code" maxLength={6} /><button className="button button-small" onClick={verifyPhoneChange}>Verify</button></>}
    </div>}
    {!hasEmail && <div className="form-stack compact-form"><p className="small-note">Add a verified recovery email and password. A duplicate verified identifier is rejected by Auth.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>New password<input type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-small" onClick={linkEmail} disabled={!email || password.length < 12}>Link email</button></div>}
    {message && <div className="banner" role="status">{message}</div>}
  </section>;
}
