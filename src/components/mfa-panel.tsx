"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Enrollment = { id: string; qrCode: string; secret: string };

export function MfaPanel() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true); setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const existing = await supabase.auth.mfa.listFactors();
      if (existing.error) throw existing.error;
      const verified = existing.data?.totp.find((factor) => factor.status === "verified");
      if (verified) {
        setEnrollment({ id: verified.id, qrCode: "", secret: "Already enrolled" });
        setMessage("Authenticator is already enrolled. Enter a current code to reach assurance level 2.");
      } else {
        const abandoned = (existing.data?.all ?? []).filter((factor) =>
          factor.factor_type === "totp" &&
          factor.status === "unverified" &&
          factor.friendly_name === "Pixlwave admin"
        );
        for (const factor of abandoned) {
          const { error: cleanupError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (cleanupError) throw cleanupError;
        }
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Pixlwave admin" });
        if (error) throw error;
        setEnrollment({ id: data.id, qrCode: data.totp.qr_code.trimEnd(), secret: data.totp.secret });
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "MFA setup failed."); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (!enrollment) return;
    setBusy(true); setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code });
      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The code could not be verified."); }
    finally { setBusy(false); }
  }

  return <section className="panel-card">
    <div className="panel-title"><div><span className="eyebrow">Administrator protection</span><h2>Authenticator MFA</h2></div><span className="status status-warning">Required for admin</span></div>
    <p className="muted">Ordinary advertiser and owner access does not imply administrator access. Active admins must reach AAL2 before the console opens.</p>
    {!enrollment && <button className="button" onClick={begin} disabled={busy}>{busy ? "Preparing…" : "Set up or verify MFA"}</button>}
    {enrollment && <div className="mfa-grid">
      {enrollment.qrCode && <Image src={enrollment.qrCode} width={180} height={180} alt="Authenticator enrollment QR code" unoptimized />}
      <div><p><b>Authenticator secret</b></p><code className="secret-code">{enrollment.secret}</code><label>Current six-digit code<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label><button className="button" onClick={verify} disabled={busy || code.length !== 6}>Verify MFA</button></div>
    </div>}
    {message && <div className="banner" role="status">{message}</div>}
  </section>;
}
