# P06 handoff - Fulfillment and settlement

Plan version: 0.9 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R03, R13, R14, R15, R16, R17.  
Entry dependency: P05 accepted and its actual handoff verified.  
Decision/configuration gates: P05 paid-booking and manual financial record contracts accepted. Use confirmed cancellation/rejection charge rules, admin-determined partial refunds and manual owner transfer after verification.

Previous phase: [P05 - Payments and booking integration](P05-payments-integration.md).

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Campaigns, evidence and cancellation

- [ ] Build confirmed campaign schedules, owner service/evidence records and admin completion/non-delivery decisions. Scheduled/live-window notifications indicate dates only, never verified playback. Completion requires admin evidence verification; no physical playback control.
- [ ] Allow advertiser cancellation only before successful payment + seven days. Refund 95% of the cancelled booking amount; allocate 5% to Pixlwave inclusive of Razorpay processing charges, with no separate processing deduction or added fulfillment commission. Preserve the request timestamp, queue the refund for admin and mark refunded only after admin records its completed payment reference.
- [ ] Block ordinary cancellation/refund eligibility after the cutoff while retaining owner inability/non-delivery as the business exception. Preserve eligibility for timely requests whose manual processing completes later.
- [ ] Refund undelivered daily units or theatre show/slot units at the booked rate; support partial delivery, evidence and admin decision reasons.
- [ ] Remove pause/resume, campaign extensions and in-place rescheduling/change actions from scope. Later advertising dates use a separate booking. Keep fulfillment, refund and settlement status separate.
- [ ] Review unit-linked evidence before admin-verifying completion. Use booked prices for fully missed units; let admin manually determine partial-delivery refunds with a reason and evidence. Record applicable actual Razorpay charges separately, deduct them once and apply no owner-failure penalty.

### Owner settlement and financial reporting

- [ ] Provide admin reports for paid-pending funds, rejected/cancelled liabilities, accepted commitments, completed service, refunds, platform revenue and owner earnings.
- [ ] Release only an accepted, fulfilled booking's reconciled owner balance after admin review; neither day seven nor a removed 48-hour timer triggers payout.
- [ ] Implement admin-only manual owner transfer records after fulfillment verification, with beneficiary, amount, bank reference, proof, operator and timestamps. Do not integrate Route or any automatic payout API.
- [ ] Require admin to record the completed external bank transfer before showing settled. Guard against duplicate references/settlement records; uncertain transfers remain unresolved until manually reconciled.
- [ ] Provide exception reconciliation for missing payment evidence, failed or uncertain manual transfers, post-settlement owner non-delivery and manual refunds. Preserve audited corrections; do not automatically debit an owner or issue a second transfer.
- [ ] Store one manual external transaction with balanced eligible line allocations. Record ineligible or uncertain external transfers as audited reconciliation exceptions without falsely marking service verified.

Parallel sequencing: Evidence/campaign views, cancellation/refund assessments and finance/owner reports can progress against shared paid-line and ledger contracts. Refund-versus-payout decisions must share one reconciled financial model and pass integration races.

## Integration with previous work

Use P05 actual funded lines and journals, P04 booking/cancellation state, P02 service promises and P03 notifications/tickets. Admin records external refund/transfer completion; application jobs never perform money movements. Earlier rejection refund logic is reused, not reimplemented.

Reuse the completed application's identities, data contracts and services. Any unavailable downstream feature is tracked for its owning phase; it is not treated as an implemented or validated feature here.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P06-T01: Test cancellation immediately before/at/after seven-day expiry, including an accepted booking and a timely cancellation manually processed after the cutoff. Assert eligibility is preserved and no automated refund occurs.
- [ ] P06-T02: For manual rejection, deadline rejection and owner non-delivery after day seven, verify net refund equals the affected paid amount less applicable actual Razorpay processing charges. No 5% cancellation fee or other penalty applies; admin records manual completion and duplicate deductions are blocked.
- [ ] P06-T03: Verify Rs 10,000 cancellation refunds Rs 9,500 and allocates Rs 500 to Pixlwave inclusive of processing charges, with no additional fee or owner payout on the cancelled amount. Test partial-cart allocation, paise rounding, cumulative refund limits, duplicate refunds, gateway failure and refund-versus-payout races.
- [ ] P06-T04: Verify absence of pause/change endpoints, authorization on evidence, truthful fulfillment status and continued access to valid non-delivery claims without a 48-hour expiry.
- [ ] P06-T05: Separate scheduled status, owner-reported completion and admin verification. For partial delivery, require an authorized admin-entered refund assessment, reason and unit-linked evidence; enforce remaining paid-value limits and audit changes without automatically calculating an hours/plays refund.
- [ ] P06-T06: Prove paid-pending, rejected, cancelled, unfulfilled and disputed items cannot be marked eligible for normal owner settlement in the website; eligible completed items settle independently within a mixed cart. Record any erroneous external transfer as an exception, not an approved payout.
- [ ] P06-T07: Test duplicate manual transfer records, missing bank reference/proof, unverified beneficiary, failed or uncertain transfer, unauthorized status changes and concurrent admin edits. Assert no payout/Route API is called.
- [ ] P06-T08: Race owner non-delivery refund against payout; account for refunds discovered after settlement without silently creating a negative recoverable balance.
- [ ] P06-T09: Reconcile 85% owner share and 15% gross commission with Razorpay processing charges deducted from Pixlwave's commission on completed service. Verify manual refunds/transfers against bank references and enforce admin permissions and audit history.
- [ ] P06-T10: Reconcile one bank transfer covering multiple eligible lines for the same owner without duplicate counting. Record an erroneous external transfer as an exception and block normal settlement/fulfillment status changes.
- [ ] P06-T11: From a P05 sandbox-paid cart, first cancel one line before the 168-hour cutoff. Then advance the controlled test clock beyond the 192-hour service start, complete one remaining line and report partial delivery on another. Verify admin assessments, evidence, fee rules, receipts, notifications and owner balance; record manual completion without any refund/payout API execution.

Manual acceptance scenario: Use a sandbox-paid approved campaign, inspect evidence, assess partial delivery, process a timely cancellation and record manual refund/owner-transfer outcomes. Show no penalty for owner failure beyond applicable processing-charge deduction.

Exit gate: Campaign, refund and owner finance workflows reconcile with previous phases and external references; no hidden unpaid or unverified payout, duplicated money record or incorrect notification. Actual outside-bank mistakes remain auditable exceptions.

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
| P06-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T08 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T09 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T10 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T11 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P07 - Production validation and launch](P07-production-launch.md).

Required outputs: Complete fulfillment/refund/manual payout workflows, balanced journals and exception records, evidence access/retention, operator procedures and full-system regression fixtures for P07.

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
| 2026-09-15 | 0.9 | Corrected P06-T11 chronology: cancel before 168 hours, then advance beyond 192 hours for fulfillment and partial-delivery checks. |
