# Pixlwave development handoff guide

Version: 1.0 implementation. Updated: 2026-09-18.
Status: P01 completed and accepted; P02 ready to start.

## Read before continuing

1. Read [plan.md](plan.md), [decisions](docs/decisions.md) and [requirements review](docs/requirements-review.md).
2. Read the current phase below and the previous phase's actual accepted exit evidence.
3. Read [phase and test migration](docs/phase-mapping.md) when following an older reference; archived handoffs are historical only.
4. Agree changed schemas, API/event contracts and permissions before parallel work. Use current implementation and repository instructions.
5. A planned checklist or draft document is not proof that a phase passed.

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

## Seven active phases

| Phase | Handoff | Status |
| --- | --- | --- |
| P01 | [Foundation and accounts](docs/handoffs/P01-foundation-accounts.md) | COMPLETED - implementation built and accepted |
| P02 | [Inventory management](docs/handoffs/P02-inventory-management.md) | READY TO START |
| P03 | [Discovery and communication](docs/handoffs/P03-discovery-communication.md) | NOT STARTED |
| P04 | [Booking and admin workflow](docs/handoffs/P04-booking-admin.md) | NOT STARTED |
| P05 | [Payments and booking integration](docs/handoffs/P05-payments-integration.md) | NOT STARTED |
| P06 | [Fulfillment and settlement](docs/handoffs/P06-fulfillment-settlement.md) | NOT STARTED |
| P07 | [Production validation and launch](docs/handoffs/P07-production-launch.md) | NOT STARTED |

There is no separate P00 phase. P01 includes the scope/design checkpoint. Owner listing and verification are P02; public discovery is P03. P04 proves booking/admin/capacity with restricted payment fixtures; P05 must validate the same flow with actual Razorpay sandbox capture and manual rejection refunds. P06 reuses these records for fulfillment and finance. P07 hardening and client acceptance precede release.

## Required handoff evidence

For every phase record:

- Delivered scope, missing work, accepted decision IDs and exact implementation revision.
- Changed files, schemas/migrations, backward compatibility and recovery procedure.
- API/event contracts, roles, configuration names and secret-store references without secret values.
- Completed integration with previous phases and affected regression cases, including their observed outcomes.
- Exact test command or manual procedure, environment, date/time, expected/observed result and evidence links.
- Real provider evidence separately from fixtures; blocked/skipped checks remain BLOCKED/NOT RUN.
- Manual reviewer, acceptance result, defects/severity/owner and next-phase implications.
- Operational procedures, monitoring, deadline jobs, manual finance reconciliation and next concrete action.

Each phase file contains unfilled records and validation rows. All 59 earlier tests are mapped in [phase-mapping.md](docs/phase-mapping.md); seven additional tests explicitly cover phase integration. All 66 are planned, not executed.

## Parallel work and phase closure

Parallel workstreams may share a phase after their interfaces are agreed. Merge and validate them in one environment before sign-off. Do not maintain duplicate booking, listing, auth or financial models between workstreams.

A phase closes only when its implementation, current-phase tests, affected earlier regression, manual acceptance and handoff all pass. Unavailable endpoints/providers cannot be marked passed using unrelated mocks. P04 paid fixtures are a specifically documented boundary; P05 replaces this boundary with real sandbox payment and reruns the complete flow.

P07 first completes hardening and client acceptance, then conducts specifically authorized live transaction/release checks. Combining these activities into one phase does not allow release before either validation gate.

Manual refunds and owner payouts remain manual. Restore/retry handling must reconcile external transaction evidence; application guards cannot control an admin's external bank account. Never treat restored pending tasks as authorization to repeat uncertain money movements.

## Current state and next action

P01 application code, database migrations, RLS, Auth flows, worker/outbox, CI, contracts, Resend delivery, and manual acceptance are completed and accepted. Local deterministic tests, documentation checks, build, secret scan, and account acceptance pass.

Phase 1 is complete. Begin Phase 2 (P02 - Inventory management) starting with owner onboarding, inventory forms, and Mappls Kerala map integration.

## Revision note

v0.9 retains the seven-phase structure and corrects cross-phase ownership and fixture boundaries. P01 specifies downstream rules; P02/P03/P05 label downstream-dependent domain fixtures and require integrated reruns; P06 uses a chronologically valid cancellation-then-service test. The [migration map](docs/phase-mapping.md) and [archived handoffs](docs/archive/v0.7-handoffs/README.md) retain history. No feature, requirement or validation scenario was removed.
