> HISTORICAL v0.7 HANDOFF - superseded by the seven-phase v0.8 plan. Do not implement from this file or treat its phase/test IDs as current. Use [current phase mapping](../../phase-mapping.md) and [active handoffs](../../../handoff.md). Original test descriptions below are retained for provenance; relative source links were adjusted for this archive.

# P00 handoff - Scope, admin workflow, and design

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: DRAFT / AWAITING REMAINING DETAILS  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../../plan.md), [handoff guide](../../../handoff.md) and [decision register](../../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R01, R08-R15, R18.  
Dependencies: Source documents and latest client clarification.  
Decision gates: D01 confirmed 192-hour notice / 168-hour cutoff; D05 confirmed cancellation allocation; D06 manual refund workflow; D07 confirmed outcome-specific deductions; D08 release details. Payment-origin seven-day clocks, automatic rejection, manual refund task creation and approval-only reservation are settled.

Starting inputs: latest client answers, source blueprint, UI references and current planning draft.

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Approve the admin-mediated workflow, permission matrix, charged-cart/item definitions, deadline examples and refund eligibility matrix.
- [ ] Document price ownership: owner supplies the initial base price; only admin changes a published rate after owner discussion. Preserve booked-price history.
- [ ] Review all three category forms, upfront checkout, paid-awaiting-admin status, admin coordination notes, advertiser cancellation, refund tracking and owner fulfillment screens.
- [ ] Implement the confirmed 192-hour notice, 168-hour review/cancellation cutoff and owner non-delivery exception; use the successful-payment clock and verify deadline rejection creates a manual refund task without moving money.
- [ ] Review reference-led responsive designs, provider/data plan, media requirements and estimated startup operating costs.

## Planned testing and validation

- [ ] P00-T01: Walk through paid cart submission, manual admin-owner discussion and mixed item decisions without exposing requests to owner accounts.
- [ ] P00-T02: Use dated IST examples to validate minimum notice and seven-day boundaries, including a day-seven rejection and a day-seven cancellation awaiting refund processing.
- [ ] P00-T03: Review owner price submission, admin-only rate editing, current-booking protection, 15% commission and cancellation/refund examples.
- [ ] P00-T04: Trace every requirement to a phase; verify obsolete dynamic pricing, owner approval controls, delayed checkout and pause/change features are absent from current designs.

Manual acceptance scenario: Client reviews the new complete flow and designs; distinguish accepted rules from outstanding details.

Exit gate: Core workflow and designs accepted; unresolved parameters have explicit gates rather than invented defaults.

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
| P00-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P00-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P00-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P00-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P01 - Engineering foundation](P01-foundation.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

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
