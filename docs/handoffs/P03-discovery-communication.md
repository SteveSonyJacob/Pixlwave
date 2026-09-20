# P03 handoff - Discovery and communication

Plan version: 1.0 draft. Updated: 2026-09-21.
Status: IN PROGRESS — public map slice complete
Implementation revision: current working tree
Application tests: 3 map tests PASS; lint and production build PASS
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R02, R04, R08, R16, R17, R18.  
Entry dependency: P02 accepted and its actual handoff verified.  
Decision/configuration gates: P02 published inventory APIs accepted; configure OpenStreetMap tile/geocoding endpoints and SMTP/SMS delivery, ticket/media permissions and supported Kerala discovery.

Previous phase: [P02 - Inventory management](P02-inventory-management.md).

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Public discovery and pricing

- [ ] Build Kerala-first homepage/search/map/details, featured inventory, city/locality/category/date/budget filters, responsive navigation and clear availability labels. Details include listing images, dimensions/resolution, pin/address, owner-attributed audience estimates, published unit prices and an availability calendar.
- [ ] Display fixed current admin-published day/show/slot rates; calculate totals from dated units. No demand or nearby-screen price adjustment service.
- [ ] Implement immutable pre-payment quote snapshots, rate versions and customer-visible price-change checks. Specify the paid-line price snapshot contract; P04/P05 implement and rerun it with fixture-funded and Razorpay-funded bookings. Admin changes affect future quotes only.
- [x] Use MapLibre markers/clustering and owner-defined GeoJSON route display through configurable OpenStreetMap-derived endpoints; pricing uses listing rates and booking units, not map traffic/demand.
- [ ] Keep geography extensible for later states while enforcing Kerala launch inventory eligibility.
- [ ] Provide complete source-blueprint listing details and calendar states; keep state selection Kerala-only at launch and display no fake audience or live-availability claims.

### Notification infrastructure and tickets

- [ ] Implement the in-app/email/SMS delivery framework and role-specific templates for payment, review, decision, cancellation, refund, fulfillment and support events. Use explicit contract fixtures in P03; P04-P06 connect and rerun the actual domain triggers.
- [ ] Implement the durable reminder/template mechanism for the 168-hour review deadline, deadline rejection and pending manual refunds using event fixtures. P04 connects the real deadline job; P05/P06 connect actual payment/refund status.
- [ ] Use durable outbox delivery, idempotency, retry/backoff, bounce/failure tracking and accurate links; notification delays never silently extend eligibility.
- [ ] Implement booking-linked support tickets, attachments, admin replies and private internal notes. Customer requests and creatives are not automatically forwarded to owners.
- [ ] Use ordinary Gmail/other recipient delivery with configured SMTP/SMS providers; no waiting-to-pay or 48-hour countdown campaigns.
- [ ] Use ticket states open/in-progress/resolved/closed with audited replies and private notes; show notification delivery status separately from booking state. Scheduled-start notices never claim verified playback.

Parallel sequencing: Public search/map/detail pages and notification/ticket services can progress independently on P01 identities and P02 listings. Booking/payment notification contracts are agreed now and exercised with explicit event fixtures until P04/P05 emits real events.

## Integration with previous work

Discovery reads P02 listings/rates/calendars; tickets use P01 accounts and safe attachments. Real provider test delivery is required. Booking/payment event tests and paid-price/booking-linked ticket checks use labeled event/database fixtures until P04/P05 supplies actual funded requests; P05 reruns them with real sandbox-funded records. Do not advertise checkout as operational before P05.

Booking/payment/campaign event cases initially use explicit contract fixtures; paid-price protection and booking-linked ticket checks use clearly labeled database fixtures until funded requests exist. Actual listing and general account/listing-ticket flows use the completed application, and real SMTP/SMS test delivery is required. P04-P06 rerun affected cases with actual requests and events; P05 must prove paid-price protection and booking-linked ticket access using real sandbox-funded records. Fixture results cannot close those later integrations.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
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

- Delivered behavior and omitted scope: `/map` displays published inventory with district/category filters, clustered markers, rate popups and mobile GeoJSON routes. Other P03 discovery/communication work remains outside this slice.
- Files/modules changed: public map page/component, published-inventory API consumer, navigation/home links, MapLibre style/worker setup and responsive styles.
- Branch/commit/build revision and environment URL: current working tree; no deployed URL recorded.
- Accepted decisions, architecture and workstream ownership: D16/C16 changed to OpenStreetMap + MapLibre GL JS.
- Schemas/migrations, compatibility and recovery commands: provider migration exists locally and is not applied to a linked environment.
- API/event contracts, example payloads and permissions: public `GET /api/inventory/published` supplies map records; authenticated geocoding remains separate.
- Configuration names and secret-store references: configurable public tile URL and server-side Nominatim URL; no client map key.
- Provider account/region verification: attribution and public-service safeguards implemented; production capacity/manual browser acceptance remain NOT VERIFIED.
- Setup/run commands and pinned versions: documented in `README.md`; verified with test, lint and production build.
- Predecessor integration and regression evidence: NOT RECORDED.
- Operations/recovery/reconciliation instructions: NOT ESTABLISHED.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

These checks are planned, not executed.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P03-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T08 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T09 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T10 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P03-T11 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| Earlier-phase regression | Not available | List affected case IDs and rerun steps | Previous behavior remains correct | Not executed | None | NOT RUN |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| No implementation | Phase functionality not delivered | Future developer | Build and validate all workstreams | NOT STARTED |
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
