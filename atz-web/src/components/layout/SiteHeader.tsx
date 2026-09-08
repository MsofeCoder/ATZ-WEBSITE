"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Dict } from "@/dictionaries";
import { LANGS, type Lang } from "@/lib/locales";
import { localePath, stripLocale, sectionHref } from "@/lib/site";
import { useConsultation } from "@/components/providers/ConsultationProvider";

const LANG_LABEL: Record<Lang, string> = { en: "EN", sw: "SW" };

export default function SiteHeader({ dict, lang }: { dict: Dict; lang: Lang }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? localePath(lang, "/");
  const { open: openConsultation } = useConsultation();
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Every internal link is built through localePath, so a Swahili visitor
  // never gets silently dropped onto the English tree.
  const links = [
    { href: sectionHref(lang, "ecosystem"), label: dict.nav.companies },
    { href: sectionHref(lang, "approach"), label: dict.nav.approach },
    { href: sectionHref(lang, "about"), label: dict.nav.about },
    { href: sectionHref(lang, "values"), label: dict.nav.values },
    { href: localePath(lang, "/contact"), label: dict.footer.contact },
  ];

  /** Same page, other language — keeps the visitor where they were. */
  const langHref = (target: Lang) =>
    target === lang ? pathname : localePath(target, stripLocale(pathname));

  // Close the mobile menu when the route changes. Adjusting state during
  // render is React's documented pattern for this — an effect here would
  // paint the open menu on the new page first, then close it.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Escape closes the menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const langSwitch = (onNavigate?: () => void) => (
    <div
      className="border-navy/20 inline-flex overflow-hidden rounded-full border"
      role="group"
      aria-label={dict.a11y.langGroup}
    >
      {LANGS.map((l) => (
        <Link
          key={l}
          href={langHref(l)}
          hrefLang={l}
          onClick={onNavigate}
          aria-current={l === lang ? "true" : undefined}
          // Roomier on touch: these chips sat at roughly 40×28, under the
          // 44px minimum target, and they are the control a Swahili speaker
          // landing on the English page reaches for first.
          className={`font-display flex min-h-11 items-center px-4 text-xs font-bold tracking-wider transition sm:min-h-0 sm:px-3 sm:py-1.5 ${
            l === lang ? "bg-navy text-white" : "text-navy hover:bg-navy/5"
          }`}
        >
          {LANG_LABEL[l]}
        </Link>
      ))}
    </div>
  );

  return (
    <header className="border-navy/[0.08] bg-cream/90 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav
        aria-label={dict.a11y.primaryNav}
        className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 md:px-8"
      >
        <Link
          href={localePath(lang, "/")}
          className="flex shrink-0 items-center gap-3"
          aria-label="ATZ Company Limited"
        >
          <Image
            src="/ATZ_LOGO.png"
            alt=""
            width={38}
            height={38}
            priority
            className="h-[38px] w-[38px]"
          />
          <span
            aria-hidden="true"
            className="font-display text-navy text-[0.95rem] leading-tight font-extrabold sm:text-[1.02rem]"
          >
            ATZ <span className="text-gold-ink hidden sm:inline">COMPANY LIMITED</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-display text-navy after:bg-gold relative pb-1 text-sm font-semibold opacity-75 transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:transition-all hover:opacity-100 hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
          {langSwitch()}
          <button
            type="button"
            onClick={openConsultation}
            className="bg-navy font-display hover:bg-gold hover:text-navy-deep rounded-sm px-5 py-2.5 text-sm font-bold text-white transition"
          >
            {dict.nav.cta}
          </button>
        </div>

        <div className="ml-auto shrink-0 lg:hidden">{langSwitch()}</div>

        <button
          type="button"
          className="text-navy flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? dict.a11y.closeMenu : dict.a11y.openMenu}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"} />
          </svg>
        </button>
      </nav>

      <div
        id={menuId}
        ref={panelRef}
        // `hidden` (not just max-height) so collapsed links stay out of the
        // tab order and the accessibility tree.
        hidden={!menuOpen}
        className="border-navy/[0.08] bg-cream flex flex-col border-t px-5 pt-2 pb-5 md:px-8 lg:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className="border-navy/[0.08] font-display text-navy border-b py-3.5 text-base font-semibold"
          >
            {l.label}
          </Link>
        ))}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openConsultation();
            }}
            className="bg-navy font-display hover:bg-gold hover:text-navy-deep flex-1 rounded-sm px-5 py-2.5 text-center text-sm font-bold text-white transition"
          >
            {dict.nav.cta}
          </button>
        </div>
      </div>
    </header>
  );
}
