import Link from "next/link";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OPERATIONS_PAGE_SIZE, operationsPageNumber, pageRange } from "@/lib/operations/list-filters";

type AuditEvent = { id: number; occurred_at: string; actor_id: string | null; action: string; subject_type: string; subject_id: string; request_id: string | null; metadata: Record<string, unknown> };

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [, query] = await Promise.all([requireAdminMfa(), searchParams]);
  const page = operationsPageNumber(query.page);
  const [first, last] = pageRange(page);
  const { data, count, error } = await (await createServerSupabaseClient()).from("audit_log")
    .select("id,occurred_at,actor_id,action,subject_type,subject_id,request_id,metadata", { count: "exact" })
    .order("id", { ascending: false }).range(first, last);
  if (error) throw new Error("Audit history could not be loaded.");
  const events = (data ?? []) as AuditEvent[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / OPERATIONS_PAGE_SIZE));
  return <main className="dashboard-shell wide-dashboard"><div className="dashboard-heading"><div><span className="eyebrow">AAL2 protected</span><h1>Audit history</h1><p>Recorded actions are append-only. This view is restricted to verified administrators.</p></div><Link className="button button-secondary button-small" href="/admin">Inventory console</Link></div>
    <p className="small-note muted">{count ?? 0} recorded event(s) · page {page} of {totalPages}</p>
    {events.length ? <div className="audit-list">{events.map((event) => <article className="panel-card" key={event.id}><div className="panel-title"><div><span className="eyebrow">{event.subject_type.replaceAll("_", " ")}</span><h2>{event.action.replaceAll("_", " ")}</h2></div><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</time></div><p>Subject: <code>{event.subject_id}</code></p><p>Actor: <code>{event.actor_id ?? "System"}</code></p>{event.request_id ? <p>Request: <code>{event.request_id}</code></p> : null}{Object.keys(event.metadata ?? {}).length ? <details><summary>Recorded details</summary><pre>{JSON.stringify(event.metadata, null, 2)}</pre></details> : null}</article>)}</div> : <p className="queue-empty">{page > totalPages ? "No audit events on this page. Return to an earlier page." : "No audit events recorded."}</p>}
    {totalPages > 1 || page > 1 ? <nav className="booking-pagination" aria-label="Audit pages">{page > 1 ? <Link className="button button-secondary button-small" href={`/admin/audit?page=${Math.min(page - 1, totalPages)}`}>Previous</Link> : null}{page < totalPages ? <Link className="button button-secondary button-small" href={`/admin/audit?page=${page + 1}`}>Next</Link> : null}</nav> : null}
  </main>;
}
