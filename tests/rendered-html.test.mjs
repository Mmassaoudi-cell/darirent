import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedSha256 =
  "780270db7970df893e3dbebdbd5921ca4f2d9b9db4bd26d4dd805676761fb0bb";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("preserves the supplied visualization exactly in source and build", async () => {
  const [source, built] = await Promise.all([
    readFile(new URL("../public/darirent-product-concept.html", import.meta.url)),
    readFile(new URL("../dist/client/darirent-product-concept.html", import.meta.url)),
  ]);

  assert.equal(sha256(source), expectedSha256);
  assert.equal(sha256(built), expectedSha256);
  assert.deepEqual(built, source);
});

test("retains the visualization security boundary", async () => {
  const html = await readFile(
    new URL("../public/darirent-product-concept.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /sandbox="allow-scripts"/);
  assert.match(html, /referrerpolicy="no-referrer"/);
  assert.match(html, /frame-src 'self'/);
});
