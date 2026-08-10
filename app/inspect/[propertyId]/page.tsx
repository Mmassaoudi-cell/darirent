import { requireChatGPTUser } from "../../chatgpt-auth";
import { Header } from "../../components/Header";
import { readLocale, type Locale } from "../../lib/i18n";
import { InspectionForm } from "./inspection-form";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InspectPage({ params, searchParams }: Props) {
  const [{ propertyId }, query] = await Promise.all([params, searchParams]);
  const locale = readLocale(query.lang);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><Header locale={locale} /><AuthenticatedInspection propertyId={propertyId} locale={locale} /></main>;
}

async function AuthenticatedInspection({ propertyId, locale }: { propertyId: string; locale: Locale }) {
  await requireChatGPTUser(`/inspect/${propertyId}?lang=${locale}`);
  return <section className="inspection-page"><div className="inspection-intro"><span className="eyebrow">Guided condition capture</span><h1>Capture the same required areas every time.</h1><p>Move slowly, keep people and personal documents out of frame, and use clear wide views. Missing coverage is reported honestly.</p><div className="limitation-box">Visual AI is observational. It does not replace structural, electrical, plumbing, safety, or mold inspection.</div></div><InspectionForm propertyId={propertyId} /></section>;
}
