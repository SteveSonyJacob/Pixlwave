# Seven-phase migration and validation coverage

Version: 0.9 draft. Updated: 2026-09-15.
Current authority: [plan.md](../plan.md) and [seven active handoffs](../handoff.md).

This is a documentation restructuring only. Exactly seven current phases replace the earlier P00-P11 breakdown. No application code/data needs migration because implementation has not started. All 59 previous validation scenarios are retained, reassigned and given unique current IDs. Wording is clarified where a scenario depends on a later phase, with its original wording preserved in the archive. Seven integration cases are added, for 66 planned cases. None has run.

## Workstream migration

| Historical work | Current owner | Integration / sequencing |
| --- | --- | --- |
| P00 scope/design | P01 Foundation and accounts | Opening design checkpoint inside the phase; no extra P00 |
| P01 foundation | P01 Foundation and accounts | Runnable application/database/worker/CI foundation |
| P02 authentication | P01 Foundation and accounts | Login, profiles, roles and admin protections |
| P02 owner verification / publication check | P02 Inventory management | Owner dashboard, onboarding, admin verification and real listing publication |
| P02 direct booking endpoint permission test | P04 Booking and admin workflow | Run when the booking/admin endpoints exist |
| P03 inventory/media | P02 Inventory management | All categories, owner base prices, approved service promises and media |
| P04 discovery/pricing | P03 Discovery and communication | Uses P02's approved inventory and rate APIs |
| P06 notifications/support | P03 Discovery and communication | Framework, tickets and provider delivery; domain event fixtures until actual P04-P06 integration |
| P05 cart/admin/capacity | P04 Booking and admin workflow | Real domain with restricted payment fixtures |
| P07 payments/ledger | P05 Payments and booking integration | Real Razorpay sandbox replaces the payment fixture boundary |
| P08 fulfillment/refunds | P06 Fulfillment and settlement | Actual paid campaigns, evidence, manual refund assessment/recording |
| P09 owner finance | P06 Fulfillment and settlement | Manual verified owner transfers and accounting |
| P10 hardening | P07 Production validation and launch | Must pass before release |
| P11 acceptance/release | P07 Production validation and launch | Sequential client acceptance and authorized release after hardening |

Each current phase's parallel workstreams have explicit contracts, predecessor integration, regression, manual acceptance and handoff gates. The number of milestone documents does not remove those requirements.

## All 59 preserved validation cases

Historical IDs in this table are for lookup only; current IDs identify the active tests.

| Historical ID | Current ID | Current handoff |
| --- | --- | --- |
| P00-T01 | P01-T01 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P00-T02 | P01-T02 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P00-T03 | P01-T03 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P00-T04 | P01-T04 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P01-T01 | P01-T05 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P01-T02 | P01-T06 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P01-T03 | P01-T07 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P01-T04 | P01-T08 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P02-T01 | P01-T09 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P02-T04 | P01-T10 | [Foundation and accounts](handoffs/P01-foundation-accounts.md) |
| P02-T03 | P02-T01 | [Inventory management](handoffs/P02-inventory-management.md) |
| P03-T01 | P02-T02 | [Inventory management](handoffs/P02-inventory-management.md) |
| P03-T02 | P02-T03 | [Inventory management](handoffs/P02-inventory-management.md) |
| P03-T03 | P02-T04 | [Inventory management](handoffs/P02-inventory-management.md) |
| P03-T04 | P02-T05 | [Inventory management](handoffs/P02-inventory-management.md) |
| P03-T05 | P02-T06 | [Inventory management](handoffs/P02-inventory-management.md) |
| P04-T01 | P03-T01 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P04-T02 | P03-T02 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P04-T03 | P03-T03 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P04-T04 | P03-T04 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P04-T05 | P03-T05 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P06-T01 | P03-T06 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P06-T02 | P03-T07 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P06-T03 | P03-T08 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P06-T04 | P03-T09 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P06-T05 | P03-T10 | [Discovery and communication](handoffs/P03-discovery-communication.md) |
| P02-T02 | P04-T01 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P05-T01 | P04-T02 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P05-T02 | P04-T03 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P05-T03 | P04-T04 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P05-T04 | P04-T05 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P05-T05 | P04-T06 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P05-T06 | P04-T07 | [Booking and admin workflow](handoffs/P04-booking-admin.md) |
| P07-T01 | P05-T01 | [Payments and booking integration](handoffs/P05-payments-integration.md) |
| P07-T02 | P05-T02 | [Payments and booking integration](handoffs/P05-payments-integration.md) |
| P07-T03 | P05-T03 | [Payments and booking integration](handoffs/P05-payments-integration.md) |
| P07-T04 | P05-T04 | [Payments and booking integration](handoffs/P05-payments-integration.md) |
| P07-T05 | P05-T05 | [Payments and booking integration](handoffs/P05-payments-integration.md) |
| P07-T06 | P05-T06 | [Payments and booking integration](handoffs/P05-payments-integration.md) |
| P08-T01 | P06-T01 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P08-T02 | P06-T02 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P08-T03 | P06-T03 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P08-T04 | P06-T04 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P08-T05 | P06-T05 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P09-T01 | P06-T06 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P09-T02 | P06-T07 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P09-T03 | P06-T08 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P09-T04 | P06-T09 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P09-T05 | P06-T10 | [Fulfillment and settlement](handoffs/P06-fulfillment-settlement.md) |
| P10-T01 | P07-T01 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P10-T02 | P07-T02 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P10-T03 | P07-T03 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P10-T04 | P07-T04 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P10-T05 | P07-T05 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P11-T01 | P07-T06 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P11-T02 | P07-T07 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P11-T03 | P07-T08 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P11-T04 | P07-T09 | [Production validation and launch](handoffs/P07-production-launch.md) |
| P11-T05 | P07-T10 | [Production validation and launch](handoffs/P07-production-launch.md) |

