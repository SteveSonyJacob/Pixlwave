# P02 inventory management contracts

Version: 1.0 implementation draft. Updated: 2026-09-17. Authority: `plan.md` v1.0 and `docs/decisions.md` v0.9.

Phase 2 adds one inventory source of truth to the P01 account foundation. Owner mode is still not an administrative role. Owners submit identity evidence, create and edit their own draft or rejected inventory, and submit it for review. An AAL2 platform administrator approves or rejects owner verification, publishes or rejects listings, suspends live inventory and alone creates later published-rate revisions.

## Records and state

- `owner_verifications` keeps draft/submitted/approved/rejected/suspended review state and private document references.
- `inventory_listings` models LED, theatre and mobile inventory in Kerala. Shared fields hold first-party coordinates, provider provenance, audience attribution, operating hours, duration, plays, service promise and the owner base rate.
- `listing_blackouts` and `theatre_show_instances` are real dated capacity inputs. LED capacity is exactly one whole screen per day; theatre `slots_total` and mobile `rotatingSlots` are explicit shared capacities.
- `listing_rate_revisions` is append-only application history. Initial publication records `initial_owner`; later revisions require AAL2 admin, owner-discussion notes, reason, amount and effective time.
- `approved_service_snapshot` freezes the terms an admin approved. P04 copies this and the selected rate revision into its paid-line fixture and P05 reruns it with Razorpay-funded lines. Editing the live listing never mutates a copied snapshot.
- `published_inventory` is the narrow public projection. Base tables, owner UUIDs, verification data, rate discussion notes and private assets are not exposed to anonymous callers.

Database mutation RPCs authorize every call again and apply per-actor rate limits. Draft creation requires approved owner verification. Owners can edit only draft/rejected rows and cannot publish, suspend or change a published rate. Privileged review functions call `is_admin_aal2()` and append to `audit_log`.

## Category contracts

| Category | Rate/capacity unit | Required details |
| --- | --- | --- |
| LED/digital | one whole screen per day | creative resolution, physical dimensions, operating hours, duration and plays; daily capacity fixed to one |
| Theatre | a quantity of slots in an explicit show | venue, auditorium, dated show start, slots per show, duration and plays per show |
| Mobile | a rotating slot on a vehicle-day | vehicle label, rotating-slot count, published GeoJSON route, duration and plays; owner opt-in for custom routes |

`src/lib/inventory/domain.ts` validates Kerala bounds, the 14 launch districts, operating-time order, rate limits, service values and category details. It also provides executable fixture rules for blackout overlap, shared slot capacity, custom-route compatibility, creative compatibility and immutable paid-service snapshots. A custom mobile route is compatible only when no approved booking overlaps; shared bookings must use the committed published route. Paid-pending requests are deliberately absent from these capacity fixtures because they reserve nothing.

## Location contract

The owner form calls a server-only Mappls search endpoint. Results outside the broad Kerala boundary are discarded. When Mappls fails, the adapter tries Google geocoding. First-party latitude, longitude, locality, district and provider provenance are stored in PostgreSQL; raw provider payloads are not retained. If neither provider is configured, a verified manual Kerala pin remains possible and the UI reports the provider failure rather than inventing a result.

Runtime names are `MAPPLS_SEARCH_URL`, `MAPPLS_ACCESS_TOKEN` and `GOOGLE_GEOCODING_API_KEY`. Real quotas, commercial terms, key restrictions and representative Kerala accuracy remain provider/manual acceptance gates.

## Private media contract

The private upload route authenticates the caller, enforces purpose, reads file bytes, rejects MIME spoofing/corruption, calculates SHA-256, reads PNG/JPEG dimensions, checks the EICAR test signature, stores the object in a private Supabase bucket and writes immutable metadata. Owner documents accept PDF/PNG/JPEG up to 10 MB. Creatives accept PNG/JPEG/MP4/WebM up to 50 MB. Owner-document retention is initially 180 days; unattached creative retention is initially 365 days. Final legal retention remains a launch review item.

Only the uploader or an AAL2 admin can read metadata. A clean asset receives a five-minute signed download URL after a fresh authorization check. Storage object keys contain the uploader UUID and a random UUID, never an untrusted path. Cross-account object reads fail at the metadata RLS boundary.

The built-in scanner is intentionally named `pixlwave-signature-and-eicar-v1`; it is useful application validation, not a claim of full production malware detection. Video resolution, duration and codec extraction and a production malware engine must be configured before checkout can accept video. `creativeFitsListing` already enforces exact approved duration, minimum resolution and aspect compatibility for the P04 checkout boundary.

## API and UI

- `GET /api/inventory/published`: safe all-category records with fixed current rate; optional category/district filters; explicitly says availability is confirmed only at admin approval.
- `GET /api/maps/search?q=`: authenticated Mappls-first Kerala place search with Google fallback and truthful provider failure.
- `POST /api/media/upload`: authenticated multipart private upload, signature validation, scan metadata and quarantine-compatible state.
- `GET /api/media/:id/preview` and `/download`: authorization-scoped five-minute safe preview or private download; owner-verification documents cannot use the creative preview route.
- `/owner`: verification, inventory states and submission; it retains the explicit no-customer-request boundary.
- `/owner/listings/new` and `/owner/listings/:id/edit`: category forms, pin provenance, service/capacity and calendar inputs.
- `/admin`: AAL2 owner/listing queues, private evidence links, publication/rejection, rate revisions and suspension.
- `/advertiser/creative`: private creative versions. Public inventory discovery remains P03.

No Phase 2 route accepts a booking, reserves capacity, moves money, exposes raw advertiser requests to owners or implements dynamic pricing.
