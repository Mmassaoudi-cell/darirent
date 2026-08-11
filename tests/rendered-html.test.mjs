import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("preserves the supplied visualization exactly in source and build", async () => {
  const [source, built] = await Promise.all([
    readFile(new URL("../public/darirent-product-concept.html", import.meta.url)),
    readFile(new URL("../dist/client/darirent-product-concept.html", import.meta.url)),
  ]);

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
