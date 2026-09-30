import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { formatInr } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { removeCartLine, submitCart } from "./actions";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import { SubmitButton } from "@/components/ui/submit-button";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };
type Cart = { id: string; status: string; total_amount_paise: number; submitted_at: string | null; checkout_expires_at: string | null; created_at: string };
type Line = { id: string; cart_id: string; status: string; category: string; quantity: number; unit_amount_paise: number; paid_amount_paise: number; listing_snapshot: { title?: string; locality?: string }; creative_snapshot: { name?: string; assetId?: string }; requested_units: unknown; service_windows: unknown };

function describeUnits(line: Line) {
  const units = Array.isArray(line.service_windows) ? line.service_windows as Record<string, unknown>[] : [];
  if (!units.length) return `${line.quantity} ${line.category === "led" ? "day" : "slot"}${line.quantity === 1 ? "" : "s"}`;
  return units.map((unit) => {
    if (line.category === "theatre" && typeof unit.startsAt === "string") return `${new Date(unit.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST · ${unit.quantity ?? 1} slot(s)`;
    return `${String(unit.date ?? "Selected date")}${line.category === "mobile" ? ` · ${unit.quantity ?? 1} rotating slot(s)` : " · whole screen"}`;
  }).join("; ");
}

export default async function CartPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: carts, error: cartsError }, { data: lines, error: linesError }] = await Promise.all([
    supabase.from("booking_carts").select("id,status,total_amount_paise,submitted_at,checkout_expires_at,created_at").eq("advertiser_id", identity.userId).in("status", ["open", "submitted"]).order("created_at", { ascending: false }),
    supabase.from("booking_lines").select("id,cart_id,status,category,quantity,unit_amount_paise,paid_amount_paise,listing_snapshot,creative_snapshot,requested_units,service_windows").eq("advertiser_id", identity.userId).eq("status", "draft").order("created_at"),
  ]);
  if (cartsError || linesError) throw new Error("Cart records could not be loaded.");
  const visibleCarts = (carts ?? []) as Cart[];
  const cartLines = (lines ?? []) as Line[];
  return <main className="dashboard-shell wide-dashboard booking-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Campaign planning</span><h1>Your booking carts</h1><p>Collect current quotes and clean creative versions in an open cart.</p></div><Link className="button button-secondary button-small" href="/discover">Add placement</Link></div>
    <MessageBanner message={query.message} error={query.error} />
    <div className="banner banner-warning">Sandbox payment collects the full cart once. Payment received means awaiting admin confirmation; capacity is reserved only if admin approves a line. A rejected line enters manual refund review.</div>
    {visibleCarts.length ? visibleCarts.map((cart) => {
      const items = cartLines.filter((line) => line.cart_id === cart.id);
      return <section className="panel-card booking-cart" key={cart.id}>
        <div className="panel-title"><div><span className="inventory-kicker">Cart {cart.id.slice(0, 8)}</span><h2>{cart.status === "open" ? "Open cart" : "Frozen — ready for payment"}</h2></div><b>{formatInr(cart.total_amount_paise)}</b></div>
        {items.length ? <div className="booking-line-list">{items.map((line) => <article key={line.id}><div><span className="status">{line.category}</span><h3>{line.listing_snapshot.title ?? "Placement"}</h3><p>{line.listing_snapshot.locality} · {describeUnits(line)}</p><p>Creative version: {line.creative_snapshot.assetId ? <a href={`/api/media/${line.creative_snapshot.assetId}/preview`} target="_blank" rel="noopener noreferrer">{line.creative_snapshot.name ?? "Preview creative"} ↗</a> : line.creative_snapshot.name ?? "Frozen asset"}</p><details><summary>Full requested units</summary><pre>{JSON.stringify(line.requested_units, null, 2)}</pre></details></div><div><small>{line.quantity} × {formatInr(line.unit_amount_paise)}</small><strong>{formatInr(line.paid_amount_paise)}</strong>{cart.status === "open" ? <form action={removeCartLine}><input type="hidden" name="lineId" value={line.id} /><button className="button button-secondary button-small danger-button">Remove</button></form> : null}</div></article>)}</div> : <p className="queue-empty">This open cart has no lines yet.</p>}
        <div className="cart-total"><span>Payable cart total</span><strong>{formatInr(cart.total_amount_paise)}</strong></div>
        {cart.status === "open" && items.length ? <form action={submitCart} className="cart-submit"><input type="hidden" name="cartId" value={cart.id} /><div><b>Review {items.length} placement(s)</b><small>Your price, dates and creative will be saved for payment.</small></div><SubmitButton pendingLabel="Preparing payment…">Continue to Payment</SubmitButton></form> : null}
        {cart.status === "submitted" ? <div className="cart-submit"><div><b>One payment for {items.length} line(s)</b><small>Checkout expires {cart.checkout_expires_at ? new Date(cart.checkout_expires_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "soon"} IST. Cancellation within 168 hours returns 95%; admin rejection is subject only to actual gateway processing charges.</small></div><RazorpayCheckout cartId={cart.id} /></div> : null}
      </section>;
    }) : <p className="queue-empty">No open or submitted cart. Create a current quote and add it here.</p>}
    <div className="quote-actions"><Link className="button button-secondary" href="/bookings">View paid requests</Link><span>Paid requests reserve nothing until an admin approves each line.</span></div>
  </main>;
}
