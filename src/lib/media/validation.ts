import { createHash } from "node:crypto";

export const MAX_CREATIVE_BYTES = 50 * 1024 * 1024;
export const MAX_VERIFICATION_BYTES = 10 * 1024 * 1024;
export const SIGNED_DOWNLOAD_SECONDS = 300;

export type DetectedMedia = {
  mimeType: "image/png" | "image/jpeg" | "video/mp4" | "video/webm" | "application/pdf";
  kind: "image" | "video" | "document";
  width: number | null;
  height: number | null;
  sha256: string;
};

function jpegDimensions(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] };
    }
    if (length < 2) break;
    offset += length + 2;
  }
  return { width: null, height: null };
}

export function detectMedia(bytes: Uint8Array): DetectedMedia {
  if (bytes.length < 12) throw new Error("File is empty or truncated.");
  const head = Array.from(bytes.slice(0, 12));
  let detected: Omit<DetectedMedia, "sha256">;
  if (head.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") {
    detected = { mimeType: "image/png", kind: "image", width: (bytes[16] * 2 ** 24) + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19], height: (bytes[20] * 2 ** 24) + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23] };
  } else if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    detected = { mimeType: "image/jpeg", kind: "image", ...jpegDimensions(bytes) };
  } else if (String.fromCharCode(...head.slice(4, 8)) === "ftyp") {
    detected = { mimeType: "video/mp4", kind: "video", width: null, height: null };
  } else if (head.slice(0, 4).join(",") === "26,69,223,163") {
    detected = { mimeType: "video/webm", kind: "video", width: null, height: null };
  } else if (String.fromCharCode(...head.slice(0, 5)) === "%PDF-") {
    detected = { mimeType: "application/pdf", kind: "document", width: null, height: null };
  } else {
    throw new Error("The file signature is not an allowed PNG, JPEG, MP4, WebM, or PDF.");
  }
  return { ...detected, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export function validateUpload(input: { bytes: Uint8Array; declaredMime: string; purpose: "creative" | "verification" }) {
  const maximum = input.purpose === "creative" ? MAX_CREATIVE_BYTES : MAX_VERIFICATION_BYTES;
  if (input.bytes.byteLength > maximum) throw new Error(`File exceeds the ${maximum / 1024 / 1024} MB limit.`);
  const detected = detectMedia(input.bytes);
  if (detected.mimeType !== input.declaredMime) throw new Error("Declared file type does not match its content signature.");
  if (input.purpose === "creative" && detected.kind === "document") throw new Error("Creative files must be PNG, JPEG, MP4, or WebM.");
  if (input.purpose === "verification" && detected.kind !== "document" && detected.kind !== "image") throw new Error("Verification files must be PDF, PNG, or JPEG.");
  const text = new TextDecoder("utf-8", { fatal: false }).decode(input.bytes);
  if (text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) throw new Error("Malware test signature detected.");
  return detected;
}
