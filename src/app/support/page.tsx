import Link from "next/link";
import { createSupportTicket } from "./actions";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OPERATIONS_PAGE_SIZE, pageRange, parseTicketFilters, ticketPageHref, ticketStatuses } from "@/lib/operations/list-filters";

type PageProps = { searchParams: Promise<{ error?: string; bookingLineId?: string; status?: string; page?: string }> };
type Ticket = { id: string; subject: string; status: string; updated_at: string };

export default async function SupportPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const filters = parseTicketFilters(query);
  const [first, last] = pageRange(filters.page);
  let ticketQuery = supabase.from("support_tickets").select("id,subject,status,updated_at", { count: "exact" }).eq("requester_id", identity.userId);
  if (filters.status === "active") ticketQuery = ticketQuery.in("status", ["open", "in_progress"]);
  else if (filters.status) ticketQuery = ticketQuery.eq("status", filters.status);
  const [{ data: tickets, count, error: ticketsError }, { data: listings, error: listingsError }] = await Promise.all([
    ticketQuery.order("updated_at", { ascending: false }).order("id").range(first, last),
    supabase.from("published_inventory").select("id,title,locality").order("title").limit(100)
  ]);
  if (ticketsError || listingsError) throw new Error("Support records could not be loaded.");
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / OPERATIONS_PAGE_SIZE));
  const bookingReference = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.bookingLineId ?? "") ? query.bookingLineId : "";
  return <main className="dashboard-shell support-page"><div className="dashboard-heading"><div><span className="eyebrow">Pixlwave support</span><h1>Tickets and replies</h1><p>Keep account, listing and booking questions in one access-controlled thread.</p></div><Link className="button button-secondary button-small" href="/notifications">Notifications</Link></div><MessageBanner error={query.error} />
    <div className="support-grid"><section className="panel-card"><span className="eyebrow">New ticket</span><h2>How can we help?</h2><form action={createSupportTicket} className="form-stack"><label>Subject<input name="subject" required minLength={5} maxLength={160} /></label><label>Related listing<select name="listingId" defaultValue=""><option value="">General account question</option>{listings?.map((listing) => <option key={listing.id} value={listing.id}>{listing.title} · {listing.locality}</option>)}</select></label><label>Booking reference <small>Optional; use the booking line ID from your booking status page.</small><input name="bookingReference" minLength={3} maxLength={120} defaultValue={bookingReference} /></label><label>Message<textarea name="message" required minLength={2} maxLength={5000} rows={6} /></label><button className="button">Open support ticket</button></form></section>
      <section><span className="eyebrow">Your history</span><h2>Support tickets</h2><form method="get" className="booking-status-filter"><label htmlFor="ticket-status">Status<select id="ticket-status" name="status" defaultValue={filters.status}><option value="">All statuses</option>{ticketStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><button className="button button-secondary button-small" type="submit">Apply</button><Link href="/support">Clear</Link></form><p className="small-note muted">{count ?? 0} matching ticket(s) · page {filters.page} of {totalPages}</p>{tickets?.length ? <div className="ticket-list">{(tickets as Ticket[]).map((ticket) => <Link key={ticket.id} href={`/support/${ticket.id}`}><div><b>{ticket.subject}</b><small>Updated {new Date(ticket.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</small></div><span className={`status ${ticket.status === "resolved" || ticket.status === "closed" ? "status-ok" : "status-warning"}`}>{ticket.status.replaceAll("_", " ")}</span></Link>)}</div> : <div className="queue-empty">{filters.page > totalPages ? "No tickets on this page. Return to an earlier page." : filters.status ? "No tickets match this status." : "No support tickets yet."}</div>}{totalPages > 1 || filters.page > 1 ? <nav className="booking-pagination" aria-label="Your ticket pages">{filters.page > 1 ? <Link className="button button-secondary button-small" href={ticketPageHref("/support", filters, Math.min(filters.page - 1, totalPages))}>Previous</Link> : null}{filters.page < totalPages ? <Link className="button button-secondary button-small" href={ticketPageHref("/support", filters, filters.page + 1)}>Next</Link> : null}</nav> : null}</section></div>
  </main>;
}
