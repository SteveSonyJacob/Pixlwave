export type CreativeAsset = {
  id: string;
  original_name: string;
  detected_mime: string | null;
  pixel_width: number | null;
  pixel_height: number | null;
  duration_seconds: number | null;
};

export function creativeCompatibility(asset: CreativeAsset, category: string, approvedService?: { adDurationSeconds?: number; categoryDetails?: { screenWidthPx?: number; screenHeightPx?: number } }) {
  if (!["image/png", "image/jpeg", "video/mp4", "video/webm"].includes(asset.detected_mime ?? "")) return "Unsupported file type";
  if (asset.detected_mime?.startsWith("video/")) {
    if (asset.duration_seconds == null) return "Video duration has not been verified";
    if (approvedService?.adDurationSeconds != null && Math.abs(asset.duration_seconds - approvedService.adDurationSeconds) > 0.05) return `Video must be ${approvedService.adDurationSeconds} seconds`;
  }
  if (category === "led" && asset.detected_mime?.startsWith("image/")) {
    const width = approvedService?.categoryDetails?.screenWidthPx;
    const height = approvedService?.categoryDetails?.screenHeightPx;
    if (!width || !height || !asset.pixel_width || !asset.pixel_height) return "Image resolution is not verified";
    if (asset.pixel_width < width || asset.pixel_height < height) return `Image must be at least ${width}×${height} pixels`;
    if (Math.abs(asset.pixel_width / asset.pixel_height - width / height) > 0.02) return "Image aspect ratio does not match this screen";
  }
  return null;
}
