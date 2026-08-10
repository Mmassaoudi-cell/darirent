import { env } from "cloudflare:workers";
import { apiError } from "../../../lib/api";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { key: parts } = await context.params;
    const key = parts.join("/");
    if (!key.startsWith("properties/")) return Response.json({ error: "Private media" }, { status: 403 });
    const object = await env.UPLOADS.get(key);
    if (!object) return Response.json({ error: "Media not found" }, { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=86400");
    headers.set("x-content-type-options", "nosniff");
    return new Response(object.body, { headers });
  } catch (error) {
    return apiError(error);
  }
}
