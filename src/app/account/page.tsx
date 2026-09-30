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
  return <main className="dashboard-shell account-hub">
    <div className="dashboard-heading"><div><span className="eyebrow">Your account</span><h1>Hello, {identity.fullName.split(" ")[0]}</h1><p>Manage your identity, workspace and account settings.</p></div><form action={signOut}><button className="button button-secondary button-small">Sign out</button></form></div>
    <MessageBanner message={query.message} error={query.error} />
    {identity.isAdmin ? (
      <section className="mode-switcher account-mode-switcher">
        <div><span className="eyebrow eyebrow-light">Administrator access</span><h2>Admin workspace</h2><p>Open the admin console when you need to review platform activity.</p></div>
        <div className="admin-console-action"><Link className="button button-mint" href="/admin">Open Admin console →</Link></div>
      </section>
    ) : (
      <section className="mode-switcher account-mode-switcher">
        <div><span className="eyebrow eyebrow-light">One account, two workspaces</span><h2>{identity.selectedMode === "owner" ? "Screen owner workspace" : "Campaign workspace"}</h2><p>Switch whenever you need. Owner listing tools unlock after business verification is approved.</p></div>
        <div className="mode-actions">
          <form action={switchMode}><input type="hidden" name="mode" value="advertiser" /><button type="submit" className={`mode-button ${identity.selectedMode === "advertiser" ? "active" : ""}`}>Plan campaigns <small>Browse and book other owners&apos; screens</small></button></form>
          <form action={switchMode}><input type="hidden" name="mode" value="owner" /><button type="submit" className={`mode-button ${identity.selectedMode === "owner" ? "active" : ""}`}>Manage screens <small>Verify, list and schedule your inventory</small></button></form>
        </div>
      </section>
    )}
    <div className="account-settings-grid">
      <section className="panel-card account-profile-card"><div className="panel-title"><div><span className="eyebrow">Personal profile</span><h2>Profile</h2></div></div><div className="profile-summary"><span className="profile-avatar" aria-hidden="true">{identity.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{identity.fullName}</strong><span>{identity.email ?? identity.phone ?? "Verified Pixlwave account"}</span>{identity.businessName ? <small>{identity.businessName}</small> : null}</div></div><details className="profile-edit"><summary>Edit profile</summary><form action={updateProfile} className="form-stack"><label>Full name<input name="fullName" defaultValue={identity.fullName} required /></label><label>Business name<input name="businessName" defaultValue={identity.businessName ?? ""} /></label><button type="submit" className="button button-small">Save profile</button></form></details></section>
      <section className="panel-card account-settings-card"><div className="panel-title"><div><span className="eyebrow">Account settings</span><h2>Manage your account</h2></div></div><nav className="account-settings-list" aria-label="Account settings">{identity.isAdmin ? <Link href="/account/security"><strong>Security & MFA</strong><small>Protect your sign-in and sessions</small><span>Manage →</span></Link> : null}<Link href="/notifications"><strong>Notifications</strong><small>Review account updates and alerts</small><span>View →</span></Link><Link href="/support"><strong>Support</strong><small>Get help with your account or bookings</small><span>Open →</span></Link></nav></section>
    </div>
    {phoneAuthEnabled ? <IdentifierLinking hasEmail={Boolean(identity.email)} hasPhone={Boolean(identity.phone)} /> : null}
  </main>;
}
