# Pixlwave requirements and planning review

Version: 0.7 draft. Updated: 2026-09-15.
Scope: original two-page frontend blueprint, both supplied UI references, latest user decisions, master plan and all 12 phase handoffs.
Result: documentation coverage reviewed and ambiguities corrected; the three review questions are now resolved, while implementation and operational verification remain. No application code, tests or client acceptance have been completed.

Read [plan.md](../plan.md), [decision register](decisions.md) and [handoff guide](../handoff.md). The latest direct user answers govern; reference documents and images do not override them. This is a requirements review, not a fresh provider capability, pricing, legal or production-readiness assessment.

## 1. Source coverage

Source: [frontend blueprint](references/frontend-blueprint.pdf). Each row accounts for the original section's features, including replacements explicitly requested later.

| Blueprint section | Retained or specified behavior | Replaced or deferred behavior | Phases / verification |
| --- | --- | --- | --- |
| 1. Authentication | Mobile OTP/email through Supabase, business signup fields, account/profile management, recovery and one-person advertiser/owner switching | Email method and delivery providers remain implementation setup decisions; no team accounts | P02-T01-T04; D09 |
| 2. Home dashboard | City/locality and category search, featured screens and map browsing without login | State search is restricted to Kerala launch inventory; schema supports future states | P04-T01, T04-T05 |
| 3. Listing page | Images, dimensions/resolution, map location, published rate per actual booking unit, availability calendar and attributed audience estimates | No invented traffic measurements or guaranteed availability before approval | P03-T01, T04; P04-T01, T05 |
| 4. Booking flow | Screen selection, inclusive LED start/end dates, automatic arithmetic totals, image/video upload and preview, payment | Theatre units are show slots; mobile units follow published dated slots/service promises. One frozen cart is paid upfront; admin decides within seven days; reservation only on approval | P03-T05; P05-T01-T06; P07-T01, T06 |
| 5. Payment | Razorpay UPI/card/net-banking when enabled, single cart checkout, downloadable payment receipts and completed-refund confirmations | GST feature is deferred; receipts must not claim to be implemented GST invoices. Refunds are performed and recorded by admin | P07-T01-T06; D07, D13, D15 |
| 6. Campaign management | Campaign list, review/schedule/service-window/evidence/completion states and delivery-issue reporting | Pause/extension/in-place changes removed. Scheduled window is not verified playback. No 48-hour reporting timer | P08-T01-T05; P06-T05 |
| 7. Theatre screens | Cinema/location, dated shows, slot quantities, pre-show creative and booking multiple days through explicit show instances | No whole-cinema daily exclusivity; multiple advertisers may book distinct available slots | P03-T02, T05; P05-T02, T06 |
| 8. Mobile billboard | Vehicle, published route, campaign dates, dated price calculation, rotating ad duration/plays and conditional custom route | No live GPS. Custom route needs owner permission and no overlapping approved vehicle booking; later approvals must keep compatible routes | P03-T02, T05; P05-T02, T06 |
| 9. Notifications/support | Payment/review/acceptance/refund/scheduled-start notifications, website/email/SMS and booking-linked support tickets | Tickets replace live chat; owner does not get a raw request queue. Start notifications do not claim observed ad playback | P06-T01-T05; P08-T04 |

The UI images guide layout, colors, cards, maps and dashboards. Sample listing counts, prices, brand logos, instant-booking claims and unverified audience claims are not approved launch content. Decorative Save/Compare/Enquire controls must not be shipped as dead buttons: either map them to an implemented flow in P00 or omit them from the approved design; they do not independently add requirements absent from the blueprint or client answers.

## 2. Gaps corrected in this revision

