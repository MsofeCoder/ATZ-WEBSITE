"use client";

import { useState } from "react";
import type { Dict } from "@/dictionaries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsultationModal from "@/components/ConsultationModal";
import HtmlLang from "@/components/HtmlLang";
import { WA_URL as WA, EMAIL } from "@/lib/site";

export default function ContactPage({ dict, lang }: { dict: Dict; lang: "en" | "sw" }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <HtmlLang lang={lang} />
      <Header dict={dict} lang={lang} />
      <main className="min-h-screen bg-[#F3F4F7] py-[120px]">
        <div className="mx-auto max-w-[1180px] px-8">
          <div className="mx-auto max-w-[700px] text-center">
            <span className="mb-3.5 inline-flex items-center gap-2.5 font-display text-xs font-bold uppercase tracking-widest text-navy before:h-0.5 before:w-[26px] before:bg-gold">
              {dict.footer.contact}
            </span>
            <h1 className="font-display text-4xl font-extrabold text-navy md:text-[2.7rem]">
              {dict.cta.h2}
            </h1>
            <p className="mt-4 text-slate-ink">{dict.cta.p}</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[900px] gap-10 md:grid-cols-2">
            {/* Quick contact cards */}
            <div className="rounded-md border border-navy/10 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-deep/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-gold" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-extrabold text-navy">{dict.contact.callWa}</h3>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-2 block text-gold transition hover:text-gold-soft">
                +255 794 557 333
              </a>
            </div>

            <div className="rounded-md border border-navy/10 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-deep/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-gold" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-extrabold text-navy">{dict.contact.email}</h3>
              <a href={`mailto:${EMAIL}`} className="mt-2 block text-gold transition hover:text-gold-soft">
                {EMAIL}
              </a>
            </div>

            <div className="rounded-md border border-navy/10 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-deep/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-gold" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-extrabold text-navy">{dict.contact.location}</h3>
              <p className="mt-2 text-slate-ink">{dict.contact.locationValue}</p>
            </div>

            <div className="rounded-md border border-navy/10 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-deep/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-gold" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-extrabold text-navy">{dict.contact.response}</h3>
              <p className="mt-2 text-slate-ink">{dict.contact.responseValue}</p>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-[600px] text-center">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2.5 rounded-sm bg-gold px-8 py-4 font-display text-sm font-bold text-navy-deep transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {dict.nav.cta}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </main>
      <Footer dict={dict} />
      <ConsultationModal dict={dict} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
