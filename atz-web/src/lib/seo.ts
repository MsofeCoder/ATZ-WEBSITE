/** Structured data and per-locale metadata helpers. */
import type { Metadata } from "next";
import type { Lang } from "@/dictionaries";
import { BRAND_LIST } from "./brands";
import { SITE_URL } from "./env";
import { EMAIL, PHONE_E164, LOCALITY, COUNTRY, FOUNDING_YEAR, localePath } from "./site";

export { SITE_URL };

const OG_LOCALE: Record<Lang, string> = { en: "en_US", sw: "sw_TZ" };

/** `alternates` block pointing at both locales for a given route. */
export function alternatesFor(lang: Lang, route = "/"): Metadata["alternates"] {
  return {
    canonical: localePath(lang, route),
    languages: {
      en: localePath("en", route),
      sw: localePath("sw", route),
      "x-default": localePath("en", route),
    },
  };
}

/** Shared Open Graph fields; callers add title/description. */
export function openGraphFor(lang: Lang, route = "/") {
  return {
    url: localePath(lang, route),
    siteName: "ATZ Company Limited",
    images: [
      {
        url: `/og/${lang}`,
        width: 1200,
        height: 630,
        alt: "ATZ Company Limited — design, AI and code, under one standard of craft.",
      },
    ],
    locale: OG_LOCALE[lang],
    alternateLocale: OG_LOCALE[lang === "en" ? "sw" : "en"],
    type: "website" as const,
  };
}

const SLOGAN: Record<Lang, string> = {
  en: "Empowering Vision. Engineering the Future.",
  sw: "Kuwezesha Maono. Kujenga Mustakabali.",
};

const SUB_ORG_DESC: Record<Lang, Record<string, string>> = {
  en: {
    md: "Creative studio — brand identity, logo, and web design.",
    ai: "AI consultancy — prompt engineering, automation, and AI strategy.",
    mc: "Development agency — web apps, ERP/CRM/POS, e-commerce.",
  },
  sw: {
    md: "Studio ya ubunifu — nembo, utambulisho wa chapa, na muundo wa tovuti.",
    ai: "Ushauri wa AI — maelekezo, automation, na mkakati wa AI.",
    mc: "Shirika la programu — programu za wavuti, ERP/CRM/POS, na biashara mtandaoni.",
  },
};

/** Organization JSON-LD, including the three subsidiaries. */
export function buildOrganizationJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "ATZ Company Limited",
    url: SITE_URL + localePath(lang, "/"),
    logo: `${SITE_URL}/ATZ_LOGO.png`,
    email: EMAIL,
    slogan: SLOGAN[lang],
    foundingDate: String(FOUNDING_YEAR),
    address: {
      "@type": "PostalAddress",
      addressLocality: LOCALITY,
      addressCountry: COUNTRY,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: PHONE_E164,
        email: EMAIL,
        contactType: "sales",
        areaServed: COUNTRY,
        availableLanguage: ["en", "sw"],
      },
    ],
    subOrganization: BRAND_LIST.map((b) => ({
      "@type": "Organization",
      name: b.name,
      description: SUB_ORG_DESC[lang][b.id],
      url: b.url,
    })),
  };
}

/** WebSite node — lets search engines label the site name per locale. */
export function buildWebSiteJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL + localePath(lang, "/"),
    name: "ATZ Company Limited",
    inLanguage: lang,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Breadcrumbs for interior pages. */
export function buildBreadcrumbJsonLd(lang: Lang, trail: { name: string; route: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: SITE_URL + localePath(lang, item.route),
    })),
  };
}

/**
 * Serialises JSON-LD for `dangerouslySetInnerHTML`, escaping `<` so a string
 * in the payload cannot close the script tag early.
 *
 * The replacement has to be the two-character sequence `\\u003c`, which a JSON
 * parser decodes back to `<`. Writing it as `"\u003c"` — as this did — is a no-op:
 * that escape is resolved by the *JavaScript* parser before `replace` ever
 * runs, so it substituted `<` for `<` and did nothing at all.
 *
 * Nothing was exploitable, because every value reaching here is a
 * compile-time constant. It becomes load-bearing the moment editor-authored
 * content reaches a JSON-LD field.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
