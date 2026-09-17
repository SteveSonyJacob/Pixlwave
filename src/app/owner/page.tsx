import Link from "next/link";
import { requireIdentity } from "@/lib/auth/identity";

export default async function OwnerPage() {
  const identity = await requireIdentity();
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Owner mode</span><h1>Media workspace</h1><p>Welcome, {identity.fullName}. Verification and listing creation arrive in Phase 2.</p></div><Link className="button button-secondary button-small" href="/account">Switch mode</Link></div><div className="restriction-grid"><section className="panel-card"><span className="status status-ok">Correct access</span><h2>Your media and confirmed fulfillment</h2><p>Owners will manage their own listings and receive only admin-authorized, confirmed service instructions.</p></section><section className="panel-card panel-restricted"><span className="status status-danger">Explicitly unavailable</span><h2>No customer request queue</h2><p>Owners cannot read raw advertiser requests, private coordination notes, accept/reject bookings, or change a published rate.</p></section></div></main>;
}
