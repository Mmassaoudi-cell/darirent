import { and, eq } from "drizzle-orm";
import type { getDb } from "../../db";
import { opportunityScores, properties } from "../../db/schema";
import { scoreNewProperty } from "./score";

type Db = ReturnType<typeof getDb>;
type Property = typeof properties.$inferSelect;
export const MIN_COMPS_SAMPLE = 8;

export async function getNeighborhoodPriceReference(db: Db, neighborhood: string) {
  const rows = await db
    .select({ priceDt: properties.priceDt, sizeM2: properties.sizeM2 })
    .from(properties)
    .where(
      and(
        eq(properties.neighborhood, neighborhood),
        eq(properties.status, "published"),
        eq(properties.isPreview, false),
      ),
    );
  const values = rows
    .map((row) => row.priceDt / Math.max(row.sizeM2, 1))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median = values.length
    ? values.length % 2
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2
    : null;
  return {
    sampleSize: values.length,
    medianDtM2: values.length >= MIN_COMPS_SAMPLE ? median : null,
  };
}

export async function computePropertyScore(
  db: Db,
  property: Property,
  identityVerified: boolean,
) {
  const reference = await getNeighborhoodPriceReference(db, property.neighborhood);
  return scoreNewProperty({
    priceDt: property.priceDt,
    sizeM2: property.sizeM2,
    furnished: property.furnished,
    parking: property.parking,
    elevator: property.elevator,
    identityVerified,
    priceReferenceDtM2: reference.medianDtM2 ?? undefined,
    referenceSampleSize: reference.sampleSize,
  });
}

export async function recordPropertyScore(
  db: Db,
  property: Property,
  identityVerified: boolean,
) {
  const score = await computePropertyScore(db, property, identityVerified);
  await db.insert(opportunityScores).values({
    id: crypto.randomUUID(),
    propertyId: property.id,
    ...score,
  });
  return score;
}
