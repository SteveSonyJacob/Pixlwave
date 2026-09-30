import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { signUpWithPassword } from "@/app/auth/actions";
import { CheckboxField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type PageProps = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function SignUpPage({ searchParams }: PageProps) {
  const { error, next } = await searchParams;
  return (
    <AuthCard showBrand={false} showEyebrow={false} eyebrow="" title="Create your workspace" copy="">
      <MessageBanner error={error} />
      <form action={signUpWithPassword} className="form-stack">
        <input type="hidden" name="next" value={next ?? "/account"} />
        <div className="field-row"><TextField id="signup-name" name="fullName" label="Full name" autoComplete="name" required placeholder="Your name" /><TextField id="signup-business" name="businessName" label="Business name" hint="Optional" autoComplete="organization" placeholder="Studio or company" /></div>
        <TextField id="signup-email" name="email" label="Work email" type="email" autoComplete="email" required placeholder="you@business.com" />
        <TextField id="signup-password" name="password" label="Password" type="password" autoComplete="new-password" minLength={12} required placeholder="At least 12 characters" />
        <CheckboxField id="signup-policy" label="I understand payment does not reserve inventory; only admin confirmation does." required />
        <SubmitButton fullWidth pendingLabel="Creating account…">Create verified account</SubmitButton>
      </form>
      <p className="auth-foot">Already registered? <Link href={next ? `/auth/sign-in?next=${encodeURIComponent(next)}` : "/auth/sign-in"}>Sign in</Link></p>
    </AuthCard>
  );
}
