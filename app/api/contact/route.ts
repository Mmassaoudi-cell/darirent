import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { messages, properties, users } from "../../../db/schema";
import { apiError, unauthorized } from "../../lib/api";
import { upsertCurrentUser } from "../../lib/current-user";
import { copy, readLocale, type Locale } from "../../lib/i18n";
import { enforceDailyRateLimit, rateLimited } from "../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { propertyId?: string; locale?: Locale };
    if (!payload.propertyId) return Response.json({ error: "Property is required" }, { status: 400 });
    const db = getDb();
    const [row] = await db.select({ property: properties, owner: users }).from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.id, payload.propertyId)).limit(1);
    if (!row || row.property.status !== "published") return Response.json({ error: "Property not found" }, { status: 404 });
    if (!row.owner.phone || row.property.isPreview) {
      return Response.json({ error: "Contact is disabled for launch-preview listings" }, { status: 409 });
    }
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    const limit = await enforceDailyRateLimit(db, current.id, "contact", 20);
    if (!limit.allowed) return rateLimited(limit.retryAfterSeconds, "Daily contact limit reached. Please try again tomorrow.");
    const locale = readLocale(payload.locale);
    const body = copy[locale].whatsapp(row.property.title, row.property.neighborhood);
    await db.insert(messages).values({
      id: crypto.randomUUID(), propertyId: row.property.id, senderId: current.id,
      recipientId: row.owner.id, body, channel: "whatsapp_click",
    });
    const phone = row.owner.phone.replace(/[^0-9]/g, "").replace(/^0/, "216");
    return Response.json({ url: `https://wa.me/${phone}?text=${encodeURIComponent(body)}` });
  } catch (error) {
    return apiError(error);
  }
}
