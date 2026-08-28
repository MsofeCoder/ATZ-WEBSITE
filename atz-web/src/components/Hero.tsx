"use client";

import { useState, useCallback } from "react";
import gsap from "gsap";
import type { Dict } from "@/dictionaries";
import ConstellationCanvas from "./ConstellationCanvas";
import SolarSystemHero from "./SolarSystemHero";
import CountUp from "./CountUp";
import ConsultationModal from "./ConsultationModal";
import { WA_URL as WA } from "@/lib/site";

let scrollToRegistered = false;
async function ensureScrollTo() {
  if (scrollToRegistered) return;
  const [{ ScrollToPlugin }, { ScrollTrigger }] = await Promise.all([
    import("gsap/ScrollToPlugin"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);
  scrollToRegistered = true;
}

type Brand = "md" | "ai" | "mc";

export default function Hero({ dict, onActiveCardChange }: { dict: Dict; onActiveCardChange?: (id: Brand) => void }) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSatelliteSelect = useCallback(
    (id: Brand) => {
      ensureScrollTo().then(() => {
        gsap.to(window, {
          scrollTo: { y: "#ecosystem", offsetY: 80 },
          duration: 1.2,
          delay: 0.3,
          ease: "power3.inOut",
          onComplete: () => {
            onActiveCardChange?.(id);
          },
        });
      });
    },
    [onActiveCardChange]
  );

  return (
    <section className="relative overflow-hidden bg-navy-deep py-24 text-white md:pt-[120px]">
      <ConstellationCanvas />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 400px at 85% 8%, rgba(201,168,76,0.14), transparent 60%), radial-gradient(500px 380px at 8% 92%, rgba(201,168,76,0.08), transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-1 mx-auto max-w-[1180px] px-8">
        <div className="grid items-center gap-15 lg:grid-cols-[1.15fr_0.85fr] max-lg:grid-cols-1">
          <div>
            <div className="rise d1 mb-5 flex items-center gap-3 text-gold-soft" style={{ animationDelay: ".05s" }}>
              <span className="h-px w-[38px] bg-gold-soft opacity-60" aria-hidden="true" />
              {dict.hero.eyebrow}
            </div>
            <h1 className="rise d2 max-w-[840px] font-display text-4xl font-extrabold leading-[1.08] text-white md:text-[4rem]" style={{ animationDelay: ".18s" }}>
              {dict.hero.h1a}{" "}
              <span className="text-md-b">{dict.hero.design}</span>{" "}
              <span className="text-ai-a">{dict.hero.ai}</span>{" "}
              <span className="text-mc-b">{dict.hero.code}</span>{" "}
              {dict.hero.h1b}
            </h1>
            <p className="rise d3 mt-5 max-w-[600px] font-serif-accent text-xl italic text-gold-soft md:text-[1.4rem]" style={{ animationDelay: ".32s" }}>
              &ldquo;{dict.hero.slogan}&rdquo;
            </p>
            <p className="rise d4 mb-10 mt-5 max-w-[580px] text-white/70" style={{ animationDelay: ".46s" }}>
              {dict.hero.sub}
            </p>
            <div className="rise d5 flex flex-wrap items-center gap-4" style={{ animationDelay: ".6s" }}>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-sm bg-gold px-7 py-4 font-display text-sm font-bold text-navy-deep transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(201,168,76,0.25)] active:translate-y-0 active:scale-[0.98]"
              >
                {dict.nav.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </button>
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-sm border border-white/20 bg-[#1F3A2E] px-6 py-4 font-display text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#25D366] hover:text-navy-deep"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" /><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>
                {dict.hero.whatsapp}
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
            <SolarSystemHero dict={dict} onSelect={handleSatelliteSelect} />
          </div>
        </div>

        <div className="rise d5 mt-14 flex flex-wrap gap-9" style={{ animationDelay: ".6s" }}>
          <div className="border-l-2 border-gold pl-3.5">
            <b className="block font-display text-[1.7rem] font-black text-white"><CountUp target={3} /></b>
            <span className="text-sm text-white/60">{dict.hero.stat1}</span>
          </div>
          <div className="border-l-2 border-gold pl-3.5">
            <b className="block font-display text-[1.7rem] font-black text-white"><CountUp target={50} suffix="+" /></b>
            <span className="text-sm text-white/60">{dict.hero.stat2}</span>
          </div>
          <div className="border-l-2 border-gold pl-3.5">
            <b className="block font-display text-[1.7rem] font-black text-white">Morogoro</b>
            <span className="text-sm text-white/60">{dict.hero.stat3}</span>
          </div>
        </div>
      </div>

      <ConsultationModal dict={dict} open={modalOpen} onClose={() => setModalOpen(false)} />

      <style jsx global>{`
        .rise {
          opacity: 0;
          transform: translateY(22px);
          animation: riseIn 0.8s cubic-bezier(0.22, 0.9, 0.35, 1) forwards;
        }
        @keyframes riseIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rise { opacity: 1; transform: none; animation: none; }
        }
      `}</style>
    </section>
  );
}
