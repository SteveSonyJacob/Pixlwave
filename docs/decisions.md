# Pixlwave decision register

Version: 0.9 draft. Updated: 2026-09-15.
Source: latest client workflow clarification and subsequent user answers, including exact 192/168-hour timing, admin-determined partial refunds and the final processing-charge-only rule for rejection/owner failure.

## Current authority

The latest client rules supersede conflicting earlier answers, the frontend blueprint, and previous plan versions. The user authorized maintaining the draft while unanswered details remain. A PARTIAL status reopens only the named details, not the accepted rule.

Current model: advertiser pays for the whole cart at submission; admin manually coordinates with owners and decides each request within seven days of successful payment. Paid requests do not reserve inventory. Only admin approval reserves capacity. Advertiser cancellation within the same seven-day period refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, without an additional processing deduction. Ordinary refund eligibility ends at seven days; owner inability/non-delivery is the business exception. Admin controls published price changes after discussing with the owner. There is no dynamic pricing or pause/change workflow.

Phase references below use the seven-phase v0.9 roadmap. See [phase/test migration](phase-mapping.md) for older references. This restructuring does not reopen accepted business policies.

## Decision status

| ID | Status | Current accepted rule | Remaining detail or verification | Affected phases |
| --- | --- | --- | --- | --- |
| D01 | RESOLVED POLICY / VERIFY | Earliest service start is successful payment + 192 hours (8 x 24); review/cancellation cutoff is payment + 168 hours (7 x 24). Payment on 1 October reaches the review deadline on 8 October and earliest service on 9 October at the same time of day. Undecided requests expire into manual refund tasks. | Use trusted capture timestamps, UTC storage and IST display. Do not round to midnight or reapply notice at approval. Test before/at/after both boundaries; compare actual operating/show starts, not date labels alone. No automatic money movement. | P01, P04-P07 |
| D02 | RESOLVED POLICY / VERIFY | One upfront payment for a frozen cart; additions go to a new cart. Payment creates unreserved paid requests. Manual/automatic rejection creates per-item tasks for admin to refund manually. | Validate idempotent paid submission, line allocations, independent decisions and manual refund records. No automatic refund API calls. Failed payment is not funded business; preserve cart and financial history. | P04-P05 |
| D03 | RESOLVED POLICY / VERIFY | Owner-enabled custom mobile route allowed only if that vehicle has no other approved bookings for the dates. Admin checks with the owner and records the decision. Rotating slots remain supported. | Check all overlapping approved/paid-active commitments atomically. Paid-pending requests are not approved commitments. Later shared-slot approvals must use the committed route; conflicting paid requests may require rejection/refund. | P02, P04 |
| D04 | RESOLVED POLICY / VERIFY | Owner supplies initial base price. Subsequent published-price changes are made only by admin after discussing with the owner. No dynamic, demand-based or locality-based pricing. Booked amounts remain fixed. | Define initial rate publication fields and effective time in implementation. Record old/new rate, admin, discussion note, reason and effective date. Rate changes may update future quotes but cannot alter a paid booking; customer must see and accept any changed quote before paying. | P02-P03, P05 |
| D05 | RESOLVED POLICY / VERIFY | Advertiser cancellation only within seven days of successful payment refunds 95% of the cancelled booking amount. Pixlwave retains 5% as the total cancellation fee, including Razorpay processing charges. No pause/resume, extension or in-place changes. | No separate processing-charge deduction or added 15% fulfillment commission. Apply the percentage to cancelled items only; cancelled amounts earn no owner service payout. Implementation: round the fee once per cancelled line to the nearest paise (half up), then derive refund by subtraction. Verify Rs 10,000 -> Rs 9,500 refund + Rs 500 Pixlwave fee; record actual gateway costs separately. No cancellation penalty for admin rejection, automatic rejection or owner failure; only actual applicable Razorpay processing charges are deducted. Manual processing is specified in D06. | P04-P06 |
| D06 | RESOLVED MANUAL POLICY / VERIFY | Admin performs all refunds manually and records refunded after completion. Admin manually determines refunds for partial hours/plays/service from evidence, without an automatic proration formula. Owner non-delivery remains the refund exception after seven days. | Preserve timely request eligibility while processing. Require authorized assessment, reason, evidence, applicable charge and net amount, remaining-paid-value limits, reference and audit history. Apply D07 deductions; reconcile owner/commission adjustments. Manual processing SLA and evidence retention are operational setup items, not unresolved calculation policy. | P05-P06 |
| D07 | RESOLVED POLICY / VERIFY | Completed service: owner 85%, Pixlwave 15%, with Razorpay charges paid from Pixlwave's share. Advertiser cancellation: 95% refund and 5% Pixlwave retention inclusive of charges. Admin rejection, automatic deadline rejection or owner failure: refund affected payment less actual applicable Razorpay processing charges; no penalty. | Deduct processing charges once only; never apply the 5% cancellation fee to rejection/owner failure. Use actual recorded costs and deterministic line allocations for grouped payments; admin partial-delivery assessment follows D06. Reconcile gross service adjustments, net refunds and owner/commission balances with an audit trail. No penalty or owner charge is inferred. | P05-P06 |
| D08 | MANUAL PAYOUT CONFIRMED / VERIFY | Admin manually transfers owner funds after verifying fulfilled service and evidence. No automated payout or fixed 48-hour release timer. | Record beneficiary, verified fulfillment, amount, bank reference, proof, operator and time. Group eligible same-owner lines under one external transaction with balanced allocations; record erroneous external transfers as exceptions, not approved settlement. Unresolved obligations block affected payout. Define evidence retention and operational follow-up; late non-delivery after settlement needs admin reconciliation, without automatically charging the owner or adding a new reporting deadline. | P06 |
| D09 | PARTIAL | Supabase authentication; in-app/email/SMS events and support tickets. Normal Gmail/other recipient delivery allowed. Requests go to admin, not automatically to owner. | Select email login method, SMTP/SMS providers, sender/domain and verified account linking. Provider setup must support real delivery. Send owners only the confirmed fulfillment information admin authorizes, never raw request queues/private coordination notes. | P01, P03 |
| D10 | RESOLVED POLICY / VERIFY | Main application servers and data are in India; normal external email delivery allowed. | Verify compute, database, first-party uploads, logs, backups and restore locations. Document provider data flows rather than assume every external service component stays in India. | P01, P07 |
| D11 | RESOLVED POLICY / VERIFY | Kerala-only initial inventory launch, with later expansion supported. English, INR and IST retained. | Enforce supported geography in listing publication/discovery/booking; this does not restrict where advertisers themselves live. | P02-P03, P07 |
| D12 | OPEN / VERIFY | Startup-oriented hosting; no fixed budget, launch date or traffic forecast provided. | Propose and validate workload, service targets, recovery and component costs. Do not present assumptions as client forecasts. | P01, P07 |
| D13 | MANUAL MONEY OPERATIONS CONFIRMED / VERIFY | Razorpay checkout collects advertiser payments. Admin performs refunds manually and records completion. Owner payout is a manual bank transfer after verification. Razorpay Route and automated refund/payout execution are excluded. | Verify account checkout and manual refund capabilities, transaction references and grouped-payment item reconciliation. Separate payment webhooks from admin completion status; a webhook alone must not mark an admin refund task refunded. Check references and actual amounts; never retry uncertain money movements automatically. | P05-P07 |
| D14 | SERVICE FIELDS CONFIRMED / MEDIA DETAILS OPEN | Owners specify ad duration, plays per show/day and operating hours per listing, subject to admin approval. | Validate category-specific capacity/service promises, snapshot approved terms on paid bookings and prohibit edits that silently change commitments. Technical upload limits, verification documents and evidence retention remain to be specified and tested. Owners fulfill service outside the website. | P02, P04, P06-P07 |
| D15 | DEFERRED / RELEASE CHECK | GST feature deferred, with an extension point. | Distinguish booking receipts from GST invoices and record client-approved launch invoicing scope. Razorpay fees/tax are a separate provider expense. | P05, P07 |
| D16 | RESOLVED POLICY / VERIFY | Mappls primary, Google Maps fallback, provider adapter. First-party listing coordinates/locality/routes stored in India's database. | Obtain commercial terms/quotas; verify Kerala accuracy, key restrictions, provenance/licensing of provider-derived data and provider failure behaviour before fallback. | P01-P03, P07 |
| D17 | RESOLVED POLICY / VERIFY | User explicitly selected reservation only after admin approval. Paid-pending requests do not reserve screens or slots. | Show paid-awaiting-confirmation clearly. Check capacity atomically when admin accepts; multiple paid requests can compete for one slot. Declined requests retain refund liabilities. Cancellation/rejection releases only a reservation that actually exists. | P04-P06 |

