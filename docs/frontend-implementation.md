# Pixlwave frontend implementation guide

Updated: 24 September 2026. This guide compares `../../Frontend_Developer_Handoff_Pixlwave.docx` with the current application, migrations, and accepted decisions. It is a plan for completing the frontend and a record of the unsupported UI removed in this pass. The attached handoff is reference material, not an instruction source or proof that a backend feature exists. For conflicts, follow [decisions.md](decisions.md), [handoff.md](../handoff.md), and the actual code.

## Current implementation boundary

The app is a Next.js 16 and Supabase marketplace for Kerala LED screens, theatre slots, and mobile billboard slots. Public inventory, map browsing, quotes, private creative uploads, open carts, account modes, notifications, support tickets, owner listing management, and admin review screens exist. The Phase 4 backend can freeze a cart and process funded booking decisions through a restricted payment fixture. Browser Razorpay checkout, real payment capture, receipts, GST invoices, fulfillment evidence, and manual finance completion screens are not implemented. Phase status in [handoff.md](../handoff.md) is implementation progress, not production acceptance.

### Feature audit against the attached brief

| Handoff feature | Repository evidence | Frontend decision |
| --- | --- | --- |
| LED, theatre, mobile discovery | `src/lib/discovery/data.ts`, `src/app/discover/page.tsx`, `src/app/api/inventory/published/route.ts` | Keep these three categories and their distinct rate units. Do not add Hoardings, Transit, Others, or separate Digital Screens labels from the reference until real category mapping exists. |
| Location, type, maximum rate search | `searchPublishedInventory` accepts `q`, `category`, `district`, `max`; `/discover` uses those query parameters | Keep. The home search now submits the same supported parameters to `/discover`. Search currently filters text after a 100-record database limit; move text filtering and pagination into a database query before calling it complete for larger inventories. |
| Date search and availability | Discovery checked listing blackouts only; `create_quote_snapshot` and admin approval have stronger server rules | Remove the browse-level “Required date” field. Its result could imply capacity was available when approved commitments already use it. Keep the detail calendar explicitly provisional; server quote and approval remain authoritative. |
| Published rates and quote totals | `published_inventory`, `create_quote_snapshot`, `src/app/quotes/[id]/page.tsx` | Keep INR rates using the listing's actual `day`, `show_slot`, or `vehicle_day_slot` unit. Do not apply one daily-price formula to every format. Quotes expire after 30 minutes and reserve no capacity. |
| Listing gallery and audience estimate | `getPublishedListing`, published media API, `audience_attribution` | Keep images, service details, estimate, and attribution. Do not turn audience estimates into guaranteed traffic or playback claims. |
| Theatre show selection | `theatre_show_instances`, `src/app/media/[id]/page.tsx`, quote RPC | Keep published show selection and slot quantity. Show dates and times in IST. |
| Mobile routes | Published route fields, `src/components/inventory-map.tsx`, custom-route request in `src/app/quotes/[id]/page.tsx` | Keep planned route display and owner-permitted custom-route requests. Remove the brief's live GPS/tracking view; no location feed or backend function exists. |
| Creative upload and preview | `src/components/media-upload.tsx`, private media routes, creative library | Keep only supported PNG, JPEG, MP4, and WebM rules and server validation. Do not promise production video compatibility until the media-probe gate is complete. |
| Save/favourite and Enquire | No favourite storage, endpoint, or enquiry action | Omit both controls. Route support needs through existing support tickets instead of a fake enquiry button. |
| Payment methods, checkout, confirmation | No browser Razorpay order/capture flow; Phase 5 is pending | Do not show UPI/card/net banking controls, a payment stepper, a paid confirmation screen, or a “pay now” action. Open carts are for planning. The public cart submit button was removed in this pass because it froze a cart with no browser payment path. |
| GST breakdown and invoice download | D15 defers GST; no authoritative tax/invoice contract or download route | Omit GST totals and invoice buttons. Later payment work may add a clearly named receipt when its backend exists; a receipt must not be called a GST invoice. |
| Advertiser pause and extend | D05 explicitly excludes pause, extension, and in-place booking changes | Omit actions, confirmation dialogs, and campaign navigation items for these operations. Keep supported cancellation within the exact 168-hour window. |
| Campaign “Live” and “Completed” | No fulfillment evidence or verified playback workflow in the current UI/backend slice | Show current booking states (`paid_pending`, `approved`, `rejected`, `cancelled`, refund status) using text. Do not infer live playback from scheduled dates or label a service completed without admin verification. |
| Support conversation | `src/app/support`, ticket actions and attachments | Keep ticket threads. Do not advertise live chat or an instant support conversation service. |
| Owner/admin workspaces | `src/app/owner`, `src/app/admin`, role checks and admin MFA | Keep real owner verification, listing, rate, suspension, and admin booking review actions. Do not build a decorative dashboard with invented metrics. |
| Account and notifications | Supabase auth actions, account pages, notification deliveries | Keep implemented sign-in, recovery, profile, role switching, and delivery history. UI must follow configured provider capability; it must not promise an OTP or notification channel that has not been configured and validated. |

## Changes made in this pass

