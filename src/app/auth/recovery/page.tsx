import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { requestPasswordRecovery } from "@/app/auth/actions";

type PageProps = { searchParams: Promise<{ error?: string }> };
export default async function RecoveryPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return <AuthCard eyebrow="Account recovery" title="Reset your password" copy="We will email a single-use recovery link to the verified account address.">
    <MessageBanner error={error} />
    <form action={requestPasswordRecovery} className="form-stack">
      <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@business.com" /></label>
      <button className="button button-full" type="submit">Send recovery link</button>
    </form>
  </AuthCard>;
}
