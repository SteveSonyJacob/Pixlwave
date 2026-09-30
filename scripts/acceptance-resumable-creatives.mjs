import { randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { Upload } from "tus-js-client";

process.loadEnvFile(".env.local");
const base = new URL(process.env.NEXT_PUBLIC_APP_URL);
if (process.env.APP_ENV === "production" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw new Error("This acceptance test requires a local app and a non-production configuration.");
if (!process.env.FIXTURE_PASSWORD) throw new Error("Configured acceptance account password is unavailable.");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function account(email) {
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (values) => values.forEach(({ name, value }) => jar.set(name, value)) }
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: process.env.FIXTURE_PASSWORD });
  assert(!error && data.user, "Acceptance account sign-in failed.");
  return { userId: data.user.id, cookie: () => [...jar].map(([key, value]) => `${key}=${value}`).join("; "), client };
}
async function post(path, input, actor) {
  const response = await fetch(new URL(path, base), { method: "POST", headers: { "Content-Type": "application/json", Cookie: actor.cookie() }, body: JSON.stringify(input) });
  return { status: response.status, body: await response.json() };
}

// Generate a valid incompressible PNG large enough to require multiple TUS chunks.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const content = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(content));
  return Buffer.concat([length, content, crc]);
}
function png() {
  const side = 1536;
  const header = Buffer.alloc(13); header.writeUInt32BE(side, 0); header.writeUInt32BE(side, 4); header[8] = 8; header[9] = 6;
  const raw = randomBytes((side * 4 + 1) * side);
  for (let row = 0; row < side; row++) raw[row * (side * 4 + 1)] = 0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

let intent;
let advertiser;
let owner;
let task;
try {
  advertiser = await account("advertiser@pixlwave.test");
  owner = await account("owner@pixlwave.test");
  const bytes = png();
  const authorized = await post("/api/media/upload-intent", { purpose: "creative", originalName: "resumable-acceptance.png", contentType: "image/png", size: bytes.length }, advertiser);
  assert(authorized.status === 200 && authorized.body.sessionId, "Creative upload intent failed.");
  intent = authorized.body;
  assert(new URL(intent.endpoint).pathname.endsWith("/upload/resumable/sign"), "Signed upload intent used the authenticated TUS endpoint.");
  assert(typeof intent.token === "string" && intent.token.split(".").length === 3, "Storage returned an invalid signed upload token format.");
  const forbidden = await post("/api/media/upload-finalize", { sessionId: intent.sessionId }, owner);
  assert(forbidden.status === 404, "A different account accessed the upload session.");
  let paused = false;
  let pauseDone;
  let uploadDone;
  let uploadFailed;
  const pausePromise = new Promise((resolve) => { pauseDone = resolve; });
  const uploaded = new Promise((resolve, reject) => { uploadDone = resolve; uploadFailed = reject; });
  void uploaded.catch(() => {});
  task = new Upload(bytes, {
    endpoint: intent.endpoint, headers: { "x-signature": intent.token, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }, chunkSize: 6 * 1024 * 1024,
    uploadDataDuringCreation: true, storeFingerprintForResuming: false,
    retryDelays: [0, 1000, 3000],
    metadata: { bucketName: intent.bucket, objectName: intent.objectKey, contentType: "image/png", cacheControl: "3600" },
    async onChunkComplete(_chunkSize, accepted, total) {
      if (!paused && accepted >= 6 * 1024 * 1024 && accepted < total) {
        paused = true;
        await task.abort();
        pauseDone();
      }
    },
    onSuccess() { uploadDone(); },
    onError(error) {
      let detail = "No safe provider message";
      try {
        const body = JSON.parse(error.originalResponse?.getBody() ?? "{}");
        const message = String(body.message ?? body.error ?? "");
        if (/^[A-Za-z0-9 .,:'()_-]{1,200}$/.test(message)) detail = message;
      } catch { /* Do not log arbitrary provider response bodies or upload URLs. */ }
      uploadFailed(new Error(`Signed resumable storage transport failed (HTTP ${error.originalResponse?.getStatus() ?? "no response"}): ${detail}`)); pauseDone();
    }
  });
  task.start();
  await pausePromise;
  if (!paused) { await uploaded; throw new Error("Upload did not reach an interrupted chunk boundary."); }
  await new Promise((resolve) => setTimeout(resolve, 100));
  task.start();
  await uploaded;
  const finals = await Promise.all([
    post("/api/media/upload-finalize", { sessionId: intent.sessionId }, advertiser),
    post("/api/media/upload-finalize", { sessionId: intent.sessionId }, advertiser)
  ]);
  assert(finals.every((result) => [200, 201].includes(result.status) && result.body.asset?.id), "Uploaded creative did not finalize.");
  assert(finals[0].body.asset.id === finals[1].body.asset.id, "Repeated finalization created different assets.");
  assert(finals[0].body.asset.pixel_width === 1536 && finals[0].body.asset.pixel_height === 1536, "Content-derived image dimensions differ.");
  assert(!("object_key" in finals[0].body.asset), "Finalize exposed the private storage key.");
  console.log("Live resumable creative acceptance passed: signed multi-chunk PNG, pause/resume, cross-account denial, concurrent idempotent finalization and content dimensions.");
} finally {
  await task?.abort();
  if (intent) {
    const removedSession = await admin.from("media_upload_sessions").delete().eq("id", intent.sessionId).eq("uploader_id", advertiser.userId);
    if (removedSession.error) throw new Error("Acceptance upload-session cleanup failed.");
    const removedAsset = await admin.from("private_media_assets").delete().eq("object_key", intent.objectKey).eq("uploader_id", advertiser.userId);
    if (removedAsset.error) throw new Error("Acceptance asset cleanup failed.");
    const removedObject = await admin.storage.from(intent.bucket).remove([intent.objectKey]);
    if (removedObject.error) throw new Error("Acceptance storage cleanup failed.");
  }
  await advertiser?.client.auth.signOut();
  await owner?.client.auth.signOut();
}
