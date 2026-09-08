import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Exclude only deployments we can *positively identify* as non-canonical.
  //
  // The previous test required VERCEL_ENV === "production" to allow indexing.
  // That variable exists only on Vercel, so any other production host — a
  // self-hosted Node server, a container, another platform — failed the test
  // and served `Disallow: /` for the entire site. Nothing would have failed
  // or logged; the traffic would simply have disappeared. Inverting the check
  // means an unknown environment defaults to indexable, and only Vercel's own
  // preview and development deployments are held back.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
