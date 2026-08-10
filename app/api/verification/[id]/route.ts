import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  properties,
  users,
  verificationRequests,
} from "../../../../db/schema";
import { apiError, forbidden, unauthorized } from "../../../lib/api";
import { upsertCurrentUser } from "../../../lib/current-user";
import { recordPropertyScore } from "../../../lib/scoring-service";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    if (current.role !== "admin") return forbidden();
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string; reviewNote?: string };
    if (body.action !== "approve" && body.action !== "reject") {
      return Response.json({ error: "Action must be approve or reject" }, { status: 400 });
    }
    const db = getDb();
    const [verification] = await db
      .select()
      .from(verificationRequests)
      .where(and(eq(verificationRequests.id, id), eq(verificationRequests.status, "pending")))
      .limit(1);
    if (!verification) return Response.json({ error: "Pending request not found" }, { status: 404 });

    const status = body.action === "approve" ? "approved" : "rejected";
    await db
      .update(verificationRequests)
      .set({ status, reviewNote: body.reviewNote?.trim().slice(0, 500) || null })
      .where(eq(verificationRequests.id, id));

    if (status === "approved") {
      await db
        .update(users)
        .set({ identityVerifiedAt: new Date() })
        .where(eq(users.id, verification.userId));
      const ownerListings = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, verification.userId));
      for (const property of ownerListings) await recordPropertyScore(db, property, true);
    }

    return Response.json({ verification: { id, status } });
  } catch (error) {
    return apiError(error);
  }
}
