import { describe, expect, it } from "vitest";
import { isSessionIdleExpired } from "./session";

describe("idle session boundary", () => {
  const now = Date.parse("2026-10-01T04:30:00Z");
  it("expires at the configured boundary", () => {
    expect(isSessionIdleExpired(now - 3_599_999, now, 60)).toBe(false);
    expect(isSessionIdleExpired(now - 3_600_000, now, 60)).toBe(true);
  });
  it("allows an authenticated session to establish its first activity marker", () => {
    expect(isSessionIdleExpired(null, now, 60)).toBe(false);
  });
});
