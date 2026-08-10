import { requireChatGPTUser } from "../chatgpt-auth";
import { Header } from "../components/Header";
import { VerifyOwnerForm } from "./verify-owner-form";

export const dynamic = "force-dynamic";
export default function VerifyOwnerPage() { return <main><Header locale="en" /><AuthenticatedVerification /></main>; }
async function AuthenticatedVerification() { await requireChatGPTUser("/verify-owner"); return <section className="workflow-shell"><div className="workflow-intro"><span className="eyebrow">Manual trust review</span><h1>Request owner verification.</h1><p>Documents are stored privately and are never served by the public media route. Approval requires a human reviewer; submitting does not grant a badge.</p><div className="limitation-box">Private beta only. Tunisian legal and privacy review must be completed before public identity-document collection.</div></div><VerifyOwnerForm /></section>; }
