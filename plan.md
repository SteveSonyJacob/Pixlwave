# Pixlwave production development plan

Version: 0.1 draft  
Updated: 2026-09-14  
Status: planning only; no application development started  
Purpose: phased implementation, explicit validation gates, and continuity between development sessions.

## 1. Authority and draft status

The user authorized creating this plan now and updating it after remaining questions are answered. Confirmed user answers are requirements. Unanswered questions and assistant recommendations are recorded in [the decision register](docs/decisions.md) and are not approved policies.

The PDF is an initial frontend blueprint. The two images provide visual direction, not additional feature mandates or verified business claims. Later user clarifications override both. This plan does not silently resolve the eight-day/ten-day conflict, pricing formula, pause fine, route conflicts, or provider restrictions.

Source copies:
- [Frontend blueprint](docs/references/frontend-blueprint.pdf)
- [Homepage visual reference](docs/references/ui-homepage.jpg)
- [Public and dashboard visual reference](docs/references/ui-pages.jpg)

Development handoff entry point: [handoff.md](handoff.md). Phase files start as NOT STARTED; test checklists are planned, not executed results.

## 2. Product and scope

Pixlwave connects advertisers with third-party advertising inventory owners. Customers browse public listings, submit advertising requests, wait for owner decisions, pay through one grouped checkout, and manage campaigns. Owners list inventory, review requests, provide the advertising service outside Pixlwave, and submit completion evidence. Administrators verify owners, moderate listings, resolve disputes/refunds, and control settlement.

All three categories must be implemented by completion:
- Normal digital/LED screens: exclusive reservation of the screen for booked days.
- Theatre advertising: owner-defined shows with multiple bookable ad slots and defined durations.
- Mobile billboards: multiple rotating ad slots on a vehicle, owner-defined routes, and optional custom routing subject to owner permission and a pending shared-route policy.

One individual per account; an account may switch between advertiser and owner roles. Platform administrator access is separately granted. There are no customer organization/team accounts in the confirmed scope.

Confirmed deployment/product constraints: responsive English website, INR, IST, public browsing with sign-in for bookings, India-only hosting, Pixlwave branding with a replaceable logo, no existing code or real listings. The user/client manually validates every phase.

Excluded or deferred:
- Physical ad playback, remote screen control, and automated proof-of-play are excluded. Owners perform screening.
- Live vehicle GPS tracking is excluded; listing locations and applicable planned routes are shown.
- Native mobile apps are not in the responsive website scope.
- Live chat/chatbot is replaced by support tickets.
- GST implementation is deferred with an extension point; D15 governs production receipt/tax readiness.
- Extra categories, favorites, enquiry chat, and claimed brand counts pictured in references are not automatically scope.
- No production purchase, account activation, real charge, payout, or deployment is authorized by writing this document.

## 3. Requirement traceability

| ID | Confirmed requirement | Implementation / validation phases |
| --- | --- | --- |
| R01 | Complete responsive marketplace with advertiser, owner, admin access | P00-P03, P10-P11 |
| R02 | Supabase authentication, recovery/profile/business details, one account with two marketplace roles | P02, P06 |
| R03 | Administrator verifies owners and approves listings | P02-P03, P09 |
| R04 | Public city/locality/category search, featured inventory, maps, detail pages, calendar and specs | P03-P04 |
| R05 | LED inventory reserves whole-screen days | P03, P05 |
| R06 | Theatre inventory supports multiple advertiser slots per show | P03, P05 |
| R07 | Mobile inventory supports rotating slots and owner-controlled route options | P03, P05 |
| R08 | Dynamic demand-based pricing, possibly including nearby inventory | P04-P05, P07 |
| R09 | No requests for the upcoming eight days; owner approval required | P00, P05 |
| R10 | Upload image/video ad, preview, and owner approval | P03, P05 |
| R11 | Cart with multiple bookings; early-approved capacity stays held until all decisions; then one 24-hour payment window | P05, P07 |
| R12 | Razorpay INR checkout, allocations/receipts; GST extension area | P07 |
| R13 | Campaign states, approval-based changes, completion evidence, admin disputes | P08 |
| R14 | Missed delivery refunds, paid cancellation, 1-2-day admin review, pause-related fine | P08 |
| R15 | 25% commission, deferred owner settlement, admin-controlled release, possible manual bank-reference fallback | P07-P09 |
| R16 | In-app/email/SMS lifecycle notifications and ticket support | P06, integrated P07-P09 |
| R17 | India-only hosting, production reliability, tests and manual phase validation | P01, P10-P11 |
| R18 | Reference-led UI, replaceable logo, sample data during development, real content at launch | P00, P03-P04, P11 |

Requirement implementation cannot be marked complete until its relevant acceptance tests and manual review pass.

## 4. Proposed technical architecture

This is a working recommendation that can be adjusted before foundation acceptance.

