"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutResponse = { keyId: string; orderId: string; amount: number; currency: string; cartId: string; error?: string };
type RazorpayInstance = { open: () => void; close?: () => void };
type CheckoutWindow = Window & { Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance };
let checkoutScriptPromise: Promise<void> | null = null;

function loadCheckoutScript() {
  if ((window as CheckoutWindow).Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]')?.remove();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    const timer = window.setTimeout(() => { script.onload = null; script.onerror = null; reject(new Error("Checkout loading timed out. Check your connection and retry.")); }, 15_000);
    script.onload = () => { window.clearTimeout(timer); if ((window as CheckoutWindow).Razorpay) resolve(); else reject(new Error("Checkout loaded without the payment control.")); };
    script.onerror = () => { window.clearTimeout(timer); reject(new Error("Checkout could not load.")); };
    document.head.appendChild(script);
  }).catch((error) => {
    document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]')?.remove();
    checkoutScriptPromise = null;
    throw error;
  });
  return checkoutScriptPromise;
}

export function RazorpayCheckout({ cartId, disabled }: { cartId: string; disabled?: boolean }) {
  const router = useRouter();
  const instance = useRef<RazorpayInstance | null>(null);
  const mounted = useRef(false);
  const launching = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); instance.current?.close?.(); instance.current = null; };
  }, []);
  async function start() {
    if (launching.current || disabled) return;
    launching.current = true;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartId }), signal: controller.signal });
      const order = await response.json() as CheckoutResponse;
      if (!response.ok) throw new Error(order.error ?? "Checkout is unavailable.");
      await loadCheckoutScript();
      if (!mounted.current) return;
      const Razorpay = (window as CheckoutWindow).Razorpay;
      if (!Razorpay) throw new Error("Checkout could not load.");
      instance.current = new Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: "Pixlwave", description: "Advertising booking cart",
        retry: { enabled: true }, redirect: false,
        handler: () => { if (mounted.current) router.push("/bookings?message=Payment+submitted.+Verified+capture+may+take+a+moment+to+appear."); },
        modal: { ondismiss: () => { instance.current = null; launching.current = false; if (mounted.current) { setBusy(false); setMessage("Checkout was closed. Check your bookings if you attempted payment; server verification may still be processing."); } } },
      });
      instance.current.open();
    } catch (error) { launching.current = false; if (mounted.current) { setMessage(error instanceof Error ? error.message : "Checkout is unavailable."); setBusy(false); } }
  }
  return <div><button type="button" className="button" disabled={busy || disabled} aria-busy={busy} onClick={start}>{busy ? "Opening checkout…" : "Pay cart in Razorpay sandbox"}</button>{message ? <p role="alert">{message} <a href="/bookings">View booking status</a></p> : null}</div>;
}
