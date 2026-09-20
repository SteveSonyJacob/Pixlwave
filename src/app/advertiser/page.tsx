import Link from "next/link";
import { requireIdentity } from "@/lib/auth/identity";

export default async function AdvertiserPage() {
  const identity = await requireIdentity();
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Advertiser mode</span><h1>Campaign workspace</h1><p>Welcome, {identity.fullName}. Prepare private, scanned creatives while public discovery is completed in Phase 3.</p></div><Link className="button button-secondary button-small" href="/account">Switch mode</Link></div><div className="dashboard-grid"><section className="panel-card"><span className="status status-ok">Phase 2 ready</span><h2>Creative library</h2><p>Upload PNG, JPEG, MP4 or WebM assets. Every file is content-signature checked, scanned and kept private.</p><Link className="button button-small" href="/advertiser/creative">Manage creatives</Link></section><section className="panel-card"><span className="status status-warning">Phase 3–5</span><h2>Discovery and campaigns</h2><p>Public inventory discovery arrives in Phase 3; paid submission and admin confirmation arrive later.</p></section></div><div className="truth-note"><b>Future paid status</b><span>“Payment received — awaiting admin confirmation”</span><small>Payment will not reserve inventory.</small></div></main>;
}
