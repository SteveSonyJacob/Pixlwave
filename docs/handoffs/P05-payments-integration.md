# P05 handoff - Payments and booking integration

Plan version: 1.0 draft. Updated: 2026-09-25.
Status: IMPLEMENTED IN WORKSPACE; DATABASE AND REAL SANDBOX ACCEPTANCE PENDING.
Implementation revision: uncommitted workspace changes on 2026-09-25.
Application tests: 50 unit tests passed; migration integration test blocked by missing disposable database.
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R08, R09, R11, R12, R14, R15, R16, R17.  
Entry dependency: P04 accepted and its actual handoff verified.  
Decision/configuration gates: P04 payment-success and booking contracts accepted; verify Razorpay sandbox/account capabilities, actual processing charges, receipt scope and manual refund reference workflow.

Previous phase: [P04 - Booking and admin workflow](P04-booking-admin.md).

## Entry checklist

- [x] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [x] Record provider/environment/configuration prerequisites without secrets.
- [x] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Payment collection, receipts and refund records

- [x] Create exactly one server-priced Razorpay sandbox order for the entire submitted cart. Store internal item allocations; do not create a separate checkout/order per item.
- [x] Use verified captured payment/webhooks to atomically allocate the payment to submitted booking lines and enter unreserved paid-awaiting-admin review.
- [x] Persist integer-paise payment and line allocations, 15% commission policy snapshots and account-scoped receipts. Fulfillment earnings remain P06 scope.
- [x] Create item-specific manual refund tasks and admin completion records reconciled to a processed Razorpay refund. No refund API creation call exists.
- [x] Treat browser callbacks as advisory; deduplicate events/captures, keep extra or mismatched captures as exceptions, leave the submitted cart and its normal checkout unchanged after payment failure, and preserve signed-event capture time for late payment checks. Missing webhooks are detected through provider order payment fetch and require original signed event redelivery.
- [x] Provide downloadable account-scoped payment receipts and completed-refund confirmations, with one external refund transaction and balanced whole-obligation allocations.

### End-to-end booking integration

- [x] Connect verified Razorpay capture to the existing P04 transaction boundary; use one order per cart and retain signed-event capture timestamps. Real end-to-end acceptance still needs test-mode credentials and webhook delivery.
- [x] Connect manual rejection-refund completion records to P03 notifications and P04 rejected line states. Payment/refund/booking status stay independent; no automatic refunds.

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
- [ ] P05-T04: Fail a payment inside Razorpay Checkout, use its normal in-modal retry, and verify the Pixlwave cart, items, total, checkout and one provider order remain unchanged until a verified capture. A failed payment creates no funded review/confirmed booking; payment success never equals admin approval or owner settlement. As a ledger/domain test, use a simulated fulfillment-eligible Rs 10,000 line to assert Rs 8,500 owner and Rs 1,500 gross Pixlwave commission with gateway costs charged only against the latter; rerun with actual admin-verified completion in P06-T09.
- [ ] P05-T05: As a ledger-allocation fixture rather than a fulfillment test, verify one gateway order for a mixed cart, immutable receipt totals and authorized downloads; record one manual partial/grouped refund and reconcile its allocation without counting the transaction multiple times. P06-T05 reruns partial-delivery refund accounting after admin assessment.
- [ ] P05-T06: Expire a checkout across an IST date boundary and deliver a late capture/webhook: preserve captured money, avoid restarting deadlines or confirming an ineligible booking, and create a manual exception task. Test valid price snapshots when an admin changes rates.
- [ ] P05-T07: Run a real Razorpay sandbox multi-owner cart through P03 discovery, P04 admin decisions and manual rejection refund recording. Verify one capture, exact clocks, capacity, actual notifications and financial totals; rerun fixture-era permission/concurrency cases, including P02-T02, P02-T03, P02-T05 and P02-T06, and record provider outages distinctly.

Manual acceptance scenario: Pay one mixed cart in Razorpay sandbox, receive payment notification, decide items in the admin dashboard, record a manually completed rejection refund and download reconciled receipts. No fixture may satisfy this sign-off.

Exit gate: Real sandbox payment through booking, capacity, notifications and manual rejection refunds passes on one revision. No production test-funding path; browser callbacks alone cannot fund review.

## Actual implementation record

