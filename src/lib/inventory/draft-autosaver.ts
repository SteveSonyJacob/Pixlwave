import type { ListingFormValues } from "@/components/listing-form-model";
import type { DraftContext, DraftSaveResult } from "./drafts";

type Snapshot = { payload: ListingFormValues; step: number };
export type AutosaveState = { status: "saved" | "unsaved" | "saving" | "error" | "conflict"; revision: number; message?: string };
type Write = (input: DraftContext & Snapshot) => Promise<DraftSaveResult>;
const signature = (snapshot: Snapshot) => JSON.stringify(snapshot);

// One writer per form. A response acknowledges only its snapshot, never later keystrokes.
export class DraftAutosaver {
  private latest: Snapshot;
  private acknowledged: string;
  private pending: Promise<boolean> | null = null;
  private retry: (Snapshot & { revision: number }) | null = null;
  private listeners = new Set<(state: AutosaveState) => void>();
  state: AutosaveState;

  constructor(private context: DraftContext, initial: Snapshot, private write: Write) {
    this.latest = { payload: { ...initial.payload }, step: initial.step };
    this.acknowledged = signature(initial);
    this.state = context.stale ? { status: "conflict", revision: context.revision, message: "The inventory listing changed since this autosave. Copy any edits you need, then discard this autosave to load the current listing." } : { status: "saved", revision: context.revision };
  }
  subscribe(listener: (state: AutosaveState) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private emit(state: AutosaveState) { this.state = state; this.listeners.forEach((listener) => listener(state)); }
  update(snapshot: Snapshot) {
    this.latest = { payload: { ...snapshot.payload }, step: snapshot.step };
    if (["conflict", "error", "saving"].includes(this.state.status)) return;
    const status = signature(snapshot) === this.acknowledged ? "saved" : "unsaved";
    if (status !== this.state.status) this.emit({ ...this.state, status });
  }
  flush(force = false): Promise<boolean> {
    if (this.state.status === "conflict") return Promise.resolve(false);
    if (this.pending) return this.pending.then((ok) => ok ? this.flush(force) : false);
    if (!this.retry && signature(this.latest) === this.acknowledged && (!force || this.state.revision > 0)) return Promise.resolve(true);
    this.pending = this.drain().finally(() => { this.pending = null; });
    return this.pending;
  }
  private async drain() {
    do {
      // Keep an ambiguous network request intact so its retry can be idempotent.
      const request = this.retry ?? { ...this.latest, revision: this.state.revision };
      this.retry = request;
      this.emit({ status: "saving", revision: this.state.revision });
      let result: DraftSaveResult;
      try { result = await this.write({ id: this.context.id, listingId: this.context.listingId, baseUpdatedAt: this.context.baseUpdatedAt, ...request }); }
      catch { result = { ok: false, kind: "unavailable", message: "Connection interrupted. Keep this page open and retry saving." }; }
      if (!result.ok) {
        if (result.kind === "invalid") this.retry = null;
        this.emit({ status: result.kind === "conflict" ? "conflict" : "error", revision: this.state.revision, message: result.message });
        return false;
      }
      this.retry = null;
      this.acknowledged = signature({ payload: request.payload, step: request.step });
      this.emit({ status: signature(this.latest) === this.acknowledged ? "saved" : "unsaved", revision: result.revision });
    } while (signature(this.latest) !== this.acknowledged);
    return true;
  }
}
