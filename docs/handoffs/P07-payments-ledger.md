# P07 handoff - Upfront grouped payment and rejection refunds

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../plan.md), [handoff guide](../../handoff.md) and [decision register](../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R11, R12, R15, R16.  
Dependencies: P05-P06; real payment now activates the domain review queue.  
Decision gates: D07 confirmed outcome-specific deductions; D13 Razorpay; D15 receipt scope; D02 payment-success anchor and D17 unreserved paid-pending requests are confirmed.

Previous phase: [P06 - Notifications, admin reminders, and support](P06-notifications-support.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Create exactly one server-priced Razorpay order for the entire submitted cart, containing the summed value of all valid items before any booking decision. Store internal item allocations; do not create a separate checkout/order per item. Customer pays once through enabled UPI/card/net-banking methods.
- [ ] Use verified captured payment/webhooks to atomically allocate the payment to all submitted booking lines and enter unreserved paid-awaiting-admin review. Set both seven-day clocks from verified payment success; confirmation/reservation occurs only after admin approval.
- [ ] Persist integer-paise immutable ledger entries, price and 15% commission policy snapshots, attempts and receipts; pending funds are liabilities, not earned owner payouts.
- [ ] Create an item-specific manual refund task on rejection. Provide admin processing/completion fields for amount, deductions, reference, evidence and time; admin marks refunded after completing it. Deduplicate tasks and completion records, reconcile with actual transactions and prohibit automated refund API calls.
- [ ] Handle missing callbacks, duplicate/out-of-order webhooks, extra successful attempts, allocation failure and late payment safely. Keep tax calculation modular and receipt naming accurate.

- [ ] Provide downloadable account-scoped payment receipts and completed-refund confirmations. Model one external refund transaction with balanced item allocations; record late/extra captures as manual exceptions without automatic refunds.

## Planned testing and validation

- [ ] P07-T01: Pay a multi-owner/multi-category cart before any decisions; prove captured total equals all paid lines and exactly one submission enters admin review without reserving inventory; delayed/replayed webhooks do not restart its seven-day clocks.
- [ ] P07-T02: Accept one item, reject another and expire a still-undecided item at day seven; assert refund tasks appear without a refund API call. Record a manually completed sandbox refund and reconcile its item amount/reference. Test duplicate tasks/references, incomplete completion data, unauthorized edits and failed or uncertain external outcomes.
- [ ] P07-T03: Test forged signatures, manipulated totals, repeated clicks, duplicate captures, lost webhooks, provider timeout and concurrent payment/rejection/cancellation events.
- [ ] P07-T04: Verify failed payments create no funded review/confirmed booking, and payment success never equals admin approval or owner settlement. For completed Rs 10,000 service, assert Rs 8,500 owner and Rs 1,500 gross Pixlwave commission with gateway costs charged only against the latter.

- [ ] P07-T05: Verify one gateway order for a mixed cart, immutable receipt totals and authorized downloads; record one manual partial/grouped refund and reconcile its allocation without counting the transaction multiple times.
- [ ] P07-T06: Expire a checkout across an IST date boundary and deliver a late capture/webhook: preserve captured money, avoid restarting deadlines or confirming an ineligible booking, and create a manual exception task. Test valid price snapshots when an admin changes rates.

Manual acceptance scenario: Sandbox-pay a cart upfront, accept/reject items as admin and inspect the customer's payment receipt, item refunds and financial ledger.

Exit gate: Real sandbox checkout, funded admin submission and rejected-item refund/reconciliation evidence passes. Live money remains a P11 gate.

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
| P07-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P08 - Fulfillment, seven-day cancellation, and refunds](P08-campaigns-refunds.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

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
