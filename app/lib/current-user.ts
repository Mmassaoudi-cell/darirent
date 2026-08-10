import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";

export async function upsertCurrentUser(
  requestedRole?: "renter" | "owner",
): Promise<(typeof users.$inferSelect) | null> {
  const authenticated = await getChatGPTUser();
  if (!authenticated) return null;
  return upsertAuthenticatedUser(authenticated, requestedRole);
}

export async function upsertAuthenticatedUser(
  authenticated: ChatGPTUser,
  requestedRole?: "renter" | "owner",
) {
  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.id, authenticated.userId)).limit(1);
  if (existing) {
    if (requestedRole === "owner" && existing.role === "renter") {
      const [updated] = await db
        .update(users)
        .set({ role: "owner", name: authenticated.displayName })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: authenticated.userId,
      email: authenticated.email,
      name: authenticated.displayName,
      role: requestedRole ?? "renter",
    })
    .returning();
  return created;
}
