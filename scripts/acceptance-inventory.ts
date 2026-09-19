import { randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResult } from "pg";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";
import { readServerEnv } from "../src/lib/config/env";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function asUser(client: PoolClient, userId: string, aal: "aal1" | "aal2", sql: string, values: unknown[] = []): Promise<QueryResult> {
  await client.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [userId, JSON.stringify({ sub: userId, aal })]);
  await client.query("set local role authenticated");
  try {
    const result = await client.query(sql, values);
    await client.query("reset role");
    return result;
  } catch (error) {
    try { await client.query("reset role"); } catch { /* the caller restores its savepoint */ }
    throw error;
  }
}

async function expectDenied(client: PoolClient, label: string, userId: string, aal: "aal1" | "aal2", sql: string, values: unknown[]) {
  await client.query("savepoint expected_denial");
  let denied = false;
  try {
    await asUser(client, userId, aal, sql, values);
  } catch {
    await client.query("rollback to savepoint expected_denial");
    await client.query("reset role");
    denied = true;
  }
  if (!denied) { await client.query("rollback to savepoint expected_denial"); throw new Error(`${label}: mutation unexpectedly succeeded.`); }
}

function listing(category: "led" | "theatre" | "mobile") {
  const shared = {
    category, title: `[Sample] ${category} acceptance inventory`, description: "A transactionally rolled-back Phase 2 acceptance listing for Kerala inventory.",
    locality: "Kochi", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999, sourceProvider: "manual", sourcePlaceId: `acceptance-${category}`,
    audienceEstimate: 1000, audienceBasis: "Owner-attributed acceptance estimate, not a public reach guarantee.", adDurationSeconds: 10, playsPerUnit: 60,
    operatingStart: "09:00", operatingEnd: "21:00", baseRatePaise: 1000000, servicePromise: "Deliver the approved creative for every explicitly contracted unit and provide evidence.", blackouts: []
  };
  if (category === "led") return { ...shared, categoryDetails: { screenWidthPx: 1920, screenHeightPx: 1080, physicalWidthMetres: 6, physicalHeightMetres: 3.4, dailyCapacity: 1 } };
  if (category === "theatre") return { ...shared, categoryDetails: { venueName: "Acceptance Cinema", auditoriumName: "Screen 1", slotsPerShow: 4, showStarts: ["2026-10-20T18:30:00+05:30"] } };
  return { ...shared, categoryDetails: { vehicleLabel: "Acceptance Vehicle", rotatingSlots: 5, routeName: "Kochi test route", routeGeoJson: "{\"type\":\"LineString\",\"coordinates\":[[76.27,9.97],[76.30,10.01]]}", customRouteAllowed: true } };
}

async function main() {
  loadLocalEnvFile();
  const env = readServerEnv();
  assert(env.APP_ENV !== "production", "Inventory acceptance must never run in production.");
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1, application_name: "pixlwave-inventory-acceptance" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const users = await client.query("select id,email from auth.users where email in ('owner@pixlwave.test','advertiser@pixlwave.test','admin@pixlwave.test')");
    const id = (email: string) => users.rows.find((row) => row.email === email)?.id as string | undefined;
    const ownerId = id("owner@pixlwave.test"); const advertiserId = id("advertiser@pixlwave.test"); const adminId = id("admin@pixlwave.test");
    assert(ownerId && advertiserId && adminId, "Run npm run seed:auth first; owner, advertiser and admin fixtures are required.");
    const existing = await client.query("select count(*)::int as count from public.inventory_listings where owner_id=$1", [ownerId]);
    assert(existing.rows[0].count === 0, "Fixture owner already has inventory; use a clean fixture before running rollback acceptance.");
    await client.query("delete from public.owner_verifications where owner_id=$1", [ownerId]);
    const assetId = randomUUID();
    await client.query(`insert into public.private_media_assets(id,uploader_id,purpose,object_key,original_name,declared_mime,detected_mime,byte_size,sha256,scan_status,scan_engine,scan_completed_at,retention_until)
      values ($1,$2,'owner_verification',$3,'acceptance.pdf','application/pdf','application/pdf',100,$4,'clean','acceptance-fixture',now(),now()+interval '1 day')`, [assetId, ownerId, `${ownerId}/acceptance/${assetId}.pdf`, "b".repeat(64)]);
    await asUser(client, ownerId, "aal1", "select public.submit_owner_verification($1::jsonb)", [JSON.stringify({ legalName: "Acceptance Owner", businessType: "Company", registrationLast4: "A123", contactPhone: "+919876543210", address: "Kochi, Kerala, India", documentAssetIds: [assetId] })]);
    await asUser(client, adminId, "aal2", "select public.review_owner_verification($1,'approved',null)", [ownerId]);
    await expectDenied(client, "unverified owner", advertiserId, "aal1", "select public.create_inventory_listing($1::jsonb)", [JSON.stringify(listing("led"))]);
    await expectDenied(client, "invalid category details", ownerId, "aal1", "select public.create_inventory_listing($1::jsonb)", [JSON.stringify({ ...listing("led"), categoryDetails: {} })]);
    const listingIds: string[] = [];
    for (const category of ["led", "theatre", "mobile"] as const) {
      const created = await asUser(client, ownerId, "aal1", "select (public.create_inventory_listing($1::jsonb)).id", [JSON.stringify(listing(category))]);
      const listingId = created.rows[0]?.id as string;
      assert(listingId, `${category}: creation failed`);
      listingIds.push(listingId);
      await asUser(client, ownerId, "aal1", "select public.submit_inventory_listing($1)", [listingId]);
      await asUser(client, adminId, "aal2", "select public.review_inventory_listing($1,'published',null)", [listingId]);
    }
    const published = await client.query("select category,amount_paise from public.published_inventory where id=any($1::uuid[]) order by category", [listingIds]);
    assert(published.rowCount === 3, "All three categories were not published through the shared projection.");
    await expectDenied(client, "owner published-rate change", ownerId, "aal1", "select public.change_published_rate($1,1250000,'Unauthorized owner attempt','Acceptance denial')", [listingIds[0]]);
    await asUser(client, adminId, "aal2", "select public.change_published_rate($1,1250000,'Discussed with acceptance owner','Acceptance revision')", [listingIds[0]]);
    const revised = await client.query("select amount_paise from public.published_inventory where id=$1", [listingIds[0]]);
    assert(Number(revised.rows[0]?.amount_paise) === 1250000, "Admin rate revision was not published.");
    const crossAccountMedia = await asUser(client, advertiserId, "aal1", "select id from public.private_media_assets where id=$1", [assetId]);
    assert(crossAccountMedia.rowCount === 0, "Cross-account private media was visible.");
    await client.query("rollback");
    console.log("P02 inventory acceptance PASS: unverified/invalid-category denial, owner verification, three categories, admin publication/rate control, public projection and private-media RLS. Transaction rolled back.");
  } catch (error) {
    try { await client.query("rollback"); } catch { /* retain original error */ }
    throw error;
  } finally { client.release(); await pool.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
