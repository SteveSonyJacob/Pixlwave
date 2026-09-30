import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { MediaUpload } from "@/components/media-upload";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submitListing, submitListingRevision, submitOwnerVerification } from "./actions";
import { googleMapsLocationUrl } from "@/lib/maps/google-maps-url";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };
type Listing = { id: string; category: string; status: string; title: string; locality: string; district: string; latitude: number; longitude: number; owner_base_rate_paise: number; rate_unit: string; review_reason: string | null; suspension_reason: string | null; updated_at: string };
type Revision = { id: string; listing_id: string; status: string; version: number; review_reason: string | null };
function badge(status: string) { return status === "published" || status === "approved" ? "status-ok" : status === "rejected" || status === "suspended" ? "status-danger" : "status-warning"; }
function rupees(paise: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100); }

export default async function OwnerPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: verification, error: verificationError }, { data: listings, error: listingsError }, { data: checkpoints, error: checkpointError }, { data: revisions, error: revisionsError }] = await Promise.all([
    supabase.from("owner_verifications").select("status,legal_name,business_type,registration_last4,contact_phone,address,review_reason,submitted_at,reviewed_at").eq("owner_id", identity.userId).maybeSingle(),
    supabase.from("inventory_listings").select("id,category,status,title,locality,district,latitude,longitude,owner_base_rate_paise,rate_unit,review_reason,suspension_reason,updated_at").eq("owner_id", identity.userId).order("updated_at", { ascending: false }),
    supabase.from("owner_listing_drafts").select("id,listing_id,payload->>title,step,updated_at").eq("owner_id", identity.userId).eq("status", "active").is("listing_id", null).order("updated_at", { ascending: false }).limit(100),
    supabase.from("inventory_listing_revisions").select("id,listing_id,status,version,review_reason").eq("owner_id", identity.userId).in("status", ["draft", "submitted", "rejected"]).order("version", { ascending: false })
  ]);
  if (verificationError || listingsError || revisionsError) throw new Error("Owner workspace records could not be loaded.");
  const approved = verification?.status === "approved";
  const rows = (listings ?? []) as Listing[];
  return <main className="dashboard-shell wide-dashboard">
    <div className="dashboard-heading"><div><span className="eyebrow">Screen ownership</span><h1>Your media workspace</h1><p>{approved ? `${identity.fullName}, manage your screens and request self-use dates here. Changes to published availability need admin approval.` : "Complete business verification to unlock screen listings and inventory tools."}</p></div><div className="heading-actions"><Link className="button button-secondary button-small" href="/account">Switch workspace</Link>{approved ? <Link className="button button-small" href="/owner/listings/new">Add screen</Link> : null}</div></div>
    <MessageBanner message={query.message} error={query.error} />
    {approved ? <div className="metric-grid"><div><span>Published</span><strong>{rows.filter((listing) => listing.status === "published").length}</strong><small>Visible in public discovery</small></div><div><span>In review</span><strong>{rows.filter((listing) => listing.status === "submitted").length + ((revisions as Revision[] | null) ?? []).filter((revision) => revision.status === "submitted").length}</strong><small>Initial and replacement submissions</small></div><div><span>Draft work</span><strong>{rows.filter((listing) => ["draft", "rejected"].includes(listing.status)).length + (checkpoints?.length ?? 0)}</strong><small>Saved inventory and new-listing checkpoints</small></div></div> : null}
    {approved && checkpointError && !["42P01", "PGRST205"].includes(checkpointError.code) ? <MessageBanner error="Your autosaved progress could not be loaded. Refresh before starting a new listing." /> : null}
    {approved && checkpoints?.length ? <section className="panel-card"><h2>Continue an unfinished listing</h2><p>These entries are private autosaves and have not been added to inventory.</p><div className="access-list">{checkpoints.map((checkpoint) => <Link key={checkpoint.id} href={`/owner/listings/new?draft=${checkpoint.id}`}><strong>{checkpoint.title || "Untitled screen"}</strong><span>Resume step {checkpoint.step + 1} →</span></Link>)}</div></section> : null}
    <section className={`verification-card panel-card owner-verification-card ${approved ? "is-approved" : ""}`}>
      <div className="panel-title"><div><span className="eyebrow">Owner verification</span><h2>{verification ? "Review status" : "Verify your business"}</h2></div><span className={`status ${badge(verification?.status ?? "draft")}`}>{verification?.status ?? "not submitted"}</span></div>
      {approved ? <p className="owner-verification-message"><strong>Identity approved.</strong> Each listing still receives a separate admin review before it becomes public.</p> : verification?.status === "submitted" ? <p>Admin review is pending. Submitted documents remain private and are available only through short-lived authorized downloads.</p> : <>
        {verification?.review_reason ? <div className="banner banner-error">{verification.review_reason}</div> : null}
        <form action={submitOwnerVerification} className="form-stack verification-form">
          <div className="field-row"><label>Legal owner / business name<input name="legalName" required minLength={2} defaultValue={verification?.legal_name ?? identity.businessName ?? identity.fullName} /></label><label>Business type<input name="businessType" required placeholder="Individual, partnership, company…" defaultValue={verification?.business_type ?? ""} /></label></div>
          <div className="field-row"><label>Registration ID — last 4 only<input name="registrationLast4" required pattern="[A-Za-z0-9]{4}" maxLength={4} defaultValue={verification?.registration_last4 ?? ""} /></label><label>Contact phone<input name="contactPhone" type="tel" required pattern="^\+[1-9][0-9]{7,14}$" placeholder="+919876543210" defaultValue={verification?.contact_phone ?? identity.phone ?? ""} /></label></div>
          <label>Business address<textarea name="address" required minLength={10} rows={3} defaultValue={verification?.address ?? ""} /></label>
          <MediaUpload purpose="verification" inputName="documentAssetId" accept="application/pdf,image/png,image/jpeg" label="Verification document (PDF, PNG or JPEG; 10 MB maximum)" />
          <button className="button button-small">Submit for admin review</button>
        </form>
      </>}
    </section>
    {approved ? <><div className="section-heading compact-heading inventory-heading"><div><span className="eyebrow">Inventory</span><h2>Listings</h2></div><div className="inventory-heading-note"><span>Self-use dates</span><p>Open a published listing, propose unavailable dates, then submit the replacement for admin approval.</p></div></div>
    {rows.length ? <div className="inventory-table">{rows.map((listing) => { const revision = (revisions as Revision[] | null)?.find((item) => item.listing_id === listing.id); return <article key={listing.id} className="inventory-row">
      <div className={`format-mark format-${listing.category}`}>{listing.category.slice(0,1).toUpperCase()}</div>
      <div><span className="inventory-kicker">{listing.category} · {listing.locality}, {listing.district}</span><h3>{listing.title}</h3><small>Owner base: {rupees(listing.owner_base_rate_paise)} / {listing.rate_unit.replaceAll("_"," ")}</small><a className="listing-location-link" href={googleMapsLocationUrl(listing.latitude, listing.longitude)} target="_blank" rel="noopener noreferrer">Open screen location in Google Maps ↗</a>{revision ? <p className="row-reason">Replacement v{revision.version}: {revision.status}{revision.review_reason ? ` — ${revision.review_reason}` : ""}</p> : listing.review_reason || listing.suspension_reason ? <p className="row-reason">{listing.review_reason || listing.suspension_reason}</p> : null}</div>
      <div className="row-actions"><span className={`status ${badge(revision?.status ?? listing.status)}`}>{revision ? `revision ${revision.status}` : listing.status}</span>{listing.status === "draft" || listing.status === "rejected" ? <><Link className="button button-secondary button-small" href={`/owner/listings/${listing.id}/edit`}>Edit</Link><form action={submitListing}><input type="hidden" name="listingId" value={listing.id} /><button className="button button-secondary button-small">Submit review</button></form></> : listing.status === "published" && revision?.status !== "submitted" ? <><Link className="button button-secondary button-small" href={`/owner/listings/${listing.id}/edit`}>{revision ? "Edit replacement" : "Propose update"}</Link>{revision ? <form action={submitListingRevision}><input type="hidden" name="revisionId" value={revision.id} /><button className="button button-secondary button-small">Submit replacement</button></form> : null}</> : null}</div>
    </article>; })}</div> : <div className="empty-state inventory-empty"><span>▦</span><h2>No inventory yet</h2><p>{approved ? "Create an LED screen, theatre show inventory or mobile billboard route." : "Complete owner verification before creating inventory."}</p>{approved ? <Link className="button" href="/owner/listings/new">Create first listing</Link> : null}</div>}
    <section className="panel-card owner-boundary"><span className="status owner-boundary-label">Owner boundary</span><h2>Approvals stay admin-managed</h2><p>Customer requests and coordination notes stay with Pixlwave. Fulfillment details are released here only after each placement is approved.</p></section></> : null}
  </main>;
}
