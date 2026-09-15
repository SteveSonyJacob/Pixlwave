# P05 handoff - Payments and booking integration

Plan version: 0.9 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R08, R09, R11, R12, R14, R15, R16, R17.  
Entry dependency: P04 accepted and its actual handoff verified.  
Decision/configuration gates: P04 payment-success and booking contracts accepted; verify Razorpay sandbox/account capabilities, actual processing charges, receipt scope and manual refund reference workflow.

Previous phase: [P04 - Booking and admin workflow](P04-booking-admin.md).

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Payment collection, receipts and refund records

- [ ] Create exactly one server-priced Razorpay order for the entire submitted cart, containing the summed value of all valid items before any booking decision. Store internal item allocations; do not create a separate checkout/order per item. Customer pays once through enabled UPI/card/net-banking methods.
- [ ] Use verified captured payment/webhooks to atomically allocate the payment to all submitted booking lines and enter unreserved paid-awaiting-admin review. Set both seven-day clocks from verified payment success; confirmation/reservation occurs only after admin approval.
- [ ] Persist integer-paise immutable ledger entries, price and 15% commission policy snapshots, attempts and receipts; pending funds are liabilities, not earned owner payouts.
- [ ] Create an item-specific manual refund task on rejection. Provide admin processing/completion fields for amount, deductions, reference, evidence and time; admin marks refunded after completing it. Deduplicate tasks and completion records, reconcile with actual transactions and prohibit automated refund API calls.
- [ ] Handle missing callbacks, duplicate/out-of-order webhooks, extra successful attempts, allocation failure and late payment safely. Keep tax calculation modular and receipt naming accurate.
- [ ] Provide downloadable account-scoped payment receipts and completed-refund confirmations. Model one external refund transaction with balanced item allocations; record late/extra captures as manual exceptions without automatic refunds.

### End-to-end booking integration

- [ ] Connect verified Razorpay capture to the existing P04 transaction boundary; use one order per cart and retain original capture timestamps. Replace fixture funding in all end-to-end acceptance journeys.
- [ ] Connect manual rejection-refund completion records to P03 notifications and P04 rejected line states. Payment/refund/booking status stay independent; no automatic refunds.

Parallel sequencing: Razorpay order/webhook handling, receipts/manual refund records and payment UX can progress after agreeing ledger and provider event contracts. Final acceptance is one shared end-to-end journey through existing booking services.

## Integration with previous work

Razorpay captures fund the same P04 requests without reserving capacity; admin decisions reserve/reject through existing rules and emit P03 notifications. Rerun P04 capacity/timing and P03 event-routing cases with real sandbox checkout, including mixed rejection and manual refunds.

No fixture funding is allowed to satisfy this phase's end-to-end acceptance. Real Razorpay sandbox checkout must feed the P04 transaction boundary. Manual refunds are performed outside application automation, then recorded and reconciled.

P05-T04's completed-service split is a ledger/domain calculation using a simulated fulfillment-eligible line because P06 owns evidence, completion verification and settlement. P05-T05's partial/grouped refund is likewise a ledger-allocation fixture, not a partial-delivery decision. These tests do not prove fulfillment. P06-T05 and P06-T09 rerun the relevant refund/allocation and 85%/15% calculations using admin-assessed or admin-verified campaigns. P05 also reruns P02-T02, P02-T03, P02-T05 and P02-T06 with sandbox-funded booking records.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P05-T01: Pay a multi-owner/multi-category cart before any decisions; prove captured total equals all paid lines and exactly one submission enters admin review without reserving inventory; delayed/replayed webhooks do not restart its seven-day clocks.
- [ ] P05-T02: Accept one item, reject another and expire a still-undecided item at day seven; assert refund tasks appear without a refund API call. Record a manually completed sandbox refund and reconcile its item amount/reference. Test duplicate tasks/references, incomplete completion data, unauthorized edits and failed or uncertain external outcomes.
- [ ] P05-T03: Test forged signatures, manipulated totals, repeated clicks, duplicate captures, lost webhooks, provider timeout and concurrent payment/rejection/cancellation events.
- [ ] P05-T04: Verify failed payments create no funded review/confirmed booking, and payment success never equals admin approval or owner settlement. As a ledger/domain test, use a simulated fulfillment-eligible Rs 10,000 line to assert Rs 8,500 owner and Rs 1,500 gross Pixlwave commission with gateway costs charged only against the latter; rerun with actual admin-verified completion in P06-T09.
- [ ] P05-T05: As a ledger-allocation fixture rather than a fulfillment test, verify one gateway order for a mixed cart, immutable receipt totals and authorized downloads; record one manual partial/grouped refund and reconcile its allocation without counting the transaction multiple times. P06-T05 reruns partial-delivery refund accounting after admin assessment.
- [ ] P05-T06: Expire a checkout across an IST date boundary and deliver a late capture/webhook: preserve captured money, avoid restarting deadlines or confirming an ineligible booking, and create a manual exception task. Test valid price snapshots when an admin changes rates.
- [ ] P05-T07: Run a real Razorpay sandbox multi-owner cart through P03 discovery, P04 admin decisions and manual rejection refund recording. Verify one capture, exact clocks, capacity, actual notifications and financial totals; rerun fixture-era permission/concurrency cases, including P02-T02, P02-T03, P02-T05 and P02-T06, and record provider outages distinctly.

Manual acceptance scenario: Pay one mixed cart in Razorpay sandbox, receive payment notification, decide items in the admin dashboard, record a manually completed rejection refund and download reconciled receipts. No fixture may satisfy this sign-off.

Exit gate: Real sandbox payment through booking, capacity, notifications and manual rejection refunds passes on one revision. No production test-funding path; browser callbacks alone cannot fund review.

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
| P05-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P05-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P06 - Fulfillment and settlement](P06-fulfillment-settlement.md).

Required outputs: Verified sandbox checkout, immutable ledger/fee allocations, manual refund records, receipts, event reconciliation, capture-to-booking evidence and funded campaign contracts for P06.

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
| 2026-09-15 | 0.9 | Identified completed-service and partial-refund checks as ledger fixtures, assigned P06 integrated reruns and required sandbox reruns of P02 invariants. |
