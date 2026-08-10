import { NativeLink as Link } from "./components/NativeLink";
import { Header } from "./components/Header";
import { copy, readLocale } from "./lib/i18n";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: PageProps) {
  const locale = readLocale((await searchParams).lang);
  const t = copy[locale];
  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"}>
      <Header locale={locale} />
      <section className="hero-shell">
        <div className="hero-copy">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.headline}<br /><em>{t.subhead}</em></h1>
          <p>{t.intro}</p>
          <form className="hero-search" action="/search">
            <input type="hidden" name="lang" value={locale} />
            <label className="sr-only" htmlFor="home-neighborhood">{t.searchPlaceholder}</label>
            <input id="home-neighborhood" name="neighborhood" placeholder={t.searchPlaceholder} />
            <button className="button button-primary" type="submit">{t.search}</button>
          </form>
          <div className="hero-actions">
            <Link className="button button-secondary" href={`/search?lang=${locale}`}>{t.map}</Link>
            <Link className="text-link" href={`/list-property?lang=${locale}`}>{t.list} →</Link>
          </div>
        </div>
        <div className="hero-decision-card" aria-label="Example decision summary">
          <div className="photo-ambient photo-ambient-one"><span>{t.captureReady}</span></div>
          <div className="decision-heading"><div><small>Aïn Zaghouan Nord · S+2</small><strong>1,450 DT <span>/ {t.month}</span></strong></div><div className="score-orb">86</div></div>
          <div className="decision-grid"><span>{t.priceValue} <b>88</b></span><span>{t.condition} <b>91</b></span><span>{t.listingTrust} <b>74</b></span><span>{t.locationFit} <b>87</b></span></div>
          <p className="preview-note">{t.previewNote}</p>
        </div>
      </section>
      <section className="value-strip">
        <article><span>01</span><h2>{t.costs}</h2><p>{t.costsBody}</p></article>
        <article><span>02</span><h2>{t.evidence}</h2><p>{t.evidenceBody}</p></article>
        <article><span>03</span><h2>{t.price}</h2><p>{t.priceBody}</p></article>
      </section>
      <section className="inspection-band">
        <div><span className="eyebrow">{t.workflow}</span><h2>{t.workflowTitle}</h2><p>{t.workflowBody}</p></div>
        <Link className="button button-light" href={`/search?lang=${locale}`}>{t.inspectCta}</Link>
      </section>
      <footer className="site-footer"><span>{t.beta}</span><nav><Link href={`/methodology?lang=${locale}`}>{t.methodology}</Link><Link href={`/privacy?lang=${locale}`}>{t.privacy}</Link><Link href={`/terms?lang=${locale}`}>{t.terms}</Link></nav></footer>
    </main>
  );
}
