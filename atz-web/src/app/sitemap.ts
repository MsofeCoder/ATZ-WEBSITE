import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atzcompany.co.tz";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { en: BASE, sw: `${BASE}/sw` } },
    },
    {
      url: `${BASE}/sw`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { en: BASE, sw: `${BASE}/sw` } },
    },
  ];
}
