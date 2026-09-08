import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { ROUTES, localePath } from "@/lib/site";
import { LANGS } from "@/dictionaries";

/** Priority by route depth — the home page first, legal pages last. */
const PRIORITY: Record<string, number> = {
  "/": 1,
  "/contact": 0.8,
  "/privacy": 0.3,
  "/terms": 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.flatMap((route) =>
    LANGS.map((lang) => ({
      url: `${SITE_URL}${localePath(lang, route)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      // The Swahili tree ranks a shade below its English counterpart.
      priority: (PRIORITY[route] ?? 0.5) * (lang === "en" ? 1 : 0.9),
      alternates: {
        languages: Object.fromEntries(LANGS.map((l) => [l, `${SITE_URL}${localePath(l, route)}`])),
      },
    }))
  );
}
