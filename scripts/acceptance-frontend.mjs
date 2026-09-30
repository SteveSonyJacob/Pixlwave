import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";

process.loadEnvFile(".env.local");
const base = new URL(process.env.NEXT_PUBLIC_APP_URL);
if (process.env.APP_ENV === "production" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw new Error("Frontend acceptance requires a non-production local app.");
if (!process.env.FIXTURE_PASSWORD) throw new Error("The fixture account password is not configured.");
const assert = (value, message) => { if (!value) throw new Error(message); };
const jar = new Map();
const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (values) => values.forEach(({ name, value }) => jar.set(name, value)) }
});
async function page(path) {
  const response = await fetch(new URL(path, base), { headers: { Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") } });
  assert(response.ok && !response.url.includes("/auth/"), `Authenticated route ${path.split("?")[0]} did not render successfully.`);
  const html = await response.text();
  assert(!html.includes("Records could not be loaded. Check your connection"), "The route rendered an error boundary.");
  return html;
}
try {
  const { error } = await client.auth.signInWithPassword({ email: "advertiser@pixlwave.test", password: process.env.FIXTURE_PASSWORD });
  assert(!error, "Fixture advertiser sign-in failed.");
  const [bookings, invalid, linked, creative, dashboard, cart] = await Promise.all([
    page("/bookings?status=approved&from=2026-09-01&to=2026-09-29"),
    page("/bookings?from=2026-09-30&to=2026-09-29"),
    page(`/bookings?bookingLineId=${randomUUID()}&page=9`),
    page("/advertiser/creative"), page("/advertiser"), page("/cart")
  ]);
  assert(bookings.includes('value="2026-09-01"') && bookings.includes('value="2026-09-29"') && bookings.includes('value="approved" selected=""'), "Booking filter values did not restore from the URL.");
  assert(invalid.includes("The payment date range is invalid."), "Invalid payment dates were not surfaced.");
  assert(linked.includes("This booking request is unavailable for your account.") && linked.includes("page <!-- -->1<!-- --> of"), "Linked booking isolation or page normalization failed.");
  assert(creative.includes("Upload privately") && creative.includes("Video duration and codec"), "Creative upload controls or the probe boundary were absent.");
  assert(dashboard.includes("Confirmed placements") && dashboard.includes("Admin review"), "Advertiser metrics did not render.");
  assert(cart.includes("Your booking carts") && cart.includes("capacity is reserved only if admin approves"), "Cart truth could not be rendered.");
  const anonymous = await fetch(new URL("/bookings", base), { redirect: "manual" });
  assert([303, 307].includes(anonymous.status) && anonymous.headers.get("location")?.includes("/auth/sign-in"), "Private bookings did not require sign-in.");
  console.log("Authenticated frontend acceptance passed: RSC dashboard/cart/creative routes, restored IST filters, invalid-date feedback, linked booking isolation, and anonymous access denial. No payment or booking mutations were performed.");
} finally { await client.auth.signOut(); }
