import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { IdentifierLinking } from "@/components/identifier-linking";
import { requireIdentity } from "@/lib/auth/identity";
import { signOut, switchMode, updateProfile } from "@/app/auth/actions";
import { isPhoneAuthEnabled } from "@/lib/auth/features";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function AccountPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const phoneAuthEnabled = isPhoneAuthEnabled();
  return <main className="dashboard-shell">
    <div className="dashboard-heading"><div><span className="eyebrow">Account foundation</span><h1>Hello, {identity.fullName.split(" ")[0]}</h1><p>Manage one verified identity and move between your advertiser and owner workspaces.</p></div><form action={signOut}><button className="button button-secondary button-small">Sign out</button></form></div>
    <MessageBanner message={query.message} error={query.error} />
    <section className="mode-switcher">
      <div><span className="eyebrow eyebrow-light">Current mode</span><h2>{identity.selectedMode === "owner" ? "Owner workspace" : "Advertiser workspace"}</h2><p>Mode changes navigation and permitted actions. It never grants admin privilege.</p></div>
      <div className="mode-actions">
        <form action={switchMode}><input type="hidden" name="mode" value="advertiser" /><button className={`mode-button ${identity.selectedMode === "advertiser" ? "active" : ""}`}>Advertiser <small>Plan and track campaigns</small></button></form>
        <form action={switchMode}><input type="hidden" name="mode" value="owner" /><button className={`mode-button ${identity.selectedMode === "owner" ? "active" : ""}`}>Owner <small>Manage your media</small></button></form>
      </div>
    </section>
    <div className="dashboard-grid">
      <section className="panel-card"><div className="panel-title"><div><span className="eyebrow">Personal profile</span><h2>Business details</h2></div></div><form action={updateProfile} className="form-stack"><label>Full name<input name="fullName" defaultValue={identity.fullName} required /></label><label>Business name<input name="businessName" defaultValue={identity.businessName ?? ""} /></label><button className="button button-small">Save profile</button></form></section>
      <section className="panel-card"><div className="panel-title"><div><span className="eyebrow">Access summary</span><h2>What you can open</h2></div></div><div className="access-list"><Link href="/advertiser"><b>Advertiser dashboard</b><span>Enabled →</span></Link><Link href="/owner"><b>Owner dashboard</b><span>Enabled →</span></Link><Link href="/support"><b>Support tickets</b><span>Open →</span></Link><Link href="/notifications"><b>Notifications</b><span>View →</span></Link><Link href="/account/security"><b>Security & MFA</b><span>Manage →</span></Link>{identity.isAdmin ? <Link href="/admin"><b>Admin console</b><span>MFA required →</span></Link> : <div><b>Admin console</b><span>Not granted</span></div>}</div></section>
    </div>
    {phoneAuthEnabled ? <IdentifierLinking hasEmail={Boolean(identity.email)} hasPhone={Boolean(identity.phone)} /> : null}
  </main>;
}
