"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/** Native disclosure remains usable without hydration; only dismissal needs JS. */
export function MobileNavigation({ children }: { children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (details.current?.open && event.target instanceof Node && !details.current.contains(event.target)) details.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && details.current?.open) {
        details.current.open = false;
        details.current.querySelector("summary")?.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 901px)");
    function closeOnDesktop() { if (desktop.matches && details.current) details.current.open = false; }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return <details ref={details} className="mobile-navigation" onBlur={(event) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }}><summary><span className="navigation-label"><Icon name="menu" size={18} />Menu</span></summary><nav aria-label="Mobile navigation" onClick={(event) => {
    if (event.target instanceof Element && event.target.closest("a") && details.current) details.current.open = false;
  }}>{children}</nav></details>;
}
