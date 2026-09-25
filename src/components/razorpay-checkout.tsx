"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutResponse = { keyId: string; orderId: string; amount: number; currency: string; cartId: string; error?: string };
type CheckoutWindow = Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } };

function loadCheckoutScript() {
  return new Promise<void>((resolve, reject) => {
    const current = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if ((window as CheckoutWindow).Razorpay) { resolve(); return; }
    if (current) { current.addEventListener("load", () => resolve(), { once: true }); current.addEventListener("error", () => reject(new Error("Checkout could not load.")), { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Checkout could not load."));
    document.head.appendChild(script);
  });
}

export function RazorpayCheckout({ cartId, disabled }: { cartId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function start() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartId }) });
      const order = await response.json() as CheckoutResponse;
      if (!response.ok) throw new Error(order.error ?? "Checkout is unavailable.");
      await loadCheckoutScript();
      const Razorpay = (window as CheckoutWindow).Razorpay;
      if (!Razorpay) throw new Error("Checkout could not load.");
      new Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: "Pixlwave", description: "Advertising booking cart",
        retry: { enabled: true }, redirect: false,
        handler: () => { router.push("/bookings?message=Payment+submitted.+Verified+capture+may+take+a+moment+to+appear."); },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout is unavailable."); setBusy(false); }
  }
  return <div><button type="button" className="button" disabled={busy || disabled} onClick={start}>{busy ? "Opening checkout…" : "Pay cart in Razorpay sandbox"}</button>{message ? <p role="alert">{message}</p> : null}</div>;
}
