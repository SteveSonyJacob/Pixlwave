import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { BookingStatusTracker } from "@/components/booking-status-tracker";
import { StatusTimeline, type TimelineItem } from "@/components/ui/status-timeline";
import { requireIdentity } from "@/lib/auth/identity";
import { formatInr } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BOOKING_PAGE_SIZE, bookingPageHref, parseBookingFilters, type BookingFilterQuery } from "@/lib/booking/filters";
import { SubmitButton } from "@/components/ui/submit-button";
import { cancelBookingLine } from "../cart/actions";

type PageProps = { searchParams: Promise<BookingFilterQuery & { message?: string; error?: string }> };
type Line = { id: string; cart_id: string; status: string; category: string; paid_amount_paise: number; paid_at: string | null; decision_due_at: string | null; decided_at: string | null; decision_reason: string | null; listing_snapshot: { title?: string; locality?: string }; creative_snapshot: { name?: string }; requested_units: unknown };
type Refund = { booking_line_id: string; reason: string; refund_amount_paise: number; fee_amount_paise: number; status: string };
type Event = { cart_id: string; booking_line_id: string | null; event_type: string; created_at: string };

const bookingLabels: Record<string, string> = {
  paid_pending: "Payment received · awaiting admin confirmation",
  approved: "Approved · capacity reserved",
  rejected: "Rejected",
  deadline_rejected: "Review deadline passed · refund review",
  cancelled: "Cancelled",
  payment_ineligible: "Payment received · manual refund review"
};
const refundLabels: Record<string, string> = { pending_manual: "Manual refund pending", refunded: "Refund recorded" };
const formatIst = (value: string) => `${new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST`;
async function requestTime() { return Date.now(); }

