import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { inspections, opportunityScores, properties, propertyImages, users } from "../../../db/schema";
import { ContactButton } from "../../components/ContactButton";
import { Header } from "../../components/Header";
import { ViewTracker } from "../../components/ViewTracker";
import { readLocale } from "../../lib/i18n";
import { scoreLabel } from "../../lib/score";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ListingPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = readLocale(query.lang);
  const db = getDb();
  const [row] = await db.select({ property: properties, owner: users }).from(properties)
    .innerJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.id, id)).limit(1);
  if (!row || row.property.status !== "published") notFound();
  const [images, scoreRows, inspectionRows] = await Promise.all([
    db.select().from(propertyImages).where(eq(propertyImages.propertyId, id)).orderBy(asc(propertyImages.sortOrder)),
    db.select().from(opportunityScores).where(eq(opportunityScores.propertyId, id)).orderBy(desc(opportunityScores.computedAt)).limit(1),
    db.select().from(inspections).where(eq(inspections.propertyId, id)).orderBy(desc(inspections.createdAt)).limit(1),
  ]);
  const property = row.property;
  const score = scoreRows[0];
  const inspection = inspectionRows[0];
  const moveInCash = property.priceDt + property.depositDt + property.agencyFeeDt;
  return <main dir={locale === "ar" ? "rtl" : "ltr"}>
    <ViewTracker propertyId={property.id} />
    <Header locale={locale} />
    {property.isPreview && <div className="preview-banner">Launch preview: this example demonstrates the product and cannot be contacted or rented.</div>}
    <section className="listing-shell">
      <div className="listing-gallery">
        {images.length ? images.slice(0, 4).map((image) => <img key={image.id} src={image.url} alt={`${property.title} property view`} />) : <div className="gallery-placeholder photo-ambient photo-ambient-one"><span>OWNER PHOTOS APPEAR HERE</span></div>}
      </div>
      <aside className="listing-summary">
        <small>{property.rooms} · {property.neighborhood}, {property.city}</small>
        <h1>{property.title}</h1>
        <strong className="detail-price">{property.priceDt.toLocaleString("fr-TN")} DT <span>/ month</span></strong>
        <p>{property.sizeM2} m² · {property.furnished ? "Furnished" : "Unfurnished"}{property.parking ? " · Parking" : ""}{property.elevator ? " · Elevator" : ""}</p>
        <div className="owner-line"><span className={row.owner.identityVerifiedAt ? "trust-dot verified" : "trust-dot"} /> {row.owner.name} · {row.owner.identityVerifiedAt ? "Identity verified" : "Identity review pending"}</div>
        <ContactButton propertyId={property.id} locale={locale} disabled={property.isPreview || !row.owner.phone} />
        <Link className="button button-secondary button-block" href={`/inspect/${property.id}?lang=${locale}`}>Start guided inspection</Link>
      </aside>
      <section className="decision-panel">
        <div className="decision-title"><div><span className="eyebrow">Explainable decision support</span><h2>Your rental opportunity</h2><p>{score ? scoreLabel(score.composite) : "Score pending more data"}</p></div><div className="large-score">{score?.composite ?? "—"}</div></div>
        {score && <div className="score-breakdown">
          <ScoreBar label="Price value" value={score.priceValue} weight="30%" />
          <ScoreBar label="Visible condition" value={score.conditionScore} weight="25%" />
          <ScoreBar label="Listing trust" value={score.trustScore} weight="25%" />
          <ScoreBar label="Location fit" value={score.locationFit} weight="20%" />
        </div>}
        <p className="method-note">The composite is a deterministic weighted calculation, not an LLM opinion. Preview scores use illustrative data. <Link href="/methodology">Read the methodology and limitations →</Link></p>
      </section>
      <section className="cost-panel">
        <div><small>Monthly rent</small><strong>{property.priceDt.toLocaleString("fr-TN")} DT</strong></div>
        <div><small>Deposit</small><strong>{property.depositDt.toLocaleString("fr-TN")} DT</strong></div>
        <div><small>Agency fee</small><strong>{property.agencyFeeDt.toLocaleString("fr-TN")} DT</strong></div>
        <div className="move-in-total"><small>Estimated move-in cash</small><strong>{moveInCash.toLocaleString("fr-TN")} DT</strong></div>
      </section>
      <section className="detail-copy"><h2>What the owner says</h2><p>{property.description || "No description supplied."}</p></section>
      <section className="inspection-summary"><div><span className="eyebrow">Condition evidence</span><h2>{inspection ? `${inspection.coveragePct}% visual coverage` : "Inspection not completed"}</h2><p>{inspection ? "The latest guided capture records required rooms and visible evidence." : "Request a guided capture before committing."}</p></div><div className="limitation-box">Visual AI is observational. It does not replace structural, electrical, plumbing, safety, or mold inspection.</div></section>
    </section>
  </main>;
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return <div className="score-row"><div><span>{label}</span><small>{weight} weight</small></div><div className="score-track"><span style={{ width: `${value}%` }} /></div><strong>{value}</strong></div>;
}
