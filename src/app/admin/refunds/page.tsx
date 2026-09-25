import Link from "next/link";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/discovery/domain";
import { MessageBanner } from "@/components/message-banner";
import { checkGatewayOrder, recordManualRefund } from "./actions";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };
type Obligation = { id: string; cart_id: string; booking_line_id: string; reason: string; gross_amount_paise: number; fee_amount_paise: number; processing_charge_paise: number; refund_amount_paise: number; status: string };
type Capture = { cart_id: string; provider_payment_id: string; provider_fee_paise: number | null };

export default async function AdminRefundsPage({ searchParams }: PageProps) {
  const [, query] = await Promise.all([requireAdminMfa(), searchParams]);
  const client = await createServerSupabaseClient();
  const [{ data: obligations }, { data: captures }, { data: transactions }, { data: exceptions }, { data: orders }, { data: alerts }] = await Promise.all([
    client.from("refund_obligations").select("id,cart_id,booking_line_id,reason,gross_amount_paise,fee_amount_paise,processing_charge_paise,refund_amount_paise,status").order("created_at"),
    client.from("payment_captures").select("cart_id,provider_payment_id,provider_fee_paise").eq("outcome", "allocated"),
    client.from("manual_refund_transactions").select("id,cart_id,provider_refund_id,amount_paise,completed_at").order("recorded_at", { ascending: false }).limit(50),
    client.from("payment_exceptions").select("provider_payment_id,cart_id,reason,status,created_at").eq("status", "pending_manual").order("created_at"),
    client.from("payment_orders").select("cart_id,provider_order_id,receipt,state,created_at").order("created_at", { ascending: false }).limit(50),
    client.from("payment_reconciliation_alerts").select("provider_payment_id,cart_id,amount_paise,status").eq("status", "missing_webhook").order("detected_at"),
  ]);
  const pending = ((obligations ?? []) as Obligation[]).filter((item) => item.status === "pending_manual");
  const captureByCart = new Map(((captures ?? []) as Capture[]).map((capture) => [capture.cart_id, capture]));
  const grouped = Map.groupBy(pending, (item) => item.cart_id);
  return <main className="dashboard-shell wide-dashboard booking-page"><div className="dashboard-heading"><div><span className="eyebrow">AAL2 protected</span><h1>Manual refunds</h1><p>Complete the refund in Razorpay first. Record its processed reference and evidence here; this page never sends money.</p></div><Link className="button button-secondary button-small" href="/admin/bookings">Booking review</Link></div><MessageBanner message={query.message} error={query.error} />
    {[...grouped].map(([cartId, items]) => <section className="panel-card" key={cartId}><h2>Cart {cartId.slice(0, 8)}</h2><p>Payment {captureByCart.get(cartId)?.provider_payment_id ?? "unreconciled"} · gateway fee {captureByCart.get(cartId)?.provider_fee_paise == null ? "pending verification" : formatInr(captureByCart.get(cartId)!.provider_fee_paise!)}</p><form action={recordManualRefund} className="form-stack"><input type="hidden" name="cartId" value={cartId} />{items.map((item) => <label key={item.id}><input type="checkbox" name="obligationId" value={item.id} /> Booking {item.booking_line_id.slice(0, 8)} · {item.reason.replaceAll("_", " ")} · gross {formatInr(item.gross_amount_paise)} · expected refund {formatInr(item.refund_amount_paise)}{item.fee_amount_paise ? ` · cancellation fee ${formatInr(item.fee_amount_paise)}` : ""}{item.processing_charge_paise ? ` · gateway charge ${formatInr(item.processing_charge_paise)}` : ""}</label>)}<label>Processed Razorpay refund ID<input name="refundId" pattern="rfnd_[A-Za-z0-9]+" required /></label><label>Provider completion time (IST)<input name="completedAt" type="datetime-local" required /></label><label>Dashboard or provider evidence<textarea name="proof" minLength={8} maxLength={2000} required /></label><button className="button">Verify and record selected refund lines</button></form></section>)}
    {!pending.length ? <p className="queue-empty">No manual refund obligations are pending.</p> : null}
    <section className="panel-card"><h2>Recorded refund transactions</h2>{(transactions ?? []).length ? <ul>{(transactions ?? []).map((item) => <li key={item.id}>{item.provider_refund_id} · {formatInr(Number(item.amount_paise))} · cart {item.cart_id.slice(0, 8)} · {new Date(item.completed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</li>)}</ul> : <p>No completed refund records yet.</p>}</section>
    <section className="panel-card"><h2>Captured payment exceptions</h2><p>Investigate these in the Razorpay dashboard before any external correction. They are not attached to approvable booking lines.</p>{(exceptions ?? []).length ? <ul>{(exceptions ?? []).map((item) => <li key={item.provider_payment_id}>{item.provider_payment_id} · cart {item.cart_id.slice(0, 8)} · {item.reason}</li>)}</ul> : <p>No payment exceptions pending.</p>}</section>
    <section className="panel-card"><h2>Order and webhook reconciliation</h2><p>Check provider payments for an order if the signed capture has not arrived. A captured payment found here is flagged and stays outside booking review until its original signed webhook is delivered.</p>{(alerts ?? []).length ? <ul>{(alerts ?? []).map((alert) => <li key={alert.provider_payment_id}>Missing webhook: {alert.provider_payment_id} · cart {alert.cart_id.slice(0, 8)} · {formatInr(Number(alert.amount_paise))}</li>)}</ul> : <p>No missing webhook alerts.</p>}{(orders ?? []).length ? <ul>{(orders ?? []).map((order) => <li key={order.cart_id}>Cart {order.cart_id.slice(0, 8)} · {order.provider_order_id ?? order.receipt} · {order.state}{order.provider_order_id ? <form action={checkGatewayOrder}><input type="hidden" name="cartId" value={order.cart_id} /><button className="button button-secondary button-small">Check provider payments</button></form> : <small> Match this receipt in the Razorpay test dashboard before attaching the order.</small>}</li>)}</ul> : <p>No gateway orders yet.</p>}</section>
  </main>;
}
