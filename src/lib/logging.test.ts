import { expect, it } from "vitest";
import { redact } from "./logging";

it("redacts secrets recursively from structured logs", () => {
  expect(redact({ userId: "safe", headers: { authorization: "Bearer secret" }, otp: "123456", nested: [{ apiKey: "abc" }] })).toEqual({
    userId: "safe", headers: { authorization: "[REDACTED]" }, otp: "[REDACTED]", nested: [{ apiKey: "[REDACTED]" }]
  });
});
