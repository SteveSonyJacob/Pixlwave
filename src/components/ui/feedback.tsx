import type { ComponentProps, ReactNode } from "react";
import { Icon } from "./icon";

export function Badge({ tone = "neutral", className = "", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "info" | "success" | "warning" | "danger" }) {
  return <span className={`ui-badge ${className}`} data-tone={tone} {...props} />;
}

export function Notice({ tone = "info", children, ...props }: ComponentProps<"div"> & { tone?: "info" | "success" | "danger" }) {
  return <div {...props} className={`ui-notice ${props.className ?? ""}`} data-tone={tone}><Icon name={tone === "danger" ? "warning" : tone === "success" ? "check" : "info"} /><div>{children}</div></div>;
}

export function ErrorNotice({ children, ...props }: Omit<ComponentProps<"div">, "children"> & { children: ReactNode }) {
  return <Notice {...props} tone="danger" role={props.role ?? "alert"}>{children}</Notice>;
}

export function EmptyState({ title, description, children, headingLevel = 2 }: { title: string; description: string; children?: ReactNode; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return <div className="ui-empty"><Icon name="search" size={32} /><Heading>{title}</Heading><p>{description}</p>{children ? <div className="ui-empty-actions">{children}</div> : null}</div>;
}

export function Skeleton({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`ui-skeleton ${className}`} aria-hidden="true" />;
}
