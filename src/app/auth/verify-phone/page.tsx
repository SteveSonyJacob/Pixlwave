import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { verifyPhoneOtp } from "@/app/auth/actions";

type PageProps = { searchParams: Promise<{ phone?: string; error?: string }> };
export default async function VerifyPhonePage({ searchParams }: PageProps) {
  const query = await searchParams;
  return <AuthCard eyebrow="Phone verification" title="Enter your code" copy={`We sent a one-time code to ${query.phone || "your phone"}. Codes expire and can only be used once.`}>
    <MessageBanner error={query.error} />
    <form action={verifyPhoneOtp} className="form-stack">
      <input type="hidden" name="phone" value={query.phone ?? ""} />
      <label>Six-digit code<input name="token" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} required placeholder="000000" /></label>
      <button className="button button-full" type="submit">Verify and sign in</button>
    </form>
  </AuthCard>;
}
