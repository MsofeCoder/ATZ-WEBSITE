"use client";

import Link from "next/link";
import type { Lang } from "@/lib/locales";
import { LANGS } from "@/lib/locales";

/* ------------------------------------------------------------------ */
/* Inline flag marks — no image requests, crisp at any DPR              */
/* Both are simplified to read at 20×14px; neither uses <clipPath>, so  */
/* the toggle can render twice on one page (desktop + mobile bars)      */
/* without duplicate-id collisions.                                     */
/* ------------------------------------------------------------------ */

/** United Kingdom — Union Flag, simplified (no counterchange on the saltire). */
function UKFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#ffffff" strokeWidth="8" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3.2" />
      <path d="M30 0v40M0 20h60" stroke="#ffffff" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7.5" />
    </svg>
  );
}

/** Tanzania — green over blue, split by a black band with gold fimbriation. */
function TZFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#1EB53A" />
      <path d="M0 40L60 0V40Z" fill="#00A3DD" />
      <path d="M0 40L60 0" stroke="#FCD116" strokeWidth="15" />
      <path d="M0 40L60 0" stroke="#000000" strokeWidth="9" />
    </svg>
  );
}

const LANG_META: Record<Lang, { label: string; shortLabel: string; Flag: typeof UKFlag }> = {
  en: { label: "English", shortLabel: "EN", Flag: UKFlag },
  sw: { label: "Kiswahili", shortLabel: "SW", Flag: TZFlag },
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

/**
 * EN / SW switch. A sliding navy pill marks the active language; each option
 * is a real link, so the switch works without JavaScript and keeps the
 * visitor on the same page in the other language.
 */
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
        const { label, shortLabel, Flag } = LANG_META[l];
        const isActive = l === lang;

        return (
          <Link
            key={l}
            href={langHref(l)}
            hrefLang={l}
            lang={l}
            title={label}
            onClick={onNavigate}
            aria-current={isActive ? "true" : undefined}
            className={`lang-toggle__option ${isActive ? "lang-toggle__option--active" : ""}`}
          >
            <span className="lang-toggle__flag" aria-hidden="true">
              <Flag />
            </span>
            <span className="lang-toggle__label">
              {shortLabel}
              <span className="sr-only"> — {label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
