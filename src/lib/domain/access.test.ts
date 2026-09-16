import { describe, expect, it } from "vitest";
import { can } from "./access";

describe("permission matrix", () => {
  it("never gives owner mode a customer request queue or booking decision", () => {
    expect(can("owner", "booking-request:read-all")).toBe(false);
    expect(can("owner", "booking-request:decide")).toBe(false);
    expect(can("owner", "published-rate:change")).toBe(false);
  });

  it("does not infer admin authority from either individual mode", () => {
    expect(can("advertiser", "admin:access")).toBe(false);
    expect(can("owner", "admin:access")).toBe(false);
    expect(can("admin", "booking-request:decide")).toBe(true);
  });
});
