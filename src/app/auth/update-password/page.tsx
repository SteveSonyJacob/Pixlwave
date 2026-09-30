import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { updatePassword } from "@/app/auth/actions";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type PageProps = { searchParams: Promise<{ error?: string }> };
export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return <AuthCard eyebrow="Secure your account" title="Choose a new password" copy="Use at least 12 characters and avoid a password used on another service.">
    <MessageBanner error={error} />
    <form action={updatePassword} className="form-stack"><TextField id="new-password" name="password" label="New password" hint="Use at least 12 characters." type="password" minLength={12} autoComplete="new-password" required /><SubmitButton fullWidth pendingLabel="Updating password…">Update password</SubmitButton></form>
  </AuthCard>;
}
