/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { createInAppAlerts, deliverSavedSearchEmail, findSavedSearchMatches } from "../app/lib/alerts";
import * as schema from "../db/schema";
import { savedSearches, users } from "../db/schema";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  UPLOADS: R2Bucket;
  RESEND_API_KEY?: string;
  ALERT_FROM_EMAIL?: string;
  PUBLIC_SITE_URL?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

async function runSavedSearchAlerts(env: Env) {
  const db = drizzle(env.DB, { schema });
  const searches = await db
    .select({ search: savedSearches, recipient: users.email })
    .from(savedSearches)
    .innerJoin(users, eq(savedSearches.userId, users.id));

  for (const { search, recipient } of searches) {
    const matches = await findSavedSearchMatches(db, search);
    await createInAppAlerts(db, search);
    try {
      await deliverSavedSearchEmail({
        db,
        search,
        matches,
        recipient,
        apiKey: env.RESEND_API_KEY,
        from: env.ALERT_FROM_EMAIL,
        siteUrl: env.PUBLIC_SITE_URL,
      });
    } catch (error) {
      console.error("Saved-search email delivery failed", { searchId: search.id, error });
    }
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runSavedSearchAlerts(env));
  },
};

export default worker;
