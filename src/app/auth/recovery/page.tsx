import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { requestPasswordRecovery } from "@/app/auth/actions";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type PageProps = { searchParams: Promise<{ error?: string }> };
export default async function RecoveryPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return <AuthCard eyebrow="Account recovery" title="Reset your password" copy="We will email a single-use recovery link to the verified account address.">
    <MessageBanner error={error} />
    <form action={requestPasswordRecovery} className="form-stack">
      <TextField id="recovery-email" name="email" label="Email" type="email" autoComplete="email" required placeholder="you@business.com" />
      <SubmitButton fullWidth pendingLabel="Sending recovery link…">Send recovery link</SubmitButton>
    </form>
  </AuthCard>;
}
