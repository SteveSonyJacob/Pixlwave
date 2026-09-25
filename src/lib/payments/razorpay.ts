import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const orderSchema = z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: z.number().int().positive(), currency: z.literal("INR"), receipt: z.string() });
const paymentSchema = z.object({ id: z.string().regex(/^pay_[A-Za-z0-9]+$/), order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), status: z.string(), amount: z.number().int().positive(), currency: z.string(), fee: z.number().int().nonnegative().nullable().optional(), tax: z.number().int().nonnegative().nullable().optional() });
const refundSchema = z.object({ id: z.string().regex(/^rfnd_[A-Za-z0-9]+$/), payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), amount: z.number().int().positive(), currency: z.string().optional(), status: z.string(), created_at: z.number().int().positive(), processed_at: z.number().int().positive().optional() });
export type RazorpayPayment = z.infer<typeof paymentSchema>;

export function readRazorpayConfig(source: Record<string, string | undefined> = process.env) {
  const keyId = source.RAZORPAY_KEY_ID;
  const keySecret = source.RAZORPAY_KEY_SECRET;
  const webhookSecret = source.RAZORPAY_WEBHOOK_SECRET;
  if (!keyId?.startsWith("rzp_test_") || !keySecret || keySecret.includes("replace") || !webhookSecret || webhookSecret.includes("replace")) {
    throw new Error("Razorpay sandbox keys and webhook secret are required.");
  }
  if (!["local", "test", "staging"].includes(source.APP_ENV ?? "")) throw new Error("Sandbox checkout requires an explicit non-production environment.");
  return { keyId, keySecret, webhookSecret };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export const captureEventSchema = z.object({
  event: z.literal("payment.captured"),
  created_at: z.number().int().positive(),
  payload: z.object({ payment: z.object({ entity: paymentSchema }) }),
});
export const failedEventSchema = z.object({
  event: z.literal("payment.failed"),
  created_at: z.number().int().positive(),
  payload: z.object({ payment: z.object({ entity: paymentSchema }) }),
});

async function apiRequest(path: string, init: RequestInit) {
  const { keyId, keySecret } = readRazorpayConfig();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Razorpay API returned ${response.status}; inspect the provider dashboard before retrying.`);
  return response.json();
}

export async function createRazorpayOrder(input: { amount: number; receipt: string; cartId: string }) {
  const body = { amount: input.amount, currency: "INR", receipt: input.receipt, partial_payment: false, notes: { pixlwave_cart_id: input.cartId } };
  return orderSchema.parse(await apiRequest("/orders", { method: "POST", body: JSON.stringify(body) }));
}

export async function fetchRazorpayPayment(id: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid payment reference.");
  return paymentSchema.parse(await apiRequest(`/payments/${id}`, { method: "GET" }));
}

export async function fetchRazorpayOrderPayments(id: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid order reference.");
  const collection = z.object({ items: z.array(paymentSchema) }).parse(await apiRequest(`/orders/${id}/payments`, { method: "GET" }));
  return collection.items;
}

export async function fetchRazorpayRefund(id: string) {
  if (!/^rfnd_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid refund reference.");
  return refundSchema.parse(await apiRequest(`/refunds/${id}`, { method: "GET" }));
}
