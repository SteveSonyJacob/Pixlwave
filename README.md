# Pixlwave

Pixlwave is a Next.js marketplace for advertising inventory in Kerala. Mapping uses OpenStreetMap data rendered with MapLibre GL JS, with no browser API key required.

## Local setup

1. Copy `.env.example` to `.env` and add the Supabase values for the target environment.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.

The owner listing form provides explicit address search, click-to-place and draggable pins. Public inventory is available on `/map`, with category and district filters, clustered markers and mobile-route overlays.

## Map configuration

- `NEXT_PUBLIC_OSM_TILE_URL` controls the raster tile template used by MapLibre.
- `OSM_NOMINATIM_URL` controls the geocoding search endpoint.
- `MAPS_CONTACT_EMAIL` is optional and identifies requests to compatible Nominatim services.
- `MAPS_PRIMARY_PROVIDER` must be `openstreetmap`.

The defaults use the community OpenStreetMap tile server and public Nominatim instance. They require visible attribution and compliance with the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/). Pixlwave limits geocoding to explicit searches, serializes public Nominatim requests and caches results in-process. For sustained production traffic, point the same environment variables at a suitable hosted or self-hosted OSM-derived service.

Apply `supabase/migrations/202609190001_openstreetmap_provider.sql` before editing existing listings. It converts legacy provider values and constrains new values to `openstreetmap` or `manual`.

## Verification

```text
npm test
npm run lint
npm run build
```

`npm run worker` processes durable notification delivery, checks booking review reminders/deadlines each minute, and performs support-attachment retention cleanup at most once every seven days using database-backed state. Deadline expiry rejects still-pending lines and creates manual refund obligations; it never sends money. `npm run media:cleanup` forces a single cleanup cycle for an operations check and resets the next weekly run; it exits unsuccessfully if any object deletion fails. Apply all migrations before starting either command.

Phase 4 adds `/cart`, `/bookings` and the MFA-protected `/admin/bookings` queue. Browser payment intentionally remains unavailable until Phase 5. For Phase 4 acceptance only, `npm run fixture:fund-cart -- <cart-uuid> [captured-at-iso]` can cross the trusted payment boundary when `P04_FIXTURE_FUNDING_ENABLED=true`; both the command and database function refuse fixture funding unless the database name contains `test`.

The pre-development and pre-build hooks copy MapLibre's CSP-friendly worker files into `public/maplibre`.
