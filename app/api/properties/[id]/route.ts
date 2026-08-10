import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { inspections, opportunityScores, properties, propertyImages, users } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { apiError, forbidden, unauthorized } from "../../../lib/api";
import { upsertCurrentUser } from "../../../lib/current-user";
import { scoreNewProperty } from "../../../lib/score";
import { canEditProperty, parsePropertyInput } from "../../../lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDb();
    const [row] = await db
      .select({ property: properties, owner: users })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.id, id))
      .limit(1);
    if (!row) return Response.json({ error: "Property not found" }, { status: 404 });
    const authenticated = await getChatGPTUser();
    if (row.property.status !== "published" && authenticated?.userId !== row.property.ownerId) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
    const [images, scoreRows, inspectionRows] = await Promise.all([
      db.select().from(propertyImages).where(eq(propertyImages.propertyId, id)).orderBy(asc(propertyImages.sortOrder)),
      db.select().from(opportunityScores).where(eq(opportunityScores.propertyId, id)).orderBy(desc(opportunityScores.computedAt)).limit(1),
      db.select().from(inspections).where(eq(inspections.propertyId, id)).orderBy(desc(inspections.createdAt)).limit(1),
    ]);
    return Response.json({
      property: row.property,
      owner: {
        id: row.owner.id,
        name: row.owner.name,
        phoneAvailable: Boolean(row.owner.phone),
        identityVerified: Boolean(row.owner.identityVerifiedAt),
      },
      images,
      score: scoreRows[0] ?? null,
      inspection: inspectionRows[0] ?? null,
      costs: {
        rent: row.property.priceDt,
        deposit: row.property.depositDt,
        agencyFee: row.property.agencyFeeDt,
        moveInCash: row.property.priceDt + row.property.depositDt + row.property.agencyFeeDt,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    const { id } = await context.params;
    const db = getDb();
    const [existing] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!existing) return Response.json({ error: "Property not found" }, { status: 404 });
    if (!canEditProperty(current.id, existing.ownerId, current.role)) return forbidden();
    const payload = await request.json();
    const parsed = parsePropertyInput({ ...existing, ...payload });
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
    const [property] = await db
      .update(properties)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.ownerId, existing.ownerId)))
      .returning();
    const score = scoreNewProperty({
      priceDt: property.priceDt,
      sizeM2: property.sizeM2,
      furnished: property.furnished,
      parking: property.parking,
      elevator: property.elevator,
      identityVerified: Boolean(current.identityVerifiedAt),
    });
    await db.insert(opportunityScores).values({ id: crypto.randomUUID(), propertyId: id, ...score });
    return Response.json({ property, score });
  } catch (error) {
    return apiError(error);
  }
}
