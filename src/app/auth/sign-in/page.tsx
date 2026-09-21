import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { MessageBanner } from "@/components/message-banner";
import { sendPhoneOtp, signInWithPassword } from "@/app/auth/actions";
import { isGoogleAuthEnabled, isPhoneAuthEnabled } from "@/lib/auth/features";

type PageProps = { searchParams: Promise<{ message?: string; error?: string; next?: string }> };

export default async function SignInPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const phoneAuthEnabled = isPhoneAuthEnabled();
  const googleAuthEnabled = isGoogleAuthEnabled();
  const alternateSignInEnabled = phoneAuthEnabled || googleAuthEnabled;
  return (
    <AuthCard eyebrow="Welcome back" title="Sign in to Pixlwave" copy={alternateSignInEnabled ? "Use your verified email and password, or a configured alternate sign-in method." : "Use your verified email and password."}>
      <MessageBanner message={query.message} error={query.error} />
      <div className="auth-sections">
        <form action={signInWithPassword} className="form-stack">
          <input type="hidden" name="next" value={query.next ?? "/account"} />
          <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@business.com" /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your password" /></label>
          <button className="button button-full" type="submit">Sign in with email</button>
          <Link className="text-link form-link" href="/auth/recovery">Forgot password?</Link>
        </form>
        {alternateSignInEnabled ? <div className="or"><span>or continue another way</span></div> : null}
        {googleAuthEnabled ? <GoogleSignInButton /> : null}
        {phoneAuthEnabled ? <>
          <form action={sendPhoneOtp} className="form-stack">
            <label>Mobile number<input name="phone" type="tel" autoComplete="tel" required placeholder="+91 98765 43210" pattern="^\\+[1-9][0-9]{7,14}$" /></label>
            <button className="button button-secondary button-full" type="submit">Send one-time code</button>
          </form>
        </> : null}
      </div>
      <p className="auth-foot">New to Pixlwave? <Link href="/auth/sign-up">Create an account</Link></p>
    </AuthCard>
  );
}
