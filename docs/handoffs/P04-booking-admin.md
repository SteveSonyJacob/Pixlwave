# P04 handoff - Booking and admin workflow

Plan version: 1.0 draft. Updated: 2026-09-22.
Status: IN PROGRESS — implementation complete; disposable-database replay and manual acceptance pending
Implementation revision: current working tree
Application tests: 16 files / 46 tests PASS; lint, typecheck, documentation contracts, client-secret scan and production build PASS
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R03, R05, R06, R07, R09, R10, R11, R14, R16.  
Entry dependency: P03 accepted and its actual handoff verified.  
Decision/configuration gates: P03 discovery/quotes and notification contracts accepted. Confirmed 192/168-hour clocks and approval-only reservations apply. Payment capture enters through a defined trusted interface; actual gateway wiring is P05.

Previous phase: [P03 - Discovery and communication](P03-discovery-communication.md).

## Entry checklist

- [x] Read current policies and repository instructions; no confirmed answer was reopened.
- [x] Verify predecessor implementation/tests and required quote/notification interfaces. P03 manual/provider acceptance remains open in its handoff.
- [x] Define one booking schema, RPC/event contract and role boundary shared by the UI, worker and later payment integration.
- [x] Record the test-only funding prerequisite without secrets.
- [x] Define disposable-database fixtures and affected regression cases; execution is blocked by the currently configured non-test database guard.

## Parallel workstreams and deliverables

### Cart, requests and admin review

- [x] Build category quote-to-cart forms, creative preview links and a multi-line cart; freeze submitted contents and route later additions to a new open cart.
- [x] Implement paid-awaiting-admin review, admin decisions, private coordination notes, exact 168-hour due dates, deadline rejection and manual refund obligations. No function moves refund money.
- [x] Implement approval-only allocations for LED dates, theatre shows and mobile dated slots. Paid-pending lines have no allocation.
- [x] Enforce custom-route eligibility and committed-route compatibility under the same per-unit transaction locks used for capacity.
- [x] Persist independent line decisions, cancellation events, allocation release and refund obligations.
- [x] Preserve explicit units and immutable quote/service/creative snapshots; validate actual service-start instants at trusted capture and do not reapply notice at approval.

### Integration and payment fixture boundary

- [x] Use P02 inventory and P03 quotes to form immutable cart/creative snapshots. Admin decision, cancellation, review-due, deadline-rejection and refund-task events enqueue P03 notifications without owner routing.
- [x] Provide a database-service-only fixture adapter plus guarded CLI. There is no browser/route handler funding endpoint; both layers require an explicitly enabled database whose name contains `test`.

Parallel sequencing: Cart/category request UI and admin review UI can progress against the same booking state contract. Capacity/timing transactions can be developed alongside these UIs; run integrated real-database races before closing.

## Integration with previous work

Continue directly from P03 listing/quote flows, use P01 permissions and P02 actual capacity, and emit real domain decision/deadline events. Explicit paid fixtures exercise the trusted payment boundary, not gateway integration. All required LED/day, theatre/show and mobile/slot combinations use the same domain; no duplicated later implementation. Rerun P02-T02, P02-T03, P02-T05 and P02-T06 against P04's fixture-funded approval transactions; P05 repeats them with real Razorpay sandbox funding.