function timeline(line: Line, refund: Refund | undefined, events: Event[]): TimelineItem[] {
  const cartEvents = events.filter((event) => event.cart_id === line.cart_id && (!event.booking_line_id || event.booking_line_id === line.id));
  const paymentEvent = cartEvents.find((event) => event.event_type === "payment.captured");
  const decisionEvent = cartEvents.find((event) => event.event_type.startsWith("booking."));
  const paymentIneligible = line.status === "payment_ineligible";
  const items: TimelineItem[] = [
    { title: "Payment verified", detail: "Captured payment was recorded for this cart.", timestamp: line.paid_at ? formatIst(line.paid_at) : paymentEvent ? formatIst(paymentEvent.created_at) : undefined, status: "complete" },
    { title: "Pixlwave coordinates with the screen owner", detail: paymentIneligible ? "This request could not enter approval review." : "The screen remains unreserved until admin approval.", status: paymentIneligible ? "failed" : line.status === "paid_pending" ? "current" : "complete" }
  ];
  if (!paymentIneligible) items.push(line.status === "paid_pending"
    ? { title: "Admin decision", detail: "Awaiting a separate decision for this placement.", status: "upcoming" }
    : { title: line.status === "approved" ? "Capacity reserved" : line.status === "cancelled" ? "Booking cancelled" : "Request closed", detail: line.status === "approved" ? "Admin approved this line and allocated its units." : "Any refund obligation is tracked separately.", timestamp: line.decided_at ? formatIst(line.decided_at) : decisionEvent ? formatIst(decisionEvent.created_at) : undefined, status: line.status === "approved" ? "complete" : "failed" });
  if (refund) items.push({ title: refund.status === "refunded" ? "Refund recorded" : "Manual refund pending", detail: refund.status === "refunded" ? "See the recorded transaction confirmation below." : "The refund obligation exists; no money has been marked refunded yet.", status: refund.status === "refunded" ? "complete" : "current" });
  return items;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const filters = parseBookingFilters(query);
  const supabase = await createServerSupabaseClient();
  let lineQuery = supabase.from("booking_lines").select("id,cart_id,status,category,paid_amount_paise,paid_at,decision_due_at,decided_at,decision_reason,listing_snapshot,creative_snapshot,requested_units", { count: "exact" }).eq("advertiser_id", identity.userId).neq("status", "draft").order("created_at", { ascending: false }).order("id").range((filters.page - 1) * BOOKING_PAGE_SIZE, filters.page * BOOKING_PAGE_SIZE - 1);
  if (filters.status) lineQuery = lineQuery.eq("status", filters.status);
  if (filters.bookingLineId) lineQuery = lineQuery.eq("id", filters.bookingLineId);
  if (filters.paidFrom) lineQuery = lineQuery.gte("paid_at", filters.paidFrom);
  if (filters.paidBefore) lineQuery = lineQuery.lt("paid_at", filters.paidBefore);
  const [{ data: lines, count, error: linesError }, { count: pendingRefunds, error: refundCountError }, { data: confirmations, error: confirmationsError }, { count: submittedCount, error: cartsError }, { count: pendingCount, error: pendingError }] = await Promise.all([
    lineQuery,
    supabase.from("refund_obligations").select("id", { count: "exact", head: true }).eq("advertiser_id", identity.userId).eq("status", "pending_manual"),
    supabase.from("manual_refund_transactions").select("id,cart_id,provider_refund_id,amount_paise").order("recorded_at", { ascending: false }).limit(20),
    supabase.from("booking_carts").select("id", { count: "exact", head: true }).eq("advertiser_id", identity.userId).eq("status", "submitted"),
    supabase.from("booking_lines").select("id", { count: "exact", head: true }).eq("advertiser_id", identity.userId).eq("status", "paid_pending")
  ]);
  if (linesError || refundCountError || confirmationsError || cartsError || pendingError) throw new Error("Booking status records could not be loaded.");
  const rows = (lines ?? []) as Line[];
  const { data: refunds, error: refundsError } = rows.length ? await supabase.from("refund_obligations").select("booking_line_id,reason,refund_amount_paise,fee_amount_paise,status").eq("advertiser_id", identity.userId).in("booking_line_id", rows.map((line) => line.id)) : { data: [] };
  if (refundsError) throw new Error("Booking refund records could not be loaded.");
  const refundByLine = new Map(((refunds ?? []) as Refund[]).map((item) => [item.booking_line_id, item]));
  const cartIds = [...new Set(rows.map((line) => line.cart_id))];
  const { data: history, error: historyError } = cartIds.length
    ? await supabase.from("booking_events").select("cart_id,booking_line_id,event_type,created_at").in("cart_id", cartIds).neq("event_type", "admin.note").order("created_at", { ascending: false }).limit(500)
    : { data: [] };
  if (historyError) throw new Error("Booking status history could not be loaded.");
  const events = (history ?? []) as Event[];
  const pending = Boolean(submittedCount || pendingCount || pendingRefunds);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / BOOKING_PAGE_SIZE));
  const now = await requestTime();

  return <main className="dashboard-shell wide-dashboard booking-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Advertiser requests</span><h1>Booking decisions</h1><p>Every line is decided independently. Payment and refund state remain separate from inventory approval.</p></div><Link className="button button-secondary button-small" href="/cart">Cart</Link></div>
    <MessageBanner message={query.message} error={query.error} />
    <BookingStatusTracker pending={pending} />
    {filters.bookingLineId ? <div className="banner">Showing the linked booking request. <Link href="/bookings">View all bookings</Link>.</div> : null}
    <form key={`${filters.status}:${filters.from}:${filters.to}`} method="get" className="panel-card booking-status-filter"><label htmlFor="booking-status">Decision<select id="booking-status" name="status" defaultValue={filters.status}><option value="">All funded requests</option><option value="paid_pending">Awaiting admin</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="deadline_rejected">Deadline passed</option><option value="cancelled">Cancelled</option><option value="payment_ineligible">Payment needs review</option></select></label><label htmlFor="booking-from">Payment from (IST)<input id="booking-from" type="date" name="from" defaultValue={filters.from} /></label><label htmlFor="booking-to">Payment through (IST)<input id="booking-to" type="date" name="to" defaultValue={filters.to} /></label><button className="button button-secondary button-small" type="submit">Apply filters</button><Link href="/bookings">Clear</Link></form>
    {filters.invalidRange ? <MessageBanner error="The payment date range is invalid. Date filters were cleared; choose valid dates with the end on or after the start." /> : null}
    {submittedCount ? <div className="banner banner-warning" role="status">{submittedCount} cart(s) are prepared for checkout. A browser return is not proof of payment. Verified captures will appear below when processing completes. <Link href="/cart">Review checkout</Link>.</div> : null}
    <p className="small-note muted">{count ?? 0} matching funded request(s) · page {filters.page} of {totalPages}</p>
    {rows.length ? <div className="booking-line-list">{rows.map((line) => {
      const refund = refundByLine.get(line.id);
      const cancellable = ["paid_pending", "approved"].includes(line.status) && !!line.decision_due_at && new Date(line.decision_due_at).getTime() > now;
      return <article className="panel-card" id={`booking-${line.id}`} key={line.id}>
        <div><span className={`status ${line.status === "approved" ? "status-ok" : line.status === "paid_pending" ? "status-warning" : "status-danger"}`}>{bookingLabels[line.status] ?? line.status.replaceAll("_", " ")}</span><h2>{line.listing_snapshot.title ?? "Placement"}</h2><p>{line.category} · {line.listing_snapshot.locality} · creative {line.creative_snapshot.name}</p><small>Booking reference: {line.id}</small>{line.decision_due_at ? <small>Decision/cancellation cutoff: {formatIst(line.decision_due_at)}</small> : null}{line.decision_reason ? <p className="row-reason">{line.decision_reason}</p> : null}<div className="review-actions"><a href={`/api/receipts/${line.cart_id}`}>Download cart payment receipt</a><Link href={`/support?bookingLineId=${line.id}`}>Get support for this booking</Link></div><StatusTimeline label={`Status of ${line.listing_snapshot.title ?? "placement"}`} items={timeline(line, refund, events)} /></div>
        <div className="booking-money"><strong>{formatInr(line.paid_amount_paise)}</strong>{refund ? <small>{formatInr(refund.refund_amount_paise)} refund · {refundLabels[refund.status] ?? refund.status.replaceAll("_", " ")}{refund.fee_amount_paise ? ` · ${formatInr(refund.fee_amount_paise)} total fee` : ""}</small> : null}{cancellable ? <form action={cancelBookingLine}><input type="hidden" name="lineId" value={line.id} /><SubmitButton className="button button-secondary button-small danger-button" pendingLabel="Requesting cancellation…">Cancel with 95% manual refund</SubmitButton></form> : null}</div>
      </article>;
    })}</div> : <p className="queue-empty">{filters.bookingLineId ? "This booking request is unavailable for your account." : filters.status || filters.from || filters.to || filters.page > 1 ? "No funded requests match these filters on this page." : "No funded booking requests yet."}</p>}
    {totalPages > 1 || filters.page > 1 ? <nav className="booking-pagination" aria-label="Booking pages">{filters.page > 1 ? <Link className="button button-secondary button-small" href={bookingPageHref(filters, Math.min(filters.page - 1, totalPages))}>Previous</Link> : null}{filters.page < totalPages ? <Link className="button button-secondary button-small" href={bookingPageHref(filters, filters.page + 1)}>Next</Link> : null}{filters.page > totalPages ? <Link href={bookingPageHref(filters, 1)}>Return to first page</Link> : null}</nav> : null}
    {confirmations?.length ? <section className="panel-card"><h2>Recent completed refund confirmations</h2><p className="small-note muted">Latest 20 recorded confirmations across your bookings.</p><ul>{confirmations.map((item) => <li key={item.id}><a href={`/api/refund-confirmations/${item.id}`}>{item.provider_refund_id} · {formatInr(Number(item.amount_paise))}</a></li>)}</ul></section> : null}
  </main>;
}