- Delivered: one durable cart order claim, server-priced Razorpay test order, hosted checkout with normal in-modal retry on the same order, signed capture webhook, transactional P04 funding and line allocation, fee reconciliation, missing-webhook detection through provider order payment fetch, manual refund completion with processed provider reference, payment exception queue, account-scoped receipt and refund confirmation downloads, and `refund.completed` notification. Failed attempts do not change Pixlwave cart state, items, total or normal checkout. Payment never reserves inventory or decides a line. The UI does not call any refund creation or payout API.
- Implementation files: `supabase/migrations/202609250001_phase5_payments.sql`, `src/lib/payments/*`, `src/app/api/payments/order/route.ts`, `src/app/api/webhooks/razorpay/route.ts`, receipt/refund-confirmation routes, `/cart`, `/bookings`, `/admin/refunds`, and `scripts/test-migrations.ts`.
- Revision/environment: uncommitted workspace changes; no integrated environment URL or provider keys were supplied. Real Razorpay sandbox behavior and India account capability are NOT VERIFIED.
- Schema/API/permissions: [P05 contracts](../architecture/P05-payment-contracts.md). Service-only order/capture/fee/completion RPCs; the completion action requires AAL2 and verifies the provider first. Payment and receipt reads are account-scoped. GST invoices, partial-delivery assessments and owner settlement remain outside P05.
- Configuration and exact setup/recovery: [.env.example](../../.env.example) and [P05 operations](../operations/P05-payments.md). `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` belong in a server secret store. No values are recorded here.
- Compatibility: P04 `record_trusted_cart_payment`, `refund_obligations`, admin approval and expiry remain the booking authority. The `p04_fixture` path remains guarded by a test database and explicit enablement for old phase tests; P05 acceptance cannot use it.
- Remaining integration limits: No disposable `pixlwave_test` connection or Razorpay test credentials/webhook endpoint were available. An uncertain order-create outcome stays in `creating` and needs provider receipt reconciliation. Lost original signed capture events need provider redelivery. Admin records whole existing P04 obligations; P06 owns partial-delivery refund assessment.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

Implementation checks were executed locally. Real sandbox and database acceptance are still pending; no fixture result is represented as provider evidence.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Application checks | Workspace, 2026-09-25 | `npm run lint`; `npm run typecheck`; `npm test`; `npm run test:docs`; `npm run build`; `npm run check:client-secrets` | All commands pass | All passed; 50 unit tests; client secret scan had no configured server values to compare | Command output from this session | PASS |
| P05-T01 | Workspace, 2026-09-25 | `npm run db:test` plus sandbox procedure in P05 operations | As specified above | Database guard refused configured non-test database; provider unavailable | Command output | BLOCKED |
| P05-T02 | Workspace, 2026-09-25 | `npm run db:test` and `/admin/refunds` sandbox procedure | As specified above | Migration fixture authored; not executed | None | NOT RUN |
| P05-T03 | Workspace, 2026-09-25 | `npm test`; `npm run db:test` | As specified above | HMAC/config tests passed; database race cases not executed | Vitest output: 50 tests | PARTIAL |
| P05-T04 | Workspace, 2026-09-25 | `npm test`; sandbox journey still required | As specified above | Simulated completed-service Rs 10,000 split passed at 85/15 with provider cost in platform share; real journey not run | Vitest output | PARTIAL |
| P05-T05 | Workspace, 2026-09-25 | `npm run db:test` and receipt access in two accounts | As specified above | Whole-obligation grouped model implemented; provider/account test not run | None | NOT RUN |
| P05-T06 | Workspace, 2026-09-25 | Late signed capture after quote expiry | As specified above | P04 notice boundary reused; test database unavailable | None | NOT RUN |
| P05-T07 | No sandbox environment | Exact steps in P05 operations | As specified above | Not executed; credentials/webhook/account not supplied | None | BLOCKED |
| Earlier-phase regression | Workspace, 2026-09-25 | `npm test`, `npm run build`; rerun P02/P04 funded cases after sandbox setup | Previous behavior remains correct | 50 unit tests and build passed; funded provider cases pending | Command output | PARTIAL |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| Sandbox acceptance | One real capture/refund journey is not demonstrated | Integration operator | Configure test keys and webhook; run P05 operations steps 1-5 | BLOCKED |
| Disposable database | SQL migration/finance fixtures not replayed | Integration operator | Supply isolated `pixlwave_test` database and run `npm run db:test` | BLOCKED |
| Client sign-off | No human acceptance evidence | Client/reviewer | Review redacted sandbox journey, receipts and admin refund | NOT REVIEWED |

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
| 2026-09-25 | Workspace implementation | Added sandbox order, verified webhook/P04 capture, finance allocations, manual refund reconciliation, receipts, tests and operations documentation. Database replay and real provider sign-off remain pending. |
