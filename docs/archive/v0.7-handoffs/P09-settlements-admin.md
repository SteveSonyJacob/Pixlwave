> HISTORICAL v0.7 HANDOFF - superseded by the seven-phase v0.8 plan. Do not implement from this file or treat its phase/test IDs as current. Use [current phase mapping](../../phase-mapping.md) and [active handoffs](../../../handoff.md). Original test descriptions below are retained for provenance; relative source links were adjusted for this archive.

# P09 handoff - Owner settlement and admin finance

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../../plan.md), [handoff guide](../../../handoff.md) and [decision register](../../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R15, R03.  
Dependencies: P08; provider account verification.  
Decision gates: D07 accounting verification; D08 completion approval details; D13 manual payout workflow.

Previous phase: [P08 - Fulfillment, seven-day cancellation, and refunds](P08-campaigns-refunds.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Provide admin reports for paid-pending funds, rejected/cancelled liabilities, accepted commitments, completed service, refunds, platform revenue and owner earnings.
- [ ] Release only an accepted, fulfilled booking's reconciled owner balance after admin review; neither day seven nor a removed 48-hour timer triggers payout.
- [ ] Implement admin-only manual owner transfer records after fulfillment verification, with beneficiary, amount, bank reference, proof, operator and timestamps. Do not integrate Route or any automatic payout API.
- [ ] Require admin to record the completed external bank transfer before showing settled. Guard against duplicate references/settlement records; uncertain transfers remain unresolved until manually reconciled.
- [ ] Provide exception reconciliation for missing payment evidence, failed or uncertain manual transfers, post-settlement owner non-delivery and manual refunds. Preserve audited corrections; do not automatically debit an owner or issue a second transfer.

- [ ] Store one manual external transaction with balanced eligible line allocations. Record ineligible or uncertain external transfers as audited reconciliation exceptions without falsely marking service verified.

## Planned testing and validation

- [ ] P09-T01: Prove paid-pending, rejected, cancelled, unfulfilled and disputed items cannot be marked eligible for normal owner settlement in the website; eligible completed items settle independently within a mixed cart. Record any erroneous external transfer as an exception, not an approved payout.
- [ ] P09-T02: Test duplicate manual transfer records, missing bank reference/proof, unverified beneficiary, failed or uncertain transfer, unauthorized status changes and concurrent admin edits. Assert no payout/Route API is called.
- [ ] P09-T03: Race owner non-delivery refund against payout; account for refunds discovered after settlement without silently creating a negative recoverable balance.
- [ ] P09-T04: Reconcile 85% owner share and 15% gross commission with Razorpay processing charges deducted from Pixlwave's commission on completed service. Verify manual refunds/transfers against bank references and enforce admin permissions and audit history.

- [ ] P09-T05: Reconcile one bank transfer covering multiple eligible lines for the same owner without duplicate counting. Record an erroneous external transfer as an exception and block normal settlement/fulfillment status changes.

Manual acceptance scenario: Review pending funds, settle one fulfilled booking, block an unfulfilled booking and rehearse failure/manual recovery paths.

Exit gate: Eligible payout records require fulfillment verification and admin-recorded transfer completion. Recorded movements reconcile with provider/bank references; the website neither creates nor controls external bank transfers.

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
| P09-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P09-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P09-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P09-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P09-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P10 - System validation and operational readiness](P10-hardening.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

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
