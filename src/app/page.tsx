import Link from "next/link";
import Image from "next/image";
import { getFeaturedInventory, type PublishedListing } from "@/lib/discovery/data";
import { localDemoEnabled } from "@/lib/discovery/demo";
import { formatInr } from "@/lib/discovery/domain";
import { keralaDistricts } from "@/lib/inventory/domain";

const categories = [
  { icon: "▦", slug: "led", name: "LED screens", unit: "Whole screen · per day", copy: "High-impact digital placements with operating hours and fixed published day rates." },
  { icon: "▶", slug: "theatre", name: "Theatre slots", unit: "Specific show · per slot", copy: "Choose visible show instances and approved pre-show duration and play commitments." },
  { icon: "↝", slug: "mobile", name: "Mobile media", unit: "Vehicle route · rotating slot", copy: "Plan across owner-permitted routes with dated, shared rotating capacity." }
];

export default async function Home() {
  let featured: PublishedListing[] = [];
  try { featured = await getFeaturedInventory(); } catch { /* Public landing page stays useful if inventory is unavailable. */ }
  const featuredAreDemo = featured.length > 0 && featured.every((listing) => listing.is_demo);
  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Kerala&apos;s managed media marketplace</span>
            <h1>Your campaign,<br /><em>everywhere it matters.</em></h1>
            <p>Discover LED screens, theatre moments and mobile media across Kerala—priced clearly and coordinated by a real team.</p>
            <div className="hero-actions">
              <Link className="button" href="/auth/sign-up">Plan a campaign <span>→</span></Link>
              <Link className="button button-secondary" href="/map">Explore the map</Link>
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
            <div className="hero-note"><span className="status-dot" /><div><b>Published media</b><small>Explore before you request a quote</small></div></div>
          </div>
        </div>
      </section>

      <section className="home-search section" aria-labelledby="home-search-heading">
        <div><span className="eyebrow">Start with a place</span><h2 id="home-search-heading">Find media across Kerala</h2><p>Search published placements by location, format and rate.</p></div>
        <form action="/discover" method="get" className="home-search-form">
          <label>Place or media name<input name="q" placeholder="City, locality or screen" /></label>
          <label>Format<select name="category" defaultValue=""><option value="">All formats</option><option value="led">LED screens</option><option value="theatre">Theatre slots</option><option value="mobile">Mobile media</option></select></label>
          <label>District<select name="district" defaultValue=""><option value="">All Kerala</option>{keralaDistricts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
          <label>Maximum ₹ / unit<input name="max" type="number" min="100" step="100" placeholder="Any price" /></label>
          <button className="button" type="submit">Search media</button>
        </form>
      </section>

      <section className="section featured-section" aria-labelledby="featured-heading">
        <div className="section-heading"><div><span className="eyebrow">{featuredAreDemo ? "Local preview" : "Published inventory"}</span><h2 id="featured-heading">{featuredAreDemo ? "Sample Kerala media" : "Featured Kerala media"}</h2></div><p>{featuredAreDemo ? "Illustrative placements and prices for interface review. Demo listings cannot be booked." : "Admin-approved service terms and fixed published rates. Quotes do not reserve inventory."}</p></div>
        {localDemoEnabled() ? <div className="demo-callout"><div><b>Local preview data</b><p>Explore three illustrative placements without adding records to Supabase. Demo quotes are disabled.</p></div><div><Link className="button button-secondary button-small" href="/discover?demo=1">Browse demos</Link><Link className="button button-secondary button-small" href="/map?demo=1">Demo map</Link></div></div> : null}
        {featured.length ? <div className="featured-grid">{featured.map((listing) => <article className="featured-card" key={listing.id}>{listing.cover_image_url || listing.cover_asset_id ? <Image className="featured-card-cover" src={listing.cover_image_url ?? `/api/inventory/${listing.id}/media/${listing.cover_asset_id}`} alt={`${listing.title} at ${listing.locality}`} width={700} height={400} unoptimized /> : null}<span className={`format-mark format-${listing.category}`}>{listing.category === "led" ? "LED" : listing.category === "theatre" ? "THE" : "MOB"}</span><div>{listing.is_demo ? <span className="demo-badge">Demo listing</span> : null}<span className="inventory-kicker">{listing.locality}, {listing.district}</span><h3>{listing.title}</h3><p>{formatInr(listing.amount_paise)} / {listing.rate_unit.replaceAll("_", " ")}</p></div><Link className="button button-secondary button-small" href={`/media/${listing.id}${listing.is_demo ? "?demo=1" : ""}`}>View media</Link></article>)}</div> : <div className="featured-empty"><p>Published placements will appear here as they are approved.</p><Link className="button button-secondary button-small" href="/discover">Browse discovery</Link></div>}
      </section>

      <section className="section" id="categories">
        <div className="section-heading"><div><span className="eyebrow">Media, made flexible</span><h2>Three ways to be seen</h2></div><p>Each format keeps its own honest unit, availability and service promise.</p></div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <article className={`category-card category-${index + 1}`} key={category.name}>
              <div className="category-icon">{category.icon}</div><span className="category-index">0{index + 1}</span>
              <h3>{category.name}</h3><b>{category.unit}</b><p>{category.copy}</p>
              <Link className="coming" href={`/discover?category=${category.slug}`}>Browse format →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="process-copy"><span className="eyebrow eyebrow-light">A calmer booking process</span><h2>One payment.<br />Clear decisions.</h2><p>When checkout becomes available, you will pay once for the frozen cart. Payment starts the review clock, but it does not reserve inventory. Pixlwave coordinates with every owner and confirms each item separately.</p><Link href="/auth/sign-up" className="button button-mint">Create your account →</Link></div>
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
      <footer className="footer"><span>© 2026 Pixlwave</span><span>English · INR · IST · Kerala launch</span><span>Published discovery is live; payment confirmation remains admin-coordinated</span><span>Map data © OpenStreetMap contributors</span></footer>
    </main>
  );
}
