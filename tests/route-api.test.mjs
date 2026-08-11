import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { after, before, test } from "node:test";

const port = 4197;
const origin = `http://localhost:${port}`;
const headers = {
  "oai-authenticated-user-id": "route-renter",
  "oai-authenticated-user-email": "route-renter@example.test",
};
let server;

function wrangler(...args) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", ...args],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch (error) {
      if (Date.now() >= deadline) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("DariRent test server did not become ready");
}

before(async () => {
  wrangler("d1", "migrations", "apply", "site-creator-d1", "--local", "--config", "wrangler.test.jsonc");
  wrangler("d1", "execute", "site-creator-d1", "--local", "--config", "wrangler.test.jsonc", "--file", "tests/fixtures/route-seed.sql");
  server = spawn(
    process.execPath,
    ["node_modules/vinext/dist/cli.js", "dev", "--port", String(port)],
    { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", () => undefined);
  server.stderr.on("data", () => undefined);
  await waitForServer();
});

after(async () => {
  if (!server || server.killed) return;
  server.kill();
  await new Promise((resolve) => {
    server.once("exit", resolve);
    setTimeout(resolve, 3_000);
  });
});

test("POST /api/contact blocks preview listings and owners without a phone", async () => {
  for (const propertyId of ["preview-ain-zaghouan", "route-no-phone"]) {
    const response = await fetch(`${origin}/api/contact`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ propertyId, locale: "en" }),
    });
    assert.equal(response.status, 409);
  }
});

test("PATCH /api/properties/:id rejects a renter editing another owner's listing", async () => {
  const response = await fetch(`${origin}/api/properties/route-owned`, {
    method: "PATCH",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized edit" }),
  });
  assert.equal(response.status, 403);
});

test("admin operations show alert configuration only to administrators", async () => {
  const adminHeaders = {
    "oai-authenticated-user-id": "route-admin",
    "oai-authenticated-user-email": "route-admin@example.test",
  };
  const adminResponse = await fetch(`${origin}/admin/verifications`, { headers: adminHeaders });
  assert.equal(adminResponse.status, 200);
  assert.match(await adminResponse.text(), /Email alerts:.*not configured/);

  const renterResponse = await fetch(`${origin}/admin/verifications`, { headers });
  assert.equal(renterResponse.status, 200);
  const renterBody = await renterResponse.text();
  assert.match(renterBody, /Admin access required/);
  assert.doesNotMatch(renterBody, /RESEND_API_KEY/);
});

test("POST /api/properties/:id/images rejects excessive, non-image, and oversized uploads", async () => {
  const ownerHeaders = {
    "oai-authenticated-user-id": "route-owner",
    "oai-authenticated-user-email": "route-owner@example.test",
  };
  const excessive = new FormData();
  for (let index = 0; index < 13; index += 1) {
    excessive.append("images", new File([new Uint8Array([137, 80, 78, 71])], `${index}.png`, { type: "image/png" }));
  }
  const excessiveResponse = await fetch(`${origin}/api/properties/route-owned/images`, {
    method: "POST",
    headers: ownerHeaders,
    body: excessive,
  });
  assert.equal(excessiveResponse.status, 400);

  const nonImage = new FormData();
  nonImage.append("images", new File(["not an image"], "notes.txt", { type: "text/plain" }));
  const nonImageResponse = await fetch(`${origin}/api/properties/route-owned/images`, {
    method: "POST",
    headers: ownerHeaders,
    body: nonImage,
  });
  assert.equal(nonImageResponse.status, 400);

  const oversized = new FormData();
  oversized.append("images", new File([new Uint8Array(8_000_001)], "large.png", { type: "image/png" }));
  const oversizedResponse = await fetch(`${origin}/api/properties/route-owned/images`, {
    method: "POST",
    headers: ownerHeaders,
    body: oversized,
  });
  assert.ok([400, 413].includes(oversizedResponse.status), `expected an upload rejection, received ${oversizedResponse.status}`);
});

test("owner verification, comps scoring, alerts, localized contact, and view counts work end to end", async () => {
  const ownerHeaders = {
    "oai-authenticated-user-id": "route-owner",
    "oai-authenticated-user-email": "route-owner@example.test",
  };
  const adminHeaders = {
    "oai-authenticated-user-id": "route-admin",
    "oai-authenticated-user-email": "route-admin@example.test",
  };

  const verificationForm = new FormData();
  verificationForm.append("identity", new File(["identity"], "identity.png", { type: "image/png" }));
  verificationForm.append("propertyProof", new File(["proof"], "proof.pdf", { type: "application/pdf" }));
  verificationForm.append("consent", "on");
  const verificationResponse = await fetch(`${origin}/api/verification`, {
    method: "POST",
    headers: ownerHeaders,
    body: verificationForm,
  });
  assert.equal(verificationResponse.status, 201);
  const verification = await verificationResponse.json();

  const approvalResponse = await fetch(`${origin}/api/verification/${verification.verification.id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "content-type": "application/json" },
    body: JSON.stringify({ action: "approve", reviewNote: "Route test approval" }),
  });
  assert.equal(approvalResponse.status, 200);

  const listingResponse = await fetch(`${origin}/api/properties`, {
    method: "POST",
    headers: { ...ownerHeaders, "content-type": "application/json" },
    body: JSON.stringify({
      title: "Ready-to-use Route Comps Home",
      neighborhood: "Route Comps",
      city: "Tunis",
      lat: 36.86,
      lng: 10.27,
      priceDt: 1440,
      depositDt: 1440,
      agencyFeeDt: 0,
      sizeM2: 100,
      rooms: "S+2",
      furnished: false,
      parking: true,
      elevator: true,
      description: "End-to-end route test listing",
      status: "published",
      phone: "+21622000000",
    }),
  });
  assert.equal(listingResponse.status, 201);
  const listing = await listingResponse.json();
  assert.match(listing.score.modelVersion, /^comps-v1:n=8:median=/);

  const searchResponse = await fetch(`${origin}/api/properties?neighborhood=Route%20Comps`, { headers });
  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json();
  assert.ok(search.properties.some((property) => property.id === listing.property.id));

  const viewResponse = await fetch(`${origin}/api/properties/${listing.property.id}?track=1`, { headers });
  assert.equal(viewResponse.status, 200);

  const savedResponse = await fetch(`${origin}/api/saved-searches`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ name: "Route Comps homes", filters: { neighborhood: "Route Comps" } }),
  });
  assert.equal(savedResponse.status, 201);
  const saved = await savedResponse.json();
  const alertsResponse = await fetch(`${origin}/api/saved-searches/${saved.search.id}/alerts`, { headers });
  assert.equal(alertsResponse.status, 200);
  const alerts = await alertsResponse.json();
  assert.ok(alerts.alerts.some((property) => property.id === listing.property.id));

  const contactResponse = await fetch(`${origin}/api/contact`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ propertyId: listing.property.id, locale: "ar" }),
  });
  assert.equal(contactResponse.status, 200);
  const contact = await contactResponse.json();
  assert.match(new URL(contact.url).searchParams.get("text"), /^مرحباً/);

  const dashboardResponse = await fetch(`${origin}/dashboard?lang=en`, { headers: ownerHeaders });
  assert.equal(dashboardResponse.status, 200);
  assert.match(await dashboardResponse.text(), /1(?:<!-- -->)? views/);
});
