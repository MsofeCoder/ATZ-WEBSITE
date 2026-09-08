/**
 * Locale primitives — the tag set, and nothing else.
 *
 * Deliberately separate from `@/dictionaries`: a client component that needs
 * to know which locales exist (the language switcher, say) must not drag the
 * entire bilingual copy deck into the browser bundle with it. Importing
 * `LANGS` from the dictionary module used to ship every Swahili string to
 * every English visitor.
 */

export type Lang = "en" | "sw";
export const LANGS: readonly Lang[] = ["en", "sw"] as const;
export const DEFAULT_LANG: Lang = "en";

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}
