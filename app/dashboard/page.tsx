import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { Header } from "../components/Header";
import { getDb } from "../../db";
import { properties, savedSearches, verificationRequests } from "../../db/schema";
import { upsertAuthenticatedUser } from "../lib/current-user";

export const dynamic = "force-dynamic";
export default function DashboardPage() { return <main><Header locale="en" /><Dashboard /></main>; }
async function Dashboard() {
  const authenticated = await requireChatGPTUser("/dashboard");
  const user = await upsertAuthenticatedUser(authenticated);
  const db = getDb();
  const [listings, searches, verification] = await Promise.all([
    db.select().from(properties).where(eq(properties.ownerId, user.id)).orderBy(desc(properties.updatedAt)),
    db.select().from(savedSearches).where(eq(savedSearches.userId, user.id)).orderBy(desc(savedSearches.createdAt)),
    db.select().from(verificationRequests).where(eq(verificationRequests.userId, user.id)).orderBy(desc(verificationRequests.createdAt)).limit(1),
  ]);
  return <section className="dashboard-shell"><div className="dashboard-header"><div><span className="eyebrow">Private workspace</span><h1>Welcome, {user.name}</h1><p>{user.role} account · {user.identityVerifiedAt ? "Identity verified" : verification[0] ? `Verification ${verification[0].status}` : "Not verified"}</p></div><Link className="button button-primary" href="/list-property">Add property</Link></div><div className="dashboard-grid"><section><h2>Your properties</h2>{listings.length ? listings.map((listing) => <Link className="dashboard-row" href={`/listing/${listing.id}`} key={listing.id}><span><strong>{listing.title}</strong><small>{listing.neighborhood} · {listing.status}</small></span><b>{listing.priceDt} DT</b></Link>) : <p>No owner listings yet.</p>}</section><section><h2>Saved searches</h2>{searches.length ? searches.map((search) => <div className="dashboard-row" key={search.id}><span><strong>{search.name}</strong><small>{JSON.stringify(search.filters)}</small></span><Link href={`/api/saved-searches/${search.id}/alerts`}>Check alerts</Link></div>) : <p>No saved searches yet.</p>}</section></div></section>;
}
