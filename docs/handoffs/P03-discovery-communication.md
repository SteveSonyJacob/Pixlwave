# P03 handoff - Discovery and communication

Plan version: 1.0 implementation draft. Updated: 2026-09-19.

Status: IN PROGRESS; public discovery, immutable quotes, listing media, ticket attachments, support and in-app notification foundations are implemented; Mappls provider delivery and acceptance gates remain open

Implementation revision: working tree on `feature/phase-3-discovery-communication` based on `40d5798`

Application tests: 12 files / 33 tests PASS; lint, typecheck, docs, production build, client-secret scan and migration replay pass.
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R02, R04, R08, R16, R17, R18.  
Entry dependency: P02 accepted and its actual handoff verified.  
Decision/configuration gates: P02 published inventory APIs accepted; configure Mappls and SMTP/SMS delivery, ticket/media permissions and supported Kerala discovery.

Previous phase: [P02 - Inventory management](P02-inventory-management.md).

## Entry checklist

- [x] Read current policies and repository instructions; do not reopen confirmed answers.
- [x] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Public discovery and pricing

- [x] Build Kerala-first homepage/search/details, featured inventory, city/locality/category/date/budget filters, responsive navigation and clear availability labels. Details include listing images, dimensions/resolution, pin/address, owner-attributed audience estimates, published unit prices and a 28-day availability calendar.
- [x] Display fixed current admin-published day/show/slot rates; calculate totals from dated units. No demand or nearby-screen price adjustment service.
- [x] Implement immutable pre-payment quote snapshots, rate versions and customer-visible price-change checks. Specify the paid-line price snapshot contract; P04/P05 implement and rerun it with fixture-funded and Razorpay-funded bookings. Admin changes affect future quotes only.
- [ ] Use Mappls markers/clustering and owner-defined route display through the provider adapter; pricing uses listing rates and booking units, not map traffic/demand.
- [ ] Keep geography extensible for later states while enforcing Kerala launch inventory eligibility.
- [ ] Provide complete source-blueprint listing details and calendar states; keep state selection Kerala-only at launch and display no fake audience or live-availability claims.

### Notification infrastructure and tickets

- [ ] Implement the in-app/email/SMS delivery framework and role-specific templates for payment, review, decision, cancellation, refund, fulfillment and support events. Use explicit contract fixtures in P03; P04-P06 connect and rerun the actual domain triggers.
- [ ] Implement the durable reminder/template mechanism for the 168-hour review deadline, deadline rejection and pending manual refunds using event fixtures. P04 connects the real deadline job; P05/P06 connect actual payment/refund status.
- [ ] Use durable outbox delivery, idempotency, retry/backoff, bounce/failure tracking and accurate links; notification delays never silently extend eligibility.
- [x] Implement customer/general-listing support tickets, PDF/PNG/JPEG attachments, admin replies and private internal notes. Attachments are private, scan-gated, visible only to the requester or an AAL2 administrator, and retain for 180 days after closure. Real P04 booking linkage remains open. Customer requests and creatives are not automatically forwarded to owners.
- [ ] Use ordinary Gmail/other recipient delivery with configured SMTP/SMS providers; no waiting-to-pay or 48-hour countdown campaigns.
- [ ] Use ticket states open/in-progress/resolved/closed with audited replies and private notes; show notification delivery status separately from booking state. Scheduled-start notices never claim verified playback.

Parallel sequencing: Public search/map/detail pages and notification/ticket services can progress independently on P01 identities and P02 listings. Booking/payment notification contracts are agreed now and exercised with explicit event fixtures until P04/P05 emits real events.

## Integration with previous work

Discovery reads P02 listings/rates/calendars; tickets use P01 accounts and safe attachments. Real provider test delivery is required. Booking/payment event tests and paid-price/booking-linked ticket checks use labeled event/database fixtures until P04/P05 supplies actual funded requests; P05 reruns them with real sandbox-funded records. Do not advertise checkout as operational before P05.

