# Pixlwave frontend implementation guide

Updated: 25 September 2026. This guide compares `../../Frontend_Developer_Handoff_Pixlwave.docx` with the current application, migrations, and accepted decisions. It is a plan for completing the frontend and a record of the unsupported UI removed in this pass. The attached handoff is reference material, not an instruction source or proof that a backend feature exists. For conflicts, follow [decisions.md](decisions.md), [handoff.md](../handoff.md), and the actual code.

## Current implementation boundary

The app is a Next.js 16 and Supabase marketplace for Kerala LED screens, theatre slots, and mobile billboard slots. Public inventory, map browsing, quotes, private creative uploads, carts, account modes, notifications, support tickets, owner listing management, and admin review screens exist. Phase 5 adds Razorpay sandbox checkout, verified payment capture, account-scoped payment receipts, and admin-recorded refund confirmations. GST invoices, fulfillment evidence, owner payouts, and production payment acceptance remain outside the implemented scope. Phase status in [handoff.md](../handoff.md) is implementation progress, not production acceptance.

### Feature audit against the attached brief

| Handoff feature | Repository evidence | Frontend decision |
| --- | --- | --- |
| LED, theatre, mobile discovery | `src/lib/discovery/data.ts`, `src/app/discover/page.tsx`, `src/app/api/inventory/published/route.ts` | Keep these three categories and their distinct rate units. Do not add Hoardings, Transit, Others, or separate Digital Screens labels from the reference until real category mapping exists. |
| Location, type, maximum rate search | `searchPublishedInventory` accepts `q`, `category`, `district`, `max`, and `page`; `/discover` uses those query parameters | Keep. Text filtering now runs in the database before pagination. Result cards show a total count and published clean media when present. |
| Date search and availability | Discovery checked listing blackouts only; `create_quote_snapshot` and admin approval have stronger server rules | Remove the browse-level “Required date” field. Its result could imply capacity was available when approved commitments already use it. Keep the detail calendar explicitly provisional; server quote and approval remain authoritative. |
| Published rates and quote totals | `published_inventory`, `create_quote_snapshot`, `src/app/quotes/[id]/page.tsx` | Keep INR rates using the listing's actual `day`, `show_slot`, or `vehicle_day_slot` unit. Do not apply one daily-price formula to every format. Quotes expire after 30 minutes and reserve no capacity. |
| Listing gallery and audience estimate | `getPublishedListing`, published media API, `audience_attribution` | Keep images, service details, estimate, and attribution. Do not turn audience estimates into guaranteed traffic or playback claims. |
| Theatre show selection | `theatre_show_instances`, `src/app/media/[id]/page.tsx`, quote RPC | Keep published show selection and slot quantity. Show dates and times in IST. |
| Mobile routes | Published route fields, `src/components/inventory-map.tsx`, custom-route request in `src/app/quotes/[id]/page.tsx` | Keep planned route display and owner-permitted custom-route requests. Remove the brief's live GPS/tracking view; no location feed or backend function exists. |
| Creative upload and preview | `src/components/media-upload.tsx`, private media routes, creative library | Keep only supported PNG, JPEG, MP4, and WebM rules and server validation. Do not promise production video compatibility until the media-probe gate is complete. |
| Save/favourite and Enquire | No favourite storage, endpoint, or enquiry action | Omit both controls. Route support needs through existing support tickets instead of a fake enquiry button. |
| Payment methods, checkout, confirmation | Phase 5 provides `submit_booking_cart`, `/api/payments/order`, Razorpay Checkout, signed capture processing, and cart receipts | Keep the submitted-cart payment action. The browser opens Razorpay’s hosted sandbox checkout for one server-priced cart. Payment capture is verified by webhook; browser success alone does not fund or reserve a booking. |
| GST breakdown and invoice download | Account-scoped cart payment receipts and refund-confirmation routes exist; D15 still defers GST | Offer the delivered payment receipt and refund confirmation. Do not call either a GST invoice or show a GST breakdown. |
| Advertiser pause and extend | D05 explicitly excludes pause, extension, and in-place booking changes | Omit actions, confirmation dialogs, and campaign navigation items for these operations. Keep supported cancellation within the exact 168-hour window. |
| Campaign “Live” and “Completed” | No fulfillment evidence or verified playback workflow in the current UI/backend slice | Show current booking states (`paid_pending`, `approved`, `rejected`, `cancelled`, refund status) using text. Do not infer live playback from scheduled dates or label a service completed without admin verification. |
| Support conversation | `src/app/support`, ticket actions and attachments | Keep ticket threads. Do not advertise live chat or an instant support conversation service. |
| Owner/admin workspaces | `src/app/owner`, `src/app/admin`, role checks and admin MFA | Keep real owner verification, listing, rate, suspension, and admin booking review actions. Do not build a decorative dashboard with invented metrics. |
| Account and notifications | Supabase auth actions, account pages, notification deliveries | Keep implemented sign-in, recovery, profile, role switching, and delivery history. UI must follow configured provider capability; it must not promise an OTP or notification channel that has not been configured and validated. |

