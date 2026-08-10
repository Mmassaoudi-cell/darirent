export {};

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      UPLOADS: R2Bucket;
      RESEND_API_KEY?: string;
      ALERT_FROM_EMAIL?: string;
      PUBLIC_SITE_URL?: string;
    }
  }
}
