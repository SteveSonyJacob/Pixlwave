import Link from "next/link";

const categories = [
  { icon: "▦", name: "LED screens", unit: "Whole screen · per day", copy: "High-impact digital placements with operating hours and fixed published day rates." },
  { icon: "▶", name: "Theatre slots", unit: "Specific show · per slot", copy: "Choose visible show instances and approved pre-show duration and play commitments." },
  { icon: "↝", name: "Mobile media", unit: "Vehicle route · rotating slot", copy: "Plan across owner-permitted routes with dated, shared rotating capacity." }
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Kerala&apos;s managed media marketplace</span>
            <h1>Your campaign,<br /><em>everywhere it matters.</em></h1>
            <p>Discover LED screens, theatre moments and mobile media across Kerala—priced clearly and coordinated by a real team.</p>
            <div className="hero-actions">
              <Link className="button" href="/map">Explore the map <span>→</span></Link>
              <a className="button button-secondary" href="#process">See how it works</a>
            </div>
            <div className="trust-row">
              <span><b>₹</b> Fixed published rates</span>
              <span><b>✓</b> Admin-coordinated</span>
              <span><b>◷</b> Exact IST deadlines</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Illustration of a digital advertising screen by the Kerala coast">
            <div className="sun" />
            <div className="billboard">
              <div className="billboard-screen"><small>MAKE A</small><strong>WAVE.</strong><span>Across Kerala</span></div>
              <i className="post post-one" /><i className="post post-two" />
            </div>
            <div className="coast-line" />
            <div className="hero-note"><span className="status-dot" /><div><b>Payment received</b><small>Awaiting admin confirmation</small></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="section-heading"><div><span className="eyebrow">Media, made flexible</span><h2>Three ways to be seen</h2></div><p>Each format keeps its own honest unit, availability and service promise.</p></div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <article className={`category-card category-${index + 1}`} key={category.name}>
              <div className="category-icon">{category.icon}</div><span className="category-index">0{index + 1}</span>
              <h3>{category.name}</h3><b>{category.unit}</b><p>{category.copy}</p>
              <span className="coming">Owner inventory management ready</span>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="process-copy"><span className="eyebrow eyebrow-light">A calmer booking process</span><h2>One payment.<br />Clear decisions.</h2><p>You pay once for the frozen cart. Payment starts the review clock, but it does not reserve inventory. Pixlwave coordinates with every owner and confirms each item separately.</p><Link href="/auth/sign-up" className="button button-mint">Create your account →</Link></div>
        <ol className="timeline">
          <li><span>01</span><div><h3>Build one cart</h3><p>Select dated media units and the exact creative version. New additions use a new cart.</p></div></li>
          <li><span>02</span><div><h3>Pay once, upfront</h3><p>All submitted items are included. The cart stays unreserved while review is pending.</p></div></li>
          <li><span>03</span><div><h3>Admin coordinates</h3><p>Only Pixlwave admins discuss availability with owners and decide within 168 hours.</p></div></li>
          <li><span>04</span><div><h3>Each item resolves</h3><p>Accepted items reserve capacity; rejected items enter the manual refund queue.</p></div></li>
        </ol>
      </section>

      <section className="policy-strip" id="policy">
        <div><span className="eyebrow">Know before you pay</span><h2>Timing you can plan around.</h2></div>
        <div className="policy-stat"><strong>168h</strong><span>Admin review and advertiser cancellation cutoff from successful payment</span></div>
        <div className="policy-stat"><strong>192h</strong><span>Minimum notice before the first operating or show start</span></div>
        <p>Payment alone is not confirmation. Timely advertiser cancellation returns 95% of the cancelled line; owner inability or non-delivery remains reviewable later.</p>
      </section>
      <footer className="footer"><span>© 2026 Pixlwave</span><span>English · INR · IST · Kerala launch</span><span>Map data © OpenStreetMap contributors</span></footer>
    </main>
  );
}
