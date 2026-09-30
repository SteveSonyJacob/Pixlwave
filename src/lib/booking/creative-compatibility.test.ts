import { describe, expect, it } from "vitest";
import { creativeCompatibility, type CreativeAsset } from "./creative-compatibility";

const image: CreativeAsset = { id: "image", original_name: "creative.png", detected_mime: "image/png", pixel_width: 1920, pixel_height: 1080, duration_seconds: null };
const led = { adDurationSeconds: 10, categoryDetails: { screenWidthPx: 1920, screenHeightPx: 1080 } };

describe("creative selection feedback", () => {
  it("matches LED image resolution and aspect rules before the server cart check", () => {
    expect(creativeCompatibility(image, "led", led)).toBeNull();
    expect(creativeCompatibility({ ...image, pixel_width: 1280 }, "led", led)).toMatch(/at least/);
    expect(creativeCompatibility({ ...image, pixel_width: 2160, pixel_height: 1080 }, "led", led)).toMatch(/aspect ratio/);
  });

  it("does not offer video with an unverified or mismatched duration", () => {
    const video = { ...image, detected_mime: "video/mp4", pixel_width: null, pixel_height: null };
    expect(creativeCompatibility(video, "theatre", led)).toMatch(/not been verified/);
    expect(creativeCompatibility({ ...video, duration_seconds: 15 }, "theatre", led)).toMatch(/10 seconds/);
    expect(creativeCompatibility({ ...video, duration_seconds: 10 }, "theatre", led)).toBeNull();
  });
});
