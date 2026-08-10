import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { verificationRequests } from "../../../db/schema";
import { apiError, unauthorized } from "../../lib/api";
import { upsertCurrentUser } from "../../lib/current-user";

export const dynamic = "force-dynamic";

async function savePrivateFile(prefix: string, file: File) {
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") throw new Error("Use an image or PDF document");
  if (file.size > 10_000_000) throw new Error("Each document must be 10 MB or smaller");
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const key = `verification/${prefix}/${crypto.randomUUID()}.${extension}`;
  await env.UPLOADS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return key;
}

export async function POST(request: Request) {
  try {
    const current = await upsertCurrentUser("owner");
    if (!current) return unauthorized();
    const form = await request.formData();
    const identity = form.get("identity");
    const propertyProof = form.get("propertyProof");
    const consent = form.get("consent") === "on";
    if (!(identity instanceof File) || !(propertyProof instanceof File) || !consent) {
      return Response.json({ error: "Both documents and explicit consent are required" }, { status: 400 });
    }
    const [identityObjectKey, propertyProofObjectKey] = await Promise.all([
      savePrivateFile(current.id, identity),
      savePrivateFile(current.id, propertyProof),
    ]);
    const [verification] = await getDb().insert(verificationRequests).values({
      id: crypto.randomUUID(),
      userId: current.id,
      identityObjectKey,
      propertyProofObjectKey,
      status: "pending",
    }).returning();
    return Response.json({ verification: { id: verification.id, status: verification.status } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
