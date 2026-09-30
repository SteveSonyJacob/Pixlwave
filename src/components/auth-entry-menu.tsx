import Link from "next/link";

export function LoginLink({ className = "" }: { className?: string }) {
  return <Link className={`auth-login-link ${className}`.trim()} href="/auth/sign-in">Login</Link>;
}
