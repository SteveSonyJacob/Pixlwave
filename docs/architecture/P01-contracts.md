# P01 foundation and interface contracts

Version: 1.0 implementation draft. Updated: 2026-09-16. Authority: `plan.md` v1.0 and `docs/decisions.md` v0.9.

This document fixes Phase 1 interfaces without claiming that booking, payment, inventory, fulfillment or finance workflows already run. Their owning phases implement the transitions specified here.

## Product and design checkpoint

Pixlwave is an admin-managed marketplace for LED whole-day screens, theatre show slots and mobile rotating slots. The initial launch inventory is Kerala-only; users may live elsewhere. The interface is English, currency is INR represented as integer paise, business timestamps are stored as UTC and shown in IST.

The implemented shell follows the supplied references' bright white layout, blue/mint accents, prominent hero, cards and dashboard structure. It deliberately corrects reference claims that conflict with current policy: it does not say “instant booking,” “real-time availability,” observed playback or guaranteed reach. There are no dead Save, Compare or Enquire controls.

Reviewed future screens and required fields:

| Screen | Required contract | Owning phase |
| --- | --- | --- |
| LED owner form | First-party Kerala location, pin provenance, display dimensions/resolution, operating hours, inclusive dates/blackouts, whole-screen daily capacity, owner initial base day rate, approved duration/plays and media rules | P02 |
| Theatre owner form | Venue/auditorium, show instances and starts, slots per show, duration/plays, owner initial slot rate, operating calendar and media rules | P02 |
| Mobile owner form | Vehicle, rotating-slot capacity, dates/blackouts, published permitted route, duration/plays, owner initial slot rate and custom-route permission | P02 |
| Listing and discovery | Approved media, fixed published rate/unit, attributed audience estimate, date/show calendar, map pin/route, no guaranteed availability | P03 |
| Checkout | Explicit dated units, exact creative version, fixed rate revision, service terms, one frozen cart total and policy acknowledgement | P04-P05 |
| Advertiser campaign | Separate payment, review, capacity, fulfillment, refund and settlement presentation; paid status says “Payment received — awaiting admin confirmation” | P04-P06 |
| Admin review | Paid request queue, 168-hour due time, private coordination note, whole-line accept/reject, atomic capacity result and refund-task status | P04-P05 |
| Owner fulfillment | Only confirmed admin-authorized instructions and asset access; evidence submission for own service; no raw request queue or private notes | P04-P06 |

## Roles and least privilege

An Auth user represents one individual. Both advertiser and owner modes are enabled on that identity by default and mode switching changes the workspace only. Platform admin is a separate database grant, never user metadata or a selectable profile value. Active admins must complete authenticator TOTP MFA (AAL2) before privileged UI or RLS access.

| Capability | Advertiser | Owner | Admin at AAL2 |
| --- | :---: | :---: | :---: |
| Update own profile / switch mode | Yes | Yes | Yes |
| Browse marketplace | Yes | Yes | Yes |
| Build cart / see own campaigns | Yes | No | Yes |
| Manage own listing drafts | No | Yes | Yes |
| See admin-authorized confirmed fulfillment | No | Own only | Yes |
| Receive raw customer request queue | No | **Never** | Yes |
| Read private admin coordination notes | No | **Never** | Yes |
| Accept/reject a booking | No | **Never** | Yes |
| Change a published rate | No | **Never** | Yes, after owner discussion |
| Grant platform admin | No | **Never** | Restricted operational command |

The code contract is `src/lib/domain/access.ts`. Database enforcement is in `supabase/migrations/202609150001_foundation_accounts.sql`. Future privileged policies must call `public.is_admin_aal2()`, not trust `user_metadata`, profile mode or a client-provided role.

## Authentication choice

- Primary email method: verified email plus password. Recovery uses a single-use PKCE callback and a new password of at least 12 characters.
- Alternate sign-in: Google OAuth through Supabase Auth. The browser starts the PKCE authorization flow and the server callback exchanges the returned code for the application session. Phone OTP stays disabled unless a later client decision selects a TRAI DLT-compliant provider.
- Verified linking: Supabase handles verified OAuth/email identity linking. A signed-in user may link a phone only if phone authentication is later enabled. Real duplicate/linking cases remain a provider acceptance check.
- Sessions: SSR cookies with refresh-token rotation, one-hour JWT/session configuration and local-scope logout. Supabase project policy is the authority for session expiry.
- Admin: separately provisioned database row plus TOTP MFA. A role grant alone is insufficient for the admin console.