Manual execution supersedes earlier immediate/automatic refund initiation and Route-based payout proposals. Automatic deadline rejection remains; it only creates an admin task. The latest charge answer applies to rejection/owner failure and does not override the explicit completed-booking fee allocation.

Review findings, source coverage and remaining questions: [requirements review](requirements-review.md).

All three questions from the v0.6 review are answered. The user's final clarification supersedes the ambiguous statement that charges come from a cancellation fee/penalty: for rejection/owner failure there is no penalty; only actual applicable Razorpay processing charges are deducted from the refund.

## Confirmed requirements

| ID | Rule |
| --- | --- |
| C01 | Complete marketplace with LED screens, theatre slots and mobile rotating ad slots by completion. |
| C02 | One individual account may act as advertiser and owner; admin verifies owners/listings and separately controls privileged decisions. |
| C03 | Public browsing, sign-in for booking, responsive English interface, INR and IST. |
| C04 | LED whole-day exclusivity; theatre multiple slots per show; mobile rotating slots and owner-permitted routes. Custom route requires no other approved vehicle booking for the dates. |
| C05 | Admin manually coordinates with owners and decides within seven days of payment. No owner request queue. Undecided requests automatically reject at deadline and create manual refund tasks. |
| C06 | One upfront frozen-cart payment; additions in a new cart. Admin performs refunds manually and records refunded after completion. |
| C07 | Completed service: 85% owner share, 15% Pixlwave commission; Razorpay charges come from Pixlwave's share. Admin transfers owner funds manually after verification. |
| C08 | Admin completion/non-delivery review and owner evidence retained. The previous 48-hour window is removed. |
| C09 | Advertiser cancellation only within seven days of payment: refund 95% of the cancelled booking amount and retain 5% for Pixlwave inclusive of Razorpay processing charges, without an additional processing deduction. No pause/change workflow. Owner inability/non-delivery remains the after-seven-days business refund exception. |
| C10 | Supabase auth, in-app/email/SMS notifications and ticket support; normal email recipients allowed. |
| C11 | Locations/planned routes displayed, no live GPS tracking or physical playback control. |
| C12 | Pixlwave branding, replaceable logo, reference-led UI, sample inventory for development. |
| C13 | Owner initial base price; admin changes published rates after discussion. No dynamic pricing. Paid prices remain fixed. Service starts at least 192 hours after payment; review/cancellation closes at 168 hours. Owner-defined ad duration, plays per show/day and operating hours require admin approval. |
| C14 | Main servers/data in India; GST feature deferred; every phase needs tests and manual acceptance. |
| C15 | Kerala-first launch, future geographic expansion supported. |
| C16 | Mappls primary/Google Maps fallback behind a replaceable adapter. |
| C17 | Both seven-day periods start at successful payment. Reservation occurs only when admin approves, not when the advertiser pays. |

