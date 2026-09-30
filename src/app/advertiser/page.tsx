import Link from "next/link";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/discovery/domain";

type RecentLine = { id: string; status: string; paid_amount_paise: number; listing_snapshot: { title?: string; locality?: string } };

export default async function AdvertiserPage() {
  const identity = await requireIdentity();
  const supabase = await createServerSupabaseClient();
  const [{ count: awaiting, error: awaitingError }, { count: approved, error: approvedError }, { count: checkout, error: checkoutError }, { count: creatives, error: creativesError }, { data: recent, error: recentError }] = await Promise.all([
    supabase.from("booking_lines").select("id", { count: "exact", head: true }).eq("advertiser_id", identity.userId).eq("status", "paid_pending"),
    supabase.from("booking_lines").select("id", { count: "exact", head: true }).eq("advertiser_id", identity.userId).eq("status", "approved"),
    supabase.from("booking_carts").select("id", { count: "exact", head: true }).eq("advertiser_id", identity.userId).eq("status", "submitted"),
    supabase.from("private_media_assets").select("id", { count: "exact", head: true }).eq("uploader_id", identity.userId).eq("purpose", "creative").eq("scan_status", "clean"),
    supabase.from("booking_lines").select("id,status,paid_amount_paise,listing_snapshot").eq("advertiser_id", identity.userId).neq("status", "draft").order("created_at", { ascending: false }).limit(5)
  ]);
  if (awaitingError || approvedError || checkoutError || creativesError || recentError) throw new Error("Advertiser dashboard records could not be loaded.");
  return <main className="dashboard-shell wide-dashboard">
    <div className="dashboard-heading"><div><span className="eyebrow">Campaigns</span><h1>Campaign workspace</h1><p>Welcome, {identity.fullName}. Your figures below count actual cart and booking records.</p></div><Link className="button button-secondary button-small" href="/account">Switch workspace</Link></div>
    <div className="metric-grid advertiser-metrics"><Link href="/cart"><span>Ready for checkout</span><strong>{checkout ?? 0}</strong><small>Submitted carts without verified capture</small></Link><Link href="/bookings?status=paid_pending"><span>Admin review</span><strong>{awaiting ?? 0}</strong><small>Paid placements, still unreserved</small></Link><Link href="/bookings?status=approved"><span>Confirmed placements</span><strong>{approved ?? 0}</strong><small>Admin approved and allocated</small></Link><Link href="/advertiser/creative"><span>Clean creatives</span><strong>{creatives ?? 0}</strong><small>Private versions ready for compatibility checks</small></Link></div>
    <div className="dashboard-grid"><section className="panel-card"><h2>Plan a placement</h2><p>Compare published rates, choose exact inventory units, and save a quote with a compatible creative. Continue to Payment from the cart review.</p><div className="review-actions"><Link className="button button-small" href="/discover">Browse screens</Link><Link className="button button-secondary button-small" href="/cart">Open cart</Link></div></section><section className="panel-card"><h2>Creative library</h2><p>Upload PNG, JPEG, MP4 or WebM assets. Cart lines pin one clean version and its metadata.</p><Link className="button button-secondary button-small" href="/advertiser/creative">Manage creatives</Link></section></div>
    <section className="panel-card dashboard-recent"><div className="panel-title"><div><span className="eyebrow">Recent activity</span><h2>Booking requests</h2></div><Link href="/bookings">View all →</Link></div>{recent?.length ? <div className="dashboard-recent-list">{((recent ?? []) as RecentLine[]).map((line) => <div key={line.id}><div><b>{line.listing_snapshot.title ?? "Placement"}</b><small>{line.listing_snapshot.locality} · {line.status.replaceAll("_", " ")}</small></div><strong>{formatInr(line.paid_amount_paise)}</strong></div>)}</div> : <p>No paid requests yet. Your submitted carts will appear above until payment is verified.</p>}</section>
    <div className="truth-note"><b>Booking policy</b><span>Payment received — awaiting admin confirmation</span><small>Paying starts review but reserves no inventory. An admin coordinates with the owner and approves each placement separately.</small></div>
  </main>;
}
