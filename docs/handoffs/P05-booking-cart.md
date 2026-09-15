# P05 handoff - Cart, capacity, and admin review domain

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../plan.md), [handoff guide](../../handoff.md) and [decision register](../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R05-R11.  
Dependencies: P04; domain work uses explicit paid fixtures until P07 wires the verified gateway.  
Decision gates: D01 confirmed 192-hour notice / 168-hour cutoff; D05 confirmed cancellation allocation; D06 timely eligibility/manual processing interaction. Upfront payment, seven-day clocks, automatic expiry with manual refunds and approval-only reservations are confirmed.

Previous phase: [P04 - Discovery and admin-controlled pricing](P04-discovery-pricing.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Build category request forms, ad preview and a cart containing all requested bookings; freeze submitted contents and route additions to a new cart.
- [ ] Implement paid-awaiting-admin review, admin decisions, private coordination notes and seven-day due dates from payment. Automatically reject undecided requests at deadline and create a manual refund task. Owners have no direct request/decision controls, and no job sends refund money.
- [ ] Implement resource allocations for LED days, theatre show slots and mobile vehicle slots; leave paid-pending requests unreserved and allocate capacity only in an atomic admin approval transaction.
- [ ] Apply custom-route eligibility across overlapping approved vehicle bookings; admin records the owner-agreed route and cannot change an existing commitment through another request.
- [ ] Persist decision/cancellation events and refund obligations. Decisions are independent per item; neither waits for every item nor opens a new checkout window.

- [ ] Apply plan sections 3.6-3.8: explicit dated request units, atomic whole-line decisions, immutable checkout/creative snapshots and payment-time notice verification without reapplying notice at approval.

## Planned testing and validation

- [ ] P05-T01: Reject unpaid/malicious transitions to paid review; test admin-only decisions, private coordination notes and no owner exposure of raw requests.
- [ ] P05-T02: Race requests/admin decisions across multiple days/shows/vehicle slots; prove no approved oversell or incompatible route commitment with no reservation until admin approval; competing paid requests must not acquire overlapping approved capacity.
- [ ] P05-T03: Verify frozen membership, new cart for additions, per-item decisions, all rejected/mixed accepted states and preserved paid amounts.
- [ ] P05-T04: Test exact seven-day boundaries, automatic rejection and manual refund tasks, late acceptance blocked despite worker lag, and timely cancellation-versus-approval/expiry races with real database fixtures.

- [ ] P05-T05: Capture payment on 1 October at 10:00 IST; accept service starting 9 October at 10:00 and reject an earlier start. Permit approval shortly before 8 October at 10:00, reject approval at/after that instant, and do not reapply the 192-hour notice at approval. Cover daily operating starts and theatre show times.
- [ ] P05-T06: Verify inclusive LED dates, explicit theatre shows and mobile dated slots; reject partial silent acceptance and edited submitted assets. Race line cancellation against approval/expiry and release only actual reservations.

Manual acceptance scenario: Admin coordinates and decides a funded fixture cart; advertiser sees per-item progress while owner cannot access the intake queue.

Exit gate: Domain behaviour and concurrency are proven with fixtures; actual payment submission and rejection refunds remain explicitly assigned to P07/P08.

## Actual implementation record

Fill when work starts:
- Delivered behaviour: NOT IMPLEMENTED.
- Files/modules changed: NONE.
- Branch and commit/revision: NOT AVAILABLE.
- Deployment/build identifier and environment URL: NOT AVAILABLE.
- Architecture changes and accepted decision IDs: NOT RECORDED.
- Schema/migrations and command sequence: NOT CREATED.
- Data compatibility and existing-record impact: NOT ASSESSED.
- API/event contracts and example payloads: NOT CREATED.
- Permissions/access policies: NOT IMPLEMENTED.
- Configuration variable names and secret-store references: NOT CONFIGURED.
- Setup and run commands, exact versions: NOT ESTABLISHED.
- Provider accounts/region verification: NOT VERIFIED.
- Recovery/rollback or forward-fix steps: NOT ESTABLISHED.

Do not paste access tokens, OTPs, personal details, bank credentials, or secret values here.

## Validation evidence

These are unexecuted checks, not completed results.

| Check | Revision/environment | Command or manual steps | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P05-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| Manual review | Not available | Follow acceptance scenario | Client accepts behaviour | Not reviewed | None | NOT REVIEWED |

Record execution date/time, fixture, role, browser/device and report/trace/screenshot path. Keep blocked or failing checks visible. A simulated funded fixture does not prove gateway integration.

## Manual sign-off

- Reviewer/date: NOT ASSIGNED / NOT REVIEWED.
- Revision/environment: NOT AVAILABLE.
- Feedback: NOT RECORDED.
- Decision: NOT APPROVED.
- Required follow-up: NOT RECORDED.

## Issues and operations

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| Remaining phase gates | See decision gates above | Client for policy; developer for verification | Resolve accepted parameter/provider requirements | OPEN |
| No implementation | Phase features not delivered | Future developer | Complete scope and validation | NOT STARTED |

During implementation, record defects with severity, reproduction, affected requirements and next-phase impact. Add setup/configuration, migration recovery, alerts, expiry jobs and manual refund queues, retries, money reconciliation, provider escalation, retention and costs as applicable. Current operational state: NOT IMPLEMENTED.

## Next-phase handoff

Next: [P06 - Notifications, admin reminders, and support](P06-notifications-support.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

Before transfer:
- [ ] Delivered scope and actual revision documented.
- [ ] Required checks passed with evidence; exceptions explicitly recorded.
- [ ] User/client manual review recorded.
- [ ] Accepted decisions reflected in the plan and register.
- [ ] Recovery/operations and next actions are reproducible.

## Change history

| Date | Revision | Change |
| --- | --- | --- |
| 2026-09-14 | Initial draft | Created phase template; no implementation/tests. |
| 2026-09-14 | 0.4 | Rewrote planned scope/checks for latest admin-managed workflow and follow-up answers. Prior workflow specifications superseded; actual implementation remains absent. |
