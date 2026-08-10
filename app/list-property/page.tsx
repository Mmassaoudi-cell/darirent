import { requireChatGPTUser } from "../chatgpt-auth";
import { Header } from "../components/Header";
import { ListPropertyForm } from "./property-form";

export const dynamic = "force-dynamic";

export default function ListPropertyPage() {
  return <main><Header locale="fr" /><AuthenticatedOwner /></main>;
}

async function AuthenticatedOwner() {
  const user = await requireChatGPTUser("/list-property");
  return <section className="workflow-shell"><div className="workflow-intro"><span className="eyebrow">Owner supply flow</span><h1>Publish with the costs renters need.</h1><p>Signed in as {user.displayName}. Start as a draft, add photographs, then publish when the facts and fees are complete.</p><ol><li>Property facts and exact fees</li><li>Owner photographs in R2 storage</li><li>Transparent opportunity-score breakdown</li><li>Optional guided condition inspection</li></ol></div><ListPropertyForm /></section>;
}
