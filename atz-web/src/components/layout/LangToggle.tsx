"use client";

import Link from "next/link";
import type { Lang } from "@/lib/locales";
import { LANGS } from "@/lib/locales";

/* ------------------------------------------------------------------ */
/* Tiny inline SVG country silhouettes — no external assets needed     */
/* ------------------------------------------------------------------ */

/** Simplified United Kingdom outline */
function UKMapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" fill="currentColor" className={className} aria-hidden="true">
      {/* Great Britain simplified silhouette */}
      <path d="M14 1c-1 0-2.5 1-3 2s-1.5 1-2 2c-.3.6 0 1.5.5 2s0 1.5-.5 2-1 1.5-.5 2.5 1 1 .5 2-.5 2 0 3 1.5 1 2 2 .5 2 1 3 2 1.5 2.5 1 .5-2 1-3-.5-2 0-3 1.5-1 1.5-2-.5-2-.5-3 .5-1.5.5-2.5-1-1.5-1.5-2 0-2-.5-2.5-1-1-1-2z" />
      {/* Ireland simplified */}
      <path
        d="M5 7c-.5.5-1 1.5-.5 2.5s0 2-.5 2.5.5 1.5 1 2 1.5 0 2-.5.5-1.5 0-2.5-1-1-1-2 0-1.5-.5-2S5.5 6.5 5 7z"
        opacity="0.5"
      />
    </svg>
  );
}

/** Simplified Tanzania outline */
function TZMapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 26" fill="currentColor" className={className} aria-hidden="true">
      {/* Tanzania mainland simplified silhouette */}
      <path d="M4 2c-1 .5-1.5 1.5-2 3s0 3 .5 4.5 1.5 2.5 2 4 0 3 .5 4 1.5 1.5 3 2 3 .5 4.5 1 3.5 1 5 .5 2.5-1.5 3.5-2.5 1.5-2.5 2-4 .5-3 0-4.5-1.5-2.5-2.5-3.5-2-2-3-2.5-2-.5-3.5 0S5 1.5 4 2z" />
      {/* Zanzibar */}
      <path d="M22 11c-.3.3-.5 1-.3 1.5s.5 1 1 1 .8-.5.8-1-.2-1-.5-1.2-.7-.5-1-.3z" opacity="0.6" />
    </svg>
  );
}

const LANG_META: Record<Lang, { label: string; shortLabel: string; Icon: typeof UKMapIcon }> = {
  en: { label: "English", shortLabel: "EN", Icon: UKMapIcon },
  sw: { label: "Kiswahili", shortLabel: "SW", Icon: TZMapIcon },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface LangToggleProps {
  lang: Lang;
  langHref: (target: Lang) => string;
  ariaLabel: string;
  onNavigate?: () => void;
}

export default function LangToggle({ lang, langHref, ariaLabel, onNavigate }: LangToggleProps) {
  const activeIdx = LANGS.indexOf(lang);

  return (
    <div className="lang-toggle" role="group" aria-label={ariaLabel}>
      {/* Sliding pill indicator */}
      <span
        className="lang-toggle__pill"
        style={{ transform: `translateX(${activeIdx * 100}%)` }}
        aria-hidden="true"
      />

      {LANGS.map((l) => {
        const { shortLabel, Icon } = LANG_META[l];
        const isActive = l === lang;

        return (
          <Link
            key={l}
            href={langHref(l)}
            hrefLang={l}
            onClick={onNavigate}
            aria-current={isActive ? "true" : undefined}
            className={`lang-toggle__option ${isActive ? "lang-toggle__option--active" : ""}`}
          >
            <Icon className="lang-toggle__map" />
            <span className="lang-toggle__label">{shortLabel}</span>
          </Link>
        );
      })}
    </div>
  );
}
