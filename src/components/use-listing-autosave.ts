"use client";

import { startTransition, useEffect, useState } from "react";
import { saveListingCheckpoint } from "@/app/owner/draft-actions";
import { DraftAutosaver, type AutosaveState } from "@/lib/inventory/draft-autosaver";
import type { DraftContext } from "@/lib/inventory/drafts";
import type { ListingFormValues } from "./listing-form-model";

export function useListingAutosave(draft: DraftContext | undefined, payload: ListingFormValues, step: number, paused: boolean) {
  const [manager] = useState(() => draft ? new DraftAutosaver(draft, { payload, step }, saveListingCheckpoint) : null);
  const [state, setState] = useState<AutosaveState>(() => manager?.state ?? { status: "saved", revision: 0 });

  useEffect(() => manager?.subscribe((next) => {
    setState(next);
    if (next.revision > 0 && draft && !draft.listingId) {
      const url = new URL(window.location.href);
      url.searchParams.set("draft", draft.id);
      // Native history preserves the current form while making reloads resumable.
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }), [manager, draft]);

  useEffect(() => {
    if (!manager || paused) return;
    manager.update({ payload, step });
    if (manager.state.status === "error" || manager.state.status === "conflict") return;
    const timer = window.setTimeout(() => startTransition(async () => { await manager.flush(); }), 900);
    return () => window.clearTimeout(timer);
  }, [manager, payload, step, paused]);

  return { state, manager };
}
