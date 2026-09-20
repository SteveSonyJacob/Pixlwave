# P03 discovery and communication contracts

Version: 0.1 implementation draft. Updated: 2026-09-19. Authority: `plan.md` and `docs/decisions.md`.

Phase 3 reads the P02 `published_inventory` projection rather than copying owner inventory. Search cards, details and quotes therefore use the same admin-published rate revision and service values. Anonymous callers may read only published inventory, its clean listing-media metadata, blackouts and future theatre shows. Storage objects remain private and are exposed through short-lived signed URLs after the route verifies that both the listing and media are public.

## Quote contract

`quote_snapshots` is an immutable pre-payment record owned by an authenticated advertiser. `create_quote_snapshot` accepts only explicit units: LED dates, theatre show IDs plus slot quantities, or mobile dates plus rotating-slot quantities. It rejects past/blackout dates and quantities above published capacity, then copies the current rate revision, unit price, approved service and listing labels. A quote expires after 30 minutes and reserves no inventory.

`quote_snapshot_is_current` requires all three conditions: the quote is unexpired, the listing remains published, and its current rate revision still matches the quoted revision. A later admin rate change never edits an existing quote; the UI requires a fresh visible quote instead. P04/P05 must copy the accepted quote into their booking/paid-line record and rerun this contract with funded fixtures.

## Discovery and media contract

- The homepage shows up to three current featured placements from the public projection. `/discover` filters that projection by format, Kerala district, budget, text and non-blackout date, with loading and unavailable states.
- `/media/:id` displays published price unit, service promise, category fields, owner-attributed audience estimate, calendar inputs, coordinates and clean listing imagery. Its 28-day IST calendar marks blackouts and, for theatres, published show dates; every state remains provisional until a later administrator decision.
- `listing_media` files accept PNG/JPEG only and can be attached only while the owner listing is draft or rejected. Publication makes clean attached media discoverable; a published owner cannot silently replace it.
- Availability remains provisional. Search, details and quotes do not claim reservation or live capacity.
- Current coordinate presentation is first-party data. Mappls markers, clustering and mobile route rendering remain an open provider/UI deliverable.

## Support and notification contract

`support_tickets` has `open`, `in_progress`, `resolved` and `closed` states. Requesters see only their tickets and non-internal replies. AAL2 administrators may see the queue, add customer-visible replies, add private internal notes and change status. Owners receive no raw advertiser request or private support data. Booking references are nullable until P04 supplies real booking IDs.

Ticket attachments are private `private_media_assets` with purpose `support_attachment` and a required `support_ticket_id`. Requesters upload only PDF, PNG or JPEG files up to 10 MB until the ticket is closed; signature validation and scan status must be clean before a five-minute signed download is issued. The requester and AAL2 administrators are the only readers. Closing a ticket records a retention deadline of 180 days; an operations cleanup job must remove expired storage objects.

`notification_deliveries` is a per-recipient/per-channel idempotent ledger. In-app support events are implemented. Its status is presentation/delivery state only and cannot extend a review deadline or change booking/campaign state. Template fixtures cover payment, review deadline, decision, cancellation, refund, scheduled start and support language. The scheduled-start template explicitly does not claim observed playback or verified completion.

Resend is the selected provider. Supabase auth SMTP and transactional application delivery remain separate concerns: Supabase uses the already verified Resend SMTP configuration, while the durable Pixlwave worker uses the Resend Email API. Each email delivery has a stable delivery-ID idempotency key; signed Resend webhooks update sent/delivered/bounced/failed/suppressed state without changing ticket, booking or campaign state. The API key and webhook signing secret are server-only. SMS remains optional/deferred unless TRAI DLT is approved.

## Access boundaries

All mutable operations use security-definer RPCs that re-check `auth.uid()` or `is_admin_aal2()`. Tables grant authenticated users read access only through RLS; mutation grants remain unavailable. Audit entries record quote creation and ticket actions without message bodies, secrets or personal contact values.
