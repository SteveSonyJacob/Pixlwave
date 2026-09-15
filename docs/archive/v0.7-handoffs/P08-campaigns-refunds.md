> HISTORICAL v0.7 HANDOFF - superseded by the seven-phase v0.8 plan. Do not implement from this file or treat its phase/test IDs as current. Use [current phase mapping](../../phase-mapping.md) and [active handoffs](../../../handoff.md). Original test descriptions below are retained for provenance; relative source links were adjusted for this archive.

# P08 handoff - Fulfillment, seven-day cancellation, and refunds

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../../plan.md), [handoff guide](../../../handoff.md) and [decision register](../../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R13, R14, R16.  
Dependencies: P07.  
Decision gates: D05 confirmed cancellation allocation; D06 manual refund recording and exception details; D07 accounting verification; D08 payout review. Both seven-day clocks start at successful payment.

Previous phase: [P07 - Upfront grouped payment and rejection refunds](P07-payments-ledger.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Build confirmed campaign schedules, owner service/evidence records and admin completion/non-delivery decisions. Scheduled/live-window notifications indicate dates only, never verified playback. Completion requires admin evidence verification; no physical playback control.
- [ ] Allow advertiser cancellation only before successful payment + seven days. Refund 95% of the cancelled booking amount; allocate 5% to Pixlwave inclusive of Razorpay processing charges, with no separate processing deduction or added fulfillment commission. Preserve the request timestamp, queue the refund for admin and mark refunded only after admin records its completed payment reference.
- [ ] Block ordinary cancellation/refund eligibility after the cutoff while retaining owner inability/non-delivery as the business exception. Preserve eligibility for timely requests whose manual processing completes later.
- [ ] Refund undelivered daily units or theatre show/slot units at the booked rate; support partial delivery, evidence and admin decision reasons.
- [ ] Remove pause/resume, campaign extensions and in-place rescheduling/change actions from scope. Later advertising dates use a separate booking. Keep fulfillment, refund and settlement status separate.

- [ ] Review unit-linked evidence before admin-verifying completion. Use booked prices for fully missed units; let admin manually determine partial-delivery refunds with a reason and evidence. Record applicable actual Razorpay charges separately, deduct them once and apply no owner-failure penalty.

## Planned testing and validation

- [ ] P08-T01: Test cancellation immediately before/at/after seven-day expiry, including an accepted booking and a timely cancellation manually processed after the cutoff. Assert eligibility is preserved and no automated refund occurs.
- [ ] P08-T02: For manual rejection, deadline rejection and owner non-delivery after day seven, verify net refund equals the affected paid amount less applicable actual Razorpay processing charges. No 5% cancellation fee or other penalty applies; admin records manual completion and duplicate deductions are blocked.
- [ ] P08-T03: Verify Rs 10,000 cancellation refunds Rs 9,500 and allocates Rs 500 to Pixlwave inclusive of processing charges, with no additional fee or owner payout on the cancelled amount. Test partial-cart allocation, paise rounding, cumulative refund limits, duplicate refunds, gateway failure and refund-versus-payout races.
- [ ] P08-T04: Verify absence of pause/change endpoints, authorization on evidence, truthful fulfillment status and continued access to valid non-delivery claims without a 48-hour expiry.

- [ ] P08-T05: Separate scheduled status, owner-reported completion and admin verification. For partial delivery, require an authorized admin-entered refund assessment, reason and unit-linked evidence; enforce remaining paid-value limits and audit changes without automatically calculating an hours/plays refund.

Manual acceptance scenario: Run timely cancellation, rejected late cancellation, late owner non-delivery, partial refund and completion with evidence.

Exit gate: Accepted seven-day rules and exception are enforced; refund execution and banking time are distinguished from eligibility.

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
| P08-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P08-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P08-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P08-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P08-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P09 - Owner settlement and admin finance](P09-settlements-admin.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

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
