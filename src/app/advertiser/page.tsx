import Link from "next/link";
import { requireIdentity } from "@/lib/auth/identity";

export default async function AdvertiserPage() {
  const identity = await requireIdentity();
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Advertiser mode</span><h1>Campaign workspace</h1><p>Welcome, {identity.fullName}. Public inventory and paid campaign tools arrive in their owning phases.</p></div><Link className="button button-secondary button-small" href="/account">Switch mode</Link></div><div className="empty-state"><span>◎</span><h2>No campaigns yet</h2><p>Phase 1 establishes secure accounts and the truthful state model. Discovery is Phase 3 and checkout is Phase 5.</p><div className="truth-note"><b>Future paid status</b><span>“Payment received — awaiting admin confirmation”</span><small>Payment will not reserve inventory.</small></div></div></main>;
}
