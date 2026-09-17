import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { signUpWithPassword } from "@/app/auth/actions";

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function SignUpPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return (
    <AuthCard eyebrow="One individual account" title="Create your workspace" copy="Advertiser and owner modes live under the same verified identity. Admin access is never self-selected.">
      <MessageBanner error={error} />
      <form action={signUpWithPassword} className="form-stack">
        <div className="field-row"><label>Full name<input name="fullName" autoComplete="name" required placeholder="Your name" /></label><label>Business name <small>Optional</small><input name="businessName" autoComplete="organization" placeholder="Studio or company" /></label></div>
        <label>Work email<input name="email" type="email" autoComplete="email" required placeholder="you@business.com" /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required placeholder="At least 12 characters" /></label>
        <label className="check"><input type="checkbox" required /><span>I understand payment does not reserve inventory; only admin confirmation does.</span></label>
        <button className="button button-full" type="submit">Create verified account</button>
      </form>
      <p className="auth-foot">Already registered? <Link href="/auth/sign-in">Sign in</Link></p>
    </AuthCard>
  );
}
