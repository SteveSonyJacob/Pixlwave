import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import "./home-hero.css";
import { getFeaturedInventory, getMapInventory, type PublishedListing } from "@/lib/discovery/data";
import { keralaDistricts } from "@/lib/inventory/domain";
import { ListingCard } from "@/components/listing-card";
import { Button, LinkButton } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { HomepageMapPreview } from "@/components/homepage-map-preview";
import { getCurrentIdentity } from "@/lib/auth/identity";
import { switchMode } from "@/app/auth/actions";

const categories = [
  { icon: "▦", slug: "led", name: "LED screens", unit: "Whole screen · per day", copy: "High-impact digital placements with operating hours and fixed published day rates." },
  { icon: "▶", slug: "theatre", name: "Theatre slots", unit: "Specific show · per slot", copy: "Choose visible show instances and approved pre-show duration and play commitments." },
  { icon: "↝", slug: "mobile", name: "Mobile media", unit: "Vehicle route · rotating slot", copy: "Plan across owner-permitted routes with dated, shared rotating capacity." }
];
const popularPlaces = [
  { name: "Kochi", district: "Ernakulam", caption: "City centre and coastal corridors" },
  { name: "Thiruvananthapuram", district: "Thiruvananthapuram", caption: "Capital city and business districts" },
  { name: "Thrissur", district: "Thrissur", caption: "Central Kerala connections" },
  { name: "Kozhikode", district: "Kozhikode", caption: "North Kerala urban routes" }
];
const bookingSteps = [
  { number: "01", title: "Choose a placement", copy: "Browse a published screen, theatre slot, or mobile route.", tone: "coral" },
  { number: "02", title: "Review your quote", copy: "Confirm dates, creative, units, and fixed price.", tone: "blue" },
  { number: "03", title: "Pay to start review", copy: "Payment freezes the request and starts admin coordination; it does not reserve capacity.", tone: "amber" },
  { number: "04", title: "Get confirmation", copy: "Capacity is reserved only after admin approval.", tone: "mint" }
] as const;
const bookingPolicyStats = [
  { value: "7 days", label: "Cancellation cutoff", tone: "blue" },
  { value: "8 days", label: "Minimum notice", tone: "amber" },
  { value: "95%", label: "Timely cancellation refund", tone: "mint" }
] as const;

