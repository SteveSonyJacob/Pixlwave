import { describe, expect, it } from "vitest";
import { isPhoneAuthEnabled } from "./features";

describe("authentication feature selection", () => {
  it("keeps deferred phone authentication out of the active surface", () => {
    expect(isPhoneAuthEnabled({ AUTH_SMS_PROVIDER: "deferred" })).toBe(false);
    expect(isPhoneAuthEnabled({ AUTH_SMS_PROVIDER: "disabled" })).toBe(false);
    expect(isPhoneAuthEnabled({})).toBe(false);
  });

  it("enables phone authentication only when a provider is selected", () => {
    expect(isPhoneAuthEnabled({ AUTH_SMS_PROVIDER: "twilio" })).toBe(true);
  });
});