| Component | Direction | Responsibility |
| --- | --- | --- |
| Website/server | Next.js + TypeScript, modular application | Public pages, dashboards, authenticated APIs and server-side business rules |
| UI | Tailwind CSS and reusable accessible components | Reference-led design, responsive forms, consistent states |
| Authentication/database | Supabase Auth and PostgreSQL, explicitly Mumbai | Identities, persistent transactional data, access policies, migrations |
| Media | Private object storage in Mumbai; public listing assets separated | Creative/evidence uploads, validation, controlled preview/download |
| Background processing | Durable worker and transactional outbox, India-hosted | Expiry, notification delivery, reconciliation, retries |
| Payments | Razorpay checkout and Route where account capabilities allow | Collection and controlled owner transfers/settlement |
| Messaging | Supabase auth integration plus selected SMTP/SMS providers | Auth messages and application-driven business notifications |
| Hosting | AWS Mumbai application/worker, Supabase Mumbai | Staging and production isolated; no foreign-region preview shortcut |
| Verification | Unit tests, real PostgreSQL integration tests, Playwright, manual acceptance | Business logic, concurrency, full browser journeys, review evidence |

Use one repository with explicit domain modules. Avoid prematurely distributing business rules across separate services. A separate worker can share the application's domain code.

Suggested boundaries: identity, owner verification, inventory, search, pricing, booking/reservations, cart, payments/ledger, campaigns, refunds, settlements, notifications, support, and audit.

Provider integration is not permission to put secrets in source control or browser code. Supabase access policies restrict direct database access; privileged operations and financial state changes remain server-controlled. Do not duplicate schema migration ownership across competing tools.

India residency includes planned application compute, primary database, ad/evidence storage, logs, backups, and restore locations. D10 must establish the external-processor scope. Verify region and recovery options for the selected services before production approval.

### External capability checks

