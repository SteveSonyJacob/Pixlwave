# Pixlwave decision register

Status: DRAFT - awaiting user/client answers. Updated: 2026-09-14.

The user authorized drafting the plan before answering the remaining questions. A recommendation in this register is not an accepted business rule. No pending question is resolved by elapsed time or by starting development.

## How to update

Record the answer, source/date, impacted requirements, implementation phases, and tests. Update `plan.md` and affected handoffs together. Retain prior decisions as superseded rather than silently rewriting implemented financial rules. If implementation already exists, assess migration, existing-contract treatment, regression tests, and deployment implications.

## Pending decisions

| ID | Question and confirmed context | Proposed approach, not yet approved | Blocks final acceptance of |
| --- | --- | --- | --- |
| D01 | Upcoming eight days cannot be booked, but owners may take 8-10 days to respond. Which deadline wins? Does the eight-day rule mean calendar dates in IST or 192 elapsed hours? | Define exact earliest date with worked IST examples. Cart decision cutoff is the earlier of submission + 10 days or earliest screening - 48 hours; unanswered items expire. This leaves 24 hours to pay plus preparation time. Alternatively increase minimum notice. | P05 booking rules; P07 checkout deadlines; P11 launch |
| D02 | What happens when an owner never responds, and may customers edit or withdraw items after submitting a cart? Approved items must stay reserved until all items are accepted/rejected. | Freeze submitted cart membership. Additions create a new cart. Allow withdrawal with reservation release; do not extend an existing payment deadline. Apply D01 cutoff and count expired/withdrawn items as terminal, subject to explicit approval of this extension to the stated accepted/rejected rule. | P05, P07 |
| D03 | Shared mobile billboard slots can have an owner-defined route; custom routes are allowed only if the owner offers them. How are conflicting route requests handled? | Either custom routes require exclusive vehicle booking, or the first approved route fixes the route for all slots on those dates. User must select. Never independently promise conflicting routes on one vehicle. | P03 mobile inventory; P05 mobile reservations |
| D04 | Dynamic pricing must reflect requests/bookings and may consider nearby inventory. Who sets base price, formula, bounds, geographic comparison, and quote-lock time? | Owner sets base price; administrator manages a versioned, bounded formula using qualified unique demand, confirmed utilization, and comparable local inventory. Freeze price at request submission until its payment deadline. Define locality, lookback, weights, update frequency, fallback, and anti-manipulation rules before acceptance. | P04 pricing; P05 quote contract; P07 charges |
| D05 | Customers can pause with approval; a small fine is deducted from a refund. Does a pause release inventory, change dates, require a new booking to resume, or incur additional charges? | Keep policy configurable but do not invent behaviour or enable unresolved actions. Determine amount/percentage, cap, recipient, rounding, refundable base, and when it applies. | P08 pauses and refunds |
| D06 | Paid bookings can be cancelled; admin reviews refunds in 1-2 days. What are cancellation cutoffs/penalties and refund units? Missed days must be refunded. | Refund only undelivered dated line items; for theatre use missed shows/slots if approved. No advertiser penalty for owner failure/fraud. Decide partial-day/partial-slot failure, commission reversal, and how approved pauses interact with cancellations. | P08 refunds; P09 settlement reconciliation |
| D07 | Commission is 25%, but who pays gateway/Route charges, and what is the commission basis? | For a Rs 10,000 eligible booking: owner Rs 7,500, platform Rs 2,500 before provider expenses; provider fees absorbed by platform. This is an example awaiting confirmation. Define treatment of refunds, fines, future taxes, and rounding. | P07 ledger; P08 refunds; P09 payouts |
| D08 | Owner supplies photo/video evidence; administrator decides completion, fraud, refunds, and payout. How long can advertisers dispute evidence, and what happens if no evidence or response arrives? | Evidence submission, advertiser dispute opportunity, then explicit admin release. Never auto-pay merely because end date passed. Define evidence deadline, dispute window, response targets, and disputes after settlement. | P08 completion; P09 payout |
| D09 | Supabase requested for OTP/email authentication and notifications via website, Gmail, and SMS. Does Gmail mean recipients or the sender service? Is email login password-based or OTP/link-based? | Supabase Auth with phone OTP and selected email mode; external SMTP and SMS delivery providers. Application worker sends business notifications. Use a branded sender delivered to any valid email, if agreed. Verify linking phone/email to one account. | P02 auth; P06 communication production integration |
| D10 | Hosting outside India is unacceptable. Does the restriction also cover every third-party processor, including maps, email, SMS, support tools, and telemetry? | All application compute, database, uploads, logs, backups, and recovery copies target India. Verify contractual/technical scope for managed services; do not treat a Mumbai project setting as proof that every service component stays in India. | P01 final provider selection; P11 production deployment |
| D11 | UI references focus on Kerala. Is launch Kerala-only or all India? | English/INR/IST throughout, with configurable supported locations. Reference city names and imagery are illustrative until scope is answered. | P04 discovery/content; P11 launch content |
| D12 | Hosting budget, deadline, and initial usage are unknown; user requests a startup-oriented approach. | Prepare cost worksheet and a proposed workload for review; use measured capacity before selecting final sizes. No invented client budget, usage forecast, launch date, or availability commitment. | P10 load acceptance targets; P11 operating budget |
| D13 | Razorpay preferred for collection, commission, and settlement; manual bank-reference fallback if needed. Which facilities are available for the client account? | Validate Route onboarding, linked owner accounts, deferred settlement, refund/reversal support, and campaign-duration limits in the selected account. Enable manual payout recording only as an explicitly controlled alternate path, never alongside an in-flight gateway payout. | P07 provider design; P09 live payouts; P11 live money |
| D14 | Upload formats, sizes, duration/resolution limits, theatre slot lengths, repeat frequency, operating hours, evidence retention, and owner verification documents are not specified. | Define category-specific inventory and media requirements with client/owners. Store the promised duration/frequency/hours in each contract because Pixlwave does not control playback. Propose technical limits in P00 and validate real sample media before P03 acceptance. | P03 media/inventory; P05 contract; P08 evidence; P11 retention |
| D15 | GST is explicitly deferred, with room reserved for future development. What must be enabled before the client permits a real-money public launch? | Keep tax calculation behind a separate interface and distinguish booking receipts from GST invoices. Record the client-approved tax/invoicing scope before enabling live checkout; do not label omitted GST as an exemption. | P07 receipt design; P11 live checkout |

