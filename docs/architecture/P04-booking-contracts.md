# P04 booking contracts

Updated: 2026-09-22. This is the implemented interface that Phase 5 extends; it is not database/provider acceptance evidence.

## State and authority

- Cart: `open → submitted → paid_review → partially_decided|decided`. Only `open` accepts line additions/removals. Submission rechecks quote expiry, listing publication and rate revision, then stores the earliest quote expiry as the checkout deadline.
- Line: `draft → paid_pending → approved|rejected|deadline_rejected|payment_ineligible|cancelled`. Different lines in one payment move independently. No decision changes the captured line amount.
- Capacity: absent while paid-pending; active only after the whole approval transaction inserts every requested allocation. Cancellation marks only that line's active allocations released.
- Refund: rejection, payment ineligibility and timely advertiser cancellation create one `pending_manual` obligation per line. No Phase 4 function performs or marks an external refund.

Authenticated advertiser RPCs are `add_quote_to_cart`, `remove_open_cart_line`, `submit_booking_cart` and `cancel_booking_line`. `decide_booking_line` and `add_booking_admin_note` require an AAL2 platform admin inside the function. `record_trusted_cart_payment`, reminder and expiry functions are granted only to `service_role`.

## Trusted payment-success input

`record_trusted_cart_payment(cart UUID, external_reference TEXT, captured_at TIMESTAMPTZ, adapter TEXT)` is the only funded-review boundary. It is idempotent for the same cart/reference/capture tuple and rejects an alternate transition. Phase 5 must call it only after server-side Razorpay signature/event verification; browser success is never sufficient.

The function always records validly trusted customer money. It then evaluates the accepted checkout expiry and every actual service-start instant against `captured_at + 192 hours`. Ineligible lines become `payment_ineligible` and receive full manual refund obligations instead of entering admin review. Eligible lines become `paid_pending`, with `decision_due_at = captured_at + 168 hours`, and receive no allocation.

The `p04_fixture` adapter additionally requires `app.p04_fixture_funding=enabled` inside the transaction and a database name containing `test`. There is no browser/API route to it.

## Immutable snapshots and allocation keys

Each line copies the quote price/listing snapshot, approved service terms, explicit units, resolved service starts and exact clean creative metadata/hash. A database trigger rejects changes to those fields and rejects deletion after the cart leaves `open`.

- LED allocation key: `date:YYYY-MM-DD`, capacity 1, amount equals the frozen daily unit price.
- Theatre allocation key: `show:<show-instance-uuid>`, quantity and capacity are frozen from the selected show, amount equals unit price × quantity.
- Mobile allocation key: `date:YYYY-MM-DD`, quantity/capacity and route snapshot are recorded, amount equals unit price × quantity.

Approval takes canonical advisory locks for every line key, checks all capacity/route constraints, and inserts all allocations in one transaction. A custom mobile route requires zero active allocations for every selected vehicle/date. When an active custom route exists, a later shared line can be approved only with exactly that committed route.

## Events and notifications

Append-only `booking_events` record submission, trusted capture, approval/rejection, payment ineligibility, deadline rejection, cancellation and private-note audit references. P03 notification templates are emitted with stable per-line/cart keys: `payment.received`, `review.due`, `review.overdue_rejected`, `booking.decision`, `booking.cancelled` and `refund.pending_manual`. No booking or private coordination event is routed to an owner.

The worker calls `send_booking_review_reminders` and `expire_booking_review_deadlines` each minute. Expiry uses `FOR UPDATE SKIP LOCKED`; an admin approval request at/after the deadline becomes a deadline rejection even if the worker has not run yet.
