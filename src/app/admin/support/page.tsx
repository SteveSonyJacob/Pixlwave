import Link from "next/link";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OPERATIONS_PAGE_SIZE, pageRange, parseTicketFilters, ticketPageHref, ticketStatuses } from "@/lib/operations/list-filters";

type Ticket = { id: string; subject: string; status: string; booking_reference: string | null; updated_at: string };

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const [, query] = await Promise.all([requireAdminMfa(), searchParams]);
  const filters = parseTicketFilters(query);
  const [first, last] = pageRange(filters.page);
  let ticketQuery = (await createServerSupabaseClient()).from("support_tickets").select("id,subject,status,booking_reference,updated_at", { count: "exact" });
  if (filters.status === "active") ticketQuery = ticketQuery.in("status", ["open", "in_progress"]);
  else if (filters.status) ticketQuery = ticketQuery.eq("status", filters.status);
  const { data, count, error } = await ticketQuery.order("updated_at", { ascending: false }).order("id").range(first, last);
  if (error) throw new Error("Admin support queue could not be loaded.");
  const tickets = (data ?? []) as Ticket[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / OPERATIONS_PAGE_SIZE));
  return <main className="dashboard-shell wide-dashboard"><div className="dashboard-heading"><div><span className="eyebrow">AAL2 protected</span><h1>Support queue</h1><p>Customer-visible replies, private internal notes and status history stay separated.</p></div><Link className="button button-secondary button-small" href="/admin">Inventory console</Link></div>
    <form method="get" className="booking-status-filter"><label htmlFor="admin-ticket-status">Status<select id="admin-ticket-status" name="status" defaultValue={filters.status}><option value="">All statuses</option>{ticketStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><button className="button button-secondary button-small" type="submit">Apply</button><Link href="/admin/support">Clear</Link></form><p className="small-note muted">{count ?? 0} matching ticket(s) · page {filters.page} of {totalPages}</p>
    <div className="ticket-list admin-ticket-list">{tickets.length ? tickets.map((ticket) => <Link key={ticket.id} href={`/admin/support/${ticket.id}`}><div><b>{ticket.subject}</b><small>{ticket.booking_reference ? `Booking ${ticket.booking_reference} · ` : ""}Updated {new Date(ticket.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</small></div><span className={`status ${ticket.status === "resolved" || ticket.status === "closed" ? "status-ok" : "status-warning"}`}>{ticket.status.replaceAll("_", " ")}</span></Link>) : <div className="queue-empty">{filters.page > totalPages ? "No tickets on this page. Return to an earlier page." : filters.status ? "No tickets match this status." : "No support tickets."}</div>}</div>
    {totalPages > 1 || filters.page > 1 ? <nav className="booking-pagination" aria-label="Admin support pages">{filters.page > 1 ? <Link className="button button-secondary button-small" href={ticketPageHref("/admin/support", filters, Math.min(filters.page - 1, totalPages))}>Previous</Link> : null}{filters.page < totalPages ? <Link className="button button-secondary button-small" href={ticketPageHref("/admin/support", filters, filters.page + 1)}>Next</Link> : null}</nav> : null}
  </main>;
}
