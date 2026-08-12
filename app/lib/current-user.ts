import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";
import { roleForAuthenticatedEmail } from "./admin-role";

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
  const assignedRole = roleForAuthenticatedEmail(
    authenticated.email,
    env.ADMIN_EMAIL,
    requestedRole ?? "renter",
  );
  const [existing] = await db.select().from(users).where(eq(users.id, authenticated.userId)).limit(1);
  if (existing) {
    if (assignedRole === "admin" && existing.role !== "admin") {
      const [updated] = await db
        .update(users)
        .set({ role: "admin", name: authenticated.displayName })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }
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
      role: assignedRole,
    })
    .returning();
  return created;
}
