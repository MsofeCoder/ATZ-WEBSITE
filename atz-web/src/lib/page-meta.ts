/**
 * Per-route, per-locale metadata.
 *
 * Both locale trees call these, so a title or canonical can only be defined
 * once. Copy comes from the dictionary; URL shapes come from `localePath`.
 */
import type { Metadata } from "next";
import { getDictionary, type Lang } from "@/dictionaries";
import { alternatesFor, openGraphFor } from "./seo";

function build(
  lang: Lang,
  route: string,
  title: string,
  description: string,
  ogDescription = description
): Metadata {
  return {
    title,
    description,
    alternates: alternatesFor(lang, route),
    openGraph: { ...openGraphFor(lang, route), title, description: ogDescription },
    // No `images` here: Next fills both OG and Twitter from the generated
    // opengraph-image route, which renders a real 1200×630 card per locale.
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
    },
  };
}

export function homeMetadata(lang: Lang): Metadata {
  const d = getDictionary(lang).seo;
  return build(lang, "/", d.homeTitle, d.homeDesc, d.homeOgDesc);
}

export function contactMetadata(lang: Lang): Metadata {
  const d = getDictionary(lang).seo;
  return build(lang, "/contact", d.contactTitle, d.contactDesc);
}

export function privacyMetadata(lang: Lang): Metadata {
  const d = getDictionary(lang).seo;
  return build(lang, "/privacy", d.privacyTitle, d.privacyDesc);
}

export function termsMetadata(lang: Lang): Metadata {
  const d = getDictionary(lang).seo;
  return build(lang, "/terms", d.termsTitle, d.termsDesc);
}
