# Pixlwave production development plan

Version: 0.9 draft  
Updated: 2026-09-15  
Status: planning only; no application implementation or application tests started  
Purpose: phased development, testable acceptance criteria and continuity between development sessions.

## 1. Authority and current scope

This revision incorporates the client's latest operating model and the user's follow-up answers. It supersedes conflicting earlier rules. [docs/decisions.md](docs/decisions.md) distinguishes confirmed policies, unanswered details and historical proposals. The user authorized updating this draft before all remaining values are answered.

Pixlwave is an admin-managed advertising marketplace. An advertiser selects inventory, uploads the ad and pays once for the whole submitted cart. Admin manually discusses each request with its owner and accepts/rejects it within seven days of successful payment. Owners do not receive advertiser requests directly and cannot decide them through the platform.

Paid-pending requests do not reserve inventory. Only admin approval reserves capacity. Every manual/automatic rejection creates an item refund task for admin; still-undecided requests automatically reject at seven days. The website never executes refunds automatically. Admin performs the refund manually and then records its completion as refunded. Advertisers may cancel within seven days of payment for a 95% refund of the cancelled booking amount. Pixlwave retains the remaining 5% as the total cancellation fee, including Razorpay processing charges; no separate processing-charge deduction applies. Owner inability/non-delivery is the business refund exception after day seven.

Owners enter initial base prices. Subsequent published-price changes are admin-only after discussion with the owner. No demand-based or locality-based price adjustment is implemented.

All three categories remain required:
- LED/digital screen: whole-screen daily reservation.
- Theatre: multiple ad slots per show with defined duration and service promises.
- Mobile billboard: multiple rotating slots on a vehicle, owner-permitted routes, custom route only when no other approved vehicle booking overlaps the dates.

Other confirmed requirements:
- One person per account, with advertiser/owner mode switching; separately granted admin access.
- Admin verifies owners and approves listings; public browsing and authenticated booking.
- Earliest service start is successful payment + 192 hours (8 x 24); admin review and advertiser cancellation close at payment + 168 hours (7 x 24). Payment on 1 October reaches the review deadline on 8 October and the earliest service start on 9 October, at the same time of day.
- Responsive English website, INR, IST, Kerala-only initial inventory launch, expandable geographic model.
- 15% Pixlwave commission and 85% owner share for completed service; Razorpay processing charges come out of Pixlwave's 15%. For admin rejection, deadline rejection or owner failure, deduct the actual applicable Razorpay processing charges from the affected payment and refund the remainder, with no penalty.
- Admin manually transfers owner funds after fulfillment verification; completion evidence and transfer reference retained. No automated payouts or Route integration.
- Supabase auth, ticket support and in-app/email/SMS notifications.
- Main servers/data in India; normal email delivery to Gmail/other addresses allowed.
- Mappls primary, Google Maps fallback through a provider adapter.
- Reference-led UI, replaceable logo and clearly marked sample inventory during development.
- Tests and user/client manual acceptance for every phase.

Excluded from current scope: direct owner booking approval, delayed collection after decisions, payment countdowns after approval, a fixed 48-hour completion window, dynamic pricing, pause/resume, extensions and in-place campaign changes, live GPS tracking, physical ad playback/control, customer teams and native mobile apps. Additional dates require a new booking. GST implementation remains deferred with an extension point and a launch invoicing check.

Sources and continuity:
- [Frontend blueprint](docs/references/frontend-blueprint.pdf)
- [Homepage reference](docs/references/ui-homepage.jpg)
- [Page/dashboard reference](docs/references/ui-pages.jpg)
- [Decision register](docs/decisions.md)
- [Handoff guide and phase index](handoff.md)

The blueprint and images are reference material. Their old payment/owner workflows and marketing claims do not override the current client rules.

## 2. Requirement traceability

| ID | Current requirement | Phases |
| --- | --- | --- |
| R01 | Complete admin-managed responsive marketplace, three inventory categories | P01-P07 |
| R02 | Supabase auth/profile/recovery, one person with advertiser/owner roles | P01, P03 |
| R03 | Owner/listing verification, initial owner base price, protected admin operations | P01-P02, P04, P06 |
| R04 | Kerala search, category/location/date/budget filters, featured listings, maps and details | P02-P03 |
| R05 | Whole-screen daily capacity | P02, P04 |
| R06 | Multiple theatre ad slots per show | P02, P04 |
| R07 | Mobile rotating slots and approved route compatibility | P02, P04 |
| R08 | Fixed published rates; admin-only changes after owner discussion; booked-price protection | P02-P03, P05 |
| R09 | Eight-day minimum notice; admin-only request decisions within seven days of successful payment | P01, P04-P05 |
| R10 | Secure ad upload/preview, reviewed through admin coordination | P02, P04 |
| R11 | Frozen submitted cart; one upfront payment for all items; reserve only on admin approval | P04-P05 |
| R12 | Razorpay payment/receipts, item allocations, rejected-item refunds, GST extension point | P05 |
| R13 | Campaign fulfillment/evidence, admin completion and non-delivery review; no pause/change flows | P06 |
| R14 | Cancellation within seven days: 95% refund, 5% Pixlwave fee inclusive of Razorpay processing charges; admin-handled rejection refunds; later owner non-delivery exception; missed-day/show/slot refunds | P04-P06 |
| R15 | 15% commission, reconciled post-fulfillment admin-controlled owner settlement | P05-P06 |
| R16 | In-app/email/SMS notifications, admin decision reminders and support tickets | P03-P06 |
| R17 | India-hosted main servers/data, reliable operation, automated and manual validation | P01, P07 |
| R18 | Reference-led UI, replaceable logo, sample data, real Kerala launch content | P01-P03, P07 |

Retain these IDs across handoffs. A required feature is complete only when its automated checks and manual review pass. See [the source coverage and review](docs/requirements-review.md) for each blueprint section, replaced requirements, corrected ambiguities and resolved business questions.

## 3. Core workflow and invariants

### 3.1 Upfront payment and admin decisions

1. Advertiser creates a cart of requested days/shows/slots with creative assets and a visible price breakdown.
2. Server validates request eligibility and the current published quote. The customer pays the cart total once.
3. Verified payment success records immutable paid lines and enters paid-awaiting-admin review. Both seven-day clocks use the same trusted payment-success timestamp.
4. Admin contacts the owner manually, records coordination notes and decides each line within seven days.
5. Admin acceptance atomically checks availability and reserves capacity. Rejection creates that line's manual refund task; undecided requests automatically reject at the seven-day deadline and enter the same queue. Other items proceed independently.
6. Accepted service is delivered by the owner. Admin verifies fulfillment/evidence, transfers eligible owner funds manually and records the completed transfer with its reference.
7. Timely advertiser cancellation refunds 95% of the cancelled booking amount; Pixlwave retains 5%, inclusive of Razorpay processing charges. Owner non-delivery can justify a refund even after the ordinary cutoff.

Payment success is not booking confirmation. Use “Payment received - awaiting admin confirmation” until acceptance. Owners see only appropriate confirmed fulfillment information released by admin, not the original request queue or private admin/customer notes.

Example: a cart contains booking A at Rs 6,000 and B at Rs 4,000. Advertiser pays Rs 10,000 before decisions. Admin accepts A and rejects B; A reserves its capacity and B becomes a refund obligation. No second payment or wait-for-all-decisions payment timer is introduced. Admin processes B's refund manually. Deduct only the actual Razorpay processing charges allocated to B and manually refund the remainder. No 5% cancellation fee, other penalty or fulfillment commission applies to B.

### 3.2 Timing

Confirmed:
- Both the admin decision deadline and advertiser cancellation deadline are successful payment + 168 hours (7 x 24).
- Model this as a stored timestamp and enforce it on the server; webhook delivery time, user device time, admin acceptance and retries cannot restart the clock.
- Earliest service start is successful payment + 192 hours (8 x 24), including that exact instant. For payment on 1 October at 10:00 IST, the review/cancellation cutoff is 8 October at 10:00 IST and earliest service is 9 October at 10:00 IST. Do not round to midnight or the end of the seventh day.
- Admin must decide within seven days of payment. At deadline, an undecided request automatically rejects and creates a manual refund task without moving funds. Late acceptance is forbidden even if the expiry worker is delayed.
- Cancellation eligibility uses the request timestamp within seven days of successful payment. A timely request remains eligible while admin processes its refund; admin completion after the cutoff does not make it a late cancellation. All refunds are manual and remain pending until completed and recorded.


For date-based LED/mobile inventory, compare the published operating start of the first booked day with the exact 192-hour threshold; for theatre inventory compare the selected show time. Do not silently sell a shortened whole-day booking or allow an early show merely because its calendar date matches. Store timestamps in UTC and display the full IST deadline. At the 168-hour cutoff, undecided requests expire and advertiser cancellation closes; a timely recorded cancellation remains eligible during later manual processing.