Selected providers are Resend SMTP for Auth email and Google OAuth for alternate sign-in. Google client credentials are stored in Supabase Auth, never in this application. Resend Auth delivery was verified in P01; application API delivery is a separate P03 gate. Values in `.env.example` are names, never credentials.

## Charged cart and line contract

A submitted cart is an immutable snapshot containing one or more request lines. Membership, price, creative version and service terms freeze before one Razorpay order is created for the summed amount. A failed attempt may retry the same valid snapshot idempotently; editing or adding requires a new snapshot. Payment success funds every line but reserves none.

Each `PaidLineSnapshot` identifies exactly one listing and owner, one creative version, one published rate revision, explicit unit allocations and a paise total. LED lines contain inclusive dated daily units; theatre lines contain show instances and slot quantities; mobile lines contain vehicle/date/rotating-slot/route terms. Admin accepts or rejects the whole line. Partial silent shortening and post-payment repricing are forbidden.

Owner supplies the initial base price in P02. Admin controls publication and all later published changes after an owner discussion, with old/new amount, administrator, note, reason and effective time. A still-valid accepted quote may be honored; otherwise the customer sees and accepts a fresh quote. A paid line never changes.

## Separate state model

Payment, review, capacity, fulfillment, refund and settlement are orthogonal fields, defined in `src/lib/domain/states.ts`. Examples:

- A successfully paid, undecided line is `payment=succeeded`, `review=paid_awaiting_admin`, `capacity=unreserved`, `refund=null`, `settlement=ineligible`.
- A rejected line remains `review=rejected` while `refund=pending_admin`; creating the task does not move money.
- An accepted line is `review=accepted` and `capacity=approved_reserved`; elapsed time can move fulfillment into the service window but cannot prove playback.
- Admin verification may make a completed service eligible for settlement review; no timer or payment event settles it.

There is no owner approval, dynamic pricing, post-approval checkout, payment countdown, pause/resume, in-place campaign change, fixed 48-hour completion window, live GPS or automated refund/payout state.

## Timing contract and dated examples

Both clocks start from the trusted successful capture timestamp. Store UTC and display the full IST instant; never round to a date or restart at approval.

Payment at **1 October 2026, 10:00:00 IST** (`2026-10-01T04:30:00Z`) produces:

- Review/cancellation cutoff: **8 October 2026, 10:00:00 IST** (`+168h`). An action at `09:59:59.999` is inside; at exactly `10:00:00.000` it is closed.
- Earliest operating/show start: **9 October 2026, 10:00:00 IST** (`+192h`). An LED operating day or theatre show before that instant is ineligible; exactly that instant is allowed.
- An undecided line at the 168-hour instant transitions once to rejected and creates one `pending_admin` refund obligation. A delayed worker may catch up, but late approval remains forbidden. No job calls a refund API.
- A cancellation recorded before cutoff remains eligible even if the admin completes its manual refund later.

The executable contract is `src/lib/domain/policy.ts` and its boundary tests.

## Refund and settlement eligibility

| Outcome | Calculation | Execution |
| --- | --- | --- |
| Advertiser cancels a selected whole line before `+168h` | Refund 95%; Pixlwave retains 5% inclusive of processing cost; round fee once per line, half up | Create manual task; admin records completion later |
| Admin rejection or deadline rejection | Refund line value less its actual allocated Razorpay cost; no penalty or 5% fee | Create manual task; admin performs and records it |
| Owner inability/non-delivery, including after day seven | Refund affected paid value less applicable actual allocated Razorpay cost; no penalty | Evidence and admin assessment; manual completion |
| Partial delivery | Admin enters gross service adjustment, evidence, actual applicable cost and net refund; no automatic hours/plays formula | Audited manual assessment and completion |
| Completed service | Owner 85%; Pixlwave gross 15%; gateway cost reduces Pixlwave share only | Admin verifies service, transfers manually and records bank reference |

For ₹10,000 completed service: owner ₹8,500 / gross Pixlwave ₹1,500. For timely advertiser cancellation: refund ₹9,500 / retain ₹500. For rejection/owner failure, deduct the actual allocated gateway cost once and refund the rest. Cumulative allocations cannot exceed the paid line.

## API, RPC and event boundaries

Implemented in P01:

