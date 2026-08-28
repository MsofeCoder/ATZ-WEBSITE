"use client";

import { useState } from "react";
import type { Dict } from "@/dictionaries";
import { WA_URL } from "@/lib/site";
import Hero from "@/components/Hero";
import HtmlLang from "@/components/HtmlLang";
import Ecosystem from "@/components/Ecosystem";
import Testimonials from "@/components/Testimonials";
import { FounderQuoteAndValues } from "@/components/FounderQuote";
import CtaBand from "@/components/CtaBand";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Brand = "md" | "ai" | "mc";

export default function HomePage({ dict, lang }: { dict: Dict; lang: "en" | "sw" }) {
  // Shared state: satellite click in the hero opens the matching company card
  const [activeCard, setActiveCard] = useState<Brand | null>(null);

  return (
    <>
      <HtmlLang lang={lang} />
      <Header dict={dict} lang={lang} />
      <main>
        <Hero dict={dict} onActiveCardChange={(id) => setActiveCard(id)} />
        <Ecosystem dict={dict} activeCard={activeCard} />
        <Testimonials dict={dict} />
        <FounderQuoteAndValues dict={dict} lang={lang} />
        {/* CTA band with its own modal opener */}
        <CtaWithModal dict={dict} />
      </main>
      <Footer dict={dict} />

      {/* WhatsApp floating action button */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] text-navy-deep shadow-xl transition hover:scale-105 hover:shadow-2xl"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[26px] w-[26px]" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>
      </a>
    </>
  );
}

// CtaBand is client; needs modal state at this level
import ConsultationModal from "@/components/ConsultationModal";

function CtaWithModal({ dict }: { dict: Dict }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CtaBand dict={dict} onOpenModal={() => setOpen(true)} />
      <ConsultationModal dict={dict} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