On manual/automatic rejection or eligible cancellation, persist a refund obligation and notify admin. Admin performs the refund outside automated application jobs, then records the completed amount, reason, payment/refund reference and completion time and marks it refunded. Pending or failed attempts remain visible; recording intent or rejection must never mark money refunded. Processing may finish after day seven for a timely eligible event. Do not impose an unconfirmed refund-processing SLA or automatically call a refund API. Preserve provider/bank evidence and distinguish completion from estimated bank-credit timing.

### 3.3 Capacity and mobile routes

No cart, checkout or paid-pending request reserves advertising inventory. Multiple advertisers can therefore have paid requests for the same remaining unit. Availability means currently uncommitted capacity, not guaranteed service before admin approval.

At admin approval, one database transaction:
- verifies admin authorization and the current paid/request/cancellation state;
- verifies the recorded payment-time notice check, that service has not started, and capacity across every requested unit; it must not require another eight-day gap at approval;
- checks whole-day exclusivity or available theatre/mobile slots;
- checks approved mobile route compatibility across overlapping vehicle dates;
- writes the reservation, admin decision, audit and notification event together.

If capacity has been taken, approval fails without a partial allocation. Admin resolves the request, normally by rejection/refund; no automatic alternative dates or owner substitution is assumed. Pending paid requests do not satisfy the “other approved booking” route restriction, but concurrent approvals must never establish incompatible routes.

Only existing approved allocations are released on rejection/cancellation; a paid-pending request has none to release. Inventory edits/blackouts may not silently invalidate an approved service.

### 3.4 Fixed pricing

Owner supplies the initial base rate. Admin controls publication and every later published-rate change after discussing with the owner. Record owner discussion, administrator, old/new value, effective time and reason.

Calculate quotes from published rate, unit and quantity; store the rate version and paid line values. Changes in demand, request count, occupancy or nearby listing rates never automatically alter price.

Before payment, a changed quote must be shown and accepted by the customer. After payment, the amount is immutable for that booking. Do not retroactively modify a paid-pending or approved line while discussing it with the owner. No dynamic pricing formula, demand aggregation, locality weighting or scheduled repricing job is needed.

### 3.5 Separate data and state

Proposed records: identity/roles, owner verification, listings, venues/auditoriums/shows, vehicles/routes/slots, rate revisions, calendars/blackouts, media, quotes, cart and paid lines, payment attempts, admin coordination/decisions, reservations, cancellations, fulfillment/evidence, refund obligations/attempts, financial journal, transfer/settlement attempts, tickets, notifications/outbox and audits.

Do not collapse payment, decision, fulfillment and money-return status into one field:
- Payment: unpaid/processing/succeeded/failed plus separate refund totals.
- Review: paid-awaiting-admin/accepted/rejected/cancelled. Overdue is an operational alert for a missed expiry job, not an approvable business state; past-deadline requests resolve to rejected. Record cancellation time and rejection reason separately.
- Capacity: unreserved/approved-reserved/released.
- Fulfillment: scheduled/in-service-window/owner-reported-complete/admin-verified/partially-delivered/non-delivery-under-review. The clock only indicates the scheduled window; it cannot prove ad playback or completion.
- Refund: pending-admin/in-progress/refunded/failed; admin records refunded only after completing the refund and supplying its reference.
- Settlement: ineligible/eligible-for-admin-review/verified/transfer-in-progress/settled/failed; admin records a completed manual transfer with a bank reference.

A rejected line stays rejected even if its refund is still processing. A successful payment may coexist with rejected, accepted and refunded item states.


### 3.6 Booking units, checkout and cancellation consistency

Engineering specification derived from the confirmed workflow; validate examples in P01:
- A submitted cart contains request lines. Each line identifies one listing/owner, a date range or explicit shows/slots, its creative version and the agreed route/service terms. Line-unit allocations preserve individual dated prices for later missed-day/show refunds.
- LED dates include both start and end dates, and each booked day reserves the whole screen for its published operating hours. Theatre booking selects specific show instances and slot quantities; selecting multiple days expands to visible show instances, not an assumed all-day cinema reservation.
- Mobile rotating bookings identify the vehicle, dates, slot duration, plays and published route. Shared advertisements cannot each request a conflicting route. Custom-route eligibility is checked on approval across the entire vehicle/date range.
- Admin accepts or rejects the whole request line atomically; it cannot silently shorten dates or substitute shows. Different lines are decided independently. Advertiser cancellation cancels selected whole lines within the seven-day window; changing only some dates inside a line is an in-place change and remains excluded.
- Record a submitted cart snapshot and freeze membership, price, creative version and service terms while its checkout is in progress. Additions use another cart. A failed attempt can retry without duplicating funded lines; an expired or intentionally edited checkout requires a new accepted snapshot and invalidates old application checkout links.
- One Razorpay order represents the full snapshot total. Validate booking notice when forming checkout and against the trusted capture time before activating funded review. Late or invalid captures still remain recorded as customer money and create a manual reconciliation/refund task; never silently discard them or confirm an ineligible booking.
- A quote has an explicit server-side validity period selected and documented during P01/P05. Published price changes do not mutate an already-issued order; honor a still-valid accepted snapshot or require a fresh visible quote before payment. Never charge a retroactive difference.
- On admin approval, compare against the stored original notice check and the actual service dates; do not start another eight-day notice period. Both seven-day deadlines still originate from payment.
- Serialize cancellation, approval and deadline rejection using one state transition transaction. An eligible cancellation accepted first prevents later approval and releases only its existing allocations; later refund processing does not retain capacity. A rejected/cancelled line cannot be relabeled to change the applicable fee.

### 3.7 Creative files and fulfillment evidence

Before checkout, advertiser previews a validated image/video that meets the listing's approved size, resolution, aspect ratio, duration and format constraints. Keep the exact asset/version attached to the paid request; unsafe or incompatible media cannot be submitted. Owner/admin approval is about this version. Do not introduce post-payment replacement or campaign editing silently under the upload feature.

Admin privately reviews creatives and manually coordinates with the owner. After acceptance, admin releases confirmed service instructions and the approved asset through scoped access; owners never receive a raw request inbox. Evidence identifies the booked days/shows/slots, submitting owner and capture/upload times. Only the relevant advertiser, owner and admins may see permitted evidence. Admin verifies actual delivery; a photo/video or elapsed date alone is not proof that every contracted play occurred.

For a completely missed day or show/slot, calculate the gross undelivered value from the original dated price allocations. For partly delivered days/slots, admin manually determines the refund from evidence; do not invent an automatic hours/plays formula. Keep the gross service adjustment, allocated actual processing charges, net advertiser refund and owner/commission adjustments separate. Apply no penalty for owner failure, and deduct applicable Razorpay charges only once.

### 3.8 Manual financial records and truthful statuses

Use one external transaction record per completed refund or owner bank transfer, with item allocations that sum exactly to that transaction's amount. A grouped refund may cover several lines from the same payment; a grouped owner transfer may cover several eligible lines for the same verified beneficiary. References are unique per external transaction, not forbidden from legitimately appearing in that transaction's line allocations.

Only authorized admin can record completion, with amount, currency, beneficiary/payment link, reference, proof, operator and timestamp. Pending/failed operations must not appear refunded/settled. Provider events can supply reconciliation evidence but cannot automatically perform refunds, transfers or the admin completion action. Correct mistakes with audited amendment/reversal entries, not deletion.

The website can prevent invalid normal settlement records; it cannot prevent an admin from making a transfer in an external bank account. Record any unmatched, duplicate or ineligible external movement in an exception queue so accounting reflects reality without making the booking fulfilled or the payout eligible. Reconcile uncertain outcomes before another external attempt.

A payment receipt is available after verified payment, with order number, listing/date/show details, unit prices, totals and payment reference. A separate refund confirmation is downloadable after admin-recorded completion. Keep originals immutable, enforce account access and distinguish receipts from GST invoices. A booking remains rejected or cancelled even when its separate refund status changes.

Campaign dashboards distinguish paid-awaiting-review, accepted/scheduled, within scheduled service window, owner-reported completion, admin-verified completion and delivery issue. A scheduled start notification must say the service window has started; it must not claim that Pixlwave observed the ad playing.

## 4. Payments, cancellation, refunds and payout

