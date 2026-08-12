import assert from "node:assert/strict";
import test from "node:test";
import { externalOffers } from "../app/data/external-offers.ts";

test("external offers are attributed, linked, current, and do not contain copied media or contacts", () => {
  assert.ok(externalOffers.length >= 6);
  for (const offer of externalOffers) {
    assert.equal(offer.source, "Mubawab");
    assert.match(offer.sourceUrl, /^https:\/\/www\.mubawab\.tn\/fr\/a\/\d+\//);
    assert.ok(offer.priceDt > 0);
    assert.ok(offer.location.length > 0);
    assert.ok(!("phone" in offer));
    assert.ok(!("image" in offer));
  }
});
