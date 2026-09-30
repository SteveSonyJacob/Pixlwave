"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Reconcile the RSC snapshot after returning from checkout and while decisions are pending. */
export function BookingStatusTracker({ pending }: { pending: boolean }) {
  const router = useRouter();
  const reconciled = useRef(false);
  useEffect(() => {
    if (!reconciled.current) { reconciled.current = true; router.refresh(); }
    const refreshOnFocus = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    const timer = pending ? window.setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 30_000) : null;
    return () => { document.removeEventListener("visibilitychange", refreshOnFocus); if (timer) window.clearInterval(timer); };
  }, [pending, router]);
  return null;
}
