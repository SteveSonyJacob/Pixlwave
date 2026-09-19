import Link from "next/link";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Ticket = { id: string; subject: string; status: string; booking_reference: string | null; updated_at: string };

export default async function AdminSupportPage() {
  await requireAdminMfa();
  const { data } = await (await createServerSupabaseClient()).from("support_tickets").select("id,subject,status,booking_reference,updated_at").order("updated_at", { ascending: false }).limit(200);
  const tickets = (data ?? []) as Ticket[];
  return <main className="dashboard-shell wide-dashboard"><div className="dashboard-heading"><div><span className="eyebrow">AAL2 protected</span><h1>Support queue</h1><p>Customer-visible replies, private internal notes and status history stay separated.</p></div><Link className="button button-secondary button-small" href="/admin">Inventory console</Link></div>
    <div className="ticket-list admin-ticket-list">{tickets.length ? tickets.map((ticket) => <Link key={ticket.id} href={`/admin/support/${ticket.id}`}><div><b>{ticket.subject}</b><small>{ticket.booking_reference ? `Booking ${ticket.booking_reference} · ` : ""}Updated {new Date(ticket.updated_at).toLocaleString("en-IN")}</small></div><span className={`status ${ticket.status === "resolved" || ticket.status === "closed" ? "status-ok" : "status-warning"}`}>{ticket.status.replaceAll("_", " ")}</span></Link>) : <div className="queue-empty">No support tickets.</div>}</div>
  </main>;
}
