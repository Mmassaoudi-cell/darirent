import { env } from "cloudflare:workers";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { properties, propertyImages } from "../../../../../db/schema";
import { apiError, forbidden, unauthorized } from "../../../../lib/api";
import { upsertCurrentUser } from "../../../../lib/current-user";
import { canEditProperty } from "../../../../lib/validation";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const current = await upsertCurrentUser("owner");
    if (!current) return unauthorized();
    const { id } = await context.params;
    const db = getDb();
    const [property] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!property) return Response.json({ error: "Property not found" }, { status: 404 });
    if (!canEditProperty(current.id, property.ownerId, current.role)) return forbidden();
    const form = await request.formData();
    const files = form.getAll("images").filter((value): value is File => value instanceof File);
    if (!files.length) return Response.json({ error: "At least one image is required" }, { status: 400 });
    if (files.length > 12) return Response.json({ error: "Upload up to 12 images at a time" }, { status: 400 });
    if (files.some((file) => !file.type.startsWith("image/"))) {
      return Response.json({ error: "Every uploaded file must be an image" }, { status: 400 });
    }
    if (files.some((file) => file.size > 8_000_000)) {
      return Response.json({ error: "Each image must be 8 MB or smaller" }, { status: 400 });
    }
    const existing = await db.select().from(propertyImages).where(eq(propertyImages.propertyId, id)).orderBy(asc(propertyImages.sortOrder));
    const uploaded = [];
    for (const [index, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
      const key = `properties/${id}/${crypto.randomUUID()}.${extension}`;
      await env.UPLOADS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      const image = {
        id: crypto.randomUUID(),
        propertyId: id,
        url: `/api/media/${key}`,
        objectKey: key,
        sortOrder: existing.length + index,
        source: "owner_upload" as const,
      };
      await db.insert(propertyImages).values(image);
      uploaded.push(image);
    }
    return Response.json({ images: uploaded }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