export default async function Home() {
  const identity = await getCurrentIdentity().catch(() => null);
  let featured: PublishedListing[] = [];
  try { featured = await getFeaturedInventory(); } catch { /* Public landing page stays useful if inventory is unavailable. */ }
  let mapListings = featured;
  try {
    const mapInventory = await getMapInventory({});
    if (mapInventory.listings.length) mapListings = mapInventory.listings;
  } catch { /* The map preview can fall back to featured inventory. */ }
  return (
    <main>
      <section className="hero hero-photograph">
        <div className="hero-photo" aria-hidden="true"><Image src="/images/home/kerala-billboard-hero-v3-4k.webp" alt="" fill sizes="100vw" quality={90} loading="eager" fetchPriority="high" className="hero-photo-image" /></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Kerala&apos;s managed media marketplace</span>
            <h1>Your campaign,<br /><em>everywhere it matters.</em></h1>
            <p>Discover LED screens, theatre moments and mobile media across Kerala—priced clearly and coordinated by a real team.</p>
            <div className="hero-actions">
              {identity ? <>
                <form action={switchMode}><input type="hidden" name="mode" value="advertiser" /><button className="button" type="submit">Plan a campaign <span>→</span></button></form>
                <form action={switchMode}><input type="hidden" name="mode" value="owner" /><button className="button button-secondary" type="submit">List your screen <span>→</span></button></form>
              </> : <>
                <Link className="button" href="/auth/sign-up?next=%2Fadvertiser">Plan a campaign <span>→</span></Link>
                <Link className="button button-secondary" href="/auth/sign-up?next=%2Fowner">List your screen <span>→</span></Link>
              </>}
            </div>
            <div className="trust-row">
              <span><b>₹</b> Fixed published rates</span>
              <span><b>✓</b> Admin-coordinated</span>
              <span><b>◷</b> Exact IST deadlines</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-search section" aria-labelledby="home-search-heading">
        <div><span className="eyebrow">Start with a place</span><h2 id="home-search-heading">Find media across Kerala</h2><p>Search published placements by location, format and rate.</p></div>
        <Form action="/discover" className="home-search-form">
          <TextField id="home-place" label="Place or media name" name="q" placeholder="City, locality or screen" />
          <SelectField id="home-format" label="Format" name="category" defaultValue=""><option value="">All formats</option><option value="led">LED screens</option><option value="theatre">Theatre slots</option><option value="mobile">Mobile media</option></SelectField>
          <SelectField id="home-district" label="District" name="district" defaultValue=""><option value="">All Kerala</option>{keralaDistricts.map((district) => <option key={district} value={district}>{district}</option>)}</SelectField>
          <TextField id="home-budget" label="Maximum ₹ / unit" name="max" type="number" min="100" step="100" placeholder="Any price" />
          <Button type="submit"><Icon name="search" size={18} />Search media</Button>
        </Form>
      </section>

      <nav className="category-rail section" aria-label="Browse media formats">
        <Link href="/discover">All media</Link>{categories.map((category) => <Link key={category.slug} href={`/discover?category=${category.slug}`}>{category.icon} {category.name}</Link>)}
      </nav>

      <section className="section popular-section" aria-labelledby="popular-heading">
        <div className="section-heading"><div><span className="eyebrow">Start near your audience</span><h2 id="popular-heading">Explore Kerala locations</h2></div></div>
        <div className="popular-grid">{popularPlaces.map((place) => <Link className="popular-place" href={`/discover?district=${encodeURIComponent(place.district)}`} key={place.name}><span className="popular-place-mark">{place.name.slice(0, 2).toUpperCase()}</span><span><strong>{place.name}</strong><small>{place.caption}</small></span><span aria-hidden="true">→</span></Link>)}</div>
      </section>

      <section className="section featured-section" aria-labelledby="featured-heading">
        <div className="section-heading"><div><span className="eyebrow">Published inventory</span><h2 id="featured-heading">Featured Kerala media</h2></div></div>
        {featured.length ? <div className="listing-grid">{featured.map((listing) => <ListingCard key={listing.id} listing={listing} headingLevel={3} href={`/media/${listing.id}`} />)}</div> : <EmptyState title="New placements are on their way" description="Published placements will appear here as they are approved."><LinkButton variant="secondary" href="/discover">Browse screens</LinkButton></EmptyState>}
      </section>

      <section className="section map-cta" aria-labelledby="map-cta-heading"><div><span className="eyebrow">Explore visually</span><h2 id="map-cta-heading">Find screens on the map</h2><p>See live billboard locations across Kerala and open any screen for its details and exact submitted coordinates.</p><LinkButton href="/map">Explore map →</LinkButton></div><HomepageMapPreview listings={mapListings.slice(0, 12)} /></section>

      <section className="section" id="categories">
        <div className="section-heading"><div><span className="eyebrow">Media, made flexible</span><h2>Three ways to be seen</h2></div></div>
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

      <section className="policy-strip" id="policy" aria-labelledby="policy-heading">
        <div className="policy-heading">
          <div><span className="eyebrow">Know before you book</span><h2 id="policy-heading">How booking works.</h2></div>
          <span className="policy-notice">Payment starts review, not reservation</span>
        </div>
        <ol className="policy-steps">
          {bookingSteps.map((step) => <li className={`policy-step policy-step-${step.tone}`} key={step.number}><span className="policy-step-number">{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></li>)}
        </ol>
        <div className="policy-summary" aria-label="Policy summary">
          {bookingPolicyStats.map((stat) => <div className={`policy-summary-item policy-summary-${stat.tone}`} key={stat.value}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
        </div>
      </section>
    </main>
  );
}