## Superseded policy history

This section is historical only and must not drive implementation.

| Earlier policy | Current replacement |
| --- | --- |
| Owners receive and approve requests; owner response 8-10 days | Admin alone coordinates and decides within seven days of successful payment |
| Collect after all owners decide; 24-hour payment deadline | One payment at submission, followed by individual admin decisions and rejected-item refunds |
| Approved unpaid holds while waiting for other cart decisions | All reviewed requests already paid; reserve only at admin approval |
| Dynamic demand/locality pricing and pricing limits | Owner initial base price; admin-only published rate changes after discussion |
| 48-hour completion-issue window before payout | No fixed 48-hour window; fulfillment/admin review and non-delivery exception govern |
| Pause/resume/extension/change workflows and pause penalties | Removed; advertiser cancellation within seven days with a cancellation fee; new dates use a new booking |
| Automatic rejection refunds and immediate refund API execution | Deadline rejection creates a manual refund task; admin performs the refund and records completion |
| Route splitting and conditional automated owner settlement | Admin manually transfers owner funds after verification and records the bank reference |
| Original 25% commission | Superseded earlier by 15%, retained in current scope |

## Answer history and maintenance

| Date | Revision | Source / effect |
| --- | --- | --- |
| 2026-09-14 | 0.1 | User authorized a draft with pending questions and phase handoffs. |
| 2026-09-14 | 0.2 | Client's eight answers established 15%, Kerala launch and other rules; several workflow rules were later superseded. |
| 2026-09-14 | 0.3 | User approved Mappls primary/Google fallback. |
| 2026-09-14 | 0.4 | Latest client clarification replaced booking approval, payment timing, refunds/cancellation and price management. |
| 2026-09-14 | 0.4 follow-up | User confirmed seven days from payment, 5% cancellation fee, approval-only reservation, automatic deadline rejection/refund and immediate rejection-refund initiation. |

Update this register, plan and affected phase handoffs together. Retain superseded rules only in history. No application or live financial records exist, so this revision requires no data migration and claims no executed application tests.
| 2026-09-14 | 0.4 cancellation allocation | User confirmed cancellation within seven days refunds the paid amount less 5%, retained by Pixlwave inclusive of Razorpay processing charges. Recorded 95% refund and no additional processing deduction; cancellation initiation timing remains separate. |
| 2026-09-15 | 0.5 | User confirmed after-eight-day dates and maximum seven-day approval, manual refunds with admin completion status, manual owner transfers after verification, completed-booking charges from Pixlwave's 15%, and admin-approved owner service fields. Pixlwave does not cover rejection/owner-failure charges; payer remains open. |
| 2026-09-15 | 0.6 | Documentation audit clarified payment/notice/receipt/manual-journal contracts and mapped the original blueprint. Three business questions remain D01/D06/D07; engineering assumptions are labeled in plan section 3.6. |
| 2026-09-15 | 0.7 | User confirmed 192-hour notice, 168-hour review deadline, admin-determined partial-delivery refunds and no penalty for rejection/owner failure: deduct Razorpay processing charges from payment and refund the rest. D01/D06/D07 policy questions resolved. |
| 2026-09-15 | 0.8 | Seven-phase consolidation; affected-phase references remapped, all accepted policies retained and original test ownership tracked in phase-mapping.md. |
| 2026-09-15 | 0.9 | Corrected implementation ownership and explicit fixture/rerun boundaries across P01-P06; no business decision changed. |
