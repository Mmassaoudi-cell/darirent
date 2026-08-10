import { requireChatGPTUser } from "../../chatgpt-auth";
import { Header } from "../../components/Header";
import { InspectionForm } from "./inspection-form";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ propertyId: string }> };

export default async function InspectPage({ params }: Props) {
  const { propertyId } = await params;
  return <main><Header locale="en" /><AuthenticatedInspection propertyId={propertyId} /></main>;
}

async function AuthenticatedInspection({ propertyId }: { propertyId: string }) {
  await requireChatGPTUser(`/inspect/${propertyId}`);
  return <section className="inspection-page"><div className="inspection-intro"><span className="eyebrow">Guided photo inspection</span><h1>Capture the same required areas every time.</h1><p>Move slowly, keep people and personal documents out of frame, and use clear wide views. Missing coverage is reported honestly.</p><div className="limitation-box">Visual AI is observational. It does not replace structural, electrical, plumbing, safety, or mold inspection.</div></div><InspectionForm propertyId={propertyId} /></section>;
}