## Confirmed decisions and their source

All entries below come from user answers in this task, overriding conflicting PDF/UI examples.

| ID | Decision |
| --- | --- |
| C01 | Build the complete system from scratch, with all three advertising categories implemented by completion. |
| C02 | One person per account; the same account can act as advertiser and owner. Administrators verify owners and approve listings. |
| C03 | Public browsing; sign-in required for booking. Responsive English website, INR, IST. |
| C04 | Normal digital screens are exclusively reserved by day. Theatres offer multiple ad slots per show. Mobile billboards offer multiple rotating ad slots and owner-controlled route options. |
| C05 | Owners approve advertising requests; payment follows approval. Pixlwave handles the marketplace and does not deliver or play ads on physical screens. |
| C06 | Approved inventory is reserved. Multi-booking cart payment opens for 24 hours only after all requests are accepted/rejected; early approvals remain reserved while others await decisions. |
| C07 | Platform commission is 25%; owner receives settlement after screening completion, subject to admin control. Razorpay preferred; controlled manual bank-reference fallback if required. |
| C08 | Owner photo/video evidence supports completion. Administrator decides fraud, non-delivery, refunds, and whether to release payment. |
| C09 | Extensions/pauses require approval. Missed days are refundable; paid cancellations are allowed with admin refund review in 1-2 days; pause-related refund incurs a small fine whose definition is pending. |
| C10 | Supabase requested for authentication. In-app, email, and SMS notifications required, with a ticket support system. |
| C11 | Location display is required; live vehicle GPS tracking is excluded. |
| C12 | Pixlwave brand; replaceable logo; supplied UI references; no real inventory/content yet. |
| C13 | Dynamic pricing based on demand is required. Booking requests cannot target the upcoming eight days; response-time conflict remains pending. |
| C14 | Hosting outside India is not acceptable. GST implementation deferred with an extension point. Each phase requires testing and manual validation. |

## Answer history

| Date | Decision | Answer/source | Changes made | Validation implications |
| --- | --- | --- | --- | --- |
| 2026-09-14 | Draft authorization | User: create the plan now and modify after later answers. | Created draft planning documents; pending policies are explicitly unresolved. | No application implementation or test execution claimed. |
