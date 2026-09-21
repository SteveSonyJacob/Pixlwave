"use client";

import { useRef, useState } from "react";

export function MediaUpload({ purpose, inputName, accept, label, listingId, ticketId }: { purpose: "creative" | "verification" | "listing" | "ticket"; inputName: string; accept: string; label: string; listingId?: string; ticketId?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [assetId, setAssetId] = useState("");
  const [status, setStatus] = useState("No file uploaded.");
  const [pending, setPending] = useState(false);

  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) { setStatus("Choose a file first."); return; }
    setPending(true);
    setStatus("Validating and scanning…");
    const body = new FormData();
    body.set("file", file);
    body.set("purpose", purpose);
    if (listingId) body.set("listingId", listingId);
    if (ticketId) body.set("ticketId", ticketId);
    try {
      const response = await fetch("/api/media/upload", { method: "POST", body });
      const result = await response.json() as { asset?: { id: string; original_name: string; scan_status: string }; error?: string };
      if (!response.ok || !result.asset) throw new Error(result.error ?? "Upload failed.");
      setAssetId(result.asset.id);
      setStatus(`${result.asset.original_name} — signature verified and scan passed.`);
    } catch (error) {
      setAssetId("");
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally { setPending(false); }
  }

  return <div className="upload-control">
    <label>{label}<input ref={input} type="file" accept={accept} /></label>
    <input type="hidden" name={inputName} value={assetId} />
    <button className="button button-secondary button-small" type="button" disabled={pending} onClick={upload}>{pending ? "Scanning…" : purpose === "listing" ? "Upload listing image" : purpose === "ticket" ? "Attach file" : "Upload privately"}</button>
    <small role="status">{status}</small>
  </div>;
}
