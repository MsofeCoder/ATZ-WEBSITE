"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import type { Dict } from "@/dictionaries";
import { type Lang } from "@/lib/locales";
import { localePath, stripLocale, sectionHref } from "@/lib/site";
import { useConsultation } from "@/components/providers/ConsultationProvider";
import LangToggle from "@/components/layout/LangToggle";
import ScrollProgress from "@/components/motion/ScrollProgress";
import { EASE_OUT, PRESS } from "@/components/motion/variants";
import { goToScope } from "@/lib/scope-routing";

export default function SiteHeader({ dict, lang }: { dict: Dict; lang: Lang }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? localePath(lang, "/");
  const { open: openConsultation } = useConsultation();
  const menuId = useId();
  /** Scope card when it exists on this page, dialog otherwise. */
  const requestConsultation = () => goToScope(() => openConsultation());

  // Elevate the bar once the page has scrolled under it. Read through a
  // motion value rather than a scroll listener so it costs nothing per frame
  // until the threshold is actually crossed.
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

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

  const langToggle = (onNavigate?: () => void) => (
    <LangToggle
      lang={lang}
      langHref={langHref}
      ariaLabel={dict.a11y.langGroup}
      onNavigate={onNavigate}
    />
  );

  return (
    <header
      className={`border-navy/[0.08] bg-cream/90 sticky top-0 z-50 border-b backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_8px_30px_rgba(27,42,74,0.08)]" : "shadow-none"
      }`}
    >
      <ScrollProgress />
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
          {langToggle()}
          <m.button
            type="button"
            onClick={requestConsultation}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={PRESS}
            className="bg-navy font-display hover:bg-navy-deep min-h-11 rounded-sm border border-amber-500/40 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_0_rgba(234,179,8,0)] transition-all hover:border-amber-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.25)]"
          >
            {dict.nav.cta}
          </m.button>
        </div>

        <div className="ml-auto shrink-0 lg:hidden">{langToggle()}</div>

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

      <AnimatePresence initial={false}>
        {menuOpen && (
          <m.div
            id={menuId}
            key="mobile-menu"
            // Mounted only while open, so collapsed links stay out of the tab
            // order and the accessibility tree; AnimatePresence keeps the node
            // around just long enough to play the exit.
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="border-navy/[0.08] bg-cream flex flex-col border-t px-5 pt-2 pb-5 md:px-8 lg:hidden"
          >
            {links.map((l, i) => (
              <m.div
                key={l.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i + 0.05, duration: 0.25, ease: EASE_OUT }}
              >
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-navy/[0.08] font-display text-navy flex min-h-12 items-center border-b py-3.5 text-base font-semibold"
                >
                  {l.label}
                </Link>
              </m.div>
            ))}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <m.button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  requestConsultation();
                }}
                whileTap={{ scale: 0.97 }}
                transition={PRESS}
                className="bg-navy font-display hover:bg-gold hover:text-navy-deep min-h-12 flex-1 rounded-sm px-5 py-2.5 text-center text-sm font-bold text-white transition-colors"
              >
                {dict.nav.cta}
              </m.button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