| Finding | Correction | Validation location |
| --- | --- | --- |
| P07 wording could mean a separate Razorpay order per cart item | Exactly one gateway order for the entire cart, with internal item allocations | P07-T01, T05 |
| Rechecking eight-day eligibility at approval could reject a valid request near the review deadline | Check initial notice at checkout/capture, preserve its evidence and do not restart it at approval | P05-T05; P07-T06 |
| Submitted lines, dates, shows and cancellation units were underspecified | Explicit request-line and dated-unit model; whole-line atomic decisions; selected whole-line cancellation; no silent date edits | Plan 3.6; P05-T06 |
| Checkout expiry, price revision and delayed captures lacked an outcome | Immutable accepted snapshot, documented expiry, actual capture-time checks and manual exception tasks for ineligible money received | Plan 3.6; P07-T06 |
| Listing fields and invoice download were implicit | Explicit dimensions/resolution/calendar/audience fields and account-scoped payment receipt/refund downloads | P04-T05; P07-T05 |
| Overdue state and live/completed wording could contradict deadline rejection or imply playback monitoring | Overdue is an operational alert; business review state rejects at deadline. Scheduled window, owner claim and admin verification are separate | Plan 3.5, 3.8; P06-T05; P08-T05 |
| Generic refund/payout references could duplicate grouped transactions or overclaim bank control | One external transaction with balanced allocations; manual completion audit; exception records for erroneous outside-bank movements | Plan 3.8; P07-T05; P09-T01, T05 |
| Approved media version and service evidence were not explicit | Validate before checkout, freeze submitted asset/service terms, scope owner access and link evidence to booked units | Plan 3.7; P03-T05; P08-T05 |
| Recovery focused on payment webhooks but could omit manual money operations | Reconcile manual refund/transfer records and external evidence after restore before acting on pending tasks | P10-T05 |
| Phase checklists did not explicitly trace these cases | Added 11 planned cases and matching evidence placeholders; originals remain unexecuted | All affected handoffs; P11-T05 |

## 3. Resolved business questions

1. **D07 - rejection/owner failure:** No penalty applies. Deduct actual applicable Razorpay processing charges from the affected payment and refund the remainder manually. Do not apply the advertiser's 5% cancellation fee to these outcomes.
2. **D01 - exact timing:** Service must start at least 192 hours after successful payment. Review/cancellation closes at 168 hours. Payment on 1 October at 10:00 IST therefore permits service from 9 October at 10:00, with the review deadline on 8 October at 10:00. Validate actual inventory operating/show starts.
3. **D06 - partial delivery:** Admin manually determines the refund assessment from evidence. The website records the assessment, charge breakdown, net refund and reason; it does not impose an automatic hours/plays formula.

These three policy questions are resolved. Their phase tests remain unexecuted, and operational/provider/design work remains. The latest explicit no-penalty answer supersedes the interim cancellation-fee/penalty wording.

## 4. Engineering and operational details to settle during their phases

These are documented work items, not additional immediate client questionnaires:
- P00-P03: finalize email method/provider setup, business/verification fields, admin roles, creative file limits, evidence retention, valid slot promises and approved page designs.
- P01/P07: pin versions, define checkout validity and exact event/state contracts, allocate paise deterministically, implement migrations, access policies and error recovery.
- P06: configure SMTP/SMS sender credentials, test real notifications, provide admin ticket handling and track delivery failures.
- P07/P09: verify the live account's manual refund/reference workflow, owner bank details, reconciliation procedures, actual payment-method availability and receipt wording.
- P10/P11: choose measurable startup load/cost targets, verify India data/backup/log destinations, test restore and operator procedures, obtain real listings and launch acceptance.

Implement the confirmed timing, charge and manual-assessment rules. Any new proposal affecting client policy must be identified explicitly; document checks cannot substitute for the phase's actual implementation and validation.

## 5. Verification and limits

Documentation checks must verify local links, phase IDs, matching plan/handoff test wording, evidence placeholders, version/date consistency and absence of superseded active payment workflows. The expected planned validation count after this revision is 59 across 12 phases.

Application implementation: NOT STARTED. Application tests: NOT RUN. Manual/client acceptance: NOT REVIEWED. Provider capabilities, commercial terms and real transaction behavior require implementation-phase verification. Passing document checks does not change any of those statuses.
