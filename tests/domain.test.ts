import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCompositeScore,
  SCORE_WEIGHTS,
  scoreNewProperty,
} from "../app/lib/score.ts";
import {
  canEditProperty,
  parseFilters,
  parsePropertyInput,
} from "../app/lib/validation.ts";

test("opportunity score is deterministic, clamped, and uses documented weights", () => {
  assert.equal(
    Object.values(SCORE_WEIGHTS).reduce((total, weight) => total + weight, 0),
    1,
  );
  assert.deepEqual(
    calculateCompositeScore({
      priceValue: 100,
      conditionScore: 80,
      trustScore: 60,
      locationFit: 40,
    }),
    {
      priceValue: 100,
      conditionScore: 80,
      trustScore: 60,
      locationFit: 40,
      composite: 73,
      modelVersion: "weighted-v1",
    },
  );
  assert.deepEqual(
    scoreNewProperty({
      priceDt: 1_400,
      sizeM2: 100,
      furnished: true,
      parking: true,
      elevator: true,
      identityVerified: false,
    }),
    scoreNewProperty({
      priceDt: 1_400,
      sizeM2: 100,
      furnished: true,
      parking: true,
      elevator: true,
      identityVerified: false,
    }),
  );
  const compsScore = scoreNewProperty({
    priceDt: 1_400,
    sizeM2: 100,
    furnished: false,
    parking: false,
    elevator: false,
    identityVerified: true,
    priceReferenceDtM2: 13.75,
    referenceSampleSize: 8,
  });
  assert.equal(compsScore.modelVersion, "comps-v1:n=8:median=13.75");
});

test("property validation rejects invalid Tunisian coordinates and preserves valid data", () => {
  const invalid = parsePropertyInput({
    title: "Apartment",
    neighborhood: "El Aouina",
    rooms: "S+2",
    lat: 50,
    lng: 10,
    priceDt: 1_500,
    sizeM2: 90,
  });
  assert.deepEqual(invalid, { ok: false, error: "Coordinates must be within Tunisia" });

  const valid = parsePropertyInput({
    title: "  Bright S+2  ",
    neighborhood: "El Aouina",
    rooms: "S+2",
    lat: 36.86,
    lng: 10.27,
    priceDt: "1500",
    depositDt: 1500,
    agencyFeeDt: 0,
    sizeM2: 90,
    furnished: true,
    status: "published",
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.title, "Bright S+2");
    assert.equal(valid.data.priceDt, 1_500);
    assert.equal(valid.data.status, "published");
  }
});

test("authorization permits owners and admins, never unrelated renters", () => {
  assert.equal(canEditProperty("owner-a", "owner-a", "owner"), true);
  assert.equal(canEditProperty("admin-a", "owner-a", "admin"), true);
  assert.equal(canEditProperty("renter-a", "owner-a", "renter"), false);
});

test("search filters enforce safe pagination bounds", () => {
  const filters = parseFilters(
    new URL("https://example.test/search?minPrice=500&page=-4&pageSize=999&furnished=true"),
  );
  assert.deepEqual(filters, {
    minPrice: 500,
    maxPrice: undefined,
    rooms: undefined,
    neighborhood: undefined,
    furnished: true,
    verifiedOnly: undefined,
    page: 1,
    pageSize: 24,
  });
});
