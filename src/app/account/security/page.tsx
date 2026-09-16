import { MfaPanel } from "@/components/mfa-panel";
import { requireIdentity } from "@/lib/auth/identity";

export default async function SecurityPage() {
  await requireIdentity();
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Account security</span><h1>Security & MFA</h1><p>Sessions are cookie-backed, refreshed on the server, and expire according to the configured Supabase policy.</p></div></div><MfaPanel /></main>;
}
