"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { reorderListingMedia } from "@/app/owner/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";

export type ListingMediaAsset = {
  id: string; original_name: string; detected_mime: string; byte_size: number; pixel_width: number | null;
  pixel_height: number | null; scan_status: string; display_order: number;
};

type UploadRow = { key: string; file: File; progress: number; status: "queued" | "uploading" | "pausing" | "paused" | "finalizing" | "failed"; sessionId?: string; uploaded?: boolean; message?: string };
type Intent = { sessionId: string; endpoint: string; bucket: string; objectKey: string; token: string; error?: string };

export function ListingMediaManager({ listingId, revisionId, assets }: { listingId: string; revisionId?: string | null; assets: ListingMediaAsset[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const uploads = useRef(new Map<string, tus.Upload>());
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [message, setMessage] = useState("");
  const [removeAsset, setRemoveAsset] = useState<ListingMediaAsset | null>(null);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const activeUploads = uploads.current;
    return () => { for (const upload of activeUploads.values()) void upload.abort(); };
  }, []);

  function patchRow(key: string, patch: Partial<UploadRow>) {
    setRows((current) => current.map((row) => row.key === key ? { ...row, ...patch } : row));
  }

  async function finalize(key: string, sessionId: string, name: string) {
    patchRow(key, { status: "finalizing", progress: 100, uploaded: true });
    try {
      const final = await fetch("/api/media/upload-finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
      const result = await final.json() as { error?: string };
      if (!final.ok) throw new Error(result.error ?? "Server validation failed.");
      uploads.current.delete(key);
      setRows((current) => current.filter((row) => row.key !== key));
      setMessage(`${name} uploaded and validated.`);
      router.refresh();
    } catch (error) {
      patchRow(key, { status: "failed", message: error instanceof Error ? error.message : "Validation could not finish. Retry validation." });
    }
  }

  async function begin(file: File) {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    await uploads.current.get(key)?.abort();
    uploads.current.delete(key);
    setRows((current) => [...current.filter((row) => row.key !== key), { key, file, progress: 0, status: "queued" }]);
    try {
    const response = await fetch("/api/media/upload-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      purpose: "listing", listingId, revisionId: revisionId ?? null, originalName: file.name, contentType: file.type, size: file.size
    }) });
    const intent = await response.json() as Intent;
    if (!response.ok || !intent.sessionId) { patchRow(key, { status: "failed", message: intent.error ?? "Upload could not start." }); return; }
    patchRow(key, { sessionId: intent.sessionId });
    const upload = new tus.Upload(file, {
      endpoint: intent.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { "x-signature": intent.token, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: false,
      chunkSize: 6 * 1024 * 1024,
      metadata: { bucketName: intent.bucket, objectName: intent.objectKey, contentType: file.type, cacheControl: "3600" },
      onProgress(bytesUploaded, bytesTotal) { patchRow(key, { status: "uploading", progress: Math.round((bytesUploaded / bytesTotal) * 100) }); },
      onError() { patchRow(key, { status: "failed", message: "The private upload was interrupted. Resume or select the file again." }); },
      onSuccess() { void finalize(key, intent.sessionId, file.name); }
    });
    uploads.current.set(key, upload);
    upload.start();
    } catch {
      patchRow(key, { status: "failed", message: "Upload authorization could not finish. Try again." });
    }
  }

  async function chooseFiles() {
    const selected = Array.from(input.current?.files ?? []).slice(0, Math.max(0, 10 - assets.length - rows.length));
    if (!selected.length) { setMessage("Choose at least one PNG or JPEG image."); return; }
    setMessage("");
    for (const file of selected) await begin(file);
    if (input.current) input.current.value = "";
  }

  async function pause(key: string) {
    patchRow(key, { status: "pausing" });
    await uploads.current.get(key)?.abort();
    patchRow(key, { status: "paused", message: "Upload paused on this device." });
  }

  function resume(key: string) {
    const upload = uploads.current.get(key);
    if (!upload) return;
    patchRow(key, { status: "uploading", message: undefined });
    upload.start();
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...assets];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    startTransition(async () => {
      const result = await reorderListingMedia({ assetIds: next.map((asset) => asset.id) });
      setMessage(result.ok ? "Image order saved." : result.message);
      if (result.ok) router.refresh();
    });
  }

  function confirmRemove() {
    if (!removeAsset) return;
    startTransition(async () => {
      const response = await fetch(`/api/media/${removeAsset.id}`, { method: "DELETE" });
      const result = response.status === 204 ? {} : await response.json().catch(() => ({})) as { error?: string };
      setMessage(response.ok ? `${removeAsset.original_name} removed.` : result.error ?? "Image could not be removed.");
      setRemoveAsset(null);
      router.refresh();
    });
  }

  return <div className="listing-media-manager">
    <div className="listing-media-picker"><label htmlFor={`listing-media-${listingId}`}>PNG or JPEG images, up to 50 MB each</label><input ref={input} id={`listing-media-${listingId}`} type="file" accept="image/png,image/jpeg" multiple disabled={pending || assets.length >= 10} /><Button size="sm" variant="secondary" disabled={pending || assets.length >= 10} onClick={() => void chooseFiles()}>Upload selected images</Button></div>
    <p className="muted">Uploads go directly to private Supabase Storage in resumable 6 MB chunks. Files become eligible for review only after server validation.</p>
    {message ? <Notice>{message}</Notice> : null}
    {rows.length ? <div className="upload-progress-list">{rows.map((row) => <div key={row.key} className="upload-progress-row"><div><b>{row.file.name}</b><small role="status">{row.status === "finalizing" ? "Validating on server…" : row.message ?? `${row.progress}% uploaded`}</small><progress max={100} value={row.progress} aria-label={`Upload progress for ${row.file.name}`} /></div><div>{row.status === "uploading" ? <Button size="sm" variant="secondary" onClick={() => void pause(row.key)}>Pause</Button> : row.status === "failed" && row.uploaded && row.sessionId ? <Button size="sm" variant="secondary" onClick={() => void finalize(row.key, row.sessionId!, row.file.name)}>Retry validation</Button> : row.status === "paused" || row.status === "failed" && row.sessionId ? <Button size="sm" variant="secondary" onClick={() => resume(row.key)}>Resume</Button> : row.status === "failed" ? <Button size="sm" variant="secondary" onClick={() => void begin(row.file)}>Try again</Button> : null}</div></div>)}</div> : null}
    {assets.length ? <ol className="listing-media-list">{assets.map((asset, index) => <li key={asset.id}><a href={`/api/media/${asset.id}/download`} target="_blank" rel="noreferrer"><b>{asset.original_name}</b><small>{asset.pixel_width && asset.pixel_height ? `${asset.pixel_width} × ${asset.pixel_height}px · ` : ""}{Math.max(1, Math.round(asset.byte_size / 1024))} KB</small></a><div><Button size="sm" variant="secondary" disabled={pending || index === 0} aria-label={`Move ${asset.original_name} earlier`} onClick={() => move(index, -1)}>↑</Button><Button size="sm" variant="secondary" disabled={pending || index === assets.length - 1} aria-label={`Move ${asset.original_name} later`} onClick={() => move(index, 1)}>↓</Button><Button size="sm" variant="danger" disabled={pending} onClick={() => setRemoveAsset(asset)}>Remove</Button></div></li>)}</ol> : <Notice>No validated listing images yet. Add at least one before submitting the initial listing.</Notice>}
    <Dialog open={Boolean(removeAsset)} title="Remove listing image?" description={removeAsset ? `${removeAsset.original_name} will no longer be included in this draft.` : undefined} onClose={() => setRemoveAsset(null)}><div className="dialog-actions"><Button variant="secondary" disabled={pending} onClick={() => setRemoveAsset(null)}>Keep image</Button><Button variant="danger" disabled={pending} onClick={confirmRemove}>{pending ? "Removing…" : "Remove image"}</Button></div></Dialog>
  </div>;
}
