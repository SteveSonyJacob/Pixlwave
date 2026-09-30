"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function FooterVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrivateWorkspace = ["/account", "/admin", "/advertiser", "/owner"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (pathname.startsWith("/auth/") || isPrivateWorkspace) return null;
  return children;
}