- Supabase offers Mumbai as a specific project region. Its primary-region selection does not by itself prove every component/process meets a broader residency requirement: [Supabase regions](https://supabase.com/docs/guides/platform/regions).
- Production Supabase auth email needs custom SMTP, and phone OTP needs an SMS provider: [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [phone login](https://supabase.com/docs/guides/auth/phone-login).
- Razorpay Route supports split payments and holding settlements until business conditions are met; account capability, onboarding, duration and refund/reversal behaviour must be verified: [Route](https://razorpay.com/route/), [refunds](https://razorpay.com/docs/payments/route/refund/).
- Next.js supports Node.js and Docker deployments: [deployment](https://nextjs.org/docs/app/getting-started/deploying).
- PostgreSQL can enforce non-overlapping reservations using range constraints; shared capacity additionally needs appropriate slot rows/transactional controls: [range constraints](https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT).
- AWS lists Mumbai among Lightsail regions; exact compute/service sizing remains a foundation decision: [AWS availability](https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-lightsail-aws-regions/).

Sources checked during planning on 2026-09-13/14. Reverify capabilities and supported versions at implementation; these references are not a locked pricing quote.

## 5. Core domain and state design

### Contracts and resource capacity

A campaign groups the customer's advertising activity. A booking is one owner/inventory contract with dated units, a creative snapshot, quoted pricing, approval, and fulfillment. A submitted cart groups booking requests for one payment. A payment covers accepted cart items, but refunds and owner settlements remain item-specific.

Expected records include users/roles, owner verification, listings, venue/auditorium/show, vehicles/routes/slots, availability/blackouts, media assets, quote versions/lines, campaigns, bookings, approval decisions, reservation allocations, submitted carts/items, payment attempts, ledger entries, refund allocations, transfer/settlement attempts, evidence, disputes, notifications/outbox jobs, tickets/messages, and audit events.

All exclusive or capacity-limited reservation changes must occur atomically in PostgreSQL. Calendar UI checks alone cannot prevent overselling. Availability considers approved unpaid holds, paid bookings, blackout dates, slot capacity, and mobile route compatibility. An owner must not reduce capacity or change a route in a way that silently violates existing contracts.

Billing promises must specify the relevant day/show/slot, dates, duration, repeat frequency or operating hours, and route where applicable. Calendar completion is not proof an ad ran.

### Cart approval and checkout

Confirmed example: booking A approved on day 1, B on day 5, C on day 6. A and B remain reserved while later decisions are pending. After C's final decision on day 6, the accepted subtotal is payable until the corresponding time on day 7.

Proposed technical states, to finalize against D01-D02:
- Item review: submitted -> approved or rejected; possible withdrawn/expired terminals need explicit policy approval.
- Reservation: held -> paid/committed or released.
- Cart: draft -> awaiting decisions -> awaiting payment -> paid or expired/cancelled; no accepted items means no checkout.
- Financial states are separate from campaign delivery and refund states.

The final-decision transaction starts the payment window once, stores its absolute deadline, and emits an event. Repeated webhooks, owner clicks, or notifications cannot restart it. Approval only holds the purchased capacity: a theatre/mobile slot must not block remaining slots.

No indefinite hold policy is silently assumed. D01 resolves minimum notice versus owner response time; D02 resolves unanswered requests and submitted-cart changes. The cutoff determines validity on every server action even if a cleanup worker is late.

### Pricing

Dynamic pricing is required, but its formula is pending. Proposed design uses versioned, explainable rules and qualified demand rather than an opaque model. Define a base rate, bounds, lookback, comparable locality/category, weighting, update interval, and fallback when there is little data. Duplicate/self-generated requests must not cheaply inflate demand.

Store each quote's dated lines, pricing version and inputs, expiry, and approval/payment protection. Price freezing at submission is a recommendation awaiting D04. Whatever policy is chosen, never charge a changed amount without a customer-visible quote and consent.

### Money, refunds, and settlement

- Store INR in integer paise. Store commission and policy versions with each contract.
- Calculate authoritative payable totals on the server. A browser callback cannot mark payment final.
- One cart payment allocates exactly to its accepted booking lines. Customer refunds and owner payouts must reconcile to these allocations.
- Use immutable financial entries with compensating adjustments; do not overwrite financial history to fix a refund.
- Commission is confirmed at 25%; fee absorption and refund treatment remain D07.
- Refund only approved refundable units. Dynamic rates mean a missed day should use its booked line value, not today's price or necessarily an average.
- The admin refund review target is 1-2 days. Provider processing and customer bank credit are separate statuses.
- Photo/video evidence and administrator review govern payout. Unresolved disputes/refunds block affected settlement.
- Distinguish gateway payment capture, owner transfer, held settlement, released settlement, and actual bank settlement.
- A manual bank-reference payout is an audited alternative path if needed. Prevent duplicate payout through gateway and manual modes.
- Handle paid-after-expiry, missing webhooks, pending refunds, and ambiguous transfer results through reconciliation before retrying.
- Tax logic has a separate extension point. Deferred GST is not a declared tax exemption.

## 6. Design and content

Follow the references' white backgrounds, blue/teal accents, large local imagery, prominent search bar, listing cards, map discovery, and dashboard structure. Build a shared design system with replaceable logo/assets.

Required surfaces: public home/search/map/details/how-it-works; login/profile; owner onboarding/listings/request inbox; category-specific request and upload preview; cart decisions/deadline/checkout; advertiser campaigns/payments/evidence/disputes; owner campaigns/earnings; admin verification/listings/refunds/settlements/support/audit; and ticket views.

Use explicit loading, empty, validation, denied, rejected, unavailable, awaiting-owner, held, awaiting-payment, processing, failed, expired, and partially-refunded states. Use “Request booking” where approval is required. Do not promise instant booking, verified playback, real inventory, audience reach, or brand adoption without evidence. Kerala launch scope is pending D11.

Test data must be unmistakably demo data outside production. Client-owned or licensed production imagery, real listings, and accurate marketing copy are launch inputs.

## 7. Phase roadmap

Phases are ordered to expose a usable feature to manual review at each boundary. Detailed requirements and gate evidence belong in the corresponding handoff file. Build only policy-neutral pieces while a relevant decision is unresolved; do not declare the phase complete.

| Phase | Scope | Main prerequisite |
| --- | --- | --- |
| P00 | [Scope, policies, and design](docs/handoffs/P00-scope-design.md) | None; this draft is the starting input. |
| P01 | [Engineering foundation](docs/handoffs/P01-foundation.md) | P00 architecture direction; unresolved unrelated business values may remain gated. |
| P02 | [Authentication and account roles](docs/handoffs/P02-auth-roles.md) | P01. |
| P03 | [Inventory, moderation, and media](docs/handoffs/P03-inventory-media.md) | P02. |
| P04 | [Public discovery and dynamic pricing](docs/handoffs/P04-discovery-pricing.md) | P03. |
| P05 | [Requests, reservations, and grouped cart](docs/handoffs/P05-booking-cart.md) | P04 and P02; foundational outbox from P01. |
| P06 | [Notifications and support tickets](docs/handoffs/P06-notifications-support.md) | P05 lifecycle events and P02 identities. |
| P07 | [Grouped checkout and financial ledger](docs/handoffs/P07-payments-ledger.md) | P05, P06; accepted pricing/financial contracts. |
| P08 | [Campaign changes, evidence, and refunds](docs/handoffs/P08-campaigns-refunds.md) | P07. |
| P09 | [Owner settlement and admin operations](docs/handoffs/P09-settlements-admin.md) | P08; provider/account readiness. |
| P10 | [System validation and operational readiness](docs/handoffs/P10-hardening.md) | P02-P09 feature gates complete. |
| P11 | [Client acceptance and production release](docs/handoffs/P11-launch.md) | P10 passed and all release-blocking decisions resolved. |

### P00 - Scope, policies, and design

Dependencies: None; this draft is the starting input.  
Decision gates: D01-D15: resolve structural rules now; explicitly schedule remaining parameter/provider decisions before affected phase acceptance.

Deliver:
- Approve the requirements traceability, glossary, role/permission matrix, and the distinction between campaign, booking, submitted cart, payment, and settlement.
- Specify LED day exclusivity, theatre show/slot capacity, and mobile vehicle/slot/route behaviour. Define quote and reservation contracts.
- Resolve timing and batch-payment examples, refund/fine policy, completion evidence, and payout authority using the decision register.
- Create responsive designs for public discovery, all three booking forms, cart decision tracking, advertiser/owner/admin dashboards, tickets, and error/empty states. Use the supplied references and replaceable branding.
- Document media limits, required owner verification details, service providers, preliminary India-only deployment diagram, and proposed performance/cost targets.

Test and validate:
- P00-T01: Walk through one LED booking, two advertisers sharing theatre slots, and mobile slots sharing a route; identify every resource reserved.
- P00-T02: Tabletop the user's day-1/day-5/day-6 cart example and payment deadline on day 7; include one rejection, no response, withdrawal, and all-rejected cases.
- P00-T03: Test policy examples for earliest booking date in IST, approval near campaign start, partial delivery, pause fine, refund rounding, and mixed-owner settlement.
- P00-T04: Review every supplied PDF requirement against the requirement map; review mobile/desktop designs and remove unsupported instant-booking or trust claims.

Manual acceptance: User/client reviews workflows, visual direction, decision outcomes, and scope. Record accepted recommendations explicitly.

Exit gate: Scope and designs approved; no unresolved structural contradiction is passed to booking, pricing, or money implementation. Deferred values have named gates.

Handoff: [P00-scope-design.md](docs/handoffs/P00-scope-design.md). P01: establish the repository, local setup, schema boundaries, and CI using the accepted architecture.

### P01 - Engineering foundation

Dependencies: P00 architecture direction; unresolved unrelated business values may remain gated.  
Decision gates: D10 for final providers; D12 for final sizes. Provider-neutral local scaffolding can proceed.

Deliver:
- Create a TypeScript/Next.js project with reusable UI foundations, separate business modules, validated configuration, reproducible dependency versions, and documented local setup.
- Create migration-managed PostgreSQL/Supabase setup, storage adapter, worker/outbox skeleton, test fixtures, health checks, structured redacted logging, and CI.
- Separate local, test, staging, and production settings. Define secret handling and India-region deployment configuration; do not deploy abroad for previews.
- Establish schema boundaries for users, listings, resource capacity, quote versions, bookings, carts, ledger, tickets, and audit events.

Test and validate:
- P01-T01: Fresh checkout can install, configure, build, and run the application and worker with documented steps.
- P01-T02: CI runs lint, type checks, focused tests, and production build; invalid configuration fails clearly.
- P01-T03: Migrations apply to an empty test database; worker jobs survive restart and do not create duplicate side effects.
- P01-T04: Verify secrets are not included in browser bundles or logs; inspect region configuration and storage/log destinations.

Manual acceptance: Run the local setup from the written guide and review a staging shell and test-account fixtures.

Exit gate: Reproducible foundation and CI pass; architecture/setup handoff is sufficient for another developer.

Handoff: [P01-foundation.md](docs/handoffs/P01-foundation.md). P02: implement authenticated sessions and enforced permissions.

### P02 - Authentication and account roles

Dependencies: P01.  
Decision gates: D09 authentication modes/providers; D10 provider scope; D14 owner verification fields.

Deliver:
- Integrate Supabase Auth for confirmed email login mode and phone OTP, logout, session expiry, profile management, account recovery, and business details.
- Allow one account to switch advertiser/owner modes; no team-member feature. Link identifiers only through verified account-linking flows.
- Implement owner verification submission/review and server-enforced advertiser, owner, and administrator access. Add database access policies and audited privileged actions.
- Protect administrator access with a proposed MFA requirement recorded in the security design; implement rate limiting and abuse controls.

Test and validate:
- P02-T01: Verify login, recovery, invalid/expired/reused OTP, session expiry, logout, and identifier-linking behaviour.
- P02-T02: Attempt cross-account profile/booking reads, role escalation, direct API access, and database access outside policies.
- P02-T03: Confirm unverified owners cannot publish inventory and UI role switching does not grant unauthorized privileges.
- P02-T04: Exercise authentication messages using real provider test configuration; mocks alone do not close provider acceptance.

Manual acceptance: Review advertiser/owner switching, owner verification, recovery, and admin access using separate accounts.

Exit gate: Authentication and permissions work across server and database boundaries; delivery-provider dependencies are resolved or explicitly block acceptance.

Handoff: [P02-auth-roles.md](docs/handoffs/P02-auth-roles.md). P03: owner inventory creation, moderation, and media handling.

### P03 - Inventory, moderation, and media

Dependencies: P02.  
Decision gates: D03 mobile route policy; D14 inventory/media limits; D10 storage residency.

Deliver:
- Build owner CRUD and admin publish/reject/suspend workflows for LED screens, theatre auditoriums/shows/ad slots, and mobile vehicles/routes/rotating slots.
- Store map coordinates, address/locality, imagery, dimensions/resolution, base price inputs, operating hours, capacity, ad duration/frequency, and owner-declared audience estimates with attribution.
- Support calendars, maintenance/blackout dates, recurring shows with exceptions, and multiple vehicle inventory. Preserve previously agreed bookings when editing listings.
- Implement private ad/evidence upload primitives and public listing image handling, file validation, scanning/quarantine, safe previews, authorized downloads, and retention controls.
- Create clearly marked non-production fixtures for all categories and owner verification scenarios.

Test and validate:
- P03-T01: Check listing approval and suspension permissions, cross-owner edits, and exposure of draft/unverified listings.
- P03-T02: Verify theatre show capacity and mobile slot/route representation; test recurring-calendar exceptions and overlapping blackout dates.
- P03-T03: Reject spoofed file types, oversized/unsupported/corrupt files, and unauthorized downloads; verify expiring links and quarantine.
- P03-T04: Ensure capacity reduction, vehicle reassignment, or listing deletion cannot silently invalidate existing commitments.

Manual acceptance: Create, review, publish, edit, and suspend one listing of each category; review image/video previews and location coordinates.

Exit gate: All three inventory types are accurately representable and access-controlled; unresolved resource semantics block the affected module.

Handoff: [P03-inventory-media.md](docs/handoffs/P03-inventory-media.md). P04: connect approved inventory to public search and versioned quotes.

### P04 - Public discovery and dynamic pricing

Dependencies: P03.  
Decision gates: D04 pricing contract; D11 geography; D01 date filter semantics.

Deliver:
- Build homepage, category/city/locality/date/budget search, featured inventory, detail pages, map/list views, and accessible responsive navigation.
- Implement owner base prices and a versioned deterministic demand-pricing service with approved demand signals, locality scope, limits, and cold-start fallback.
- Generate reproducible dated line-item quotes showing billing unit, price breakdown, total, and validity. Persist quote inputs/version for later reconciliation.
- Prevent rejected/draft listings from discovery, misleading availability claims, manipulation through repeated requests, and repricing of protected contract snapshots.

Test and validate:
- P04-T01: Check search/filter combinations, pagination, map/list agreement, out-of-service inventory, and no-results/loading/provider-failure states.
- P04-T02: Use deterministic pricing fixtures for low/high demand, nearby categories, sparse data, duplicate demand, bounds, and rounding.
- P04-T03: Verify same-day/date-range totals and show/slot/day units; ensure changing current rates cannot modify a saved quote protected by policy.
- P04-T04: Review keyboard use, screen-reader labels, mobile layouts, and meaningful rendering of public listing pages.

Manual acceptance: Review discovery on phone and desktop against the references; review worked pricing examples with the client.

Exit gate: Discovery is reviewable with sample data; formula and price-lock policy are accepted and demonstrated.

Handoff: [P04-discovery-pricing.md](docs/handoffs/P04-discovery-pricing.md). P05: submit quoted bookings and reserve capacity under concurrent approvals.

### P05 - Requests, reservations, and grouped cart

Dependencies: P04 and P02; foundational outbox from P01.  
Decision gates: D01-D04 must be settled for complete acceptance.

Deliver:
- Build category-specific request forms, creative preview, submitted cart, per-item decisions, owner request inbox, and approval/rejection reasons.
- Enforce minimum booking notice and approved response cutoff on the server using documented IST date semantics.
- Reserve whole-screen days or the selected theatre/mobile capacity atomically at approval; enforce mobile route compatibility.
- Implement batch state derivation: early approvals stay reserved, rejected items do not charge, and the 24-hour payment window begins exactly once when all items have a qualifying terminal decision.
- Implement approved withdrawal/expiry rules, immutable submitted membership if accepted, deadline jobs, and events for notifications. Payment eligibility must not depend on worker punctuality.

Test and validate:
- P05-T01: Run concurrent owner approvals and prove inventory cannot be oversold for any category, including bookings across multiple dates/shows.
- P05-T02: Verify day-1/day-5/day-6 approvals produce the expected final 24-hour window; also test reordered/repeated decisions and simultaneous last decisions.
- P05-T03: Test all rejected, mixed decisions, unanswered owners, withdrawals, expired holds, and changing the earliest date under the accepted policy.
- P05-T04: Test midnight IST boundaries, eight-day exclusion, stale quote/availability, worker downtime/restart, and attempts to reserve one's own listing if restricted by the accepted policy.

Manual acceptance: Use separate advertiser and owner accounts to reproduce multi-owner approval timing and inspect reserved versus available capacity.

Exit gate: Booking, reservation, and cart lifecycle tests pass against the real database; no unbounded unresolved hold policy remains.

Handoff: [P05-booking-cart.md](docs/handoffs/P05-booking-cart.md). P06: deliver and track business notifications and support requests for these lifecycle events.

### P06 - Notifications and support tickets

Dependencies: P05 lifecycle events and P02 identities.  
Decision gates: D09 provider/sender selection; D10 provider processing scope.

Deliver:
- Deliver required booking, approval, payment-deadline, campaign, and ticket updates through in-app, email, and SMS channels.
- Use persisted events, deduplication, retry/backoff, delivery status, failure visibility, and server-side deadlines; notification failure never extends a booking deadline.
- Implement advertiser/owner tickets linked to bookings, attachments, admin replies, status, and internal notes hidden from customers.
- Configure domain authentication and required SMS provider onboarding/templates. Reuse providers for auth and business messages where suitable, while keeping the flows distinct.

Test and validate:
- P06-T01: Check event-to-recipient/channel mapping, duplicate events, bounced email, SMS failures, provider timeouts, and worker recovery.
- P06-T02: Verify notification content, IST deadline display, links, and sensitive-data redaction.
- P06-T03: Attempt cross-account ticket access and internal-note disclosure; test safe attachments and support status transitions.
- P06-T04: Verify actual delivery with provider test accounts and permitted recipient devices; record any blocked external checks.

Manual acceptance: Receive a booking approval and deadline reminder on website/email/SMS; open and resolve a ticket across user/admin accounts.

Exit gate: Required notifications and support workflows pass, with provider prerequisites and test evidence recorded.

Handoff: [P06-notifications-support.md](docs/handoffs/P06-notifications-support.md). P07: collect one payment for accepted cart items and allocate the money reliably.

### P07 - Grouped checkout and financial ledger

Dependencies: P05, P06; accepted pricing/financial contracts.  
Decision gates: D07 fee/commission basis; D13 Razorpay account capability; D15 receipt/tax scope; D01-D02 deadline semantics.

Deliver:
- Create one server-priced Razorpay order for the accepted cart subtotal and expose supported UPI/card/net-banking checkout methods.
- Freeze item allocations and 25% commission snapshots according to the accepted policy; represent all money in integer paise.
- Implement verified webhooks, idempotent processing, an append-only financial journal, payment attempts, receipts, payment status, and provider reconciliation.
- Treat browser success as provisional until verified; handle duplicate/late payments, abandoned checkout, expiry races, and paid-but-unreconciled states without double booking.
- Add a separate tax calculation interface and future tax breakdown area; no invented GST calculation or GST invoice claim.

Test and validate:
- P07-T01: Run mixed-owner/mixed-category cart payments and verify accepted items only, exact allocation totals, rounding, and one payment confirming all included bookings atomically.
- P07-T02: Test tampered totals, forged/replayed/out-of-order webhooks, multiple clicks, multiple successful attempts, and lost callback/webhook delivery.
- P07-T03: Test payment arriving exactly at/after the deadline, worker failure, provider timeout, and held inventory being unavailable; reconcile or refund safely under an explicit exception policy.
- P07-T04: Verify receipt ownership, audit journal consistency, settlement ineligibility before completion, and notifications after confirmed payment.

Manual acceptance: Complete sandbox checkout for a cart with accepted and rejected items, inspect customer receipt and admin allocation ledger, then reproduce failed payment.

Exit gate: Sandbox payment and reconciliation evidence passes; no live checkout until P11 authorization and provider readiness.

Handoff: [P07-payments-ledger.md](docs/handoffs/P07-payments-ledger.md). P08: operate paid campaigns, collect evidence, and handle approved changes/refunds.

### P08 - Campaign changes, evidence, and refunds

Dependencies: P07.  
Decision gates: D05 pause/fine policy; D06 cancellation/refund units; D08 completion/dispute rules; D14 evidence requirements.

Deliver:
- Build campaign dashboards with truthful scheduled/owner-reported live/completed status; no assertion of verified physical playback from a calendar alone.
- Implement approval-based extensions, creative replacements, pauses/resumption, and paid cancellations with approved capacity and price effects.
- Collect owner photo/video evidence and advertiser disputes; give admin controlled completion/fraud/non-delivery decisions with reasons and audit history.
- Implement full/partial refunds for undelivered units, approved fines and commission adjustments, 1-2-day admin review tracking, and separate gateway processing status.
- Add compensating journal entries, item-level refund allocations, safe refund retries, and payout blocking while disputes/refunds are unresolved.

Test and validate:
- P08-T01: Test competing extension requests, rejected changes preserving original contracts, and payment-required extensions not becoming active prematurely.
- P08-T02: Test partial delivery across dynamic-price days/shows, multiple cart owners, penalty caps, integer rounding, cumulative refund limits, and refunded commission treatment.
- P08-T03: Test duplicate admin actions, failed/pending refund responses, reversal prerequisites, and concurrent refund versus settlement attempts.
- P08-T04: Verify evidence authorization, fake/missing evidence review, advertiser disputes, and inability of owners to approve their own payout.

Manual acceptance: Run completion with evidence, owner non-delivery, partial refund, advertiser cancellation, and accepted/rejected pause/extension scenarios.

Exit gate: All agreed campaign policies and refund accounting pass; review time is not displayed as guaranteed bank-credit time.

Handoff: [P08-campaigns-refunds.md](docs/handoffs/P08-campaigns-refunds.md). P09: release only reconciled eligible balances and complete the admin finance workspace.

### P09 - Owner settlement and admin operations

Dependencies: P08; provider/account readiness.  
Decision gates: D07 financial allocation; D08 payout eligibility; D13 gateway/manual modes.

Deliver:
- Implement owner earnings and payout status, admin completion review, release action, commission/refund reports, outstanding liabilities, and audit search.
- Integrate Razorpay Route linked-account onboarding and approved deferred-settlement flow; distinguish transfer creation, release, and actual settlement.
- Implement controlled manual bank-reference recording only if needed, with evidence and checks that exclude duplicate/in-flight gateway payment.
- Reconcile payments, transfer holds, reversals, refunds, gateway fees, platform revenue, and owner balances; record exceptions for human resolution.
- Prevent bank-detail changes, disputes, incomplete evidence, or unresolved money movements from silently bypassing payout checks.

Test and validate:
- P09-T01: Verify a mixed-owner cart settles each eligible booking independently after completion, without waiting for unrelated owners unless policy requires it.
- P09-T02: Test duplicate release, timeout/retry, failed/reversed transfer, missing owner onboarding, refund before/after transfer, and webhook replay.
- P09-T03: Race manual payout recording against automated payout and refund; assert no double payment or release of disputed balances.
- P09-T04: Reconcile provider test transactions to journal and reports; verify admin permissions and auditable changes.

Manual acceptance: Review owner earnings, release one eligible payout through sandbox-supported flows, block a disputed payout, and rehearse manual fallback if selected.

Exit gate: Every paid/refunded/settled amount reconciles or appears as an explicit tracked exception; payout prerequisites are documented.

Handoff: [P09-settlements-admin.md](docs/handoffs/P09-settlements-admin.md). P10: execute system-wide reliability, security, accessibility, and recovery validation.

### P10 - System validation and operational readiness

Dependencies: P02-P09 feature gates complete.  
Decision gates: D10 residency evidence; D12 agreed capacity/service targets; remaining provider/retention decisions.

Deliver:
- Run full regression across advertiser, owner, and admin workflows on phone/tablet/desktop and supported browsers.
- Validate security boundaries, accessible UI, query/index performance, upload handling, reservation contention, and background queue capacity.
- Configure monitoring and alerts for checkout errors, overdue decisions, stuck holds, queue backlog, failed messages/refunds/payouts, and reconciliation gaps.
- Exercise Indian-region backups/restoration, deploy/migration recovery, worker crashes, provider outages, and storage/retention cleanup.
- Produce measured cost/capacity estimate and operations runbook, including provider escalation and financial incident response.

Test and validate:
- P10-T01: Run production-like end-to-end journeys and simultaneous reservation/payment/refund scenarios against representative data.
- P10-T02: Run authorization/accessibility checks and targeted security review of uploads, sessions, webhooks, rate limits, and privileged actions.
- P10-T03: Measure latency/error rates under the agreed load; verify no oversell and no duplicate financial movement.
- P10-T04: Restore a backup into an isolated permitted environment and reconcile transactions since the recovery point before accepting readiness.

Manual acceptance: Perform user/client regression review, inspect alerts/reports, and rehearse an outage and restore using only the handoff/runbook.

Exit gate: No unresolved critical/high-severity defects; required targets and recovery checks pass with evidence, and remaining accepted issues have owners.

Handoff: [P10-hardening.md](docs/handoffs/P10-hardening.md). P11: perform final client acceptance, production configuration, and controlled release.

### P11 - Client acceptance and production release

Dependencies: P10 passed and all release-blocking decisions resolved.  
Decision gates: D01-D15 closed or explicitly outside enabled launch scope without dropping required end-of-development features.

Deliver:
- Obtain final acceptance for all three inventory categories, approval/cart behaviour, pricing, cancellation/refund rules, owner settlement, and UI.
- Configure India-only production infrastructure and verified provider accounts, domain, TLS, private uploads, backups, alert recipients, and operational ownership.
- Complete production owner onboarding/content, replace demo inventory, and finalize client-approved terms, privacy, support, cancellation, and receipt/tax scope.
- Perform authorized controlled live payment/refund/settlement verification where provider test mode cannot prove production operation.
- Publish final setup/release/recovery runbooks, training walkthroughs, credential ownership references, known issues, and monitoring schedule.

Test and validate:
- P11-T01: Run production smoke tests for public discovery, auth, owner access, uploads, booking eligibility, support, and restricted admin routes.
- P11-T02: Verify exact deployed revision, configuration, migration state, region evidence, health/alerts, backup availability, and rollback procedure.
- P11-T03: Record controlled live transaction reconciliation only after explicit authorization for real charges/payouts; never mark sandbox evidence as live evidence.
- P11-T04: Confirm no demo claims, exposed secrets, test keys, mock payment behaviour, or unresolved launch-blocking policy gates remain.

Manual acceptance: User/client signs off on the release checklist and advertiser/owner/admin walkthroughs; named operator accepts ongoing support and finance responsibility.

Exit gate: Authorized release is healthy and accepted, evidence and final handoff are complete, and all required features are delivered.

Handoff: [P11-launch.md](docs/handoffs/P11-launch.md). Operate and monitor; prioritize future enhancements through a separately approved backlog.

## 8. Shared testing and acceptance standards

### Every phase

Use the smallest meaningful test set that proves its risks and contracts. Reversible cosmetic edits need visual review, not tests that merely restate the implementation. Booking/money/permission changes require behavioural, integration, and adverse-path coverage.

Each implemented phase must:
1. Pass lint/type checks/build and its required unit/integration/browser checks.
2. Demonstrate server-enforced access and invariant protection for its new capabilities.
3. Include deterministic fixtures, error/empty states, and instructions another reviewer can follow.
4. Complete manual validation with actual results and evidence at a known revision.
5. Update the phase handoff, decision register, and next-phase prerequisites.

Record NOT RUN, BLOCKED, FAIL, or PASS honestly. Missing credentials, a provider outage, and a pending client policy are different blockers. Mock-based tests can validate logic but cannot substitute for gateway/provider integration acceptance.

### Mandatory cross-phase regression cases

- User cannot access or mutate another user's private data by guessing an identifier.
- Simultaneous approvals cannot oversell whole days or shared slots.
- Eight-day rules, owner deadlines, cart finalization, and expiry use the approved IST semantics.
- Early approvals remain held through other decisions, but deadline logic cannot extend holds accidentally.
- Payment is the sum of accepted items only; one payment produces consistent item-level allocations.
- Duplicate/forged/late payment events do not duplicate bookings or move money twice.
- Extensions, pauses, refunds, disputes, and settlements cannot race into conflicting states.
- Partial refunds use booked units and never exceed refundable money; payout never exceeds eligible balance.
- Provider and worker downtime do not lose requests or erase financial uncertainty.
- Restore and reconciliation can explain payments received after a backup was taken.

### Proposed measurable targets (client review required)

These are engineering test inputs, not claimed startup usage or an agreed SLA:
- Representative dataset: 1,000 listings and 10,000 accounts, including all inventory types.
- Baseline load: 100 concurrent browsing sessions and a targeted 20-request race for the last available slot.
- Proposed API target: p95 below 1 second for ordinary search/booking reads under the agreed baseline, excluding external-provider completion times.
- Proposed experience target: LCP <= 2.5 seconds and CLS <= 0.1 on representative mobile pages, measured under a documented profile.
- Accessibility target: WCAG 2.2 AA-oriented testing of key journeys, including keyboard and screen-reader review.
- Proposed recovery targets for client review: recovery point <= 1 hour and recovery time <= 4 hours, subject to service/budget validation. Any transaction gap must be reconciled with the payment provider.

P10 must replace or approve these values with the client, document load conditions, and report measured results. A low-volume dataset is not evidence of scale.

## 9. Release and operating readiness

Release requires accepted policies, all three categories implemented, phase checks passed, manual sign-off, real inventory/content readiness, India-region evidence, provider activation, and operational ownership.

Required runbooks cover deployment/migrations, backup/restore, queue recovery, authentication issues, listing suspension, held inventory, payment reconciliation, failed refunds, disputed/failed payouts, manual fallback, and incident escalation.

Estimate recurring cost by component: application/worker compute, database/backups, storage/egress for creatives/evidence, email and SMS volumes, maps, monitoring, and payment/transfer charges. Include staging, message retries, and video download traffic. No fixed monthly total is asserted before D12 and actual provider configuration.

Keep development/sandbox, staging, and production isolated. Provider keys and real customer data must not appear in committed fixtures or handoffs. Real charges/refunds/payouts and public release need explicit operational authorization at the release step.

Required client inputs before production: owner onboarding/verification process, payout account eligibility, final policy values, real listings/assets, domain/sender ownership, notification provider setup, geographic scope, tax/receipt scope, review contacts, support ownership, and budget acceptance.

## 10. Handoff and future edits

Use [handoff.md](handoff.md) as the entry point and complete each phase record at its boundary. Handoffs must include implementation revision, schema/API changes, configuration names, actual tests/results/evidence, manual reviewer, known defects, recovery notes, and next actions.

When the user answers a pending question:
1. Update its Dxx record with exact accepted outcome and date.
2. Update the corresponding rules and phase criteria here.
3. Update affected phase handoffs and examples.
4. If code already exists, assess migration and existing-booking implications before changing behaviour.
5. Run targeted regression checks for the changed policy.

## 11. Current next step

Review and answer the open questions, prioritizing D01-D08. This draft can be edited incrementally. No application features, tests, provider accounts, or environments are claimed to exist.

