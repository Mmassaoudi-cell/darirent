import Link from "next/link";
import type { Locale } from "../lib/i18n";
import { copy } from "../lib/i18n";

export function Header({ locale = "fr" }: { locale?: Locale }) {
  const t = copy[locale];
  return (
    <header className="site-header">
      <Link className="brand" href={`/?lang=${locale}`}>dari<span>rent</span></Link>
      <nav className="main-nav" aria-label="Primary navigation">
        <Link href={`/search?lang=${locale}`}>{t.rent}</Link>
        <Link href={`/list-property?lang=${locale}`}>{t.list}</Link>
        <Link href={`/verify-owner?lang=${locale}`}>Trust center</Link>
        <Link href={`/dashboard?lang=${locale}`}>My DariRent</Link>
      </nav>
      <nav className="language-nav" aria-label="Language">
        <Link aria-current={locale === "fr" ? "page" : undefined} href="?lang=fr">FR</Link>
        <Link aria-current={locale === "ar" ? "page" : undefined} href="?lang=ar">عربي</Link>
        <Link aria-current={locale === "en" ? "page" : undefined} href="?lang=en">EN</Link>
      </nav>
    </header>
  );
}
