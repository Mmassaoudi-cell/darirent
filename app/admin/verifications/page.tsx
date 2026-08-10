import { desc, eq } from "drizzle-orm";
import { forbidden } from "../../lib/api";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { Header } from "../../components/Header";
import { upsertAuthenticatedUser } from "../../lib/current-user";
import { getDb } from "../../../db";
import { users, verificationRequests } from "../../../db/schema";
import { VerificationActions } from "./verification-actions";

export const dynamic = "force-dynamic";

export default function AdminVerificationsPage() {
  return <main><Header locale="en" /><AdminQueue /></main>;
}

async function AdminQueue() {
  const authenticated = await requireChatGPTUser("/admin/verifications");
  const current = await upsertAuthenticatedUser(authenticated);
  if (current.role !== "admin") return <section className="empty-state"><h1>Admin access required</h1><p>{await forbidden().text()}</p></section>;
  const rows = await getDb()
    .select({ verification: verificationRequests, user: users })
    .from(verificationRequests)
    .innerJoin(users, eq(verificationRequests.userId, users.id))
    .orderBy(desc(verificationRequests.createdAt));

  return (
    <section className="admin-shell">
      <span className="eyebrow">Restricted review workspace</span>
      <h1>Owner verification queue</h1>
      <p>Documents remain private and each decision is recorded against the request.</p>
      <div className="verification-queue">
        {rows.map(({ verification, user }) => (
          <article className="verification-card" key={verification.id}>
            <div><strong>{user.name}</strong><small>{user.email} · {verification.status}</small></div>
            <nav>
              <a target="_blank" rel="noreferrer" href={`/api/admin/media/${verification.identityObjectKey}`}>Identity document</a>
              <a target="_blank" rel="noreferrer" href={`/api/admin/media/${verification.propertyProofObjectKey}`}>Property proof</a>
            </nav>
            {verification.status === "pending" ? <VerificationActions id={verification.id} /> : <p>{verification.reviewNote || "No review note."}</p>}
          </article>
        ))}
        {!rows.length && <div className="empty-state"><h2>No requests yet</h2><p>New owner verification requests will appear here.</p></div>}
      </div>
    </section>
  );
}
