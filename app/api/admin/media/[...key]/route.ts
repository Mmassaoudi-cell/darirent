import { env } from "cloudflare:workers";
import { apiError, forbidden, unauthorized } from "../../../../lib/api";
import { upsertCurrentUser } from "../../../../lib/current-user";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: Context) {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    if (current.role !== "admin") return forbidden();
    const { key: parts } = await context.params;
    const key = parts.join("/");
    if (!key.startsWith("verification/")) return forbidden();
    const object = await env.UPLOADS.get(key);
    if (!object) return Response.json({ error: "Document not found" }, { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, no-store");
    headers.set("content-security-policy", "default-src 'none'; frame-ancestors 'self'");
    headers.set("x-content-type-options", "nosniff");
    return new Response(object.body, { headers });
  } catch (error) {
    return apiError(error);
  }
}