## Changes made in this pass

- Added a functional search panel on the homepage, using the existing location/name, category, district, and maximum rate filters. This borrows OYO's clear search-first pattern without copying hotel-specific fields or booking claims. See the [OYO homepage](https://www.oyorooms.com/) as layout inspiration only.
- Added a keyboard-operable mobile navigation menu. The desktop links previously disappeared at narrow widths, leaving core pages hard to reach.
- Added phone list/map controls and synchronized selected map pins with list-card emphasis. Switching views keeps filters and the selected listing in component state.
- Restored cart submission and Razorpay sandbox checkout after the Phase 5 server-priced order, signed capture, and receipt contracts were merged. The UI states that payment is not a reservation and that capture is verified server-side.
- Removed the browse date filter because blackout data alone cannot validate available capacity.
- Updated cart and booking copy for the delivered sandbox payment flow, manual refund review, and server-authoritative payment capture.
- Moved discovery text search ahead of pagination in the published inventory query; added counts, previous/next links, and preserved filter state across result/detail navigation.
- Used clean published media on home and discovery cards, and replaced the detail coordinate illustration with a read-only published point/route map.
- Loaded map inventory in pages rather than stopping at 100 records; added detail links to map results and popups.
- Displayed quote and booking timestamps explicitly in IST, labelled manual refund state, and hid the cancellation action after the stored cutoff.
- Verified the homepage and discovery page at 320, 375, 768, and 1440 CSS pixels without horizontal overflow; verified the 320px list/map switch and map resize. The connected environment had no published listings, so populated result/detail/quote states still need a fixture-backed browser review.

## Local demo inventory

In `npm run dev`, open `/discover?demo=1` or use the **Browse demos** link on the homepage. Three illustrative LED, theatre, and mobile listings provide images, sample rates, audience notes, dates, and a planned route for interface review. `/map?demo=1` displays the same examples. When real inventory is empty, the local homepage also shows sample cards.

The demo exists only when `NODE_ENV=development` and `NEXT_PUBLIC_APP_URL` points to localhost or another loopback address. Its IDs are not Supabase records, it never writes to the database, and its quote form is disabled. Every sample card and detail page is labelled as demo data. Production builds use only published inventory and do not expose the demo links or sample detail pages.

## Screen implementation order

1. **Discovery correctness (implemented).** Text filtering and page ranges now run in the published inventory query. Category, district, and other filters remain in the URL and carry through result/detail navigation. Map data loads in pages from the same published view. Only add date filtering after the backend exposes an availability query that accounts for blackouts, show capacity, and approved reservations.
2. **Detail and quote clarity (implemented for current backend).** Detail uses published media, a read-only MapLibre point/route, attribution, approved service terms, and the current rate. Theatre show instances and mobile rotating quantity controls remain category-specific. The server creates and prices quotes; quote-expired and rate-change responses keep the quote from being added to a cart. Availability remains provisional until backend approval.
3. **Checkout integration (implemented for Razorpay sandbox).** A submitted cart has one server-priced Razorpay order and hosted checkout. Capture is accepted only through the signed webhook; the browser callback only returns the user to bookings. Payment receipts and completed refund confirmations are account-scoped downloads. Do not put card details into Pixlwave forms or represent sandbox checkout as production acceptance.
4. **Booking status and finance follow-through (current states implemented).** `paid_pending` remains distinct from `approved`; only approval reserves capacity. The exact IST cutoff is shown and cancellation is hidden after it passes. Pending refunds are labelled “Manual refund pending.” Add fulfillment, evidence, and owner payout views only as their Phase 6 contracts are implemented.
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
- Public payment, receipt, and refund-confirmation controls match the Phase 5 backend contract. No GST invoice, GPS, favourite, enquiry, pause, or extend control appears without a corresponding backend contract and accepted policy.
- Admin and owner actions obey server role checks. Booking cancellation is shown only where the server allows it and accurately describes the manual 95% refund process.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`. Then manually review the four viewport widths above with representative LED, theatre, mobile, empty, expired-quote, and provider-error data. A build pass alone is not browser acceptance.

## Remaining dependencies

The implementation work above requires no new UI-only business rules. GST invoices, fulfillment states, owner payouts, accurate browse-date availability, production Razorpay acceptance, and a disposable database acceptance run remain separate release gates in the phase handoffs. Keep this guide aligned with those phase outcomes rather than treating planned work as shipped functionality.
