import Image from "next/image";
import type { PublishedListing } from "@/lib/discovery/data";
import { formatInr } from "@/lib/discovery/domain";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { googleMapsLocationUrl } from "@/lib/maps/google-maps-url";

const categoryLabels = { led: "LED screen", theatre: "Theatre", mobile: "Mobile billboard" };
const rateLabels = { day: "per day", show_slot: "per show slot", vehicle_day_slot: "per vehicle day slot" };

/** Server-rendered listing presentation; rates and detail URLs come from the page. */
export function ListingCard({ listing, href, headingLevel = 2 }: { listing: PublishedListing; href: string; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const image = listing.cover_image_url ?? (listing.cover_asset_id ? `/api/inventory/${listing.id}/media/${listing.cover_asset_id}` : null);
  return (
    <article className="ui-card listing-card">
      <div className="listing-card-media">
        {image ? <Image src={image} alt={`${listing.title} at ${listing.locality}`} width={800} height={450} unoptimized /> : <Icon name="screen" size={48} />}
        <Badge tone="info">{categoryLabels[listing.category]}</Badge>
      </div>
      <div className="listing-card-content">
        <div className="listing-card-location"><Icon name="location" size={15} /><span>{listing.locality}, {listing.district}</span></div>
        <a className="listing-card-map-link" href={googleMapsLocationUrl(listing.latitude, listing.longitude)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${listing.title} location in Google Maps`}>Open in Google Maps ↗</a>
        <Heading className="listing-card-title">{listing.title}</Heading>
        <p className="listing-card-description">{listing.description}</p>
        <dl className="listing-card-facts">
          <div><dt>Creative duration</dt><dd>{listing.ad_duration_seconds} seconds</dd></div>
          <div><dt>Scheduled service</dt><dd>{listing.plays_per_unit.toLocaleString("en-IN")} {listing.plays_per_unit === 1 ? "play" : "plays"} / {listing.category === "theatre" ? "show" : "day"}</dd></div>
        </dl>
        <div className="listing-card-footer">
          <div className="listing-card-price"><strong>{formatInr(listing.amount_paise)}</strong><small>{rateLabels[listing.rate_unit]}</small></div>
          <LinkButton href={href} variant="secondary" size="sm" aria-label={`View details for ${listing.title}`}>View details<Icon name="arrow" size={16} /></LinkButton>
        </div>
        <p className="listing-card-disclaimer">Booking subject to admin confirmation</p>
      </div>
    </article>
  );
}
