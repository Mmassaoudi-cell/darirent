import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { savedSearches } from "../../../../../db/schema";
import { createInAppAlerts } from "../../../../lib/alerts";
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
    const alerts = await createInAppAlerts(db, search);
    return Response.json({
      alerts,
      delivery: "in_app",
      note: "Automatic email delivery runs on schedule when Resend is configured.",
    });
  } catch (error) {
    return apiError(error);
  }
}
