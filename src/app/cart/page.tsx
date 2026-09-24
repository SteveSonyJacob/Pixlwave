import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { formatInr } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { removeCartLine } from "./actions";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };
type Cart = { id: string; status: string; total_amount_paise: number; submitted_at: string | null; created_at: string };
type Line = { id: string; cart_id: string; status: string; category: string; quantity: number; paid_amount_paise: number; listing_snapshot: { title?: string; locality?: string }; creative_snapshot: { name?: string; assetId?: string }; requested_units: unknown };

export default async function CartPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: carts }, { data: lines }] = await Promise.all([
    supabase.from("booking_carts").select("id,status,total_amount_paise,submitted_at,created_at").eq("advertiser_id", identity.userId).in("status", ["open", "submitted"]).order("created_at", { ascending: false }),
    supabase.from("booking_lines").select("id,cart_id,status,category,quantity,paid_amount_paise,listing_snapshot,creative_snapshot,requested_units").eq("advertiser_id", identity.userId).eq("status", "draft").order("created_at"),
  ]);
  const visibleCarts = (carts ?? []) as Cart[];
  const cartLines = (lines ?? []) as Line[];
  return <main className="dashboard-shell wide-dashboard booking-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Campaign planning</span><h1>Your booking carts</h1><p>Collect current quotes and clean creative versions in an open cart.</p></div><Link className="button button-secondary button-small" href="/discover">Add placement</Link></div>
    <MessageBanner message={query.message} error={query.error} />
    <div className="banner banner-warning">Online payment is not available yet. You can prepare a cart, but cannot submit or pay for a booking here.</div>
    {visibleCarts.length ? visibleCarts.map((cart) => {
      const items = cartLines.filter((line) => line.cart_id === cart.id);
      return <section className="panel-card booking-cart" key={cart.id}>
        <div className="panel-title"><div><span className="inventory-kicker">Cart {cart.id.slice(0, 8)}</span><h2>{cart.status === "open" ? "Open cart" : "Frozen — awaiting payment integration"}</h2></div><b>{formatInr(cart.total_amount_paise)}</b></div>
        {items.length ? <div className="booking-line-list">{items.map((line) => <article key={line.id}><div><span className="status">{line.category}</span><h3>{line.listing_snapshot.title ?? "Placement"}</h3><p>{line.quantity} unit(s) · creative: {line.creative_snapshot.name ?? "frozen asset"}</p><details><summary>Requested units</summary><pre>{JSON.stringify(line.requested_units, null, 2)}</pre></details></div><div><strong>{formatInr(line.paid_amount_paise)}</strong>{cart.status === "open" ? <form action={removeCartLine}><input type="hidden" name="lineId" value={line.id} /><button className="button button-secondary button-small danger-button">Remove</button></form> : null}</div></article>)}</div> : <p className="queue-empty">This open cart has no lines yet.</p>}
        {cart.status === "open" && items.length ? <p className="cart-submit">{items.length} planned {items.length === 1 ? "placement" : "placements"}. Review the quoted units and creative versions before checkout becomes available.</p> : null}
      </section>;
    }) : <p className="queue-empty">No open or submitted cart. Create a current quote and add it here.</p>}
    <div className="quote-actions"><Link className="button button-secondary" href="/bookings">View paid requests</Link><span>Paid requests reserve nothing until an admin approves each line.</span></div>
  </main>;
}
