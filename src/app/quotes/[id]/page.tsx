import Link from "next/link";
import { notFound } from "next/navigation";
import { requireIdentity } from "@/lib/auth/identity";
import { formatInr } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addQuoteToCart } from "@/app/cart/actions";

type PageProps = { params: Promise<{ id: string }> };
type Snapshot = { title?: string; locality?: string; district?: string; rateUnit?: string; servicePromise?: string };

export default async function QuotePage({ params }: PageProps) {
  const [{ id }, identity] = await Promise.all([params, requireIdentity()]);
  const supabase = await createServerSupabaseClient();
  const [{ data: quote }, { data: current }, { data: creatives }] = await Promise.all([
    supabase.from("quote_snapshots").select("id,listing_id,rate_revision_id,category,requested_units,quantity,unit_amount_paise,total_amount_paise,currency,listing_snapshot,rate_effective_at,expires_at,created_at").eq("id", id).maybeSingle(),
    supabase.rpc("quote_snapshot_is_current", { target_quote: id }),
    supabase.from("private_media_assets").select("id,original_name,detected_mime,pixel_width,pixel_height,duration_seconds").eq("uploader_id", identity.userId).eq("purpose", "creative").eq("scan_status", "clean").order("created_at", { ascending: false })
  ]);
  if (!quote) notFound();
  const snapshot = quote.listing_snapshot as Snapshot;
  return <main className="dashboard-shell quote-page"><div className="dashboard-heading"><div><span className="eyebrow">Immutable price snapshot</span><h1>{snapshot.title ?? "Media quote"}</h1><p>{snapshot.locality}, {snapshot.district}</p></div><span className={`status ${current ? "status-ok" : "status-danger"}`}>{current ? "current" : "refresh required"}</span></div>
    <section className="panel-card quote-summary"><div><span>Quoted total</span><strong>{formatInr(quote.total_amount_paise)}</strong><small>{quote.quantity} × {formatInr(quote.unit_amount_paise)} / {snapshot.rateUnit?.replaceAll("_", " ")}</small></div><dl><div><dt>Created</dt><dd>{new Date(quote.created_at).toLocaleString("en-IN")}</dd></div><div><dt>Expires</dt><dd>{new Date(quote.expires_at).toLocaleString("en-IN")}</dd></div><div><dt>Rate revision</dt><dd>{quote.rate_revision_id.slice(0, 8)}</dd></div></dl></section>
    {!current ? <div className="banner banner-error">This quote expired, the published rate changed, or the listing is no longer published. Create a fresh snapshot before continuing.</div> : <div className="banner">Price and service terms are frozen for this quote. Availability remains provisional and this does not reserve inventory.</div>}
    <section className="panel-card"><span className="eyebrow">Service snapshot</span><h2>What the published rate covers</h2><p>{snapshot.servicePromise}</p><details><summary>Explicit units</summary><pre>{JSON.stringify(quote.requested_units, null, 2)}</pre></details></section>
    {current ? <section className="panel-card cart-add-panel"><span className="eyebrow">Phase 4 cart</span><h2>Freeze this request</h2><p>Choose the exact scanned creative version. Adding the line freezes the quote, service terms, explicit units and creative metadata; it still reserves no inventory.</p>{creatives?.length ? <form action={addQuoteToCart} className="form-stack"><input type="hidden" name="quoteId" value={quote.id} /><label>Creative<select name="creativeAssetId" required defaultValue=""><option value="" disabled>Select a clean creative</option>{creatives.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_name} · {asset.detected_mime}{asset.pixel_width ? ` · ${asset.pixel_width}×${asset.pixel_height}` : ""}</option>)}</select></label><div className="document-links">{creatives.map((asset) => <a key={asset.id} href={`/api/media/${asset.id}/preview`} target="_blank" rel="noreferrer">Preview {asset.original_name} ↗</a>)}</div>{quote.category === "mobile" ? <fieldset className="form-fieldset"><legend>Mobile route request</legend><label><input type="checkbox" name="customRouteRequested" value="true" /> Request owner-approved custom route</label><label>Route name<input name="routeName" maxLength={160} placeholder="Optional route label" /></label><label>Custom route GeoJSON<textarea name="requestedRoute" rows={5} placeholder='Optional GeoJSON LineString; the published route is used otherwise.' /></label></fieldset> : null}<button className="button">Add frozen line to cart</button></form> : <div className="banner banner-error">Upload and scan a compatible creative before adding this quote. <Link href="/advertiser/creative">Open creative library</Link>.</div>}</section> : null}
    <div className="quote-actions"><Link className="button button-secondary" href={`/media/${quote.listing_id}`}>{current ? "Change selection" : "Create fresh quote"}</Link><Link className="button button-secondary" href="/cart">View cart</Link></div>
  </main>;
}
