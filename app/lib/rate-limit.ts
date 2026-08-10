import { sql } from "drizzle-orm";
import type { getDb } from "../../db";
import { rateLimitCounters } from "../../db/schema";

type Db = ReturnType<typeof getDb>;
type Action = "contact" | "create_property";

export async function enforceDailyRateLimit(
  db: Db,
  userId: string,
  action: Action,
  limit: number,
) {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [counter] = await db
    .insert(rateLimitCounters)
    .values({ id: crypto.randomUUID(), userId, action, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitCounters.userId, rateLimitCounters.action, rateLimitCounters.windowStart],
      set: { count: sql`${rateLimitCounters.count} + 1` },
    })
    .returning({ count: rateLimitCounters.count });
  const nextWindow = windowStart.getTime() + 86_400_000;
  return {
    allowed: counter.count <= limit,
    remaining: Math.max(0, limit - counter.count),
    retryAfterSeconds: Math.max(1, Math.ceil((nextWindow - now.getTime()) / 1000)),
  };
}

export function rateLimited(retryAfterSeconds: number, message: string) {
  return Response.json(
    { error: message },
    { status: 429, headers: { "retry-after": String(retryAfterSeconds) } },
  );
}
