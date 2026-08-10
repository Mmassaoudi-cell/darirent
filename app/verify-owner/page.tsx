import { requireChatGPTUser } from "../chatgpt-auth";
import { Header } from "../components/Header";
import { readLocale, type Locale } from "../lib/i18n";
import { VerifyOwnerForm } from "./verify-owner-form";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function VerifyOwnerPage({ searchParams }: Props) {
  const locale = readLocale((await searchParams).lang);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><Header locale={locale} /><AuthenticatedVerification locale={locale} /></main>;
}
async function AuthenticatedVerification({ locale }: { locale: Locale }) {
  await requireChatGPTUser(`/verify-owner?lang=${locale}`);
  return <section className="workflow-shell"><div className="workflow-intro"><span className="eyebrow">Manual trust review</span><h1>Request owner verification.</h1><p>Documents are stored privately and are never served by the public media route. Approval requires a human reviewer; submitting does not grant a badge.</p><div className="limitation-box">Private beta only. Tunisian legal and privacy review must be completed before public identity-document collection.</div></div><VerifyOwnerForm /></section>;
}