- Use integer paise and server-calculated totals. Verify signed gateway events; browser checkout success alone is insufficient.
- One captured cart payment allocates to every paid line, not only later-accepted lines.
- Pending customer money and rejected/cancelled refund obligations remain liabilities. They are not earned owner funds or automatically recognized commission.
- Preserve a 15% commission version: Rs 10,000 completed service maps to Rs 8,500 owner / Rs 1,500 Pixlwave. Razorpay processing charges reduce Pixlwave's Rs 1,500, not the owner's Rs 8,500. Record actual gateway costs separately from gross commission.
- For advertiser cancellation within seven days, Pixlwave retains 5% of the cancelled booking amount, including Razorpay processing charges, and refunds 95%. For completed bookings, Razorpay processing charges come from Pixlwave's 15% commission. For admin rejection, deadline rejection or owner failure, return the affected paid amount less actual applicable Razorpay processing charges; there is no cancellation penalty or additional fee. Admin manually determines partial-delivery refunds and records the corresponding financial adjustments.
- Every manual/automatic rejection creates a manual refund obligation for the item. Admin performs and records each refund independently of other cart decisions. Never execute refund payments from application jobs; deduplicate obligations and admin completion records.
- Advertiser cancellation is permitted only within seven days of successful payment. Refund 95% of the amount paid for cancelled bookings and allocate the remaining 5% to Pixlwave as the total cancellation fee, including Razorpay processing charges. For partial-cart cancellation, apply this only to the cancelled items. Do not deduct processing charges again or add the 15% fulfillment commission. No owner service payout is earned on the cancelled amount. No cancellation penalty applies to admin rejection, automatic rejection or owner failure; deduct only actual applicable Razorpay processing charges from that refund.
- Cancellation example: Rs 10,000 cancelled within seven days returns Rs 9,500 to the advertiser; Pixlwave retains Rs 500, from which processing charges are covered. Record actual gateway charges separately as costs, not as additional advertiser deductions. Calculate in integer paise, round the fee once per cancelled line to the nearest paise (half up), and derive the refund as line amount minus fee so totals reconcile.
- After the ordinary seven-day cutoff, owner inability/non-delivery is the stated business refund exception. Preserve evidence and admin review; missed daily units and theatre shows/slots use their booked amounts.
- No pause/resume or extension refund rules remain. New dates use a new booking.
- Cumulative refunds cannot exceed the amount paid for the affected items. Store compensating journal entries rather than deleting or overwriting financial history.
- Duplicate/erroneous payment correction is a technical reconciliation concern with a separate defined procedure; the ordinary cancellation cutoff must not silently hide or retain unexplained money.
- Owner settlement is a manual admin bank transfer after accepted service fulfillment and verification. Record verified evidence, owner beneficiary, amount, transaction reference, operator and completion time. No fixed 48-hour wait or deadline triggers a payout.
- Unresolved rejection, cancellation, refund and non-delivery obligations block the affected payout. Do not pay any pending/rejected/unfulfilled line to an owner.
- Reconcile payment captures and admin-recorded refunds/transfers against provider/bank references. If an external outcome is uncertain, admin checks it before repeating a refund or transfer; the website never automatically retries a money movement.
- Manual owner transfer with a bank reference is the selected payout workflow. Razorpay Route, automatic splitting, transfer creation and release APIs are outside current implementation scope. Prevent duplicate admin completion records and warn about any already recorded transfer.
- GST calculation has a separate future interface; booking receipts are not advertised as GST invoices without the agreed implementation.


Confirmed refund rules:

| Outcome | Advertiser refund | Deductions / execution |
| --- | --- | --- |
| Advertiser cancellation recorded before payment + 168 hours | 95% of cancelled booking value | 5% retained by Pixlwave, including processing charges; no extra deduction |
| Admin rejection, deadline rejection or owner failure | Affected paid value less actual applicable Razorpay processing charges | No cancellation fee or penalty; admin performs refund and records completion |
| Partial delivery | Admin manually determines the service/refund assessment from evidence | Record assessment, applicable processing charge and net refund separately; no automatic hours/plays formula or owner-failure penalty |

Engineering accounting rule: use the actual recorded Razorpay processing cost for the captured payment, not a hardcoded percentage. For a mixed cart, allocate that cost proportionally to paid line values in integer paise, distributing rounding remainder deterministically. A refund for part of a line uses the applicable portion of its allocation; aggregate deductions cannot exceed the actual charge allocation or be deducted twice. For advertiser cancellation, this cost is already inside the 5% retention. Admin's partial-delivery assessment must reconcile gross service adjustment, deductions, net refund and remaining owner/platform balances before completion. Preserve evidence and audited changes. Do not add a separate penalty, 15% fulfillment commission or unapproved fee to a rejected/undelivered portion.

## 5. Architecture, maps and deployment

| Component | Planned approach | Responsibility |
| --- | --- | --- |
| Web/server | Next.js and TypeScript in one modular repository | Public UI, three role views, server-side policies |
| UI | Reusable accessible Tailwind components | Reference-led responsive forms, truthful statuses |
| Identity/data | Supabase Auth and PostgreSQL, Mumbai | Verified identities, access policies, transactional records, migrations |
| Background work | Durable worker/outbox in India | Admin reminders, notification delivery, deadline rejection/refund-task creation and reconciliation; no refund or payout execution |
| Files | Private object storage in Mumbai; public listing images separated | Safe creatives/evidence, expiring access, retention |
| Payments | Razorpay checkout; manual admin refund and bank-transfer records | Upfront collection, line allocations, refund tracking and verified manual owner settlement; no Route integration |
| Communication | Selected SMTP/SMS integrated with Auth and application events | Website/email/SMS notifications, tickets |
| Maps | Mappls primary, Google Maps fallback through adapter | Address/pin search, markers/clusters, planned routes |
| Hosting | AWS Mumbai app/worker and Supabase Mumbai | Isolated staging/production, backups/logs/recovery in India |
| Validation | Unit, real PostgreSQL integration, Playwright and manual review | Money/permission/capacity invariants and full workflows |

Keep privileged payment, rate, approval and refund mutations server-controlled and protected by database policies. A modular application plus worker is the initial recommendation; no separate pricing microservice is needed.

Mapping uses first-party listing locations and owner-agreed route data; provider content needs the appropriate usage/storage terms. Mappls does not supply booking availability or pricing. Verify Kerala location accuracy, quotas, costs and data handling before production. Main application data stays in India; normal external email delivery is permitted.

### Previously checked provider references

