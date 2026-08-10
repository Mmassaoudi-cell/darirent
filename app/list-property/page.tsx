import { requireChatGPTUser } from "../chatgpt-auth";
import { Header } from "../components/Header";
import { readLocale, type Locale } from "../lib/i18n";
import { ListPropertyForm } from "./property-form";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ListPropertyPage({ searchParams }: Props) {
  const locale = readLocale((await searchParams).lang);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><Header locale={locale} /><AuthenticatedOwner locale={locale} /></main>;
}

async function AuthenticatedOwner({ locale }: { locale: Locale }) {
  const user = await requireChatGPTUser(`/list-property?lang=${locale}`);
  return <section className="workflow-shell"><div className="workflow-intro"><span className="eyebrow">Owner supply flow</span><h1>Publish with the costs renters need.</h1><p>Signed in as {user.displayName}. Start as a draft, add photographs, then publish when the facts and fees are complete.</p><ol><li>Property facts and exact fees</li><li>Owner photographs in private storage</li><li>Transparent opportunity-score breakdown</li><li>Optional guided condition capture</li></ol></div><ListPropertyForm locale={locale} /></section>;
}