- `GET /api/health`: returns `200` only when the full runtime/provider/India-region configuration validates; otherwise a redacted `503` field list.
- Supabase Auth APIs: password sign-up/sign-in/recovery/update, SMS OTP, verified phone change, logout and TOTP MFA.
- `public.select_account_mode(requested_mode)`: authenticated self-only mode switch.
- Profiles/admin grants: RLS-protected tables. Admin grant/suspension is an operational service-role command with an append-only audit entry.
- Durable `outbox_events`: service-only queue with a unique dedupe key, retry limit, backoff, stale-lock recovery and append-only audit companion. The worker supports only `foundation.healthcheck` now.

Reserved shared event envelope for owning phases:

```json
{
  "id": "uuid",
  "topic": "booking.review_due",
  "aggregateType": "booking_line",
  "aggregateId": "uuid",
  "occurredAt": "UTC ISO-8601",
  "schemaVersion": 1,
  "dedupeKey": "booking-line:<id>:review-due:v1",
  "payload": {}
}
```

Future domain transactions insert an event in the same database transaction as the state change. Consumers deduplicate by `dedupeKey`. Topics planned for P03-P06 include `payment.captured`, `booking.review_due`, `booking.accepted`, `booking.rejected`, `refund.task_created`, `fulfillment.instructions_released` and `settlement.eligible`. Events may notify or schedule; none authorizes or executes a refund or bank transfer.

## Provider, data and deployment plan

| Boundary | Selected foundation | Data/location rule |
| --- | --- | --- |
| App and worker | Next.js Node server plus separate durable worker on AWS Mumbai (`ap-south-1`) | Application logs and runtime in India |
| Identity/database | Supabase specific South Asia (Mumbai) region | Primary auth/profile/application data in Mumbai; RLS enabled |
| Files | Private Supabase Storage in the Mumbai project initially; public listing media separated | First-party creatives/evidence remain private; backup of objects is separate from DB backup |
| Backups/logs | India-region logical backups/object copies and CloudWatch Mumbai log groups | Restore location must also be India; no secrets or raw OTPs in logs |
| Email | Resend SMTP for Supabase Auth; Resend API for application notifications | Normal external recipients allowed; document transit/subprocessors and webhook handling |
| SMS/Auth OTP | Twilio supported Supabase provider | External provider processing is documented; TRAI DLT/sender setup required |
| Maps | Mappls primary, Google fallback adapter | Store first-party coordinates/locality/route and provider provenance separately from provider place IDs |
| Payments | Razorpay collection adapter | No refund or payout execution method in the adapter; P05 validates capture |

Runtime validation fixes compute, database, first-party object storage, backups and logs to `ap-south-1`. Region selection is a control, not a broad compliance claim. Supabase database backups do not restore deleted Storage objects, so P07 must test a separate object-backup procedure.

## Startup cost worksheet

No client budget or traffic forecast exists (D12), so this is an illustrative September 2026 low-load planning baseline, not a quote or SLA:

- Supabase Pro: listed at USD 25/month with one Micro compute credit and seven-day daily database backups.
- One AWS Lightsail 2 GB public-IPv4 app/worker host: listed at USD 12/month before region-specific transfer differences. Separate app/worker hosts improve isolation and add another bundle.
- Baseline single-host infrastructure indication: **USD 37/month**, before staging, snapshots, object copies/egress, monitoring, domain/TLS extras, media growth, Mappls/Google usage, Razorpay fees, SES email and SMS.
- Amazon SES is usage-based; Twilio India lists per-segment outbound pricing and notes rates/carrier fees may change. SMS volume, DLT registration and fraud controls can dominate low-volume infrastructure cost.

Before P07, replace this worksheet with measured listing/media volume, concurrent traffic, backup targets, real vendor quotes and named operational capacity. Sources: [Supabase pricing](https://supabase.com/pricing), [Lightsail pricing](https://aws.amazon.com/lightsail/pricing/), [SES pricing](https://aws.amazon.com/ses/pricing/), [Twilio India SMS pricing](https://www.twilio.com/en-us/sms/pricing/in), [Supabase Mumbai region](https://supabase.com/docs/guides/platform/regions), [Supabase phone login](https://supabase.com/docs/guides/auth/phone-login).

## Media foundation contract

P01 supplies only the storage adapter boundary. P02 must fix per-category MIME types, maximum sizes, dimensions/aspect ratios, video duration/codecs, malware scan/quarantine process, retention, signed URL expiry and evidence scope before accepting uploads. Browser filenames and MIME declarations are untrusted. Paid requests attach the exact scanned object version; replacement after payment is not allowed.