Paid fixtures enter only through a restricted test harness at the trusted payment boundary. Inventory, accounts, booking transactions, admin decisions and notifications use the real integrated app/database. No production client can mark a request paid. P05 repeats affected cases with real Razorpay sandbox payments.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P04-T01: Try direct API/database cross-user reads, role escalation and owner attempts to approve/reject requests or change a published rate.
- [ ] P04-T02: Reject unpaid/malicious transitions to paid review; test admin-only decisions, private coordination notes and no owner exposure of raw requests.
- [ ] P04-T03: Race requests/admin decisions across multiple days/shows/vehicle slots; prove no approved oversell or incompatible route commitment with no reservation until admin approval; competing paid requests must not acquire overlapping approved capacity.
- [ ] P04-T04: Verify frozen membership, new cart for additions, per-item decisions, all rejected/mixed accepted states and preserved paid amounts.
- [ ] P04-T05: Test exact seven-day boundaries, automatic rejection and manual refund tasks, late acceptance blocked despite worker lag, and timely cancellation-versus-approval/expiry races with real database fixtures.
- [ ] P04-T06: Capture payment on 1 October at 10:00 IST; accept service starting 9 October at 10:00 and reject an earlier start. Permit approval shortly before 8 October at 10:00, reject approval at/after that instant, and do not reapply the 192-hour notice at approval. Cover daily operating starts and theatre show times.
- [ ] P04-T07: Verify inclusive LED dates, explicit theatre shows and mobile dated slots; reject partial silent acceptance and edited submitted assets. Race line cancellation against approval/expiry and release only actual reservations.
- [ ] P04-T08: From P03 discovery, submit a fixture-funded multi-category cart, decide items as admin, verify P02 capacity and P03 notifications, then race cancellation and the 168-hour deadline. Prove normal clients cannot invoke fixture funding or approve their own request.

Manual acceptance scenario: Start from a real listing, create a cart, inject funding through the restricted test harness, accept/reject items as admin and inspect capacity and notifications. Confirm owner has no raw incoming request queue.

Exit gate: Cart/admin workflow integrates with earlier phases and passes concurrency/timing/permission tests. Evidence clearly identifies fixtures; production paid submission remains unavailable until P05 passes.

## Actual implementation record

- Delivered behavior and omitted scope: `/quotes/:id` pins a clean creative into an open cart; `/cart` freezes submission after rechecking quote expiry/current rate; `/bookings` exposes independent line outcomes/cancellation/refund obligations; `/admin/bookings` provides AAL2 review, private notes and atomic approve/reject operations. Expired-checkout or insufficient-notice captures remain recorded and immediately create `payment_ineligible` full-refund work. The worker emits due reminders and rejects overdue undecided lines. Razorpay capture, refund completion/accounting, provider delivery and manual browser acceptance remain downstream or unverified.
- Files/modules changed: Phase 4 migration; booking domain/tests; cart/bookings/admin pages and server actions; guarded fixture CLI; booking deadline worker/tests; navigation/styles; README/environment/operations/handoff documentation; migration acceptance fixture.
- Branch/commit/build revision and environment URL: current working tree; no deployed URL recorded.
- Accepted decisions, architecture and workstream ownership: D01-D07 and D13 retained. One `booking_lines`/`booking_allocations` domain is shared by all categories and is the P05 integration point.
- Schemas/migrations, compatibility and recovery commands: `202609220003_phase4_booking_admin.sql` is forward-only and not applied to the linked environment. It adds carts, immutable lines, allocations, events, admin notes, manual refund obligations and restricted RPCs. See `docs/operations/P04-booking-admin.md`.
- API/event contracts, example payloads and permissions: [P04 booking contracts](../architecture/P04-booking-contracts.md) records the implemented state/RPC/event interface. Authenticated advertisers may add current owned quotes, submit carts and cancel eligible own lines; AAL2 admins decide/add private notes; only `service_role` can record trusted capture or run deadline jobs. P03 template keys used: `payment.received`, `review.due`, `review.overdue_rejected`, `booking.decision`, `booking.cancelled`, `refund.pending_manual`.
- Configuration names and secret-store references: `P04_FIXTURE_FUNDING_ENABLED` is test-only and defaults false; existing `DATABASE_URL` is used by the worker/fixture CLI. No payment secret was added.
- Provider account/region verification: not applicable to the fixture boundary; real Razorpay sandbox verification is P05. Linked database deployment remains NOT VERIFIED.
- Setup/run commands and pinned versions: `npm run fixture:fund-cart -- <cart-id> [captured-at]` is documented and refuses non-test database names. `npm run worker` checks booking deadlines each minute.
- Predecessor integration and regression evidence: P02/P03 types and app contracts compile; 46 unit tests, docs, lint, typecheck, build and secret scan pass. Real migration replay/races remain blocked until `pixlwave_test` exists.
- Operations/recovery/reconciliation instructions: `docs/operations/P04-booking-admin.md` covers worker recovery, fixture isolation, monitoring and restore reconciliation.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

