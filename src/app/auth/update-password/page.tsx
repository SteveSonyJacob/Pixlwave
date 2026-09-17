import { AuthCard } from "@/components/auth-card";
import { MessageBanner } from "@/components/message-banner";
import { updatePassword } from "@/app/auth/actions";

type PageProps = { searchParams: Promise<{ error?: string }> };
export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return <AuthCard eyebrow="Secure your account" title="Choose a new password" copy="Use at least 12 characters and avoid a password used on another service.">
    <MessageBanner error={error} />
    <form action={updatePassword} className="form-stack"><label>New password<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label><button className="button button-full">Update password</button></form>
  </AuthCard>;
}
