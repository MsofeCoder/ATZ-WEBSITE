/** Central site constants — contact details, routes, and locale helpers. */

import type { Lang } from "@/dictionaries";

export const PHONE_E164 = "+255794557333";
export const PHONE_DISPLAY = "+255 794 557 333";
export const WA_URL = `https://wa.me/${PHONE_E164.replace("+", "")}`;
export const EMAIL = "info@atzcompany.co.tz";
export const LOCALITY = "Morogoro";
export const COUNTRY = "TZ";
export const FOUNDING_YEAR = 2025;

/** Rendered in the footer so the notice never goes stale. */
export const currentYear = () => new Date().getFullYear();

/**
 * Locale-aware path builder.
 *
 * English lives at the root (`/contact`); Swahili is prefixed (`/sw/contact`).
 * Every internal link must go through this so a locale is never dropped.
 */
export function localePath(lang: Lang, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (lang === "sw") return `/sw${clean}` || "/sw";
  return clean || "/";
}

/** Strips a leading `/sw` so a path can be re-prefixed for another locale. */
export function stripLocale(pathname: string): string {
  if (pathname === "/sw") return "/";
  if (pathname.startsWith("/sw/")) return pathname.slice(3);
  return pathname;
}

/** The locale a pathname belongs to. */
export function langFromPathname(pathname: string): Lang {
  return pathname === "/sw" || pathname.startsWith("/sw/") ? "sw" : "en";
}

/** Section anchors on the home page, as locale-aware hrefs. */
export const SECTIONS = ["ecosystem", "approach", "about", "values"] as const;
export type SectionId = (typeof SECTIONS)[number];

export function sectionHref(lang: Lang, id: SectionId): string {
  return `${localePath(lang, "/")}#${id}`;
}

/** Every content route, used by the sitemap and the language switcher. */
export const ROUTES = ["/", "/contact", "/privacy", "/terms"] as const;
export type Route = (typeof ROUTES)[number];

/** ISO date the privacy policy and terms were last revised. */
export const LEGAL_LAST_UPDATED = "2026-09-08";
