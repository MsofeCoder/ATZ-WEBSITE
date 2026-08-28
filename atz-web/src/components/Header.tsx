"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Dict, Lang } from "@/dictionaries";
import ConsultationModal from "./ConsultationModal";

export default function Header({ dict, lang }: { dict: Dict; lang: Lang }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  const links = [
    { href: "/#ecosystem", label: dict.nav.companies },
    { href: "/#testimonials", label: dict.nav.testimonials },
    { href: "/#about", label: dict.nav.about },
    { href: "/#values", label: dict.nav.values },
    { href: "/contact", label: dict.footer.contact },
  ];

  // Context-aware language toggle — preserves the current page
  const getLangHref = (target: Lang) => {
    if (target === lang) return pathname;
    if (target === "sw") {
      return pathname.startsWith("/sw") ? pathname : pathname === "/" ? "/sw" : `/sw${pathname}`;
    }
    return pathname.startsWith("/sw") ? pathname.slice(3) || "/" : pathname;
  };

  return (
    <>
      <header className="sticky top-0 z-60 border-b border-navy/[0.08] bg-cream/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-3.5">
          <Link href={lang === "sw" ? "/sw" : "/"} className="flex items-center gap-3">
            <Image src="/ATZ_LOGO.png" alt="ATZ Company Limited" width={38} height={38} className="h-[38px] w-[38px]" />
            <div className="font-display text-[1.02rem] font-extrabold text-navy">
              ATZ <span className="text-gold">COMPANY LIMITED</span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="relative pb-1 font-display text-sm font-semibold text-navy opacity-75 transition hover:opacity-100 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:after:w-full">
                {l.label}
              </Link>
            ))}
            <div className="inline-flex overflow-hidden rounded-full border border-navy/20" role="group" aria-label="Language / Lugha">
              <Link href={getLangHref("en")} aria-pressed={lang === "en"} className={`px-3 py-1.5 font-display text-xs font-bold tracking-wider ${lang === "en" ? "bg-navy text-white" : "text-navy hover:bg-navy/5"}`}>EN</Link>
              <Link href={getLangHref("sw")} aria-pressed={lang === "sw"} className={`px-3 py-1.5 font-display text-xs font-bold tracking-wider ${lang === "sw" ? "bg-navy text-white" : "text-navy hover:bg-navy/5"}`}>SW</Link>
            </div>
            <button onClick={() => setModalOpen(true)} className="rounded-sm bg-navy px-5 py-2.5 font-display text-sm font-bold text-white transition hover:bg-gold hover:text-navy-deep">
              {dict.nav.cta}
            </button>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center text-navy lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"} />
            </svg>
          </button>
        </nav>

        <div
          id="mobile-menu"
          className={`flex flex-col overflow-hidden border-t border-navy/[0.08] bg-cream px-8 transition-all duration-300 max-lg:block ${
            menuOpen ? "max-h-[480px] pb-5 pt-2" : "max-h-0"
          }`}
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="border-b border-navy/[0.08] py-3.5 font-display text-base font-semibold text-navy">
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="inline-flex overflow-hidden rounded-full border border-navy/20" role="group" aria-label="Language / Lugha">
              <Link href={getLangHref("en")} onClick={() => setMenuOpen(false)} className={`px-3 py-1.5 font-display text-xs font-bold ${lang === "en" ? "bg-navy text-white" : "text-navy"}`}>EN</Link>
              <Link href={getLangHref("sw")} onClick={() => setMenuOpen(false)} className={`px-3 py-1.5 font-display text-xs font-bold ${lang === "sw" ? "bg-navy text-white" : "text-navy"}`}>SW</Link>
            </div>
            <button onClick={() => { setMenuOpen(false); setModalOpen(true); }} className="flex-1 rounded-sm bg-navy px-5 py-2.5 text-center font-display text-sm font-bold text-white transition hover:bg-gold hover:text-navy-deep">
              {dict.nav.cta}
            </button>
          </div>
        </div>
      </header>

      <ConsultationModal dict={dict} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
