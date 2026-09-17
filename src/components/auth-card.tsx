import { Brand } from "@/components/brand";

export function AuthCard({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Brand />
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{copy}</p>
        {children}
      </section>
      <aside className="auth-art" aria-label="Pixlwave account benefits">
        <div className="glow-card">
          <span className="pill pill-light">Kerala launch</span>
          <h2>One account.<br />Two working modes.</h2>
          <p>Plan campaigns as an advertiser, manage media as an owner, and switch without creating a second identity.</p>
          <div className="mini-flow"><span>Advertiser</span><b>↔</b><span>Owner</span></div>
          <small>Platform administrator access is always granted separately and protected by MFA.</small>
        </div>
      </aside>
    </main>
  );
}