- Supabase offers Mumbai as a specific project region. Its primary-region selection does not by itself prove every component/process meets a broader residency requirement: [Supabase regions](https://supabase.com/docs/guides/platform/regions).
- Production Supabase auth email needs custom SMTP, and phone OTP needs an SMS provider: [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [phone login](https://supabase.com/docs/guides/auth/phone-login).
- Razorpay Route was previously researched ([Route](https://razorpay.com/route/), [refunds](https://razorpay.com/docs/payments/route/refund/)); it is excluded from the current manual payout implementation. Checkout and admin refund capabilities must be verified for the account before launch.
- Next.js supports Node.js and Docker deployments: [deployment](https://nextjs.org/docs/app/getting-started/deploying).
- PostgreSQL can enforce non-overlapping reservations using range constraints; shared capacity additionally needs appropriate slot rows/transactional controls: [range constraints](https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT).
- AWS lists Mumbai among Lightsail regions; exact compute/service sizing remains a foundation decision: [AWS availability](https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-lightsail-aws-regions/).
- Mappls supports interactive web maps, markers, GeoJSON/polylines and India-focused search/geocoding. It is the accepted primary provider; commercial terms, quotas, Kerala accuracy and data handling still require verification: [Web Maps](https://developer.mappls.com/documentation/sdk/Web/Web%20JS/), [search/geocoding](https://about.mappls.com/api/search-and-geocoding/).

Sources checked during planning on 2026-09-13/14. Reverify capabilities and supported versions at implementation; these references are not a locked pricing quote.

## 6. UI and manual operations

Use the references' white layouts, blue/teal accents, prominent search, listing cards, map views and dashboard structure. Logo/assets remain replaceable.

Required screens:
- Public Kerala home/search/map/details, How It Works, About/contact/support entry points and approved policy pages explaining the request/confirmation process.
- Auth/profile and owner verification/listing creation with initial base price.
- Cart/ad preview and upfront payment, followed by per-item admin review status and downloadable payment receipts/refund confirmations.
- Admin paid-request queue, due/overdue filters, owner contact/discussion notes, decisions, capacity check and price-change audit.
- Advertiser cancellations within policy, campaign status, evidence/non-delivery reports, payment/receipt/refund tracking.
- Owner listings, confirmed service instructions, evidence and earnings, without an incoming customer-request approval inbox.
- Admin completion/refund/settlement/finance/audit views and ticket support.

Explain before payment that admin confirmation is required, payment alone does not reserve inventory, and rejection leads to a refund. Show fixed price/unit and the accepted cancellation policy clearly. Avoid false instant-confirmation, playback or brand/adoption claims.

## 7. Seven-phase development roadmap

The project has exactly seven active development phases, P01-P07. Scope/design validation is the opening workstream in P01, not an extra P00 phase. All categories, business rules and 59 previous validation scenarios are retained. Seven new integration cases bring the planned total to 66; [the migration map](docs/phase-mapping.md) records every old-to-new test ID. Historical phase files are archived and must not be used as current instructions.

A phase is a delivery and validation milestone containing parallel workstreams. Agree shared schemas, API/event contracts and permissions before concurrent work. Integrate against the preceding phase's actual implementation, not a separate mock app. Later phases may prepare designs/contracts, but cannot close until prerequisite gates pass.

| Phase | Scope and handoff | Entry dependency |
| --- | --- | --- |
| P01 | [Foundation and accounts](docs/handoffs/P01-foundation-accounts.md) | Existing requirements and source review; no app implementation assumed |
| P02 | [Inventory management](docs/handoffs/P02-inventory-management.md) | P01 exit evidence and required interfaces accepted |
| P03 | [Discovery and communication](docs/handoffs/P03-discovery-communication.md) | P02 exit evidence and required interfaces accepted |
| P04 | [Booking and admin workflow](docs/handoffs/P04-booking-admin.md) | P03 exit evidence and required interfaces accepted |
| P05 | [Payments and booking integration](docs/handoffs/P05-payments-integration.md) | P04 exit evidence and required interfaces accepted |
| P06 | [Fulfillment and settlement](docs/handoffs/P06-fulfillment-settlement.md) | P05 exit evidence and required interfaces accepted |
| P07 | [Production validation and launch](docs/handoffs/P07-production-launch.md) | P06 exit evidence and required interfaces accepted |

P02 owns owner onboarding, verification and listing management. P03 exposes the approved inventory publicly. P04 uses explicitly labeled paid fixtures only at the payment boundary; its booking, capacity, admin and notification logic is real integrated application code. P05 must connect real Razorpay sandbox capture to that same code and rerun affected P03/P04 cases before passing. This is a validation dependency, not permission to ship fixture-backed bookings.

P07 contains sequential hardening, client acceptance and production-release gates. Security/load/accessibility work may run in parallel; public release follows successful validation and operational authorization.

### P01 - Foundation and accounts

Dependencies: Requirements and current decisions; scope/design checkpoint is included here.  
Requirements: R01, R02, R03, R09, R17, R18.  
Decision/configuration gates: Accepted business rules and scope; choose auth email method, admin MFA, India environment/configuration plan and initial UI/contracts. Owner verification workflow closes in P02.

Parallel work: Scope/design and UI components can progress alongside infrastructure and database setup after the core entities and interfaces are agreed. Auth implementation uses the deployed foundation; identity and permission policies must be agreed before account tests.

Workstream: Scope and interface contracts

- Approve the admin-mediated workflow, permission matrix, charged-cart/item definitions, deadline examples and refund eligibility matrix.
- Document price ownership: owner supplies the initial base price; only admin changes a published rate after owner discussion. Preserve booked-price history.
- Review all three category forms, upfront checkout, paid-awaiting-admin status, admin coordination notes, advertiser cancellation, refund tracking and owner fulfillment screens.
- Specify and validate the confirmed 192-hour notice, 168-hour review/cancellation cutoff, owner non-delivery exception and deadline-to-refund-task contract using dated examples and state/interface definitions. Implementation remains in P04-P06.
- Review reference-led responsive designs, provider/data plan, media requirements and estimated startup operating costs.

Workstream: Platform foundation

- Scaffold Next.js/TypeScript with reusable UI, clear business modules, configuration validation, supported pinned dependencies and documented local setup.
- Establish PostgreSQL/Supabase migrations, worker/outbox, durable jobs, structured redacted logs, health checks, fixtures and CI.
- Separate local/test/staging/production configuration and secret handling; select Indian compute/database/storage/backup/log destinations.
- Create adapter boundaries for Razorpay, maps, SMTP, SMS and object storage; isolate provider place IDs from first-party listing coordinates.
- Specify the shared state model and interface boundaries that keep booking, payment, admin decision, refund, fulfillment and settlement separate. Owning phases P04-P06 implement their records and transitions against these contracts.

Workstream: Accounts and access foundation

- Implement Supabase authentication, phone OTP and selected email method, recovery, session expiry, verified identifier linking and business/profile details.
- Allow one individual account to use advertiser and owner modes; separately grant platform administrator privileges.
- Explicitly forbid owner accounts from receiving customer request queues or accepting/rejecting bookings. Only admins perform booking decisions and subsequent published-price changes.
- Protect admin accounts with appropriate MFA and least-privilege access as an engineering requirement.

Integration with previous work: No previous implementation is assumed. Integrate the app shell, real database, auth sessions, shared UI, migrations, worker and CI in one runnable environment. Define permission capabilities now; owner verification/listing endpoints are P02 and booking decision endpoints are P04.

Test and validate:

- P01-T01: Walk through paid cart submission, manual admin-owner discussion and mixed item decisions without exposing requests to owner accounts.
- P01-T02: Use dated IST examples to validate minimum notice and seven-day boundaries, including a day-seven rejection and a day-seven cancellation awaiting refund processing.
- P01-T03: Review owner price submission, admin-only rate editing, current-booking protection, 15% commission and cancellation/refund examples.
- P01-T04: Trace every requirement to a phase; verify obsolete dynamic pricing, owner approval controls, delayed checkout and pause/change features are absent from current designs.
- P01-T05: Fresh checkout installs, builds and runs from documented instructions; invalid configuration fails clearly.
- P01-T06: Migrations apply to an empty database and a representative prior revision; build, lint and type checks pass.
- P01-T07: Persisted jobs survive worker restart, retries deduplicate side effects and outbox events follow committed transactions.
- P01-T08: Check browser bundles/logs for secrets and inspect provider region/configuration boundaries.
- P01-T09: Exercise login, expired/reused OTP, recovery, logout, session expiry and duplicate/linked identities.
- P01-T10: Validate real auth-delivery setup in allowed test accounts; distinguish provider-blocked checks from mock passes.
- P01-T11: From a clean environment, apply migrations, sign in, switch advertiser/owner mode, deny admin access to ordinary accounts, persist/retry a harmless outbox event and run CI on the same revision; record real auth-provider evidence.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: From a fresh checkout, start the app, sign in as separate advertiser/owner/admin accounts, switch modes and inspect access restrictions. Review all category and payment/admin workflow designs.

Exit gate: Foundation and auth work together, scope/interface contracts are documented, phase tests and manual review pass. Future endpoints are not falsely claimed as tested.

Next-phase handoff: Runnable repository/environment, migrations, identity/role policies, schema/API/event contracts, UI components, provider configuration references and setup/recovery evidence.

Handoff: [P01-foundation-accounts.md](docs/handoffs/P01-foundation-accounts.md).

### P02 - Inventory management

Dependencies: P01 accepted; integrate with all relevant completed phases.  
Requirements: R01, R03, R04, R05, R06, R07, R08, R10, R17, R18.  
Decision/configuration gates: P01 identities/access foundation accepted; verify owner documents, media constraints, approved service promises, initial publication and location provider.

Parallel work: Owner verification, the three inventory forms, media handling and the admin review UI can proceed against agreed identity/listing schemas. Shared calendar, pricing and media contracts must be integrated before publication tests.

Workstream: Owner onboarding and verification

- Build owner verification and admin review with server-side checks, database policies, rate limits and privileged audit logs.
- Build the owner inventory dashboard for drafts, verification/publication states, listing edits and suspension reasons. Admin controls verification/publication; owner accounts cannot publish unapproved rates or bypass review.

Workstream: Listings, pricing, media and capacity

- Build owner listings and admin publication/rejection/suspension for whole-day LED screens, theatre shows with multiple ad slots and mobile vehicles with rotating slots/routes.
- Capture initial owner base rate, specs, ad duration, number of plays per show/day, operating hours, blackouts, capacity and owner-attributed audience estimates. Owners set service promises per listing and admin approves them before publication. Define the immutable paid-booking snapshot fields and validate them with domain fixtures; P04/P05 implement and rerun the actual snapshot flow.
- Make subsequent published-price editing admin-only; record owner discussion, old/new price, effective time and reason. Owner suggestions cannot publish a changed rate.
- Integrate Mappls address search and pin placement for Kerala listings; retain first-party coordinates/locality and applicable route geometry with provider provenance/terms respected.
- Implement advertiser creative-upload foundations: file type/size checks, scan/quarantine, safe preview, private access and expiring downloads. Specify reusable evidence-storage and retention contracts; P06 implements fulfillment-evidence workflows. Preserve committed-service invariants with domain fixtures until P04/P05 rerun them against bookings.
- Validate category-specific image/video constraints and service promises before accepting a creative; show dimensions/resolution and a calendar of real show/day/slot capacity.

Integration with previous work: Use P01 accounts, roles, storage/configuration conventions and real database policies. Publish verified test inventory for all categories; public discovery in P03 consumes these exact records and APIs. P02 tests involving paid commitments or approved bookings use explicit inventory-domain fixtures because booking/payment do not exist until P04/P05. These fixtures validate listing invariants only; P04 reruns P02-T02, P02-T03, P02-T05 and P02-T06 with fixture-funded approval transactions, and P05 reruns them with Razorpay sandbox-funded bookings.

Test and validate:

- P02-T01: Confirm role switching grants no admin privileges and unverified owners cannot publish listings.
- P02-T02: Using an immutable paid-commitment domain fixture for the downstream-dependent portion, verify draft/verified/published access; require admin approval of owner-specified ad duration, plays per show/day and operating hours. Reject invalid service values and prove owner API edits cannot change published price or the fixture's committed service terms. Rerun with P04 fixture-funded and P05 sandbox-funded bookings.
- P02-T03: Using approved-booking domain fixtures, test show and rotating-slot capacity, blackout overlap and the no-other-approved-bookings custom-route condition across overlapping vehicle dates. Rerun against P04 approval transactions and P05 sandbox-funded bookings.
- P02-T04: Reject spoofed/corrupt/oversized uploads and unauthorized downloads; verify scanning, expiring links and safe preview.
- P02-T05: Check representative Kerala address/pin accuracy, provider failures and price audit history; use a committed-service domain fixture to reject conflicting capacity/route edits, then rerun that protection in P04 and P05.
- P02-T06: Validate duration, plays and operating hours against available service capacity; use an immutable paid-service domain fixture to preserve committed terms across listing edits, and reject incompatible creative metadata before checkout. Rerun paid-term protection in P04 and P05.
- P02-T07: Using P01 accounts, create one listing of each category, block publication by unverified owners, complete admin verification/publication and retrieve the same approved records through the read API. Recheck cross-account media and price permissions.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: An owner creates LED, theatre and mobile inventory; admin verifies the owner, reviews service promises and approves the listings. Review owner dashboard states and admin-only price changes.

Exit gate: Verified owners can manage inventory and admins can publish it securely; all category records are usable by P03. No mocked owner identity or separate duplicate listing store.

Next-phase handoff: Approved listing/media schemas and APIs, all-category sample records, owner/admin screens, published-rate and capacity contracts, protected asset access and verification evidence.

Handoff: [P02-inventory-management.md](docs/handoffs/P02-inventory-management.md).

### P03 - Discovery and communication

Dependencies: P02 accepted; integrate with all relevant completed phases.  
Requirements: R01, R02, R04, R08, R16, R17, R18.  
Decision/configuration gates: P02 published inventory APIs accepted; configure Mappls and SMTP/SMS delivery, ticket/media permissions and supported Kerala discovery.

Parallel work: Public search/map/detail pages and notification/ticket services can progress independently on P01 identities and P02 listings. Booking/payment notification contracts are agreed now and exercised with explicit event fixtures until P04/P05 emits real events.

Workstream: Public discovery and pricing

- Build Kerala-first homepage/search/map/details, featured inventory, city/locality/category/date/budget filters, responsive navigation and clear availability labels. Details include listing images, dimensions/resolution, pin/address, owner-attributed audience estimates, published unit prices and an availability calendar.
- Display fixed current admin-published day/show/slot rates; calculate totals from dated units. No demand or nearby-screen price adjustment service.
- Implement immutable pre-payment quote snapshots, rate versions and customer-visible price-change checks. Specify the paid-line price snapshot contract; P04/P05 implement and rerun it with fixture-funded and Razorpay-funded bookings. Admin changes affect future quotes only.
- Use Mappls markers/clustering and owner-defined route display through the provider adapter; pricing uses listing rates and booking units, not map traffic/demand.
- Keep geography extensible for later states while enforcing Kerala launch inventory eligibility.
- Provide complete source-blueprint listing details and calendar states; keep state selection Kerala-only at launch and display no fake audience or live-availability claims.

Workstream: Notification infrastructure and tickets

- Implement the in-app/email/SMS delivery framework and role-specific templates for payment, review, decision, cancellation, refund, fulfillment and support events. Use explicit contract fixtures in P03; P04-P06 connect and rerun the actual domain triggers.
- Implement the durable reminder/template mechanism for the 168-hour review deadline, deadline rejection and pending manual refunds using event fixtures. P04 connects the real deadline job; P05/P06 connect actual payment/refund status.
- Use durable outbox delivery, idempotency, retry/backoff, bounce/failure tracking and accurate links; notification delays never silently extend eligibility.
- Implement booking-linked support tickets, attachments, admin replies and private internal notes. Customer requests and creatives are not automatically forwarded to owners.
- Use ordinary Gmail/other recipient delivery with configured SMTP/SMS providers; no waiting-to-pay or 48-hour countdown campaigns.
- Use ticket states open/in-progress/resolved/closed with audited replies and private notes; show notification delivery status separately from booking state. Scheduled-start notices never claim verified playback.

Integration with previous work: Discovery reads P02 listings/rates/calendars; tickets use P01 accounts and safe attachments. Real provider test delivery is required. Booking/payment event tests and paid-price/booking-linked ticket checks use labeled event/database fixtures until P04/P05 supplies actual funded requests; P05 reruns them with real sandbox-funded records. Do not advertise checkout as operational before P05.

Test and validate:

- P03-T01: Verify search/filter/map/detail agreement, supported geography, clustering, empty/loading/quota failure states and restricted API keys.
- P03-T02: Check totals for days/shows/slots, quantities and paise rounding; changing request counts, bookings or nearby prices must not change a published rate.
- P03-T03: Change the published rate before checkout and require an updated visible quote; use an immutable paid-line domain fixture to prove later admin edits do not reprice it. Rerun with P04 fixture-funded and P05 Razorpay-funded bookings.
- P03-T04: Review keyboard/screen-reader flow and mobile layouts; verify switching the map adapter does not alter booking or price data.
- P03-T05: Check image preview, dimensions/resolution, location pin, dated availability, price unit and attributed audience estimate on phone and desktop; date filters and the calendar must agree.
- P03-T06: Check recipient/channel routing and confirm owners receive neither raw booking requests nor customer/admin private notes.
- P03-T07: Test duplicate events, email bounce, SMS timeout and worker recovery without lost/duplicate business actions.
- P03-T08: Using explicit deadline/payment/refund event fixtures, verify IST timestamps, admin due/overdue reminders, paid-awaiting-review wording and post-refund notification templates. Rerun actual deadline events in P04 and payment/refund outcomes in P05/P06.
- P03-T09: Attempt cross-account ticket/media access; receive real provider test messages and record any blocked external validation.
- P03-T10: Start a scheduled campaign window with no evidence: notify only its scheduled status, never observed playback or verified completion. Confirm resolved tickets retain authorized reply history and private notes stay private.
- P03-T11: Publish/change a listing through P02, verify the same approved values on search/map/details, submit a ticket using a P01 account and deliver its notification. Distinguish fixture campaign events from real listing/ticket events and prevent cross-account access.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: Browse approved inventory on phone/desktop, compare card/detail/map/calendar values, open a ticket and receive a real test notification. Label event-fixture evidence separately.

Exit gate: Discovery and communication integrate with existing accounts/inventory; real delivery and access tests pass. Later phases must rerun notification cases against their actual emitted events.

Next-phase handoff: Public browsing/map routes, listing-read contracts, quote construction, ticket workflows, notification event schemas, role/channel routing, retry/failure evidence and provider configuration references.

Handoff: [P03-discovery-communication.md](docs/handoffs/P03-discovery-communication.md).

### P04 - Booking and admin workflow

Dependencies: P03 accepted; integrate with all relevant completed phases.  
Requirements: R01, R03, R05, R06, R07, R09, R10, R11, R14, R16.  
Decision/configuration gates: P03 discovery/quotes and notification contracts accepted. Confirmed 192/168-hour clocks and approval-only reservations apply. Payment capture enters through a defined trusted interface; actual gateway wiring is P05.

Parallel work: Cart/category request UI and admin review UI can progress against the same booking state contract. Capacity/timing transactions can be developed alongside these UIs; run integrated real-database races before closing.

Workstream: Cart, requests and admin review

- Build category request forms, ad preview and a cart containing all requested bookings; freeze submitted contents and route additions to a new cart.
- Implement paid-awaiting-admin review, admin decisions, private coordination notes and seven-day due dates from payment. Automatically reject undecided requests at deadline and create a manual refund task. Owners have no direct request/decision controls, and no job sends refund money.
- Implement resource allocations for LED days, theatre show slots and mobile vehicle slots; leave paid-pending requests unreserved and allocate capacity only in an atomic admin approval transaction.
- Apply custom-route eligibility across overlapping approved vehicle bookings; admin records the owner-agreed route and cannot change an existing commitment through another request.
- Persist decision/cancellation events and refund obligations. Decisions are independent per item; neither waits for every item nor opens a new checkout window.
- Apply plan sections 3.6-3.8: explicit dated request units, atomic whole-line decisions, immutable checkout/creative snapshots and payment-time notice verification without reapplying notice at approval.

Workstream: Integration and payment fixture boundary

- Use P02 inventory and P03 quotes to form immutable cart/creative snapshots. Connect admin decision and deadline events to P03 notifications.
- Use a restricted test-only funding adapter to exercise paid review without Razorpay. It must not exist as an accessible production route or let clients mark their own requests paid. Cancellation state/races are implemented here; actual refund completion accounting is wired in P05/P06.

Integration with previous work: Continue directly from P03 listing/quote flows, use P01 permissions and P02 actual capacity, and emit real domain decision/deadline events. Explicit paid fixtures exercise the trusted payment boundary, not gateway integration. All required LED/day, theatre/show and mobile/slot combinations use the same domain; no duplicated later implementation. Rerun P02-T02, P02-T03, P02-T05 and P02-T06 against P04's fixture-funded approval transactions; P05 repeats them with real Razorpay sandbox funding.

Test and validate:

- P04-T01: Try direct API/database cross-user reads, role escalation and owner attempts to approve/reject requests or change a published rate.
- P04-T02: Reject unpaid/malicious transitions to paid review; test admin-only decisions, private coordination notes and no owner exposure of raw requests.
- P04-T03: Race requests/admin decisions across multiple days/shows/vehicle slots; prove no approved oversell or incompatible route commitment with no reservation until admin approval; competing paid requests must not acquire overlapping approved capacity.
- P04-T04: Verify frozen membership, new cart for additions, per-item decisions, all rejected/mixed accepted states and preserved paid amounts.
- P04-T05: Test exact seven-day boundaries, automatic rejection and manual refund tasks, late acceptance blocked despite worker lag, and timely cancellation-versus-approval/expiry races with real database fixtures.
- P04-T06: Capture payment on 1 October at 10:00 IST; accept service starting 9 October at 10:00 and reject an earlier start. Permit approval shortly before 8 October at 10:00, reject approval at/after that instant, and do not reapply the 192-hour notice at approval. Cover daily operating starts and theatre show times.
- P04-T07: Verify inclusive LED dates, explicit theatre shows and mobile dated slots; reject partial silent acceptance and edited submitted assets. Race line cancellation against approval/expiry and release only actual reservations.
- P04-T08: From P03 discovery, submit a fixture-funded multi-category cart, decide items as admin, verify P02 capacity and P03 notifications, then race cancellation and the 168-hour deadline. Prove normal clients cannot invoke fixture funding or approve their own request.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: Start from a real listing, create a cart, inject funding through the restricted test harness, accept/reject items as admin and inspect capacity and notifications. Confirm owner has no raw incoming request queue.

Exit gate: Cart/admin workflow integrates with earlier phases and passes concurrency/timing/permission tests. Evidence clearly identifies fixtures; production paid submission remains unavailable until P05 passes.

Next-phase handoff: Frozen-cart and request contracts, atomic approval/cancellation/capacity transactions, deadline jobs, notification events, trusted payment-success input and fixture evidence needed by P05.

Handoff: [P04-booking-admin.md](docs/handoffs/P04-booking-admin.md).

### P05 - Payments and booking integration

Dependencies: P04 accepted; integrate with all relevant completed phases.  
Requirements: R01, R08, R09, R11, R12, R14, R15, R16, R17.  
Decision/configuration gates: P04 payment-success and booking contracts accepted; verify Razorpay sandbox/account capabilities, actual processing charges, receipt scope and manual refund reference workflow.

Parallel work: Razorpay order/webhook handling, receipts/manual refund records and payment UX can progress after agreeing ledger and provider event contracts. Final acceptance is one shared end-to-end journey through existing booking services.

Workstream: Payment collection, receipts and refund records

- Create exactly one server-priced Razorpay order for the entire submitted cart, containing the summed value of all valid items before any booking decision. Store internal item allocations; do not create a separate checkout/order per item. Customer pays once through enabled UPI/card/net-banking methods.
- Use verified captured payment/webhooks to atomically allocate the payment to all submitted booking lines and enter unreserved paid-awaiting-admin review. Set both seven-day clocks from verified payment success; confirmation/reservation occurs only after admin approval.
- Persist integer-paise immutable ledger entries, price and 15% commission policy snapshots, attempts and receipts; pending funds are liabilities, not earned owner payouts.
- Create an item-specific manual refund task on rejection. Provide admin processing/completion fields for amount, deductions, reference, evidence and time; admin marks refunded after completing it. Deduplicate tasks and completion records, reconcile with actual transactions and prohibit automated refund API calls.
- Handle missing callbacks, duplicate/out-of-order webhooks, extra successful attempts, allocation failure and late payment safely. Keep tax calculation modular and receipt naming accurate.
- Provide downloadable account-scoped payment receipts and completed-refund confirmations. Model one external refund transaction with balanced item allocations; record late/extra captures as manual exceptions without automatic refunds.

Workstream: End-to-end booking integration

- Connect verified Razorpay capture to the existing P04 transaction boundary; use one order per cart and retain original capture timestamps. Replace fixture funding in all end-to-end acceptance journeys.
- Connect manual rejection-refund completion records to P03 notifications and P04 rejected line states. Payment/refund/booking status stay independent; no automatic refunds.

Integration with previous work: Razorpay captures fund the same P04 requests without reserving capacity; admin decisions reserve/reject through existing rules and emit P03 notifications. Rerun P04 capacity/timing, P03 event-routing and P02-T02/P02-T03/P02-T05/P02-T06 listing-invariant cases with real sandbox checkout, including mixed rejection and manual refunds. P05-T04 uses a simulated fulfillment-eligible ledger line, and P05-T05 uses a partial/grouped refund allocation fixture, because P06 owns completion and partial-delivery assessment. P06-T05 and P06-T09 perform the integrated reruns with admin-assessed/admin-verified campaigns.

Test and validate:

- P05-T01: Pay a multi-owner/multi-category cart before any decisions; prove captured total equals all paid lines and exactly one submission enters admin review without reserving inventory; delayed/replayed webhooks do not restart its seven-day clocks.
- P05-T02: Accept one item, reject another and expire a still-undecided item at day seven; assert refund tasks appear without a refund API call. Record a manually completed sandbox refund and reconcile its item amount/reference. Test duplicate tasks/references, incomplete completion data, unauthorized edits and failed or uncertain external outcomes.
- P05-T03: Test forged signatures, manipulated totals, repeated clicks, duplicate captures, lost webhooks, provider timeout and concurrent payment/rejection/cancellation events.
- P05-T04: Verify failed payments create no funded review/confirmed booking, and payment success never equals admin approval or owner settlement. As a ledger/domain test, use a simulated fulfillment-eligible Rs 10,000 line to assert Rs 8,500 owner and Rs 1,500 gross Pixlwave commission with gateway costs charged only against the latter; rerun with actual admin-verified completion in P06-T09.
- P05-T05: As a ledger-allocation fixture rather than a fulfillment test, verify one gateway order for a mixed cart, immutable receipt totals and authorized downloads; record one manual partial/grouped refund and reconcile its allocation without counting the transaction multiple times. P06-T05 reruns partial-delivery refund accounting after admin assessment.
- P05-T06: Expire a checkout across an IST date boundary and deliver a late capture/webhook: preserve captured money, avoid restarting deadlines or confirming an ineligible booking, and create a manual exception task. Test valid price snapshots when an admin changes rates.
- P05-T07: Run a real Razorpay sandbox multi-owner cart through P03 discovery, P04 admin decisions and manual rejection refund recording. Verify one capture, exact clocks, capacity, actual notifications and financial totals; rerun fixture-era permission/concurrency cases, including P02-T02, P02-T03, P02-T05 and P02-T06, and record provider outages distinctly.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: Pay one mixed cart in Razorpay sandbox, receive payment notification, decide items in the admin dashboard, record a manually completed rejection refund and download reconciled receipts. No fixture may satisfy this sign-off.

Exit gate: Real sandbox payment through booking, capacity, notifications and manual rejection refunds passes on one revision. No production test-funding path; browser callbacks alone cannot fund review.

Next-phase handoff: Verified sandbox checkout, immutable ledger/fee allocations, manual refund records, receipts, event reconciliation, capture-to-booking evidence and funded campaign contracts for P06.

Handoff: [P05-payments-integration.md](docs/handoffs/P05-payments-integration.md).

### P06 - Fulfillment and settlement

Dependencies: P05 accepted; integrate with all relevant completed phases.  
Requirements: R01, R03, R13, R14, R15, R16, R17.  
Decision/configuration gates: P05 paid-booking and manual financial record contracts accepted. Use confirmed cancellation/rejection charge rules, admin-determined partial refunds and manual owner transfer after verification.

Parallel work: Evidence/campaign views, cancellation/refund assessments and finance/owner reports can progress against shared paid-line and ledger contracts. Refund-versus-payout decisions must share one reconciled financial model and pass integration races.

Workstream: Campaigns, evidence and cancellation

- Build confirmed campaign schedules, owner service/evidence records and admin completion/non-delivery decisions. Scheduled/live-window notifications indicate dates only, never verified playback. Completion requires admin evidence verification; no physical playback control.
- Allow advertiser cancellation only before successful payment + seven days. Refund 95% of the cancelled booking amount; allocate 5% to Pixlwave inclusive of Razorpay processing charges, with no separate processing deduction or added fulfillment commission. Preserve the request timestamp, queue the refund for admin and mark refunded only after admin records its completed payment reference.
- Block ordinary cancellation/refund eligibility after the cutoff while retaining owner inability/non-delivery as the business exception. Preserve eligibility for timely requests whose manual processing completes later.
- Refund undelivered daily units or theatre show/slot units at the booked rate; support partial delivery, evidence and admin decision reasons.
- Remove pause/resume, campaign extensions and in-place rescheduling/change actions from scope. Later advertising dates use a separate booking. Keep fulfillment, refund and settlement status separate.
- Review unit-linked evidence before admin-verifying completion. Use booked prices for fully missed units; let admin manually determine partial-delivery refunds with a reason and evidence. Record applicable actual Razorpay charges separately, deduct them once and apply no owner-failure penalty.

Workstream: Owner settlement and financial reporting

- Provide admin reports for paid-pending funds, rejected/cancelled liabilities, accepted commitments, completed service, refunds, platform revenue and owner earnings.
- Release only an accepted, fulfilled booking's reconciled owner balance after admin review; neither day seven nor a removed 48-hour timer triggers payout.
- Implement admin-only manual owner transfer records after fulfillment verification, with beneficiary, amount, bank reference, proof, operator and timestamps. Do not integrate Route or any automatic payout API.
- Require admin to record the completed external bank transfer before showing settled. Guard against duplicate references/settlement records; uncertain transfers remain unresolved until manually reconciled.
- Provide exception reconciliation for missing payment evidence, failed or uncertain manual transfers, post-settlement owner non-delivery and manual refunds. Preserve audited corrections; do not automatically debit an owner or issue a second transfer.
- Store one manual external transaction with balanced eligible line allocations. Record ineligible or uncertain external transfers as audited reconciliation exceptions without falsely marking service verified.

Integration with previous work: Use P05 actual funded lines and journals, P04 booking/cancellation state, P02 service promises and P03 notifications/tickets. Admin records external refund/transfer completion; application jobs never perform money movements. Earlier rejection refund logic is reused, not reimplemented.

Test and validate:

- P06-T01: Test cancellation immediately before/at/after seven-day expiry, including an accepted booking and a timely cancellation manually processed after the cutoff. Assert eligibility is preserved and no automated refund occurs.
- P06-T02: For manual rejection, deadline rejection and owner non-delivery after day seven, verify net refund equals the affected paid amount less applicable actual Razorpay processing charges. No 5% cancellation fee or other penalty applies; admin records manual completion and duplicate deductions are blocked.
- P06-T03: Verify Rs 10,000 cancellation refunds Rs 9,500 and allocates Rs 500 to Pixlwave inclusive of processing charges, with no additional fee or owner payout on the cancelled amount. Test partial-cart allocation, paise rounding, cumulative refund limits, duplicate refunds, gateway failure and refund-versus-payout races.
- P06-T04: Verify absence of pause/change endpoints, authorization on evidence, truthful fulfillment status and continued access to valid non-delivery claims without a 48-hour expiry.
- P06-T05: Separate scheduled status, owner-reported completion and admin verification. For partial delivery, require an authorized admin-entered refund assessment, reason and unit-linked evidence; enforce remaining paid-value limits and audit changes without automatically calculating an hours/plays refund.
- P06-T06: Prove paid-pending, rejected, cancelled, unfulfilled and disputed items cannot be marked eligible for normal owner settlement in the website; eligible completed items settle independently within a mixed cart. Record any erroneous external transfer as an exception, not an approved payout.
- P06-T07: Test duplicate manual transfer records, missing bank reference/proof, unverified beneficiary, failed or uncertain transfer, unauthorized status changes and concurrent admin edits. Assert no payout/Route API is called.
- P06-T08: Race owner non-delivery refund against payout; account for refunds discovered after settlement without silently creating a negative recoverable balance.
- P06-T09: Reconcile 85% owner share and 15% gross commission with Razorpay processing charges deducted from Pixlwave's commission on completed service. Verify manual refunds/transfers against bank references and enforce admin permissions and audit history.
- P06-T10: Reconcile one bank transfer covering multiple eligible lines for the same owner without duplicate counting. Record an erroneous external transfer as an exception and block normal settlement/fulfillment status changes.
- P06-T11: From a P05 sandbox-paid cart, first cancel one line before the 168-hour cutoff. Then advance the controlled test clock beyond the 192-hour service start, complete one remaining line and report partial delivery on another. Verify admin assessments, evidence, fee rules, receipts, notifications and owner balance; record manual completion without any refund/payout API execution.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: Use a sandbox-paid approved campaign, inspect evidence, assess partial delivery, process a timely cancellation and record manual refund/owner-transfer outcomes. Show no penalty for owner failure beyond applicable processing-charge deduction.

Exit gate: Campaign, refund and owner finance workflows reconcile with previous phases and external references; no hidden unpaid or unverified payout, duplicated money record or incorrect notification. Actual outside-bank mistakes remain auditable exceptions.

Next-phase handoff: Complete fulfillment/refund/manual payout workflows, balanced journals and exception records, evidence access/retention, operator procedures and full-system regression fixtures for P07.

Handoff: [P06-fulfillment-settlement.md](docs/handoffs/P06-fulfillment-settlement.md).

### P07 - Production validation and launch

Dependencies: P06 accepted; integrate with all relevant completed phases.  
Requirements: R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16, R17, R18.  
Decision/configuration gates: P01-P06 feature gates accepted; provider activation, real inventory, operating budget/targets and launch authorization ready. First close hardening and client acceptance; only then perform authorized production release.

Parallel work: Security, accessibility, load testing and operator documentation may run in parallel against one release candidate. Fixes require affected regression. Hardening, client acceptance and production release are sequential gates within this phase.

Workstream: System hardening and operational readiness

- Run integrated advertiser/admin/owner regression on supported phone/tablet/desktop browsers.
- Validate access controls, uploads, webhook security, map quotas, accessibility, load and multi-user concurrency.
- Monitor paid-pending requests, approved capacity, seven-day workload, automatic rejection jobs and manual refund queues, cancellation/refund liabilities, worker lag and failed payouts.
- Exercise Indian-region backup/restore, migrations, deployment recovery, worker/provider outages and reconciliation of money movements since backup.
- Produce measured capacity/cost results and operator runbooks for manual coordination, missed deadlines, non-delivery/refund and settlement exceptions.
- Restore manual refund and bank-transfer journals as well as payment events; reconcile external transactions performed after the backup before operators act on restored pending tasks.

Workstream: Client acceptance and production release

- Obtain final approval for admin-only decisions, upfront cart payment, fixed pricing, seven-day cancellation/refund policy, owner non-delivery exception and all category workflows.
- Configure Indian production servers/data, providers, domain/TLS, safe uploads, backups, alerts and Mappls production access.
- Publish real verified Kerala listings and admin-approved rates; remove demo content and train admins for the seven-day coordination workload.
- Complete operational ownership, support, cancellation/refund disclosures, receipt/tax scope and owner onboarding/settlement arrangements.
- Perform expressly authorized controlled live payment/refund/settlement checks where needed, then deliver release/recovery/training handoffs.
- Validate the source coverage matrix and manual-operation disclosures, including download receipts, service-window wording and every replaced blueprint workflow.

Integration with previous work: Validate the complete application, not isolated demos. Recover database, media and manual money records in India; reconcile external transactions before restored tasks are acted on. Production release uses the exact tested revision/configuration with approved changes only.

Test and validate:

- P07-T01: Run production-like upfront-payment/admin-decision journeys across all categories, including mixed refunds and concurrent last-slot attempts.
- P07-T02: Verify owners cannot receive/decide requests or edit published rates; test private notes, files, sessions, signed webhooks and safe logs.
- P07-T03: Simulate outage at the seven-day deadline: block late acceptance, recover automatic rejection and manual refund task creation promptly and exactly once without calling refund or payout APIs, preserve timely cancellation records and retain unresolved obligations.
- P07-T04: Restore into an isolated Indian environment, reconcile newer provider events, and measure agreed load/accessibility targets.
- P07-T05: Restore a backup predating a manually completed refund/owner transfer, then reconcile external evidence; ensure stale pending tasks warn operators and cannot become duplicate normal completion records.
- P07-T06: Production smoke-test public discovery, fixed rates, auth, category cart, payment, paid-review status, admin decisions, refunds and role restrictions.
- P07-T07: Verify deployed revision/migrations, India data locations, provider keys, map settings, alerts and recoverability.
- P07-T08: Record approved live transaction reconciliation separately from sandbox evidence; confirm decisions/eligibility match the displayed seven-day policy.
- P07-T09: Inspect UI/API for obsolete owner approval, post-approval checkout, payment countdown, completion countdown, dynamic pricing and pause/change controls.
- P07-T10: Walk through every blueprint coverage row with the client; verify delivered replacement behavior, excluded playback/chat/pause flows and downloadable receipts against the released revision.
- P07-T11: Promote the same accepted P01-P06 release candidate through full regression, client acceptance and authorized deployment; verify migration/configuration parity, restore/reconciliation rehearsal and post-release smoke checks without losing manual finance or booking history.

Regression gate: Run affected earlier-phase cases against the integrated revision. Maintain the same schema/contracts or record a compatible migration and rerun every affected consumer. Payment/event fixtures never replace real provider evidence required by this or a later phase.

Manual acceptance: Client walks through advertiser/owner/admin flows on supported devices, signs off the release candidate and rehearses refund/payout/incident recovery. Named operators accept responsibilities; then approve and verify release.

Exit gate: All features and validation cases pass, critical/high defects are resolved, client acceptance is recorded and specifically authorized production release is healthy. No phase count reduction waives these gates.

Next-phase handoff: Accepted release revision, test and manual-review evidence, deployed configuration/migrations, restore/reconciliation runbooks, operator ownership, training and known-issue register.

Handoff: [P07-production-launch.md](docs/handoffs/P07-production-launch.md).

## 8. Shared testing and validation gates

For every implemented phase:
1. Run build/lint/type checks and meaningful behavioural tests appropriate to its change.
2. Validate new permissions and invariants in the real database; UI checks are insufficient.
3. Include deterministic fixtures, negative cases, error/empty states and review instructions.
4. Record actual command, revision, environment, time, result and evidence.
5. Complete user/client manual acceptance and update handoff/decision records before closing the phase.

NOT RUN, BLOCKED, FAIL and PASS are distinct. A mock proves logic only, not provider integration. Never record planned screenshots or test names as evidence. Cosmetic edits need proportionate visual review; money, authorization and reservations require adverse-path tests.

Critical cross-phase regression:
- One upfront payment includes all cart lines before any decision; verified success creates one review submission.
- Seven-day deadlines originate from successful payment and cannot restart on acceptance or retries.
- Paid-pending requests reserve nothing; only atomic admin approval allocates capacity.
- Multiple paid requests for the last unit cannot both become approved; rejected money remains tracked for refund.
- Owner accounts cannot view raw incoming requests, decide bookings or edit published rates directly.
- Fixed rate changes require admin authority and discussion audit; existing paid prices never change.
- Individual rejections/refunds reconcile within mixed-owner carts without duplicate charges or refunds.
- Cancellation is allowed only in the defined seven-day period with the selected fee; valid later non-delivery remains reviewable.
- No pause/change features or obsolete payment/completion countdowns exist.
- Fulfillment/admin review, refund liabilities and ledger balances govern settlement.
- Worker/provider outages and restoration preserve timing, unresolved obligations and money history.

Proposed startup validation targets, not client forecasts or agreed SLAs:
- Dataset: 1,000 listings and 10,000 accounts across all inventory types.
- Baseline load: 100 concurrent browsers and a 20-request approval race for the last slot.
- Ordinary read API p95 under 1 second under documented baseline, excluding third-party completion time.
- Representative mobile LCP <= 2.5 seconds and CLS <= 0.1 under a recorded test profile.
- Accessibility target: WCAG 2.2 AA-oriented key journey checks plus keyboard/screen-reader review.
- Proposed recovery point <= 1 hour and recovery time <= 4 hours, subject to budget/provider review; reconcile payment activity after the recovered point.

P07 must agree or replace targets and report actual measurements. Database restoration must use an isolated Indian environment.

## 9. Operating readiness and release

Production requires all current business gates resolved, all three categories, real Kerala inventory, provider activation, manual acceptance, backups/alerts and named support/finance operators.

Runbooks cover setup/deployment/migrations, incident/recovery, admin owner coordination, review deadlines, unreserved competing requests, price publication, rejection/cancellation refunds, late non-delivery, transfer/refund reconciliation and manual payout recording.

Budget by compute, worker, database/backups, media storage/egress, email/SMS, maps, monitoring and gateway/transfer costs. Include staging and admin workload. No arbitrary monthly total, staffing promise or launch date is asserted.

Keep sandbox/staging/production isolated. Real charges, refunds, transfers and public release require specific operational authorization at P07. No such action occurs by updating this plan.

## 10. Handoffs and future updates

Use [handoff.md](handoff.md) and the relevant phase file. Each handoff records scope, actual revision/files, schemas/migrations, API/events, configuration names without secrets, real tests/evidence, manual reviewer, defects, recovery and next actions.

When an answer changes:
1. Update its stable Dxx record and source/date.
2. Update current workflow, tests and affected handoffs.
3. Retain superseded policy only in historical sections.
4. If code/data exists, assess migration and existing-contract effects before changing behaviour.
5. Validate impacted rules without repeating unrelated checks.

## 11. Current next step

Implement the confirmed manual refund/payout workflow, 192-hour booking notice and 168-hour review/cancellation cutoff. Advertiser cancellation refunds 95% with 5% to Pixlwave inclusive of processing charges. Admin/deadline rejection or owner failure refunds the affected payment less actual applicable Razorpay processing charges, without penalty. Admin manually determines partial-delivery refunds. Begin P01 with the included scope/design checkpoint, foundation and accounts; complete its operational/provider verification using these accepted rules.

The three business questions raised in the review are resolved. Technical setup, provider activation, approved designs, real listings and measured launch gates remain development work. No application code, tests or client acceptance have been completed.

## 12. Revision history

| Version | Date | Change |
| --- | --- | --- |
| 0.1 | 2026-09-14 | Initial draft and phase handoffs. |
| 0.2 | 2026-09-14 | First client answers, including 15% commission and Kerala scope; workflow since superseded in part. |
| 0.3 | 2026-09-14 | Mappls primary/Google fallback accepted. |
| 0.4 | 2026-09-14 | Admin-only review, upfront grouped payment, seven days from payment, approval-only reservations, immediate rejection refunds, automatic deadline rejection/refund, 5% advertiser cancellation fee and later owner non-delivery exception; admin-controlled fixed prices; pause/change flows removed. No implementation/data migration. |
| 0.4 cancellation allocation | 2026-09-14 | Confirmed 95% refund for cancellation within seven days and 5% Pixlwave retention inclusive of Razorpay processing charges; updated partial-cart accounting and phase validation. No application implementation. |
| 0.5 | 2026-09-15 | Manual admin refunds and owner transfers replace automated money operations; automatic deadline rejection creates a task only. Confirmed completed-service fee allocation and owner-defined service fields; rejection/owner-failure charge payer remains open. No application implementation. |
| 0.6 | 2026-09-15 | Source coverage audit; clarified one payment order per cart, payment-time notice validation, booking units, manual transaction allocations, receipts and truthful service states. Added phase validation cases and recorded three remaining business questions. No application implementation. |
| 0.7 | 2026-09-15 | Resolved 192-hour notice, 168-hour cutoff, admin-determined partial refunds and rejection/owner-failure refunds less actual processing charges with no penalty. Updated handoffs and acceptance cases; no implementation. |
| 0.8 | 2026-09-15 | Reorganized into seven development phases with parallel workstreams and explicit integration gates. Preserved all 59 existing validation scenarios, added seven integration cases, mapped IDs and archived old handoffs. No application implementation. |
| 0.9 | 2026-09-15 | Corrected phase ownership and fixture boundaries: P01 specifies downstream rules, P02/P03 use labeled domain fixtures with P04/P05 reruns, P05 ledger fixtures rerun after P06 fulfillment, and P06 chronological integration starts cancellation before advancing beyond service start. No implementation. |
