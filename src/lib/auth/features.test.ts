import { describe, expect, it } from "vitest";
import { isPhoneAuthEnabled } from "./features";

describe("authentication feature selection", () => {
  it("keeps deferred phone authentication out of the active surface", () => {
    expect(isPhoneAuthEnabled({ AUTH_SMS_PROVIDER: "deferred" } as NodeJS.ProcessEnv)).toBe(false);
    expect(isPhoneAuthEnabled({ AUTH_SMS_PROVIDER: "disabled" } as NodeJS.ProcessEnv)).toBe(false);
    expect(isPhoneAuthEnabled({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("enables phone authentication only when a provider is selected", () => {
    expect(isPhoneAuthEnabled({ AUTH_SMS_PROVIDER: "twilio" } as NodeJS.ProcessEnv)).toBe(true);
  });
});
