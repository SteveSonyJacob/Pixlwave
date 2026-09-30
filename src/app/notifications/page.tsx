import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notificationChannels, notificationPageHref, OPERATIONS_PAGE_SIZE, pageRange, parseNotificationFilters } from "@/lib/operations/list-filters";
import { markNotificationRead } from "./actions";

type Delivery = { id: string; channel: "in_app" | "email" | "sms"; status: string; template_key: string; payload: Record<string,string>; read_at: string | null; created_at: string };
type PageProps = { searchParams: Promise<{ error?: string; view?: string; channel?: string; page?: string }> };
const labels: Record<string,string> = { "support.ticket.created": "Support ticket received", "support.ticket.admin_new": "New support ticket", "support.ticket.admin_reply": "Customer replied to support", "support.ticket.reply": "New support reply", "support.ticket.status": "Support status updated", "payment.received": "Payment received", "booking.decision": "Booking decision" };

function destination(delivery: Delivery, isAdmin: boolean) {
  const { ticketId, bookingLineId, cartId } = delivery.payload;
  if (ticketId && /^[0-9a-f-]{36}$/i.test(ticketId)) return { href: isAdmin && delivery.template_key.includes("admin") ? `/admin/support/${ticketId}` : `/support/${ticketId}`, label: "Open ticket" };
  if (bookingLineId && /^[0-9a-f-]{36}$/i.test(bookingLineId)) return { href: isAdmin ? "/admin/bookings" : `/bookings?bookingLineId=${bookingLineId}#booking-${bookingLineId}`, label: "View booking" };
  if (cartId && /^[0-9a-f-]{36}$/i.test(cartId)) return { href: isAdmin ? "/admin/bookings" : "/bookings", label: "View payment status" };
  return null;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const filters = parseNotificationFilters(query);
  const [first, last] = pageRange(filters.page);
  let deliveryQuery = (await createServerSupabaseClient()).from("notification_deliveries").select("id,channel,status,template_key,payload,read_at,created_at", { count: "exact" }).eq("recipient_id", identity.userId);
  if (filters.view === "unread") deliveryQuery = deliveryQuery.eq("channel", "in_app").is("read_at", null);
  else if (filters.channel) deliveryQuery = deliveryQuery.eq("channel", filters.channel);
  const { data, count, error } = await deliveryQuery.order("created_at", { ascending: false }).order("id").range(first, last);
  if (error) throw new Error("Notifications could not be loaded.");
  const deliveries = (data ?? []) as Delivery[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / OPERATIONS_PAGE_SIZE));
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Delivery history</span><h1>Notifications</h1><p>Channel delivery state is informational and never changes a booking deadline or campaign state.</p></div><Link className="button button-secondary button-small" href="/support">Support</Link></div><MessageBanner error={query.error} />
    <form method="get" className="booking-status-filter"><label htmlFor="notification-view">Show<select id="notification-view" name="view" defaultValue={filters.view}><option value="all">All delivery history</option><option value="unread">Unread in-app</option></select></label><label htmlFor="notification-channel">Channel<select id="notification-channel" name="channel" defaultValue={filters.channel} disabled={filters.view === "unread"}><option value="">All channels</option>{notificationChannels.map((channel) => <option key={channel} value={channel}>{channel.replaceAll("_", " ")}</option>)}</select></label><button className="button button-secondary button-small" type="submit">Apply</button><Link href="/notifications">Clear</Link></form>
    <p className="small-note muted">{count ?? 0} matching notification(s) · page {filters.page} of {totalPages}</p>
    {deliveries.length ? <div className="notification-list">{deliveries.map((delivery) => { const link = destination(delivery, identity.isAdmin); return <article key={delivery.id} className={delivery.channel === "in_app" && !delivery.read_at ? "unread" : "read"}><div><b>{labels[delivery.template_key] ?? delivery.template_key}</b><p>{delivery.payload.subject ?? delivery.payload.status ?? "Open Pixlwave for details."}</p><small>{delivery.channel.replaceAll("_", " ")} · {delivery.status} · {new Date(delivery.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</small></div>{link ? <Link className="text-link" href={link.href}>{link.label}</Link> : null}{delivery.channel === "in_app" && !delivery.read_at ? <form action={markNotificationRead}><input type="hidden" name="notificationId" value={delivery.id} /><input type="hidden" name="view" value={filters.view} /><input type="hidden" name="channel" value={filters.channel} /><input type="hidden" name="page" value={filters.page} /><button className="button button-secondary button-small">Mark read</button></form> : null}</article>; })}</div> : <div className="empty-state inventory-empty"><span>◌</span><h2>No notifications</h2><p>{filters.page > totalPages ? "No notifications on this page. Return to an earlier page." : filters.view === "unread" ? "All in-app notifications are read." : filters.channel ? "No notifications on this channel." : "Payment, booking and support events will appear here when they occur."}</p></div>}
    {totalPages > 1 || filters.page > 1 ? <nav className="booking-pagination" aria-label="Notification pages">{filters.page > 1 ? <Link className="button button-secondary button-small" href={notificationPageHref(filters, Math.min(filters.page - 1, totalPages))}>Previous</Link> : null}{filters.page < totalPages ? <Link className="button button-secondary button-small" href={notificationPageHref(filters, filters.page + 1)}>Next</Link> : null}</nav> : null}
  </main>;
}
