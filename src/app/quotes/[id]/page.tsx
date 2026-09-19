import Link from "next/link";
import { notFound } from "next/navigation";
import { requireIdentity } from "@/lib/auth/identity";
import { formatInr } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };
type Snapshot = { title?: string; locality?: string; district?: string; rateUnit?: string; servicePromise?: string };

export default async function QuotePage({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireIdentity()]);
  const supabase = await createServerSupabaseClient();
  const [{ data: quote }, { data: current }] = await Promise.all([
    supabase.from("quote_snapshots").select("id,listing_id,rate_revision_id,category,requested_units,quantity,unit_amount_paise,total_amount_paise,currency,listing_snapshot,rate_effective_at,expires_at,created_at").eq("id", id).maybeSingle(),
    supabase.rpc("quote_snapshot_is_current", { target_quote: id })
  ]);
  if (!quote) notFound();
  const snapshot = quote.listing_snapshot as Snapshot;
  return <main className="dashboard-shell quote-page"><div className="dashboard-heading"><div><span className="eyebrow">Immutable price snapshot</span><h1>{snapshot.title ?? "Media quote"}</h1><p>{snapshot.locality}, {snapshot.district}</p></div><span className={`status ${current ? "status-ok" : "status-danger"}`}>{current ? "current" : "refresh required"}</span></div>
    <section className="panel-card quote-summary"><div><span>Quoted total</span><strong>{formatInr(quote.total_amount_paise)}</strong><small>{quote.quantity} × {formatInr(quote.unit_amount_paise)} / {snapshot.rateUnit?.replaceAll("_", " ")}</small></div><dl><div><dt>Created</dt><dd>{new Date(quote.created_at).toLocaleString("en-IN")}</dd></div><div><dt>Expires</dt><dd>{new Date(quote.expires_at).toLocaleString("en-IN")}</dd></div><div><dt>Rate revision</dt><dd>{quote.rate_revision_id.slice(0, 8)}</dd></div></dl></section>
    {!current ? <div className="banner banner-error">This quote expired, the published rate changed, or the listing is no longer published. Create a fresh snapshot before continuing.</div> : <div className="banner">Price and service terms are frozen for this quote. Availability remains provisional and this does not reserve inventory.</div>}
    <section className="panel-card"><span className="eyebrow">Service snapshot</span><h2>What the published rate covers</h2><p>{snapshot.servicePromise}</p><details><summary>Explicit units</summary><pre>{JSON.stringify(quote.requested_units, null, 2)}</pre></details></section>
    <div className="quote-actions"><Link className="button button-secondary" href={`/media/${quote.listing_id}`}>{current ? "Change selection" : "Create fresh quote"}</Link><span>Payment and campaign submission begin in Phase 4.</span></div>
  </main>;
}