The four former P00 tests are design walkthroughs within P01; they do not claim payment implementation at that stage. Former P02-T03 belongs to P02 because it requires owner verification/publication; former P02-T02 belongs to P04 because it exercises real booking decision APIs. P02-T02, P02-T03, P02-T05 and P02-T06 use explicit downstream domain fixtures in P02 and are rerun with P04 fixture-funded approvals and P05 Razorpay sandbox-funded bookings. P03-T03 and P03-T08 use paid-line/event fixtures and are rerun from P04 through P06 as their actual producers become available. P05-T04's completed-service allocation and P05-T05's partial-refund allocation are ledger/domain fixtures; P06-T09 and P06-T05 respectively rerun them using admin-verified or admin-assessed campaigns.

## Seven added integration cases

| Current ID | Purpose |
| --- | --- |
| P01-T11 | From a clean environment, apply migrations, sign in, switch advertiser/owner mode, deny admin access to ordinary accounts, persist/retry a harmless outbox event and run CI on the same revision; record real auth-provider evidence. |
| P02-T07 | Using P01 accounts, create one listing of each category, block publication by unverified owners, complete admin verification/publication and retrieve the same approved records through the read API. Recheck cross-account media and price permissions. |
| P03-T11 | Publish/change a listing through P02, verify the same approved values on search/map/details, submit a ticket using a P01 account and deliver its notification. Distinguish fixture campaign events from real listing/ticket events and prevent cross-account access. |
| P04-T08 | From P03 discovery, submit a fixture-funded multi-category cart, decide items as admin, verify P02 capacity and P03 notifications, then race cancellation and the 168-hour deadline. Prove normal clients cannot invoke fixture funding or approve their own request. |
| P05-T07 | Run a real Razorpay sandbox multi-owner cart through P03 discovery, P04 admin decisions and manual rejection refund recording. Verify one capture, exact clocks, capacity, actual notifications and financial totals; rerun fixture-era permission/concurrency cases, including P02-T02, P02-T03, P02-T05 and P02-T06, and record provider outages distinctly. |
| P06-T11 | From a P05 sandbox-paid cart, first cancel one line before the 168-hour cutoff. Then advance the controlled test clock beyond the 192-hour service start, complete one remaining line and report partial delivery on another. Verify admin assessments, evidence, fee rules, receipts, notifications and owner balance; record manual completion without any refund/payout API execution. |
| P07-T11 | Promote the same accepted P01-P06 release candidate through full regression, client acceptance and authorized deployment; verify migration/configuration parity, restore/reconciliation rehearsal and post-release smoke checks without losing manual finance or booking history. |

## Historical files

The twelve [v0.7 handoffs](archive/v0.7-handoffs/README.md) are archived for provenance and old test text. They are not extra current phases and cannot be used to claim work completed. Their source-link paths were adjusted for the archive location; their original test descriptions remain available.

The active handoff directory contains only P01-P07. Requirement IDs R01-R18 and decision IDs D01-D17 remain stable. The master plan, decision affected-phase columns and source review all use current numbering.
