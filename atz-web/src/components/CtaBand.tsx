"use client";

import { useState } from "react";
import type { Dict } from "@/dictionaries";

export default function CtaBand({ dict, onOpenModal }: { dict: Dict; onOpenModal: () => void }) {
  const [modalOpen] = useState(false);
  void modalOpen;
  return (
    <section id="contact" className="relative overflow-hidden bg-gold py-20">
      <div className="absolute -right-15 -top-15 h-[280px] w-[280px] rounded-full border-[40px] border-navy/[0.06]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-10 px-8">
        <div>
          <h2 className="max-w-[520px] font-display text-3xl font-extrabold text-navy-deep">{dict.cta.h2}</h2>
          <p className="mt-2.5 max-w-[440px] text-navy-deep/75">{dict.cta.p}</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-2.5 rounded-sm bg-navy-deep px-7 py-4 font-display text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {dict.nav.cta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </button>
          <a
            href="https://wa.me/255794557333"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2.5 rounded-sm border border-navy-deep/15 bg-navy-deep/[0.08] px-6 py-4 font-display text-sm font-bold text-navy-deep transition hover:bg-[#25D366]"
          >
            {dict.cta.whatsapp}
          </a>
        </div>
      </div>
    </section>
  );
}
