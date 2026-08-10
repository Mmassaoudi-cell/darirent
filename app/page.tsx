import Link from "next/link";
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
          <span className="eyebrow">Tunisia-first rental intelligence</span>
          <h1>{t.headline}<br /><em>{t.subhead}</em></h1>
          <p>Compare the real move-in cost, understand the asking price, and preserve visible condition evidence before you commit.</p>
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
          <div className="photo-ambient photo-ambient-one"><span>GUIDED CAPTURE READY</span></div>
          <div className="decision-heading"><div><small>Aïn Zaghouan Nord · S+2</small><strong>1,450 DT <span>/ month</span></strong></div><div className="score-orb">86</div></div>
          <div className="decision-grid"><span>Price value <b>88</b></span><span>Condition <b>91</b></span><span>Listing trust <b>74</b></span><span>Location fit <b>87</b></span></div>
          <p className="preview-note">Launch-preview data is clearly labeled and cannot be contacted.</p>
        </div>
      </section>
      <section className="value-strip">
        <article><span>01</span><h2>{t.costs}</h2><p>Rent, deposit, agency fee, and move-in cash before contact.</p></article>
        <article><span>02</span><h2>{t.evidence}</h2><p>Guided room coverage and immutable evidence hashes.</p></article>
        <article><span>03</span><h2>{t.price}</h2><p>A visible score breakdown—not an unexplained AI opinion.</p></article>
      </section>
      <section className="inspection-band">
        <div><span className="eyebrow">Flagship workflow</span><h2>Document a rental found anywhere.</h2><p>Invite the owner, capture the required rooms, and keep a consistent condition record. The workflow checks coverage and evidence integrity; it does not diagnose defects.</p></div>
        <Link className="button button-light" href={`/search?lang=${locale}`}>{t.inspectCta}</Link>
      </section>
      <footer className="site-footer"><span>DariRent Tunisia · Private launch beta</span><nav><Link href="/methodology">Score methodology</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
    </main>
  );
}
