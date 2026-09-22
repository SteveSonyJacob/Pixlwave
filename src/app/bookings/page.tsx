import Link from "next/link";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { formatInr } from "@/lib/discovery/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cancelBookingLine } from "../cart/actions";

type PageProps = { searchParams: Promise<{ message?: string; error?: string }> };
type Line = { id: string; status: string; category: string; paid_amount_paise: number; decision_due_at: string | null; decided_at: string | null; decision_reason: string | null; listing_snapshot: { title?: string; locality?: string }; creative_snapshot: { name?: string }; requested_units: unknown };
type Refund = { booking_line_id: string; reason: string; refund_amount_paise: number; fee_amount_paise: number; status: string };

export default async function BookingsPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [{ data: lines }, { data: refunds }] = await Promise.all([
    supabase.from("booking_lines").select("id,status,category,paid_amount_paise,decision_due_at,decided_at,decision_reason,listing_snapshot,creative_snapshot,requested_units").eq("advertiser_id", identity.userId).neq("status", "draft").order("created_at", { ascending: false }),
    supabase.from("refund_obligations").select("booking_line_id,reason,refund_amount_paise,fee_amount_paise,status").eq("advertiser_id", identity.userId),
  ]);
  const refundByLine = new Map(((refunds ?? []) as Refund[]).map((item) => [item.booking_line_id, item]));
  return <main className="dashboard-shell wide-dashboard booking-page"><div className="dashboard-heading"><div><span className="eyebrow">Advertiser requests</span><h1>Booking decisions</h1><p>Every line is decided independently. Payment and refund state remain separate from inventory approval.</p></div><Link className="button button-secondary button-small" href="/cart">Cart</Link></div><MessageBanner message={query.message} error={query.error} />
    {(lines ?? []).length ? <div className="booking-line-list">{((lines ?? []) as Line[]).map((line) => { const refund = refundByLine.get(line.id); const cancellable = ["paid_pending", "approved"].includes(line.status) && line.decision_due_at; return <article className="panel-card" key={line.id}><div><span className={`status ${line.status === "approved" ? "status-ok" : line.status === "paid_pending" ? "status-warning" : "status-danger"}`}>{line.status.replaceAll("_", " ")}</span><h2>{line.listing_snapshot.title ?? "Placement"}</h2><p>{line.category} · {line.listing_snapshot.locality} · creative {line.creative_snapshot.name}</p>{line.decision_due_at ? <small>Decision/cancellation cutoff: {new Date(line.decision_due_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</small> : null}{line.decision_reason ? <p className="row-reason">{line.decision_reason}</p> : null}</div><div className="booking-money"><strong>{formatInr(line.paid_amount_paise)}</strong>{refund ? <small>{formatInr(refund.refund_amount_paise)} refund · {refund.status.replaceAll("_", " ")}{refund.fee_amount_paise ? ` · ${formatInr(refund.fee_amount_paise)} total fee` : ""}</small> : null}{cancellable ? <form action={cancelBookingLine}><input type="hidden" name="lineId" value={line.id} /><button className="button button-secondary button-small danger-button">Cancel with 95% refund</button></form> : null}</div></article>; })}</div> : <p className="queue-empty">No funded booking requests yet.</p>}
  </main>;
}
