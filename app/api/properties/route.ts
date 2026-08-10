import { and, asc, count, desc, eq, gte, inArray, isNotNull, like, lte, type SQL } from "drizzle-orm";
import { getDb } from "../../../db";
import { opportunityScores, properties, propertyImages, users } from "../../../db/schema";
import { apiError, unauthorized } from "../../lib/api";
import { upsertCurrentUser } from "../../lib/current-user";
import { scoreNewProperty } from "../../lib/score";
import { parseFilters, parsePropertyInput } from "../../lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const conditions: SQL[] = [eq(properties.status, "published")];
    if (filters.minPrice !== undefined) conditions.push(gte(properties.priceDt, filters.minPrice));
    if (filters.maxPrice !== undefined) conditions.push(lte(properties.priceDt, filters.maxPrice));
    if (filters.rooms) conditions.push(eq(properties.rooms, filters.rooms));
    if (filters.neighborhood) conditions.push(like(properties.neighborhood, `%${filters.neighborhood}%`));
    if (filters.furnished) conditions.push(eq(properties.furnished, true));
    if (filters.verifiedOnly) conditions.push(isNotNull(users.identityVerifiedAt));

    const db = getDb();
    const where = and(...conditions);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await db
      .select({
        property: properties,
        ownerName: users.name,
        ownerPhone: users.phone,
        ownerVerifiedAt: users.identityVerifiedAt,
      })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(where)
      .orderBy(desc(properties.createdAt), asc(properties.priceDt))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ total }] = await db
      .select({ total: count() })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(where);

    const ids = rows.map((row) => row.property.id);
    const [scores, images] = ids.length
      ? await Promise.all([
          db.select().from(opportunityScores).where(inArray(opportunityScores.propertyId, ids)).orderBy(desc(opportunityScores.computedAt)),
          db.select().from(propertyImages).where(inArray(propertyImages.propertyId, ids)).orderBy(asc(propertyImages.sortOrder)),
        ])
      : [[], []];

    return Response.json({
      properties: rows.map((row) => ({
        ...row.property,
        owner: {
          name: row.ownerName,
          phoneAvailable: Boolean(row.ownerPhone),
          identityVerified: Boolean(row.ownerVerifiedAt),
        },
        score: scores.find((score) => score.propertyId === row.property.id) ?? null,
        image: images.find((image) => image.propertyId === row.property.id)?.url ?? null,
      })),
      pagination: { page: filters.page, pageSize: filters.pageSize, total, pages: Math.max(1, Math.ceil(total / filters.pageSize)) },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const current = await upsertCurrentUser("owner");
    if (!current) return unauthorized();
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = parsePropertyInput(payload);
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
    const db = getDb();
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    if (!/^\+?[0-9 ()-]{8,20}$/.test(phone)) {
      return Response.json({ error: "A valid WhatsApp phone number is required" }, { status: 400 });
    }
    await db.update(users).set({ phone }).where(eq(users.id, current.id));
    const id = crypto.randomUUID();
    const [property] = await db
      .insert(properties)
      .values({ id, ownerId: current.id, ...parsed.data, isPreview: false })
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
    return Response.json({ property, score }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
