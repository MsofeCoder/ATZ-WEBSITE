/**
 * Dictionary access.
 *
 * `getDictionary` pulls in *both* locales, so it belongs to server components
 * only — importing it from a client component ships every language to the
 * browser. Client components take their copy as a prop and import `Lang` from
 * `@/lib/locales`, which carries no copy at all.
 */
import en from "./en";
import sw from "./sw";
import type { Lang } from "@/lib/locales";

export type { Dict } from "./en";
export type { Lang } from "@/lib/locales";
export { LANGS, DEFAULT_LANG, isLang } from "@/lib/locales";

const dictionaries = { en, sw };

export const getDictionary = (lang: Lang) => dictionaries[lang];
