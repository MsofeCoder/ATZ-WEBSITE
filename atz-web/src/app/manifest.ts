import type { MetadataRoute } from "next";
import { getDictionary } from "@/dictionaries";

/**
 * Web app manifest.
 *
 * The CSP already allowed `manifest-src 'self'` and both layouts already
 * declared a `themeColor`, but nothing served a manifest — so saving the site
 * to an Android home screen produced a screenshot rather than an icon.
 *
 * English is the manifest's language: a manifest is a single document per
 * origin, and the English tree is the canonical root. `lang` and `dir` are
 * declared so the install prompt renders correctly.
 */
export default function manifest(): MetadataRoute.Manifest {
  const d = getDictionary("en");
  return {
    name: "ATZ Company Limited",
    short_name: "ATZ",
    description: d.seo.homeDesc,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0E1730",
    theme_color: "#0E1730",
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      // `any` for the launcher, `maskable` for adaptive icons — a single
      // entry claiming both makes Android crop the logo to fit its mask.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