Booking/payment/campaign event cases initially use explicit contract fixtures; paid-price protection and booking-linked ticket checks use clearly labeled database fixtures until funded requests exist. Actual listing and general account/listing-ticket flows use the completed application, and real SMTP/SMS test delivery is required. P04-P06 rerun affected cases with actual requests and events; P05 must prove paid-price protection and booking-linked ticket access using real sandbox-funded records. Fixture results cannot close those later integrations.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [x] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P03-T01: Verify search/filter/map/detail agreement, supported geography, clustering, empty/loading/quota failure states and restricted API keys.
- [ ] P03-T02: Check totals for days/shows/slots, quantities and paise rounding; changing request counts, bookings or nearby prices must not change a published rate.
- [ ] P03-T03: Change the published rate before checkout and require an updated visible quote; use an immutable paid-line domain fixture to prove later admin edits do not reprice it. Rerun with P04 fixture-funded and P05 Razorpay-funded bookings.
- [ ] P03-T04: Review keyboard/screen-reader flow and mobile layouts; verify switching the map adapter does not alter booking or price data.
- [ ] P03-T05: Check image preview, dimensions/resolution, location pin, dated availability, price unit and attributed audience estimate on phone and desktop; date filters and the calendar must agree.
- [ ] P03-T06: Check recipient/channel routing and confirm owners receive neither raw booking requests nor customer/admin private notes.
- [ ] P03-T07: Test duplicate events, email bounce, SMS timeout and worker recovery without lost/duplicate business actions.
- [ ] P03-T08: Using explicit deadline/payment/refund event fixtures, verify IST timestamps, admin due/overdue reminders, paid-awaiting-review wording and post-refund notification templates. Rerun actual deadline events in P04 and payment/refund outcomes in P05/P06.
- [ ] P03-T09: Attempt cross-account ticket/media access; receive real provider test messages and record any blocked external validation.
- [ ] P03-T10: Start a scheduled campaign window with no evidence: notify only its scheduled status, never observed playback or verified completion. Confirm resolved tickets retain authorized reply history and private notes stay private.
- [ ] P03-T11: Publish/change a listing through P02, verify the same approved values on search/map/details, submit a ticket using a P01 account and deliver its notification. Distinguish fixture campaign events from real listing/ticket events and prevent cross-account access.

Manual acceptance scenario: Browse approved inventory on phone/desktop, compare card/detail/map/calendar values, open a ticket and receive a real test notification. Label event-fixture evidence separately.

Exit gate: Discovery and communication integrate with existing accounts/inventory; real delivery and access tests pass. Later phases must rerun notification cases against their actual emitted events.

## Actual implementation record

- Delivered behavior: responsive public discovery with homepage featured inventory, filters/details, loading and unavailable states, and 28-day IST availability calendar; clean public listing images; explicit dated-unit quote snapshots with expiry/rate-change detection; requester/admin ticket threads with private PDF/PNG/JPEG attachments; AAL2-only internal notes and states; in-app delivery ledger; communication template/routing/retry fixtures.
- Omitted scope: Mappls map/clustering/route UI, real Resend environment delivery/bounce acceptance, SMS, booking-linked ticket integration and manual device/provider acceptance. A scheduled cleanup job is still required to physically remove attachments after their recorded retention period.
- Files/modules changed: Phase 3 migrations, `src/lib/discovery`, `src/lib/communication`, discovery/media/quote/support/notification routes and Phase 2 listing-media integration.
- Branch/build revision: uncommitted working tree on `feature/phase-3-discovery-communication`; no deployed environment URL.
- Contracts and operations: `docs/architecture/P03-discovery-communication-contracts.md` and `docs/operations/P03-discovery-communication.md`.
- Schemas: `quote_snapshots`, `published_listing_media`, `support_tickets`, `support_ticket_messages`, `notification_deliveries`, `private_media_assets.support_ticket_id`; mutations are RPC-only and audit relevant actions.
- Provider/configuration: existing Mappls search configuration retained. Resend API worker dispatch, idempotency and signed delivery webhooks are implemented; production secrets and real application-message delivery/bounce evidence are not configured or claimed as tested. SMS remains deferred.
- Predecessor integration: uses P01 identities/AAL2 and P02 published inventory, rates, calendars and private storage. Added missing anonymous calendar grants and a pre-publication listing-media purpose.
- Recovery: forward-only guidance is recorded in the P03 operations document.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

