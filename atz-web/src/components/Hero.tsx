"use client";

import type { Dict } from "@/dictionaries";
import { WA_URL } from "@/lib/site";
import HeroOrbit from "@/components/hero-orbit/HeroOrbit";
import CountUp from "@/components/CountUp";
import { useConsultation } from "@/components/providers/ConsultationProvider";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import ArrowRight from "@/components/icons/ArrowRight";

export default function Hero({ dict }: { dict: Dict }) {
  const { open: openConsultation } = useConsultation();

  return (
    <section className="bg-navy-deep relative overflow-hidden py-20 text-white md:pt-[120px]">
      {/* Ambient light washes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 460px at 82% 4%, rgba(201,168,76,0.16), transparent 62%), radial-gradient(560px 420px at 6% 96%, rgba(201,168,76,0.09), transparent 62%), radial-gradient(900px 600px at 50% 120%, rgba(10,37,64,0.55), transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-[1] mx-auto max-w-[1180px] px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-15">
          <div>
            {/* The eyebrow and the h1 deliberately carry no entrance
                animation. `.rise` starts at opacity 0, which disqualifies an
                element from being the Largest Contentful Paint — the headline
                would sit out the metric and LCP would fall to a decorative
                graphic in the orbit instead. These two paint immediately;
                everything below them still animates in. */}
            <p className="font-display text-gold-soft mb-5 flex items-center gap-3 text-xs font-bold tracking-[0.22em] uppercase">
              <span className="bg-gold-soft h-px w-[38px] opacity-60" aria-hidden="true" />
              {dict.hero.eyebrow}
            </p>
            <h1 className="font-display max-w-[840px] text-[2.4rem] leading-[1.08] font-extrabold text-white sm:text-5xl md:text-[4rem]">
              {dict.hero.h1a}{" "}
              <span className="bg-gradient-to-r from-[#E91E8C] to-[#B14AE2] bg-clip-text text-transparent">
                {dict.hero.design}
              </span>{" "}
              <span className="bg-gradient-to-r from-[#00BCD4] to-[#6EF3FF] bg-clip-text text-transparent">
                {dict.hero.ai}
              </span>{" "}
              <span className="bg-gradient-to-r from-[#69F0AE] to-[#1B5E20] bg-clip-text text-transparent">
                {dict.hero.code}
              </span>{" "}
              {dict.hero.h1b}
            </h1>
            <p className="rise font-serif-accent text-gold-soft mt-5 max-w-[600px] text-lg italic [animation-delay:.08s] md:text-[1.4rem]">
              &ldquo;{dict.hero.slogan}&rdquo;
            </p>
            <p className="rise mt-5 mb-10 max-w-[580px] text-white/70 [animation-delay:.18s]">
              {dict.hero.sub}
            </p>
            <div className="rise flex flex-wrap items-center gap-4 [animation-delay:.28s]">
              <button
                type="button"
                onClick={openConsultation}
                className="bg-gold font-display text-navy-deep inline-flex items-center gap-2.5 rounded-sm px-7 py-4 text-sm font-bold transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(201,168,76,0.25)] active:translate-y-0 active:scale-[0.98]"
              >
                {dict.nav.cta}
                <ArrowRight />
              </button>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display hover:text-navy-deep inline-flex items-center gap-2.5 rounded-sm border border-white/20 bg-[#1F3A2E] px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]"
              >
                <WhatsAppIcon />
                {dict.hero.whatsapp}
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
            <HeroOrbit dict={dict} />
          </div>
        </div>

        <dl className="rise mt-14 flex flex-wrap gap-9 [animation-delay:.28s]">
          {[
            { value: <CountUp target={3} />, label: dict.hero.stat1 },
            { value: <CountUp target={3} />, label: dict.hero.stat2 },
            { value: "Morogoro", label: dict.hero.stat3 },
          ].map((s, i) => (
            <div key={i} className="border-gold border-l-2 pl-3.5">
              <dt className="sr-only">{s.label}</dt>
              <dd className="m-0">
                <b className="font-display block text-[1.7rem] font-extrabold text-white">
                  {s.value}
                </b>
                <span className="text-sm text-white/60" aria-hidden="true">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll cue */}
      <div
        className="text-gold-soft/70 pointer-events-none absolute bottom-5 left-1/2 z-[3] -translate-x-1/2 motion-safe:animate-bounce"
        aria-hidden="true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
