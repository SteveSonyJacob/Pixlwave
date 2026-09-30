import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { verifyPhoneOtp } from "@/app/auth/actions";
import { isPhoneAuthEnabled } from "@/lib/auth/features";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type PageProps = { searchParams: Promise<{ phone?: string; error?: string; next?: string }> };
export default async function VerifyPhonePage({ searchParams }: PageProps) {
  if (!isPhoneAuthEnabled()) redirect("/auth/sign-in?error=Phone%20authentication%20is%20not%20enabled.");
  const query = await searchParams;
  return <AuthCard eyebrow="Phone verification" title="Enter your code" copy={`We sent a one-time code to ${query.phone || "your phone"}. Codes expire and can only be used once.`}>
    <MessageBanner error={query.error} />
    <form action={verifyPhoneOtp} className="form-stack">
      <input type="hidden" name="phone" value={query.phone ?? ""} />
      <input type="hidden" name="next" value={query.next ?? "/account"} />
      <TextField id="phone-code" name="token" label="Six-digit code" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} required placeholder="000000" />
      <SubmitButton fullWidth pendingLabel="Verifying…">Verify and sign in</SubmitButton>
    </form>
  </AuthCard>;
}
