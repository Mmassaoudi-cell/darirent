import { Header } from "../components/Header";
import { ExternalOffers } from "../components/ExternalOffers";
import { readLocale } from "../lib/i18n";
import { SearchExperience } from "./search-experience";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = readLocale(params.lang);
  const initialParams = Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []),
  );
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><Header locale={locale} /><SearchExperience initialParams={initialParams} locale={locale} /><ExternalOffers locale={locale} /></main>;
}
