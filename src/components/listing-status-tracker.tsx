"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { StatusTimeline } from "@/components/ui/status-timeline";

type Event = { id: number; event_type: string; message: string; created_at: string };

export function ListingStatusTracker({ listingId, events }: { listingId: string; events: Event[] }) {
  const router = useRouter();
  const reconciled = useRef(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  useEffect(() => {
    const channel = supabase.channel(`listing-status:${listingId}`).on("postgres_changes", {
      event: "INSERT", schema: "public", table: "listing_status_events", filter: `listing_id=eq.${listingId}`
    }, () => router.refresh()).subscribe((status) => {
      if (status === "SUBSCRIBED" && !reconciled.current) { reconciled.current = true; router.refresh(); }
    });
    const refreshOnFocus = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => { document.removeEventListener("visibilitychange", refreshOnFocus); void supabase.removeChannel(channel); };
  }, [listingId, router, supabase]);
  return <StatusTimeline label="Listing review history" items={events.map((event, index) => ({
    title: event.event_type.replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    detail: event.message, timestamp: new Date(event.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }),
    status: index === 0 ? "current" as const : "complete" as const
  }))} />;
}
