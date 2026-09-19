import Link from "next/link";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markNotificationRead } from "./actions";

type Delivery = { id: string; channel: "in_app" | "email" | "sms"; status: string; template_key: string; payload: Record<string,string>; read_at: string | null; created_at: string };
const labels: Record<string,string> = { "support.ticket.created": "Support ticket received", "support.ticket.admin_new": "New support ticket", "support.ticket.admin_reply": "Customer replied to support", "support.ticket.reply": "New support reply", "support.ticket.status": "Support status updated" };

export default async function NotificationsPage() {
  const identity = await requireIdentity();
  const { data } = await (await createServerSupabaseClient()).from("notification_deliveries").select("id,channel,status,template_key,payload,read_at,created_at").eq("recipient_id", identity.userId).order("created_at", { ascending: false }).limit(100);
  const deliveries = (data ?? []) as Delivery[];
  return <main className="dashboard-shell"><div className="dashboard-heading"><div><span className="eyebrow">Delivery history</span><h1>Notifications</h1><p>Channel delivery state is informational and never changes a booking deadline or campaign state.</p></div><Link className="button button-secondary button-small" href="/support">Support</Link></div>{deliveries.length ? <div className="notification-list">{deliveries.map((delivery) => <article key={delivery.id} className={delivery.channel === "in_app" && !delivery.read_at ? "unread" : "read"}><div><b>{labels[delivery.template_key] ?? delivery.template_key}</b><p>{delivery.payload.subject ?? delivery.payload.status ?? "Open Pixlwave for details."}</p><small>{delivery.channel.replaceAll("_", " ")} · {delivery.status} · {new Date(delivery.created_at).toLocaleString("en-IN")}</small></div>{delivery.payload.ticketId ? <Link className="text-link" href={`/support/${delivery.payload.ticketId}`}>Open</Link> : null}{delivery.channel === "in_app" && !delivery.read_at ? <form action={markNotificationRead}><input type="hidden" name="notificationId" value={delivery.id} /><button className="button button-secondary button-small">Mark read</button></form> : null}</article>)}</div> : <div className="empty-state inventory-empty"><span>◌</span><h2>No notifications</h2><p>Ticket replies and later booking events will appear here.</p></div>}</main>;
}
