import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { MessageBanner } from "@/components/message-banner";
import { sendPhoneOtp, signInWithPassword } from "@/app/auth/actions";
import { isGoogleAuthEnabled, isPhoneAuthEnabled } from "@/lib/auth/features";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type PageProps = { searchParams: Promise<{ message?: string; error?: string; next?: string }> };

export default async function SignInPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const phoneAuthEnabled = isPhoneAuthEnabled();
  const googleAuthEnabled = isGoogleAuthEnabled();
  const alternateSignInEnabled = phoneAuthEnabled || googleAuthEnabled;
  return (
    <AuthCard showBrand={false} eyebrow="Welcome back" title="Sign in to Pixlwave" copy={alternateSignInEnabled ? "Use your verified email and password, or a configured alternate sign-in method." : "Use your verified email and password."}>
      <MessageBanner message={query.message} error={query.error} />
      <div className="auth-sections">
        <form action={signInWithPassword} className="form-stack">
          <input type="hidden" name="next" value={query.next ?? "/account"} />
          <TextField id="sign-in-email" label="Email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" />
          <TextField id="sign-in-password" label="Password" name="password" type="password" autoComplete="current-password" required placeholder="Your password" />
          <SubmitButton fullWidth pendingLabel="Signing in…">Sign in with email</SubmitButton>
          <Link className="text-link form-link" href="/auth/recovery">Forgot password?</Link>
        </form>
        {alternateSignInEnabled ? <div className="or"><span>or continue another way</span></div> : null}
        {googleAuthEnabled ? <GoogleSignInButton next={query.next} /> : null}
        {phoneAuthEnabled ? <>
          <form action={sendPhoneOtp} className="form-stack">
            <input type="hidden" name="next" value={query.next ?? "/account"} />
            <TextField id="sign-in-phone" label="Mobile number" name="phone" type="tel" autoComplete="tel" required placeholder="+91 98765 43210" pattern="^\\+[1-9][0-9]{7,14}$" />
            <SubmitButton variant="secondary" fullWidth pendingLabel="Sending code…">Send one-time code</SubmitButton>
          </form>
        </> : null}
      </div>
      <p className="auth-foot">New to Pixlwave? <Link href={query.next ? `/auth/sign-up?next=${encodeURIComponent(query.next)}` : "/auth/sign-up"}>Sign up</Link></p>
    </AuthCard>
  );
}
