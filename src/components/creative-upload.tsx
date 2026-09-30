"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";

type Intent = { sessionId: string; endpoint: string; bucket: string; objectKey: string; token: string; error?: string };
type UploadState = "idle" | "authorizing" | "uploading" | "pausing" | "paused" | "finalizing" | "failed" | "complete";
const MAX_BYTES = 50 * 1024 * 1024;
const allowedTypes = new Set(["image/png", "image/jpeg", "video/mp4", "video/webm"]);

export function CreativeUpload() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useRef<tus.Upload | null>(null);
  const sessionId = useRef<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [hasTask, setHasTask] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState("Choose a PNG, JPEG, MP4 or WebM file, up to 50 MB.");
  useEffect(() => () => { void upload.current?.abort(); }, []);

  async function finalize(id: string) {
    setState("finalizing");
    setMessage("Checking the uploaded file on the server…");
    try {
      const response = await fetch("/api/media/upload-finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: id }) });
      const result = await response.json() as { asset?: { original_name: string }; error?: string };
      if (!response.ok || !result.asset) throw new Error(result.error ?? "Validation could not finish.");
      sessionId.current = null;
      upload.current = null;
      setHasSession(false);
      setHasTask(false);
      setState("complete");
      setMessage(`${result.asset.original_name} is saved privately. The creative library has been refreshed.`);
      setProgress(100);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (error) {
      setState("failed");
      setMessage(error instanceof Error ? error.message : "Validation could not finish. Retry finalization.");
    }
  }

  async function start() {
    const file = fileInput.current?.files?.[0];
    if (!file || !allowedTypes.has(file.type) || file.size < 1 || file.size > MAX_BYTES) {
      setState("failed");
      setMessage("Choose a PNG, JPEG, MP4 or WebM file between 1 byte and 50 MB.");
      return;
    }
    await upload.current?.abort();
    upload.current = null;
    sessionId.current = null;
    setHasTask(false);
    setHasSession(false);
    setState("authorizing");
    setProgress(0);
    setMessage("Creating a private upload session…");
    try {
      const response = await fetch("/api/media/upload-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "creative", originalName: file.name, contentType: file.type, size: file.size }) });
      const intent = await response.json() as Intent;
      if (!response.ok || !intent.sessionId) throw new Error(intent.error ?? "Upload could not start.");
      sessionId.current = intent.sessionId;
      setHasSession(true);
      const task = new tus.Upload(file, {
        endpoint: intent.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { "x-signature": intent.token, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
        uploadDataDuringCreation: true,
        storeFingerprintForResuming: false,
        chunkSize: 6 * 1024 * 1024,
        metadata: { bucketName: intent.bucket, objectName: intent.objectKey, contentType: file.type, cacheControl: "3600" },
        onProgress(uploaded, total) { setProgress(Math.round(uploaded / total * 100)); setState("uploading"); setMessage("Uploading directly to private storage…"); },
        onError() { setState("failed"); setMessage("The private upload was interrupted. Resume this upload or start a new session."); },
        onSuccess() { void finalize(intent.sessionId); }
      });
      upload.current = task;
      setHasTask(true);
      setState("uploading");
      task.start();
    } catch (error) {
      setState("failed");
      setMessage(error instanceof Error ? error.message : "Upload could not start.");
    }
  }

  async function pause() {
    setState("pausing");
    await upload.current?.abort();
    setState("paused");
    setMessage("Upload paused on this device. Resume when ready.");
  }

  function resume() {
    if (!upload.current) return;
    setState("uploading");
    setMessage("Resuming private upload…");
    upload.current.start();
  }

  return <div className="upload-control creative-upload">
    <label htmlFor="creative-file">Creative file (PNG, JPEG, MP4 or WebM; 50 MB maximum)</label>
    <input ref={fileInput} id="creative-file" type="file" accept="image/png,image/jpeg,video/mp4,video/webm" disabled={["authorizing", "uploading", "pausing", "finalizing"].includes(state)} />
    <div className="review-actions"><button className="button button-secondary button-small" type="button" disabled={["authorizing", "uploading", "pausing", "finalizing"].includes(state)} onClick={() => void start()}>{state === "failed" ? "Start new upload" : "Upload privately"}</button>{state === "uploading" ? <button className="button button-secondary button-small" type="button" onClick={() => void pause()}>Pause</button> : null}{hasTask && (state === "paused" || state === "failed" && progress < 100) ? <button className="button button-secondary button-small" type="button" onClick={resume}>Resume</button> : null}{hasSession && state === "failed" && progress === 100 ? <button className="button button-secondary button-small" type="button" onClick={() => { if (sessionId.current) void finalize(sessionId.current); }}>Retry validation</button> : null}</div>
    {state !== "idle" ? <progress max={100} value={progress} aria-label="Creative upload progress" /> : null}
    <small role="status">{message}{state === "uploading" || state === "paused" ? ` ${progress}%` : ""}</small>
  </div>;
}
