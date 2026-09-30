import type { ReactNode } from "react";
import { NavigationLink } from "./navigation-link";
import { getCurrentIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const links = {
  advertiser: [["/advertiser", "Overview"], ["/discover", "Browse screens"], ["/cart", "Cart"], ["/bookings", "Bookings"], ["/advertiser/creative", "Creative"], ["/notifications", "Notifications"], ["/support", "Support"], ["/account", "Account"]],
  owner: [["/owner", "Owner dashboard"], ["/owner/listings/new", "Add screen"], ["/notifications", "Notifications"], ["/support", "Support"], ["/account", "Account"]],
  admin: [["/admin", "Inventory"], ["/admin/bookings", "Bookings"], ["/admin/refunds", "Refunds"], ["/admin/support", "Support"], ["/admin/audit", "Audit"], ["/notifications", "Notifications"], ["/account/security", "Security"]],
  account: [["/account", "Profile & workspaces"], ["/account/security", "Security & MFA"], ["/notifications", "Notifications"], ["/support", "Support"]]
} as const;

export async function WorkspaceLayout({ role, children }: { role: keyof typeof links; children: ReactNode }) {
  const identity = role === "account" || role === "owner" ? await getCurrentIdentity() : null;
  const ownerApproval = role === "owner" && identity
    ? await (await createServerSupabaseClient()).from("owner_verifications").select("status").eq("owner_id", identity.userId).maybeSingle()
    : null;
  const visibleLinks = links[role].filter(([href]) =>
    !(role === "account" && !identity?.isAdmin && href === "/account/security") &&
    !(role === "owner" && ownerApproval?.data?.status !== "approved" && href === "/owner/listings/new")
  );
  return <div className="workspace-layout"><aside className="workspace-sidebar"><span className="eyebrow">{role === "account" ? "Your account" : `${role} workspace`}</span><nav aria-label={`${role} workspace navigation`}>{visibleLinks.map(([href, label], index) => <NavigationLink key={href} href={href} exact={index === 0}>{label}</NavigationLink>)}</nav></aside><div className="workspace-content">{children}</div></div>;
}
