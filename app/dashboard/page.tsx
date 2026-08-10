import { count, desc, eq, inArray } from "drizzle-orm";
import { NativeLink as Link } from "../components/NativeLink";
import { requireChatGPTUser } from "../chatgpt-auth";
import { Header } from "../components/Header";
import { getDb } from "../../db";
import { properties, propertyViews, savedSearches, verificationRequests } from "../../db/schema";
import { upsertAuthenticatedUser } from "../lib/current-user";
import { readLocale, type Locale } from "../lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const locale = readLocale((await searchParams).lang);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><Header locale={locale} /><Dashboard locale={locale} /></main>;
}

async function Dashboard({ locale }: { locale: Locale }) {
  const authenticated = await requireChatGPTUser(`/dashboard?lang=${locale}`);
  const user = await upsertAuthenticatedUser(authenticated);
  const db = getDb();
  const [listings, searches, verification] = await Promise.all([
    db.select().from(properties).where(eq(properties.ownerId, user.id)).orderBy(desc(properties.updatedAt)),
    db.select().from(savedSearches).where(eq(savedSearches.userId, user.id)).orderBy(desc(savedSearches.createdAt)),
    db.select().from(verificationRequests).where(eq(verificationRequests.userId, user.id)).orderBy(desc(verificationRequests.createdAt)).limit(1),
  ]);
  const viewRows = listings.length
    ? await db.select({ propertyId: propertyViews.propertyId, total: count() }).from(propertyViews).where(inArray(propertyViews.propertyId, listings.map((listing) => listing.id))).groupBy(propertyViews.propertyId)
    : [];
  const viewCounts = new Map(viewRows.map((row) => [row.propertyId, row.total]));
  return <section className="dashboard-shell"><div className="dashboard-header"><div><span className="eyebrow">Private workspace</span><h1>Welcome, {user.name}</h1><p>{user.role} account · {user.identityVerifiedAt ? "Identity verified" : verification[0] ? `Verification ${verification[0].status}` : "Not verified"}</p></div><Link className="button button-primary" href={`/list-property?lang=${locale}`}>Add property</Link></div><div className="dashboard-grid"><section><h2>Your properties</h2>{listings.length ? listings.map((listing) => <Link className="dashboard-row" href={`/listing/${listing.id}?lang=${locale}`} key={listing.id}><span><strong>{listing.title}</strong><small>{listing.neighborhood} · {listing.status} · {viewCounts.get(listing.id) ?? 0} views</small></span><b>{listing.priceDt} DT</b></Link>) : <p>No owner listings yet.</p>}</section><section><h2>Saved searches</h2>{searches.length ? searches.map((search) => <div className="dashboard-row" key={search.id}><span><strong>{search.name}</strong><small>{JSON.stringify(search.filters)}</small></span><Link href={`/api/saved-searches/${search.id}/alerts`}>Check alerts</Link></div>) : <p>No saved searches yet.</p>}</section></div></section>;
}