Application checks below were executed on 2026-09-22. Database checks remain blocked because `DATABASE_URL` points to the linked `/postgres` database; `npm run db:test` refused destructive execution because the database name does not include `pixlwave_test`. No linked data was changed.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P04-T01 | Current working tree | `npm run lint`; `npm run typecheck`; inspect grants/RLS fixture | No cross-user/admin escalation | Static/action authorization passed; DB fixture authored but not replayed | Migration + server actions + `assertPhase4BookingWorkflow` | PARTIAL |
| P04-T02 | Current working tree | Static/action tests and build | Trusted funding/admin notes/decisions only | No browser funding route; AAL2 actions and private notes compile | Production route manifest; migration grants | PARTIAL — DB replay pending |
| P04-T03 | Not available | `npm run db:test` against `pixlwave_test` | No oversell across raced decisions | Guard refused linked `/postgres`; race fixture was not run | `assertPhase4BookingWorkflow` is ready | BLOCKED |
| P04-T04 | Local | `npm test` | Frozen membership and independent rollup | Booking domain rollup tests passed; database frozen-cart fixture not run | `src/lib/booking/domain.test.ts` | PARTIAL |
| P04-T05 | Local | `npm test`; worker test | Exact deadline, late decision rejection and one refund obligation | Exact clock and worker invocation tests passed; DB race fixture not run | Booking domain/worker tests | PARTIAL |
| P04-T06 | Local | `npm test`; database fixture authored | 1 Oct 10:00 IST produces exact 8/9 Oct boundaries; late capture remains recorded for refund | Before/at boundary domain tests passed; `payment_ineligible` database fixture is ready but not replayed | Booking domain test + `assertPhase4BookingWorkflow` | PASS at domain level; DB replay pending |
| P04-T07 | Current working tree | Typecheck/build plus migration fixture | Atomic whole-line units, immutable creative and cancellation release | UI/RPC contracts compile; LED release fixture authored; all-category DB replay not run | Migration + `assertPhase4BookingWorkflow` | PARTIAL |
| P04-T08 | Not available | Full browser + fixture-funded integration | Discovery-to-decision/deadline journey | Not executed; requires disposable DB, seeded users and browser roles | Operations procedure documented | BLOCKED |
| Earlier-phase regression | Local | `npm test`; lint; typecheck; `npm run test:docs`; build; client-secret scan | Previous behavior remains correct | 16 files / 46 tests and all static/build checks passed | Command outputs dated 2026-09-22 | PASS for application suite; DB regression blocked |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| Disposable database unavailable | Real migrations, RLS and race fixtures have not executed | Phase implementer/operator | Provision a database named with `pixlwave_test`, point `DATABASE_URL` to it and run `npm run db:test` | BLOCKED |
| P03 predecessor acceptance open | Provider/manual entry dependency is not accepted | P03 reviewer | Complete P03 provider and manual acceptance without treating P04 fixtures as substitutes | OPEN |
| Manual/browser acceptance unavailable | Advertiser/admin/owner role journey has not been reviewed | Phase implementer/reviewer | Follow the P04 operations procedure across supported phone/desktop browsers | NOT RUN |
| Real payment excluded | No production/sandbox browser checkout exists by design | P05 implementer | Connect verified Razorpay sandbox capture to `record_trusted_cart_payment` semantics and rerun P04-T01–T08 | DOWNSTREAM |

Add actual defects with severity, reproduction, affected requirements, owner, mitigation and next-phase impact. Retain operational instructions for deadline jobs, notifications, manual refunds/transfers, reconciliation and restore where applicable.

## Next-phase handoff

Next: [P05 - Payments and booking integration](P05-payments-integration.md).

Required outputs: Frozen-cart and request contracts, atomic approval/cancellation/capacity transactions, deadline jobs, notification events, trusted payment-success input and fixture evidence needed by P05.

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
| 2026-09-15 | 0.9 | Added explicit reruns of P02 inventory invariants against fixture-funded approval transactions. |
| 2026-09-22 | 1.0 | Implemented the booking/admin slice, restricted fixture boundary, deadline worker, application tests and operations documentation. Disposable-database and manual evidence remain open. |
