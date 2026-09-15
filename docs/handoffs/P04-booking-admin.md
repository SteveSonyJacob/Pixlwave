# P04 handoff - Booking and admin workflow

Plan version: 0.9 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R03, R05, R06, R07, R09, R10, R11, R14, R16.  
Entry dependency: P03 accepted and its actual handoff verified.  
Decision/configuration gates: P03 discovery/quotes and notification contracts accepted. Confirmed 192/168-hour clocks and approval-only reservations apply. Payment capture enters through a defined trusted interface; actual gateway wiring is P05.

Previous phase: [P03 - Discovery and communication](P03-discovery-communication.md).

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Cart, requests and admin review

- [ ] Build category request forms, ad preview and a cart containing all requested bookings; freeze submitted contents and route additions to a new cart.
- [ ] Implement paid-awaiting-admin review, admin decisions, private coordination notes and seven-day due dates from payment. Automatically reject undecided requests at deadline and create a manual refund task. Owners have no direct request/decision controls, and no job sends refund money.
- [ ] Implement resource allocations for LED days, theatre show slots and mobile vehicle slots; leave paid-pending requests unreserved and allocate capacity only in an atomic admin approval transaction.
- [ ] Apply custom-route eligibility across overlapping approved vehicle bookings; admin records the owner-agreed route and cannot change an existing commitment through another request.
- [ ] Persist decision/cancellation events and refund obligations. Decisions are independent per item; neither waits for every item nor opens a new checkout window.
- [ ] Apply plan sections 3.6-3.8: explicit dated request units, atomic whole-line decisions, immutable checkout/creative snapshots and payment-time notice verification without reapplying notice at approval.

### Integration and payment fixture boundary

- [ ] Use P02 inventory and P03 quotes to form immutable cart/creative snapshots. Connect admin decision and deadline events to P03 notifications.
- [ ] Use a restricted test-only funding adapter to exercise paid review without Razorpay. It must not exist as an accessible production route or let clients mark their own requests paid. Cancellation state/races are implemented here; actual refund completion accounting is wired in P05/P06.

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

- Delivered behavior and omitted scope: NOT IMPLEMENTED.
- Files/modules changed: NONE.
- Branch/commit/build revision and environment URL: NOT AVAILABLE.
- Accepted decisions, architecture and workstream ownership: NOT RECORDED.
- Schemas/migrations, compatibility and recovery commands: NOT CREATED.
- API/event contracts, example payloads and permissions: NOT IMPLEMENTED.
- Configuration names and secret-store references: NOT CONFIGURED.
- Provider account/region verification: NOT VERIFIED.
- Setup/run commands and pinned versions: NOT ESTABLISHED.
- Predecessor integration and regression evidence: NOT RECORDED.
- Operations/recovery/reconciliation instructions: NOT ESTABLISHED.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

These checks are planned, not executed.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P04-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T08 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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
