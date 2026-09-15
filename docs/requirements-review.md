# Pixlwave requirements and planning review

Version: 0.9 draft. Updated: 2026-09-15.
Scope: original two-page blueprint, supplied UI references, client decisions and seven current development phases.
Result: requirement coverage retained; the three business clarification questions are resolved. Application implementation, tests and client acceptance have not started.

Read [plan.md](../plan.md), [decisions](decisions.md), [handoff guide](../handoff.md) and [phase/test migration](phase-mapping.md). Latest user decisions govern. This restructuring is a documentation review, not a fresh verification of provider capabilities, pricing or production readiness.

## 1. Source coverage in seven phases

Source: [frontend blueprint](references/frontend-blueprint.pdf). Later client instructions replace conflicting original workflows.

| Blueprint section | Retained or specified behavior | Replacement / limit | Current verification |
| --- | --- | --- | --- |
| Authentication | Supabase mobile OTP/email, business profile, recovery and individual advertiser/owner modes | No team accounts; delivery method/providers verified during setup | P01; P01-T09, P01-T10; owner publication in P02-T01 and booking permissions in P04-T01 |
| Home dashboard | Public city/locality/category search, featured screens and map browsing | Kerala inventory at launch, expandable schema | P03; P03-T01, P03-T04, P03-T05 |
| Listing details | Images, dimensions/resolution, map pin, unit prices, availability calendar and attributed audience estimates | No invented traffic or guaranteed booking before approval | P02-P03; P02-T02, P02-T05, P03-T05 |
| Booking | Start/end dates, explicit shows/slots, arithmetic totals, image/video preview and one upfront cart payment | Admin decisions within 168 hours, service notice 192 hours, reservation only on approval | P04-P05; P04-T06, P04-T07, P05-T01, P05-T06 |
| Payment | Enabled Razorpay UPI/card/net-banking, one order per cart, receipt and refund-confirmation downloads | GST feature deferred; refunds performed/recorded by admin | P05; P05-T01, P05-T02, P05-T05 |
| Campaigns | Review, schedule, evidence, delivery issues and admin-verified completion | No pause/extension/in-place changes, verified playback claims or 48-hour reporting timer | P06; P06-T01, P06-T04, P06-T05 |
| Theatre | Cinema location, show instances, slot quantity, pre-show creative and multiple days | Multiple advertisers share available show slots | P02/P04; P02-T03, P02-T06, P04-T07 |
| Mobile billboard | Vehicle, dates, rotating slot duration/plays, published route and permitted custom route | No live GPS; custom route requires owner permission and no overlapping approved vehicle booking | P02/P04; P02-T03, P02-T06, P04-T03 |
| Notifications/support | In-app/email/SMS payment, decision, refund and scheduled-start updates; booking-linked tickets | Tickets replace live chat; owners get no raw request inbox; scheduled window is not observed playback | P03 infrastructure; actual events in P04-P06; P03-T06, P03-T10, P06-T04 |

Owner listing is explicitly P02: onboarding, admin verification, owner inventory dashboard, category forms, initial base price, media, service promises, publication and suspension. P03 reads those same approved records for public discovery.

UI references guide layout, color, cards, maps and dashboards. Sample counts/prices/brand claims are not launch evidence. Save/Compare/Enquire controls must map to an agreed implemented flow or be omitted; no dead reference-only buttons.

## 2. Preserved corrections and integration coverage