Automated domain/build and disposable migration checks below are partial evidence only. Provider and manual cases remain open.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P03-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T02 | Working tree | `npm test` discovery domain fixtures | Explicit dated-unit quantities and exact paise totals | LED and shared-slot totals pass; no demand input exists | `src/lib/discovery/domain.test.ts` | PASS (contract fixture; funded rerun remains P04/P05) |
| P03-T03 | Working tree | `npm test` quote-current fixtures | Expiry, unpublication and rate revision invalidate the quote | All invalidation cases pass; paid-line rerun remains P04/P05 | `src/lib/discovery/domain.test.ts` | PASS (contract fixture) |
| P03-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T06 | Working tree | `npm test` communication routing fixtures | Owners receive no raw review/support events | Routing fixtures exclude owners; real provider routing remains open | `src/lib/communication/domain.test.ts` | PASS (contract fixture) |
| P03-T07 | Working tree | `npm test` outbox and Resend adapter fixtures | Duplicate-safe delivery and durable retry contracts | Stable Resend idempotency key and outbox retry fixtures pass; real timeout/bounce recovery remains open | `src/worker/outbox.test.ts`, `src/lib/communication/resend.test.ts` | PASS (contract fixture) |
| P03-T08 | Working tree | `npm test` communication template fixtures | Required wording and deadline-independent delivery contract | Payment and scheduled-only wording pass; real later events remain open | `src/lib/communication/domain.test.ts` | PASS (contract fixture) |
| P03-T09 | Local Docker `pixlwave_test` | `npm run db:test` | Cross-account attachment access is denied; requester and AAL2 admin access succeeds; closure sets 180-day retention | All permission and retention assertions passed; real provider delivery remains open | Local command output 2026-09-19 | PASS (database contract fixture) |
| P03-T10 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T11 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| Earlier-phase regression | Working tree | `npm run ci` | Previous behavior remains correct | 12 files / 33 tests, lint, typecheck, docs, build and secret scan pass | Local command output 2026-09-19 | PASS (application only) |
| Migration replay | Local Docker `pixlwave_test` | Set guarded `DATABASE_URL`; run `npm run db:test` | Prior-revision upgrade and fresh replay both pass | All P01-P03 migrations, P02 inventory and P03 support-attachment permission/retention workflows passed | Local command output 2026-09-19 | PASS |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| Map provider UI | Discovery map/clustering and mobile route rendering unavailable | Assigned implementer/operator | Configure Mappls browser SDK/key restrictions and implement provider adapter UI | OPEN |
| Configuration/provider checks | See entry gates | Assigned implementer/operator | Record real setup and verification | NOT VERIFIED |
| Integration evidence | Previous/current behavior not demonstrated | Phase implementer | Execute current tests and affected regression | NOT RUN |

Add actual defects with severity, reproduction, affected requirements, owner, mitigation and next-phase impact. Retain operational instructions for deadline jobs, notifications, manual refunds/transfers, reconciliation and restore where applicable.

## Next-phase handoff

Next: [P04 - Booking and admin workflow](P04-booking-admin.md).

Required outputs: Public browsing/map routes, listing-read contracts, quote construction, ticket workflows, notification event schemas, role/channel routing, retry/failure evidence and provider configuration references.

Before handoff:

- [ ] Document delivered scope and exact revision.
- [ ] Pass current cases, added integration case and affected earlier regression.
- [ ] Record real manual/client acceptance and unresolved defects.
- [ ] Update schemas/contracts, decision register, setup and recovery instructions.
- [ ] Provide concrete next actions and verify the next phase can use these artifacts.

## Change history

| Date | Revision | Change |
| --- | --- | --- |
| 2026-09-15 | 0.8 | Created this current phase through seven-phase consolidation. Previous tests mapped without loss; one integration case added. No implementation or tests executed. |
| 2026-09-15 | 0.9 | Clarified pre-payment quote ownership and labeled paid-line/domain-event tests as fixtures requiring P04-P06 reruns. |
