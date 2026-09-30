import { MfaPanel } from "@/components/mfa-panel";
import { requireIdentity } from "@/lib/auth/identity";
import { redirect } from "next/navigation";

export default async function SecurityPage() {
  const identity = await requireIdentity();
  if (!identity.isAdmin) redirect("/account?error=Administrator+access+is+required");
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Account security</span><h1>Security & MFA</h1><p>Sessions are cookie-backed, refreshed on the server, and expire according to the configured Supabase policy.</p></div></div><MfaPanel /></main>;
}
