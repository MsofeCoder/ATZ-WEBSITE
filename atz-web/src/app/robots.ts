import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Preview and branch deployments must never be indexed — only the canonical
  // production host serves an allow rule.
  const isCanonicalHost =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV !== "production";

  if (!isCanonicalHost) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
