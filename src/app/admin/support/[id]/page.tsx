import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageBanner } from "@/components/message-banner";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addInternalNote, adminReplySupportTicket, setSupportTicketStatus } from "@/app/support/actions";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };
type Message = { id: string; author_id: string; body: string; is_internal: boolean; created_at: string };
type Attachment = { id: string; original_name: string; detected_mime: string; byte_size: number };

export default async function AdminSupportTicketPage({ params, searchParams }: PageProps) {
  const [{ id }, query, identity] = await Promise.all([params, searchParams, requireAdminMfa()]);
  const supabase = await createServerSupabaseClient();
  const [{ data: ticket }, { data: messages }, { data: attachments }] = await Promise.all([
    supabase.from("support_tickets").select("id,requester_id,subject,status,listing_id,booking_reference,created_at").eq("id", id).maybeSingle(),
    supabase.from("support_ticket_messages").select("id,author_id,body,is_internal,created_at").eq("ticket_id", id).order("created_at"),
    supabase.from("private_media_assets").select("id,original_name,detected_mime,byte_size").eq("support_ticket_id", id).eq("purpose", "support_attachment").eq("scan_status", "clean").order("created_at")
  ]);
  if (!ticket) notFound();
  return <main className="dashboard-shell ticket-page"><div className="dashboard-heading"><div><span className="eyebrow">Administrator support</span><h1>{ticket.subject}</h1><p>Requester {ticket.requester_id.slice(0, 8)} · opened {new Date(ticket.created_at).toLocaleString("en-IN")}</p></div><Link className="button button-secondary button-small" href="/admin/support">All tickets</Link></div><MessageBanner message={query.message} error={query.error} />
    <form action={setSupportTicketStatus} className="panel-card ticket-status-form"><input type="hidden" name="ticketId" value={id} /><label>Status<select name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><button className="button button-small">Update status</button></form>
    <section className="message-thread admin-thread">{(messages as Message[] | null)?.map((message) => <article key={message.id} className={message.is_internal ? "message-internal" : message.author_id === identity.userId ? "message-admin" : "message-customer"}><b>{message.is_internal ? "Private admin note" : message.author_id === identity.userId ? "Pixlwave support" : "Customer"}</b><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("en-IN")}</small></article>)}</section>
    <section className="panel-card ticket-attachments"><span className="eyebrow">Customer attachments</span><h2>Private files</h2>{(attachments as Attachment[] | null)?.length ? <div className="attachment-list">{(attachments as Attachment[]).map((attachment) => <a key={attachment.id} href={`/api/support/${id}/attachments/${attachment.id}`} target="_blank" rel="noreferrer"><span>{attachment.original_name}</span><small>{attachment.detected_mime} · {(attachment.byte_size / 1024 / 1024).toFixed(1)} MB</small></a>)}</div> : <p className="small-note">No customer attachments.</p>}</section>
    {ticket.status !== "closed" ? <div className="dashboard-grid"><form action={adminReplySupportTicket} className="panel-card form-stack reply-box"><input type="hidden" name="ticketId" value={id} /><span className="eyebrow">Customer-visible</span><label>Reply<textarea name="message" minLength={2} maxLength={5000} rows={4} required /></label><button className="button button-small">Send reply</button></form><form action={addInternalNote} className="panel-card form-stack reply-box internal-note-box"><input type="hidden" name="ticketId" value={id} /><span className="eyebrow">Admin only</span><label>Private note<textarea name="message" minLength={2} maxLength={5000} rows={4} required /></label><button className="button button-secondary button-small">Add private note</button></form></div> : null}
  </main>;
}
