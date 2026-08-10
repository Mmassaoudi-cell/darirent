import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { getDb } from "../../db";
import { alertsSent, properties, type savedSearches } from "../../db/schema";

type Db = ReturnType<typeof getDb>;
type SavedSearch = typeof savedSearches.$inferSelect;
type Property = typeof properties.$inferSelect;

export async function findSavedSearchMatches(db: Db, search: SavedSearch) {
  const filters = search.filters;
  const conditions: SQL[] = [eq(properties.status, "published")];
  if (typeof filters.minPrice === "number") conditions.push(gte(properties.priceDt, filters.minPrice));
  if (typeof filters.maxPrice === "number") conditions.push(lte(properties.priceDt, filters.maxPrice));
  if (typeof filters.rooms === "string") conditions.push(eq(properties.rooms, filters.rooms));
  if (typeof filters.neighborhood === "string") conditions.push(eq(properties.neighborhood, filters.neighborhood));
  if (filters.furnished === true) conditions.push(eq(properties.furnished, true));

  return db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt))
    .limit(20);
}

async function unsentMatches(
  db: Db,
  searchId: string,
  matches: Property[],
  channel: "in_app" | "email",
) {
  const sent = await db
    .select({ propertyId: alertsSent.propertyId })
    .from(alertsSent)
    .where(and(eq(alertsSent.savedSearchId, searchId), eq(alertsSent.channel, channel)));
  const sentIds = new Set(sent.map((item) => item.propertyId));
  return matches.filter((property) => !sentIds.has(property.id));
}

async function recordAlerts(
  db: Db,
  searchId: string,
  matches: Property[],
  channel: "in_app" | "email",
) {
  if (!matches.length) return;
  await db
    .insert(alertsSent)
    .values(
      matches.map((property) => ({
        id: crypto.randomUUID(),
        savedSearchId: searchId,
        propertyId: property.id,
        channel,
      })),
    )
    .onConflictDoNothing();
}

export async function createInAppAlerts(db: Db, search: SavedSearch) {
  const matches = await findSavedSearchMatches(db, search);
  const unsent = await unsentMatches(db, search.id, matches, "in_app");
  await recordAlerts(db, search.id, unsent, "in_app");
  return unsent;
}

export async function deliverSavedSearchEmail(input: {
  db: Db;
  search: SavedSearch;
  matches: Property[];
  recipient: string;
  apiKey?: string;
  from?: string;
  siteUrl?: string;
}) {
  if (!input.apiKey || !input.from || !input.matches.length) return { delivered: 0, configured: false };
  const unsent = await unsentMatches(input.db, input.search.id, input.matches, "email");
  if (!unsent.length) return { delivered: 0, configured: true };
  const siteUrl = (input.siteUrl ?? "https://darirent-product-concept.mmdw.chatgpt.site").replace(/\/$/, "");
  const items = unsent
    .map(
      (property) =>
        `<li><a href="${siteUrl}/listing/${encodeURIComponent(property.id)}">${escapeHtml(property.title)}</a> — ${property.priceDt} DT/month, ${escapeHtml(property.neighborhood)}</li>`,
    )
    .join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: input.from,
      to: [input.recipient],
      subject: `${unsent.length} new DariRent match${unsent.length === 1 ? "" : "es"}`,
      html: `<h1>New rentals match ${escapeHtml(input.search.name)}</h1><ul>${items}</ul><p>You are receiving this because you saved a DariRent search.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend delivery failed with status ${response.status}`);
  await recordAlerts(input.db, input.search.id, unsent, "email");
  return { delivered: unsent.length, configured: true };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}
