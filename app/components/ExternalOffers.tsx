import { externalOffers, externalOffersCollectedAt } from "../data/external-offers";
import type { Locale } from "../lib/i18n";

const labels = {
  fr: {
    eyebrow: "Offres externes en Tunisie",
    title: "Davantage de locations à explorer",
    body: "Offres publiques collectées sur Mubawab. Elles ne sont ni vérifiées, ni notées, ni hébergées par DariRent. Vérifiez toujours la disponibilité, les frais et l’identité de l’annonceur sur la source.",
    collected: "Collectées le",
    source: "Voir l’offre originale",
    month: "mois",
    notVerified: "NON VÉRIFIÉE",
  },
  ar: {
    eyebrow: "عروض خارجية في تونس",
    title: "مزيد من المساكن لاستكشافها",
    body: "عروض عامة جُمعت من Mubawab. لا تستضيفها DariRent ولم تتحقق منها أو تقيّمها. تأكد دائمًا من التوفر والمصاريف وهوية المعلن لدى المصدر.",
    collected: "جُمعت في",
    source: "شاهد العرض الأصلي",
    month: "شهر",
    notVerified: "غير موثّق",
  },
  en: {
    eyebrow: "External offers in Tunisia",
    title: "More rentals to explore",
    body: "Public offers collected from Mubawab. They are not hosted, verified, or scored by DariRent. Always confirm availability, fees, and advertiser identity at the source.",
    collected: "Collected",
    source: "View original offer",
    month: "month",
    notVerified: "NOT VERIFIED",
  },
} as const;

export function ExternalOffers({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <section className="external-offers" aria-labelledby="external-offers-title">
      <div className="external-offers-heading">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 id="external-offers-title">{t.title}</h2>
          <p>{t.body}</p>
        </div>
        <small>{t.collected} <time dateTime={externalOffersCollectedAt}>12/08/2026</time></small>
      </div>
      <div className="external-offers-grid">
        {externalOffers.map((offer) => (
          <article className="external-offer-card" key={offer.id}>
            <div className="external-offer-topline"><span>{t.notVerified}</span><small>{offer.source}</small></div>
            <p>{offer.rooms} · {offer.location}</p>
            <h3>{offer.title}</h3>
            <strong>{offer.priceDt.toLocaleString("fr-TN")} DT <small>/ {t.month}</small></strong>
            <p>{offer.sizeM2 ? `${offer.sizeM2} m² · ` : ""}{offer.features.join(" · ")}</p>
            <a href={offer.sourceUrl} target="_blank" rel="noreferrer">{t.source} ↗</a>
          </article>
        ))}
      </div>
    </section>
  );
}
