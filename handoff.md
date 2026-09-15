# Pixlwave development handoff guide

Version: 0.7 draft. Updated: 2026-09-15. No application implementation has started.

## Read before continuing

1. Read [plan.md](plan.md) and [docs/decisions.md](docs/decisions.md).
2. Read [source coverage and the review](docs/requirements-review.md), then the target phase file and preceding phase's actual exit evidence.
3. Inspect the repository and applicable local instructions. Check facts against the handoff.
4. Use current v0.7 rules; historical proposals must not become implementation.
5. Resolve only the unanswered details relevant to the phase. A document or checklist existing is not proof a phase passed.

## Current accepted model

- Advertiser pays once for all cart bookings before decisions. Submitted contents freeze; new requests use a new cart.
- Admin manually coordinates with owners and accepts/rejects each request within seven days of successful payment. Requests are not forwarded directly to owners.
- Paid-pending requests reserve nothing. Admin acceptance alone atomically reserves capacity; competing paid requests may need rejection/refund.
- Undecided requests automatically reject at seven days and create a manual refund task. Admin performs refunds manually and records refunded after completion; neither rejection nor task creation moves money.
- Advertiser cancellation within seven days of payment refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction. Admin performs the refund manually and records refunded after completion; timely eligibility remains valid while processing.
- Ordinary late cancellations/refunds are unavailable; owner inability/non-delivery is the stated later business refund exception.
- Owner sets initial base price. Only admin changes published prices after owner discussion; paid line prices remain fixed.
- For completed service, the owner receives 85%; Razorpay charges come from Pixlwave's 15%. Admin transfers funds manually after verification. Rejection/owner-failure refunds deduct only applicable actual Razorpay processing charges, with no penalty.
- No direct owner approval, dynamic pricing, pause/resume/in-place changes, post-approval payment countdown or fixed 48-hour completion window.
- LED, theatre and mobile slots, Kerala launch, Supabase, Mappls primary/Google fallback, India-hosted main servers/data, notifications and tickets remain in scope.

## Current repository state

Planning Markdown, copied references and phase templates exist. There is no application scaffold, database schema, deployed environment, provider credential setup or executed application test evidence. All implementation statuses remain NOT STARTED and test statuses NOT RUN.

This revision updates planned behaviour only. No data migration is required. Do not treat prior design discussion as client sign-off on all P00 outputs.

## Phase index

| Phase | Handoff | Current status |
| --- | --- | --- |
| P00 | [Scope, admin workflow, and design](docs/handoffs/P00-scope-design.md) | DRAFT / AWAITING REMAINING DETAILS |
| P01 | [Engineering foundation](docs/handoffs/P01-foundation.md) | NOT STARTED |
| P02 | [Authentication and role permissions](docs/handoffs/P02-auth-roles.md) | NOT STARTED |
| P03 | [Inventory, owner base prices, and media](docs/handoffs/P03-inventory-media.md) | NOT STARTED |
| P04 | [Discovery and admin-controlled pricing](docs/handoffs/P04-discovery-pricing.md) | NOT STARTED |
| P05 | [Cart, capacity, and admin review domain](docs/handoffs/P05-booking-cart.md) | NOT STARTED |
| P06 | [Notifications, admin reminders, and support](docs/handoffs/P06-notifications-support.md) | NOT STARTED |
| P07 | [Upfront grouped payment and rejection refunds](docs/handoffs/P07-payments-ledger.md) | NOT STARTED |
| P08 | [Fulfillment, seven-day cancellation, and refunds](docs/handoffs/P08-campaigns-refunds.md) | NOT STARTED |
| P09 | [Owner settlement and admin finance](docs/handoffs/P09-settlements-admin.md) | NOT STARTED |
| P10 | [System validation and operational readiness](docs/handoffs/P10-hardening.md) | NOT STARTED |
| P11 | [Client acceptance and production release](docs/handoffs/P11-launch.md) | NOT STARTED |

P05 may use explicit funded fixtures to validate domain logic; actual gateway submission and rejected-item refunds are verified in P07. Fixtures do not establish a working live payment flow.

## Required phase handoff record

Complete each existing phase file with:
- Actual scope delivered, missing work and accepted decision IDs/date.
- Branch/revision, implementation paths, environment/build URL and setup commands.
- Schema/migration names, procedure, compatibility effects and recovery.
- API/event contracts, permissions, invariants and representative non-sensitive payloads.
- Configuration variable names and approved secret-store references, never secret values.
- Exact tests run, revision/environment/time, observed results and report/screenshot/trace links.
- Manual review steps, accounts/fixtures, browser/device, reviewer/date and approval or changes.
- Known defects with severity, reproduction, impact, owner and blocking status.
- Operations, alerts, automatic expiry jobs and manual refund queues, reconciliation and recovery instructions.
- Next phase inputs, first concrete action and unresolved questions.

## Validation record

| Check | Requirement | Command/manual procedure | Expected | Observed | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Fill during implementation | Rxx / Dxx | Reproducible steps | Specific outcome | Actual result | Report/path/link | NOT RUN / BLOCKED / FAIL / PASS |

A mocked provider and a real sandbox run are different evidence. Skipped checks remain NOT RUN/BLOCKED. No screenshot or test result is implied by a planned checklist.

## Phase transition rules

A phase closes only after its required checks pass, manual validation is recorded, and handoff is current. Independent foundations may proceed while unrelated parameters remain pending; incomplete feature behaviour is not phase acceptance.

Apply the confirmed outcome-specific fee rules; record actual processing charges and manual financial decisions with evidence. Do not reopen the confirmed 95% cancellation refund, 5% Pixlwave fee inclusive of Razorpay processing charges, clock origin, automatic expiry action or reservation timing. P11 requires all active launch gates satisfied and specific operational authorization for real money/public release.

If execution is interrupted during payment, refund, approval allocation or payout, reconcile persisted and provider state before retrying. Replayed jobs must not reset deadlines or double-reserve capacity. Manual external transactions need their own reconciliation evidence; the website cannot prevent transfers performed outside it. Never equate an application's record constraint with control of the bank account.

## Next action

Apply confirmed D05 cancellation allocation, D06 manual refunds, D08 manual verified payouts and D14 owner-defined service promises. Apply resolved D01 (192-hour notice and 168-hour cutoff), D06 (admin-determined partial-delivery refunds) and D07 (processing-charge-only deductions for rejection/owner failure), then validate operational/provider details in P00. Update the plan, decision register and affected handoffs together.

## Revision note

v0.7 replaces all earlier phase specifications affected by admin-mediated upfront payment, seven-day automatic rejection and manual refund tasks, 5% cancellation fee, approval-only reservations and fixed admin-controlled pricing. Historical versions remain described in the plan/decision history; they are not active requirements.
