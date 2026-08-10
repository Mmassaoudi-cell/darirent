"use client";

import { NativeLink as Link } from "../components/NativeLink";
import { useEffect, useMemo, useState } from "react";
import { MapView } from "../components/MapView";
import { SaveSearchButton } from "../components/SaveSearchButton";
import { copy, type Locale } from "../lib/i18n";

type Property = {
  id: string; title: string; neighborhood: string; city: string; lat: number; lng: number;
  priceDt: number; depositDt: number; agencyFeeDt: number; sizeM2: number; rooms: string;
  furnished: boolean; parking: boolean; elevator: boolean; isPreview: boolean;
  owner: { name: string; identityVerified: boolean; phoneAvailable: boolean };
  score: null | { composite: number; priceValue: number; conditionScore: number; trustScore: number; locationFit: number };
  image: string | null;
};
type ApiResponse = { properties: Property[]; pagination: { page: number; pageSize: number; total: number; pages: number }; error?: string };

const labels = {
  fr: { found: "locations", results: "Résultats", map: "Carte", verified: "Vérifié", furnished: "Meublé", moveIn: "Entrée estimée", preview: "APERÇU DE LANCEMENT" },
  ar: { found: "عقار للكراء", results: "النتائج", map: "الخريطة", verified: "موثّق", furnished: "مفروش", moveIn: "تكلفة الدخول", preview: "مثال توضيحي" },
  en: { found: "rentals", results: "Results", map: "Map", verified: "Verified", furnished: "Furnished", moveIn: "Estimated move-in", preview: "LAUNCH PREVIEW" },
} as const;

export function SearchExperience({ initialParams, locale }: { initialParams: Record<string, string>; locale: Locale }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"results" | "map">("results");
  const t = labels[locale];
  const common = copy[locale];
  const query = useMemo(() => {
    const params = new URLSearchParams(initialParams);
    params.delete("lang");
    params.set("pageSize", "9");
    return params.toString();
  }, [initialParams]);
  useEffect(() => {
    let active = true;
    fetch(`/api/properties?${query}`).then(async (response) => {
      const payload = (await response.json()) as ApiResponse;
      if (!active) return;
      if (!response.ok) setError(payload.error ?? common.unableToLoad); else setData(payload);
    }).catch(() => active && setError(common.unableToLoad));
    return () => { active = false; };
  }, [query, common.unableToLoad]);

  const pageHref = (page: number) => {
    const params = new URLSearchParams(initialParams);
    params.set("page", String(page));
    params.set("lang", locale);
    return `/search?${params}`;
  };
  return (
    <section className="search-page">
      <form className="filter-bar" action="/search">
        <input type="hidden" name="lang" value={locale} />
        <label><span>{common.zone}</span><input name="neighborhood" defaultValue={initialParams.neighborhood} placeholder="El Aouina, La Soukra…" /></label>
        <label><span>Min DT</span><input name="minPrice" inputMode="numeric" defaultValue={initialParams.minPrice} /></label>
        <label><span>Max DT</span><input name="maxPrice" inputMode="numeric" defaultValue={initialParams.maxPrice} /></label>
        <label><span>S+n</span><select name="rooms" defaultValue={initialParams.rooms ?? ""}><option value="">{common.all}</option><option>S+0</option><option>S+1</option><option>S+2</option><option>S+3</option><option>S+4+</option></select></label>
        <label className="check-filter"><input type="checkbox" name="furnished" value="true" defaultChecked={initialParams.furnished === "true"} /><span>{t.furnished}</span></label>
        <label className="check-filter"><input type="checkbox" name="verifiedOnly" value="true" defaultChecked={initialParams.verifiedOnly === "true"} /><span>{t.verified}</span></label>
        <button className="button button-primary" type="submit">{common.searchButton}</button>
      </form>
      <div className="mobile-view-switch"><button onClick={() => setView("results")} aria-pressed={view === "results"}>{t.results}</button><button onClick={() => setView("map")} aria-pressed={view === "map"}>{t.map}</button></div>
      {error ? <div className="empty-state"><h1>{common.marketplaceError}</h1><p>{error}</p></div> : !data ? <div className="loading-state">{common.loading}</div> : (
        <div className="search-split">
          <section className={`results-panel ${view === "map" ? "mobile-hidden" : ""}`}>
            <div className="results-header"><div><h1>{data.pagination.total} {t.found}</h1><p>{common.sorted}</p></div><SaveSearchButton filters={initialParams} /></div>
            <div className="listing-grid">
              {data.properties.map((property, index) => {
                const moveIn = property.priceDt + property.depositDt + property.agencyFeeDt;
                return <Link className="property-card" href={`/listing/${property.id}?lang=${locale}`} key={property.id}>
                  <div className={`property-photo photo-ambient photo-ambient-${(index % 3) + 1}`} style={property.image ? { backgroundImage: `url(${property.image})` } : undefined}>
                    <div className="card-badges">{property.isPreview && <span>{t.preview}</span>}{property.owner.identityVerified && <span>{t.verified}</span>}</div>
                  </div>
                  <div className="property-body"><small>{property.rooms} · {property.neighborhood}</small><h2>{property.title}</h2><strong className="card-price">{property.priceDt.toLocaleString("fr-TN")} DT <span>/ {common.month}</span></strong><p>{property.sizeM2} m² · {property.furnished ? t.furnished : common.unfurnished}{property.parking ? ` · ${common.parking}` : ""}</p><div className="card-decision"><span>{common.opportunity} <b>{property.score?.composite ?? "—"}</b></span><span>{t.moveIn} <b>{moveIn.toLocaleString("fr-TN")} DT</b></span></div></div>
                </Link>;
              })}
            </div>
            {!data.properties.length && <div className="empty-state"><h2>{common.emptyTitle}</h2><p>{common.emptyBody}</p><Link className="button button-primary" href={`/list-property?lang=${locale}`}>{common.list}</Link></div>}
            <nav className="pagination" aria-label="Pagination"><Link aria-disabled={data.pagination.page <= 1} href={pageHref(Math.max(1, data.pagination.page - 1))}>{common.previous}</Link><span>{common.page} {data.pagination.page} / {data.pagination.pages}</span><Link aria-disabled={data.pagination.page >= data.pagination.pages} href={pageHref(Math.min(data.pagination.pages, data.pagination.page + 1))}>{common.next}</Link></nav>
          </section>
          <aside className={`map-panel ${view === "results" ? "mobile-hidden-map" : ""}`}><MapView properties={data.properties} locale={locale} /><div className="map-data-note">{common.mapNote}</div></aside>
        </div>
      )}
    </section>
  );
}
