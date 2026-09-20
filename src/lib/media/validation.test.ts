import { describe, expect, it } from "vitest";
import { detectMedia, validateUpload } from "./validation";

function png(width = 1920, height = 1080) {
  const bytes = new Uint8Array(32);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

describe("private media intake", () => {
  it("detects image dimensions from content rather than filename", () => {
    expect(detectMedia(png())).toMatchObject({ mimeType: "image/png", width: 1920, height: 1080 });
  });

  it("rejects MIME spoofing and corrupt payloads", () => {
    expect(() => validateUpload({ bytes: png(), declaredMime: "image/jpeg", purpose: "creative" })).toThrow(/does not match/);
    expect(() => detectMedia(new Uint8Array(20))).toThrow(/not an allowed/);
  });

  it("keeps verification documents out of creative uploads", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 fake-but-signature-valid");
    expect(() => validateUpload({ bytes: pdf, declaredMime: "application/pdf", purpose: "creative" })).toThrow(/Creative files/);
  });

  it("accepts only document or image support attachments", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 fake-but-signature-valid");
    expect(validateUpload({ bytes: pdf, declaredMime: "application/pdf", purpose: "ticket" }).mimeType).toBe("application/pdf");
    const video = new Uint8Array(16); video.set([0, 0, 0, 12, 102, 116, 121, 112], 0);
    expect(() => validateUpload({ bytes: video, declaredMime: "video/mp4", purpose: "ticket" })).toThrow(/Ticket attachments/);
  });
});
