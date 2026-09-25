import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { captureEventSchema, readRazorpayConfig, verifyWebhookSignature } from "./razorpay";
import { escapeReceipt, receiptDocument } from "./receipt";
import { completedServiceSplit } from "./ledger";

describe("Razorpay trust boundary", () => {
  it("requires test keys and rejects production checkout", () => {
    const config = { APP_ENV: "test", RAZORPAY_KEY_ID: "rzp_test_example", RAZORPAY_KEY_SECRET: "sandbox_secret", RAZORPAY_WEBHOOK_SECRET: "webhook_secret" };
    expect(readRazorpayConfig(config).keyId).toBe("rzp_test_example");
    expect(() => readRazorpayConfig({ ...config, APP_ENV: "production" })).toThrow();
    expect(() => readRazorpayConfig({ ...config, RAZORPAY_KEY_ID: "rzp_live_example" })).toThrow();
  });
  it("verifies raw webhook bytes and requires a captured entity", () => {
    const raw = '{"event":"payment.captured"}';
    const signature = createHmac("sha256", "secret").update(raw).digest("hex");
    expect(verifyWebhookSignature(raw, signature, "secret")).toBe(true);
    expect(verifyWebhookSignature(`${raw} `, signature, "secret")).toBe(false);
    expect(verifyWebhookSignature(raw, "bad", "secret")).toBe(false);
    expect(captureEventSchema.safeParse({ event: "payment.authorized", created_at: 1, payload: {} }).success).toBe(false);
  });
  it("escapes account receipt content and totals the frozen lines", () => {
    expect(escapeReceipt('<script>"')).toBe("&lt;script&gt;&quot;");
    const html = receiptDocument("Payment receipt", [{ label: "Payment", value: "pay_123" }], [{ description: "LED <one>", amountPaise: 12345 }]);
    expect(html).toContain("₹123.45");
    expect(html).toContain("LED &lt;one&gt;");
    expect(html).not.toContain("<one>");
  });
  it("keeps completed-service gateway cost inside the platform's 15%", () => {
    expect(completedServiceSplit(1_000_000, 23_600)).toEqual({ ownerPaise: 850_000, platformGrossPaise: 150_000, gatewayFeePaise: 23_600, platformNetPaise: 126_400 });
  });
});
