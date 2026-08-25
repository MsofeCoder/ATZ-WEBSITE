"use client";

import { useEffect } from "react";

/** Sets <html lang> to match the current route's language (server layout is static). */
export default function HtmlLang({ lang }: { lang: "en" | "sw" }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
