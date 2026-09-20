import Link from "next/link";
import { createSupportTicket } from "./actions";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { searchParams: Promise<{ error?: string }> };
type Ticket = { id: string; subject: string; status: string; updated_at: string };

export default async function SupportPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: tickets }, { data: listings }] = await Promise.all([
    supabase.from("support_tickets").select("id,subject,status,updated_at").eq("requester_id", identity.userId).order("updated_at", { ascending: false }),
    supabase.from("published_inventory").select("id,title,locality").order("title").limit(100)
  ]);
  return <main className="dashboard-shell support-page"><div className="dashboard-heading"><div><span className="eyebrow">Pixlwave support</span><h1>Tickets and replies</h1><p>Keep account and listing questions in one access-controlled thread. Booking references become available when Phase 4 creates them.</p></div><Link className="button button-secondary button-small" href="/notifications">Notifications</Link></div><MessageBanner error={query.error} />
    <div className="support-grid"><section className="panel-card"><span className="eyebrow">New ticket</span><h2>How can we help?</h2><form action={createSupportTicket} className="form-stack"><label>Subject<input name="subject" required minLength={5} maxLength={160} /></label><label>Related listing<select name="listingId" defaultValue=""><option value="">General account question</option>{listings?.map((listing) => <option key={listing.id} value={listing.id}>{listing.title} · {listing.locality}</option>)}</select></label><label>Booking reference <small>Optional; Phase 4 bookings will use this field.</small><input name="bookingReference" maxLength={120} /></label><label>Message<textarea name="message" required minLength={2} maxLength={5000} rows={6} /></label><button className="button">Open support ticket</button></form></section>
      <section><span className="eyebrow">Your history</span><h2>Recent tickets</h2>{tickets?.length ? <div className="ticket-list">{(tickets as Ticket[]).map((ticket) => <Link key={ticket.id} href={`/support/${ticket.id}`}><div><b>{ticket.subject}</b><small>Updated {new Date(ticket.updated_at).toLocaleString("en-IN")}</small></div><span className={`status ${ticket.status === "resolved" || ticket.status === "closed" ? "status-ok" : "status-warning"}`}>{ticket.status.replaceAll("_", " ")}</span></Link>)}</div> : <div className="queue-empty">No support tickets yet.</div>}</section></div>
  </main>;
}
