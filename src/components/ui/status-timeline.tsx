import type { ReactNode } from "react";

export type TimelineItem = { title: string; detail?: ReactNode; timestamp?: string; status: "complete" | "current" | "upcoming" | "failed" };
export function StatusTimeline({ items, label = "Status history" }: { items: readonly TimelineItem[]; label?: string }) {
  return <ol className="ui-status-timeline" aria-label={label}>{items.map((item, index) => <li key={`${index}-${item.title}`} data-status={item.status}><span className="ui-status-marker" aria-hidden="true">{item.status === "complete" ? "✓" : index + 1}</span><div><div className="ui-status-heading"><b>{item.title}</b>{item.timestamp ? <time>{item.timestamp}</time> : null}</div>{item.detail ? <div className="ui-status-detail">{item.detail}</div> : null}</div></li>)}</ol>;
}
