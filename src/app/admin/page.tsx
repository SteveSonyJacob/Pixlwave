import { requireAdminMfa } from "@/lib/auth/identity";

export default async function AdminPage() {
  const identity = await requireAdminMfa();
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">AAL2 protected</span><h1>Admin console foundation</h1><p>{identity.fullName}, your separately granted platform role and MFA are both verified.</p></div><span className="status status-ok">Least-privilege gate active</span></div><div className="metric-grid"><div><span>Paid requests</span><strong>—</strong><small>Implemented in Phase 4</small></div><div><span>Refund tasks</span><strong>—</strong><small>Implemented in Phase 5</small></div><div><span>Owner payouts</span><strong>—</strong><small>Implemented in Phase 6</small></div></div><section className="panel-card"><h2>Authority boundary</h2><p>This console is the only future home for booking decisions and published-price changes. Phase 1 defines the permission contract; it does not expose placeholder mutation endpoints.</p></section></main>;
}
