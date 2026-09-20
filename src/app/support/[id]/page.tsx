import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageBanner } from "@/components/message-banner";
import { MediaUpload } from "@/components/media-upload";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { replySupportTicket } from "../actions";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };
type Message = { id: string; author_id: string; body: string; created_at: string };
type Attachment = { id: string; original_name: string; detected_mime: string; byte_size: number; created_at: string };

export default async function SupportTicketPage({ params, searchParams }: PageProps) {
  const [{ id }, query, identity] = await Promise.all([params, searchParams, requireIdentity()]);
  const supabase = await createServerSupabaseClient();
  const [{ data: ticket }, { data: messages }, { data: attachments }] = await Promise.all([
    supabase.from("support_tickets").select("id,subject,status,listing_id,booking_reference,created_at,updated_at").eq("id", id).eq("requester_id", identity.userId).maybeSingle(),
    supabase.from("support_ticket_messages").select("id,author_id,body,created_at").eq("ticket_id", id).order("created_at"),
    supabase.from("private_media_assets").select("id,original_name,detected_mime,byte_size,created_at").eq("support_ticket_id", id).eq("purpose", "support_attachment").eq("scan_status", "clean").order("created_at")
  ]);
  if (!ticket) notFound();
  const closed = ticket.status === "closed";
  return <main className="dashboard-shell ticket-page"><div className="dashboard-heading"><div><span className="eyebrow">Support ticket</span><h1>{ticket.subject}</h1><p>Opened {new Date(ticket.created_at).toLocaleString("en-IN")}</p></div><span className={`status ${closed || ticket.status === "resolved" ? "status-ok" : "status-warning"}`}>{ticket.status.replaceAll("_", " ")}</span></div><MessageBanner message={query.message} error={query.error} />
    <section className="message-thread">{(messages as Message[] | null)?.map((message) => <article key={message.id} className={message.author_id === identity.userId ? "message-customer" : "message-admin"}><b>{message.author_id === identity.userId ? "You" : "Pixlwave support"}</b><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("en-IN")}</small></article>)}</section>
    <section className="panel-card ticket-attachments"><span className="eyebrow">Private attachments</span><h2>Files on this ticket</h2><p>PDF, PNG or JPEG only. Files are signature-checked, scanned and available only to you and Pixlwave administrators.</p>{(attachments as Attachment[] | null)?.length ? <div className="attachment-list">{(attachments as Attachment[]).map((attachment) => <a key={attachment.id} href={`/api/support/${id}/attachments/${attachment.id}`} target="_blank" rel="noreferrer"><span>{attachment.original_name}</span><small>{attachment.detected_mime} · {(attachment.byte_size / 1024 / 1024).toFixed(1)} MB</small></a>)}</div> : <p className="small-note">No attachments yet.</p>}{!closed ? <MediaUpload purpose="ticket" ticketId={id} inputName="supportAttachmentAssetId" accept="application/pdf,image/png,image/jpeg" label="Attach PDF, PNG or JPEG (10 MB maximum)" /> : null}</section>
    {!closed ? <form action={replySupportTicket} className="panel-card form-stack reply-box"><input type="hidden" name="ticketId" value={id} /><label>Add a reply<textarea name="message" minLength={2} maxLength={5000} rows={4} required /></label><button className="button button-small">Send reply</button></form> : <div className="banner">This ticket is closed. Open a new ticket if you need more help.</div>}<Link className="text-link" href="/support">← Back to all tickets</Link>
  </main>;
}
