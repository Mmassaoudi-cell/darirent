import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { messages, properties, users } from "../../../db/schema";
import { apiError } from "../../lib/api";
import { upsertCurrentUser } from "../../lib/current-user";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { propertyId?: string };
    if (!payload.propertyId) return Response.json({ error: "Property is required" }, { status: 400 });
    const db = getDb();
    const [row] = await db.select({ property: properties, owner: users }).from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.id, payload.propertyId)).limit(1);
    if (!row || row.property.status !== "published") return Response.json({ error: "Property not found" }, { status: 404 });
    if (!row.owner.phone || row.property.isPreview) {
      return Response.json({ error: "Contact is disabled for launch-preview listings" }, { status: 409 });
    }
    const current = await upsertCurrentUser();
    const body = `Bonjour, je vous contacte via DariRent au sujet de ${row.property.title} à ${row.property.neighborhood}.`;
    await db.insert(messages).values({
      id: crypto.randomUUID(), propertyId: row.property.id, senderId: current?.id ?? null,
      recipientId: row.owner.id, body, channel: "whatsapp_click",
    });
    const phone = row.owner.phone.replace(/[^0-9]/g, "").replace(/^0/, "216");
    return Response.json({ url: `https://wa.me/${phone}?text=${encodeURIComponent(body)}` });
  } catch (error) {
    return apiError(error);
  }
}
