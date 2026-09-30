"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavigationLink({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = !href.includes("#") && (href === "/" || exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return <Link href={href} aria-current={active ? "page" : undefined}>{children}</Link>;
}
