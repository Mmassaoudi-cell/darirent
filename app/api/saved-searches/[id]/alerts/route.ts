import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { alertsSent, properties, savedSearches } from "../../../../../db/schema";
import { apiError, forbidden, unauthorized } from "../../../../lib/api";
import { upsertCurrentUser } from "../../../../lib/current-user";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    const { id } = await context.params;
    const db = getDb();
    const [search] = await db.select().from(savedSearches).where(eq(savedSearches.id, id)).limit(1);
    if (!search) return Response.json({ error: "Saved search not found" }, { status: 404 });
    if (search.userId !== current.id && current.role !== "admin") return forbidden();
    const filters = search.filters;
    const conditions: SQL[] = [eq(properties.status, "published")];
    if (typeof filters.minPrice === "number") conditions.push(gte(properties.priceDt, filters.minPrice));
    if (typeof filters.maxPrice === "number") conditions.push(lte(properties.priceDt, filters.maxPrice));
    if (typeof filters.rooms === "string") conditions.push(eq(properties.rooms, filters.rooms));
    if (typeof filters.neighborhood === "string") conditions.push(eq(properties.neighborhood, filters.neighborhood));
    const matches = await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt)).limit(20);
    const sent = await db.select().from(alertsSent).where(eq(alertsSent.savedSearchId, id));
    const sentIds = new Set(sent.map((item) => item.propertyId));
    const alerts = matches.filter((property) => !sentIds.has(property.id));
    if (alerts.length) {
      await db.insert(alertsSent).values(alerts.map((property) => ({
        id: crypto.randomUUID(),
        savedSearchId: id,
        propertyId: property.id,
        channel: "in_app" as const,
      }))).onConflictDoNothing();
    }
    return Response.json({ alerts, delivery: "in_app", note: "Email and SMS delivery activate when a reviewed provider is configured." });
  } catch (error) {
    return apiError(error);
  }
}