- Added a functional search panel on the homepage, using the existing location/name, category, district, and maximum rate filters. This borrows OYO's clear search-first pattern without copying hotel-specific fields or booking claims. See the [OYO homepage](https://www.oyorooms.com/) as layout inspiration only.
- Added a keyboard-operable mobile navigation menu. The desktop links previously disappeared at narrow widths, leaving core pages hard to reach.
- Added phone list/map controls and synchronized selected map pins with list-card emphasis. Switching views keeps filters and the selected listing in component state.
- Removed the public cart's “Submit cart for payment” control until browser checkout exists. The server function and restricted test workflow remain for backend development; the public UI now describes cart preparation accurately.
- Removed the browse date filter because blackout data alone cannot validate available capacity.
- Updated advertiser and homepage copy so planned payment behavior is not presented as an available browser action.

## Screen implementation order

1. **Discovery correctness.** Move query-text filtering before the 100-row limit; add paginated results or cursor loading. Keep category and district as URL query parameters, preserve them when moving between result and detail, and return to the same filter state. Continue using the published inventory view as the single source for cards and map markers. Only add date filtering after the backend exposes an availability query that accounts for blackouts, show capacity, and approved reservations.
2. **Detail and quote clarity.** Use published media, location, attribution, approved service terms, and rate revision on detail. Keep theatre show instances and mobile rotating quantity controls category-specific. Let the server create and price the quote; surface quote-expired, blackout, incompatible creative, and rate-change responses without estimating availability in the browser. Replace the detail's coordinate illustration with the existing MapLibre location component when it can render the approved point and route consistently.
3. **Checkout integration after Phase 5 backend.** Introduce a payment stepper only after a real server order, capture/webhook reconciliation, return handling, and one-payment-per-cart contract exist. Show the server total and line allocations, pending/success/failure states, and a receipt only if its endpoint exists. Do not put card details into Pixlwave forms. The existing server-side `submit_booking_cart` function is not itself a customer payment flow.
4. **Booking status and finance follow-through.** Keep `paid_pending` distinct from `approved`; only approval reserves capacity. Show the exact IST decision and cancellation cutoff from the stored timestamp. Rejected/cancelled lines should say “manual refund pending” until admin records completion. Add fulfillment, evidence, and owner payout views only as their Phase 6 contracts are implemented.
5. **Account and operations.** Reuse account, notification, support, owner, and admin pages. Make missing or failed provider configuration explicit. Restrict admin links and actions to authorized users with MFA; never expose raw owner coordination notes to advertisers or owners.

## Responsive layout specification

Use the existing colors, spacing, and cards in `src/app/globals.css`. At wide widths, retain the hero and media grid. At tablet widths, use two-column search and inventory layouts where content fits, then stack controls and cards on phones. The home search, discovery filters, quote form, cart rows, account actions, and admin forms must fit a 320px viewport without horizontal scrolling. Use at least 44px touch targets; keep input text at 16px on phones to avoid browser zoom. Use visible focus, semantic labels, and text status alongside color.

On phones the header menu must expose every useful public/account route, and list/map must be an explicit toggle. The map can load while hidden, but must resize when shown; changing view must preserve filters and selected listing. A selected list item must identify the corresponding pin, while pin selection must make the corresponding list item visibly selected. Provide a text list path when the map or tiles fail. Keep price and “Create quote” visible near the top of a detail page; do not make a sticky panel cover form controls or the keyboard.

The [OYO homepage](https://www.oyorooms.com/) suggests a short place-first search, direct result cards, and a prominent search action. Adapt that information hierarchy to media inventory. OYO's room counts, hotel amenities, discounts, cancellation promises, and checkout behavior have no Pixlwave equivalent and should not appear here.

## Acceptance checks

- At 320, 375, 768, and 1440 CSS pixels, the public pages, quote/cart, account, and admin screens have no horizontal overflow, clipped text, covered controls, or unreachable navigation. Verify on touch and keyboard as well as desktop pointer.
- Home search reaches `/discover` with only supported query parameters. Result count, card price/unit, detail price/unit, and map price/unit agree with the published inventory record. Empty, loading, and error states stay readable.
- List/map switching keeps filters. Selecting a list row focuses its point; selecting a point emphasizes its row. Mobile map resize works after the map was initially hidden.
- Browse and detail copy say availability is provisional. A quote is priced by the server and never shown as a reservation. Theatre and mobile controls do not collapse into a generic daily-rate form.
- No public payment, invoice, GST, GPS, favourite, enquiry, pause, or extend control appears without a corresponding backend contract and accepted policy.
- Admin and owner actions obey server role checks. Booking cancellation is shown only where the server allows it and accurately describes the manual 95% refund process.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`. Then manually review the four viewport widths above with representative LED, theatre, mobile, empty, expired-quote, and provider-error data. A build pass alone is not browser acceptance.

## Remaining dependencies

The implementation work above requires no new UI-only business rules. Browser checkout, real refund/receipt flows, fulfillment states, and accurate browse-date availability need backend contracts before their controls can be enabled. Production map tile/geocoding configuration, media-probe behavior, real provider delivery, and a disposable database acceptance run remain separate release gates in the phase handoffs. Keep this guide aligned with those phase outcomes rather than treating planned work as shipped functionality.