| Reviewed issue | Current requirement | Validation |
| --- | --- | --- |
| Separate payment order could be created per item | One Razorpay order per submitted cart with internal allocations | P05-T01, P05-T05 |
| Notice could restart at admin approval | Payment +192-hour initial notice and +168-hour cutoff; never reapply notice at approval | P04-T06, P05-T06 |
| Booking/cancellation units unclear | Explicit dated units, whole-line atomic decisions and selected whole-line cancellation | Plan 3.6; P04-T07 |
| Quote expiry/late capture unclear | Immutable accepted snapshot; preserve money and manual exception task for invalid late capture | P05-T06 |
| Listing fields and downloads implicit | Explicit details/calendar and account-scoped immutable receipts | P03-T05, P05-T05 |
| Live/completed could imply playback observation | Scheduled window, owner claim and admin verification remain separate | P03-T10, P06-T05 |
| Manual transaction records could duplicate grouped money or imply bank control | One external transaction with balanced allocations; erroneous outside-bank transfers are auditable exceptions | P05-T05, P06-T06, P06-T10 |
| Media/evidence contract implicit | Validated paid asset version and scoped unit-linked service evidence | P02-T06, P06-T05 |
| Restore could lose manual money history | Reconcile external manual transactions before acting on restored pending tasks | P07-T05 |
| Fewer phase documents could lose scenarios or defer all testing | All 59 original scenarios retained, with downstream-dependent wording clarified; seven integration tests added; current tests, affected regression and manual acceptance required every phase | [Migration map](phase-mapping.md); all seven handoffs |

## 3. Resolved business questions

1. **D07 - rejection/owner failure:** No penalty applies. Deduct actual applicable Razorpay processing charges from the affected payment and refund the remainder manually. Do not apply the advertiser's 5% cancellation fee to these outcomes.
2. **D01 - exact timing:** Service must start at least 192 hours after successful payment. Review/cancellation closes at 168 hours. Payment on 1 October at 10:00 IST therefore permits service from 9 October at 10:00, with the review deadline on 8 October at 10:00. Validate actual inventory operating/show starts.
3. **D06 - partial delivery:** Admin manually determines the refund assessment from evidence. The website records the assessment, charge breakdown, net refund and reason; it does not impose an automatic hours/plays formula.

These three policy questions are resolved. Their phase tests remain unexecuted, and operational/provider/design work remains. The latest explicit no-penalty answer supersedes the interim cancellation-fee/penalty wording.


## 4. Implementation and operational work by current phase

These remain planned work, not additional immediate business-policy questions:

- P01: include scope/design checkpoint, auth method/provider setup, admin MFA, India environment plan, pinned dependencies and shared schema/API/event contracts.
- P02: owner verification fields, inventory dashboard, approved service promises, creative limits and evidence/storage permissions.
- P03: public discovery, maps, notification/ticket infrastructure, SMTP/SMS configuration and real test delivery. Label booking/payment event fixtures.
- P04: integrate cart, booking/admin rules, actual inventory capacity and domain notifications using restricted payment fixtures.
- P05: connect real Razorpay sandbox checkout; verify receipts, actual charge allocations and manual refund references; repeat prior event and booking cases with real capture.
- P06: admin evidence review, manual partial-refund assessment, cancellation, owner transfer records and financial reconciliation.
- P07: measured startup cost/load targets, security/accessibility, India backup/restore/log checks, real listing/provider readiness, client acceptance and authorized production release.

Implement the confirmed timing, fees and manual-assessment rules. Any new proposal affecting business policy must be labeled and reviewed; restructuring does not reopen settled answers.

## 5. Verification and limits

There are seven active phase files, 59 preserved scenarios and seven additional integration cases: 66 planned validation cases total. The migration map pairs each original ID with a current ID. Historical files are archived, not counted as extra phases.

Documentation verification checks local links, IDs, preserved test text, plan/handoff wording, evidence placeholders, requirement/decision phase references and current versions. Application implementation: NOT STARTED. Application tests: NOT RUN. Client acceptance: NOT REVIEWED.

P01 design walkthroughs and timing/refund contracts are specification evidence, not booking implementation. P02 paid/approved commitment fixtures test inventory-domain invariants and must be rerun in P04/P05. P03 paid-line/event fixtures are not live booking evidence. P05 completed-service and partial-refund fixtures test ledger calculations and must be rerun in P06. P04 funding fixtures cannot satisfy P05's real sandbox gate. P07 hardening and client acceptance must pass before release. Passing document checks does not waive any of these distinctions.
