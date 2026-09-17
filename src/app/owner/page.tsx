import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { MediaUpload } from "@/components/media-upload";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submitListing, submitOwnerVerification } from "./actions";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };
type Listing = { id: string; category: string; status: string; title: string; locality: string; district: string; owner_base_rate_paise: number; rate_unit: string; review_reason: string | null; suspension_reason: string | null; updated_at: string };
function badge(status: string) { return status === "published" || status === "approved" ? "status-ok" : status === "rejected" || status === "suspended" ? "status-danger" : "status-warning"; }
function rupees(paise: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100); }

export default async function OwnerPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: verification }, { data: listings }] = await Promise.all([
    supabase.from("owner_verifications").select("status,legal_name,business_type,registration_last4,contact_phone,address,review_reason,submitted_at,reviewed_at").eq("owner_id", identity.userId).maybeSingle(),
    supabase.from("inventory_listings").select("id,category,status,title,locality,district,owner_base_rate_paise,rate_unit,review_reason,suspension_reason,updated_at").eq("owner_id", identity.userId).order("updated_at", { ascending: false })
  ]);
  const approved = verification?.status === "approved";
  const rows = (listings ?? []) as Listing[];
  return <main className="dashboard-shell wide-dashboard">
    <div className="dashboard-heading"><div><span className="eyebrow">Owner inventory</span><h1>Your media workspace</h1><p>{identity.fullName}, create inventory here. Admin controls verification, publication and every later published-rate change.</p></div><div className="heading-actions"><Link className="button button-secondary button-small" href="/account">Switch mode</Link>{approved ? <Link className="button button-small" href="/owner/listings/new">Add inventory</Link> : null}</div></div>
    <MessageBanner message={query.message} error={query.error} />
    <section className="verification-card panel-card">
      <div className="panel-title"><div><span className="eyebrow">Owner verification</span><h2>{verification ? "Review status" : "Verify your business"}</h2></div><span className={`status ${badge(verification?.status ?? "draft")}`}>{verification?.status ?? "not submitted"}</span></div>
      {approved ? <p>Your owner identity is approved. Each listing still needs separate admin review before it is visible publicly.</p> : verification?.status === "submitted" ? <p>Admin review is pending. Submitted documents remain private and are available only through short-lived authorized downloads.</p> : <>
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
    <div className="section-heading compact-heading"><div><span className="eyebrow">Inventory</span><h2>Listings</h2></div><p>Drafts reserve nothing. Published availability remains subject to capacity at admin approval.</p></div>
    {rows.length ? <div className="inventory-table">{rows.map((listing) => <article key={listing.id} className="inventory-row">
      <div className={`format-mark format-${listing.category}`}>{listing.category.slice(0,1).toUpperCase()}</div>
      <div><span className="inventory-kicker">{listing.category} · {listing.locality}, {listing.district}</span><h3>{listing.title}</h3><small>Owner base: {rupees(listing.owner_base_rate_paise)} / {listing.rate_unit.replaceAll("_"," ")}</small>{listing.review_reason || listing.suspension_reason ? <p className="row-reason">{listing.review_reason || listing.suspension_reason}</p> : null}</div>
      <div className="row-actions"><span className={`status ${badge(listing.status)}`}>{listing.status}</span>{listing.status === "draft" || listing.status === "rejected" ? <><Link className="button button-secondary button-small" href={`/owner/listings/${listing.id}/edit`}>Edit</Link><form action={submitListing}><input type="hidden" name="listingId" value={listing.id} /><button className="button button-secondary button-small">Submit review</button></form></> : null}</div>
    </article>)}</div> : <div className="empty-state inventory-empty"><span>▦</span><h2>No inventory yet</h2><p>{approved ? "Create an LED screen, theatre show inventory or mobile billboard route." : "Complete owner verification before creating inventory."}</p>{approved ? <Link className="button" href="/owner/listings/new">Create first listing</Link> : null}</div>}
    <section className="panel-card owner-boundary"><span className="status status-danger">Owner boundary</span><h2>No advertiser request queue</h2><p>Owners do not see raw customer requests, admin coordination notes, or accept/reject controls. Confirmed fulfillment instructions arrive only after admin approval in Phase 4.</p></section>
  </main>;
}
