import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { savedSearches } from "../../../db/schema";
import { apiError, unauthorized } from "../../lib/api";
import { upsertCurrentUser } from "../../lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    const searches = await getDb().select().from(savedSearches).where(eq(savedSearches.userId, current.id)).orderBy(desc(savedSearches.createdAt));
    return Response.json({ searches });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    const payload = (await request.json()) as { name?: string; filters?: Record<string, string | number | boolean> };
    if (!payload.filters || typeof payload.filters !== "object") {
      return Response.json({ error: "Filters are required" }, { status: 400 });
    }
    const [search] = await getDb().insert(savedSearches).values({
      id: crypto.randomUUID(),
      userId: current.id,
      name: payload.name?.trim().slice(0, 80) || "My rental search",
      filters: payload.filters,
    }).returning();
    return Response.json({ search }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
