"use client";

import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Dict } from "@/dictionaries";
import { WA_URL } from "@/lib/site";
import HeroOrbit from "@/components/hero-orbit/HeroOrbit";
import CountUp from "@/components/CountUp";
import { useConsultation } from "@/components/providers/ConsultationProvider";
import { useEntrance } from "@/components/motion/useEntrance";
import { PRESS, staggerContainer, staggerItem } from "@/components/motion/variants";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import ArrowRight from "@/components/icons/ArrowRight";

/**
 * The hero.
 *
 * Copy enters as a stagger — eyebrow, headline, slogan, lede, CTAs, stats —
 * driven by `useEntrance`, so the server HTML is complete and the choreography
 * is layered on after hydration. As the visitor scrolls, the text column
 * drifts up and fades a little faster than the page (a parallax of ~60px
 * across the hero height), which hands attention to the orbit scene and then
 * to the next section. Under reduced motion neither happens.
 */
export default function Hero({ dict }: { dict: Dict }) {
  const { open: openConsultation } = useConsultation();
  const sectionRef = useRef<HTMLElement>(null);
  const phase = useEntrance();
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.15]);

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      className="bg-navy-deep relative flex min-h-[100dvh] flex-col justify-between overflow-hidden text-white"
    >
      {/* Ambient light washes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(750px 480px at 80% 10%, rgba(201,168,76,0.18), transparent 65%), radial-gradient(600px 420px at 10% 90%, rgba(201,168,76,0.10), transparent 60%), radial-gradient(900px 600px at 50% 115%, rgba(10,37,64,0.65), transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Subtle tech grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 45%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 45%, black, transparent)",
        }}
        aria-hidden="true"
      />
      {/* Edge vignette for cinematic depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 45%, rgba(6,10,22,0.65) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Main hero content container */}
      <div className="relative z-[1] mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 pt-16 pb-2 sm:px-8 md:pt-18">
        <div className="grid items-center gap-4 lg:grid-cols-[0.88fr_1.25fr] lg:gap-8 xl:grid-cols-[0.82fr_1.35fr]">
          <div className="hero-text-col">
            <m.div
              className="hero-entrance flex flex-col items-start"
              // Scroll-linked values are not animations, so MotionConfig's
              // reduced-motion setting does not reach them; gate them here.
              style={{ y: reduced ? 0 : textY, opacity: reduced ? 1 : textOpacity }}
              variants={staggerContainer(0.09, 0.05)}
              animate={phase}
            >
              {/* Eyebrow badge */}
              <m.p
                variants={staggerItem}
                className="font-display text-gold-soft mb-2.5 inline-flex items-center gap-2 rounded-full border border-[rgba(228,206,143,0.25)] bg-[rgba(228,206,143,0.08)] px-3 py-1 text-[0.7rem] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(201,168,76,0.1)] backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="bg-gold absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-gold relative inline-flex h-2 w-2 rounded-full" />
                </span>
                {dict.hero.eyebrow}
              </m.p>

              {/* Main headline */}
              <m.h1
                variants={staggerItem}
                className="font-display text-2xl leading-[1.08] font-extrabold tracking-[-0.02em] text-balance text-white sm:text-3xl md:text-[2.4rem] lg:text-[2.85rem] xl:text-[3.25rem]"
              >
                {dict.hero.h1a}{" "}
                <span className="gradient-shimmer bg-gradient-to-r from-[#E91E8C] via-[#D946EF] to-[#B14AE2] bg-clip-text text-transparent">
                  {dict.hero.design}
                </span>{" "}
                <span className="gradient-shimmer bg-gradient-to-r from-[#00BCD4] via-[#4DD0E1] to-[#6EF3FF] bg-clip-text text-transparent">
                  {dict.hero.ai}
                </span>{" "}
                <span className="gradient-shimmer bg-gradient-to-r from-[#69F0AE] via-[#81C784] to-[#A5D6A7] bg-clip-text text-transparent">
                  {dict.hero.code}
                </span>{" "}
                {dict.hero.h1b}
              </m.h1>

              {/* Slogan */}
              <m.p
                variants={staggerItem}
                className="font-serif-accent text-gold-soft mt-2 text-sm italic sm:text-base md:text-[1.15rem]"
              >
                &ldquo;{dict.hero.slogan}&rdquo;
              </m.p>

              {/* Value proposition subtext */}
              <m.p
                variants={staggerItem}
                className="mt-2 mb-4 max-w-[500px] text-[0.88rem] leading-relaxed text-pretty text-white/75 sm:text-[0.94rem]"
              >
                {dict.hero.sub}
              </m.p>

              {/* CTA action buttons */}
              <m.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
                <m.button
                  type="button"
                  onClick={openConsultation}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={PRESS}
                  className="cta-glow font-display text-navy-deep inline-flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] px-7 py-3.5 text-sm font-extrabold shadow-[0_4px_20px_rgba(201,168,76,0.35)] transition-shadow duration-200 hover:shadow-[0_8px_28px_rgba(201,168,76,0.5)]"
                >
                  {dict.nav.cta}
                  <ArrowRight />
                </m.button>
                <m.a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={PRESS}
                  className="font-display inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-950/40 px-5 py-3.5 text-sm font-bold text-emerald-300 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:border-emerald-400 hover:bg-emerald-900/60 hover:text-white"
                >
                  <WhatsAppIcon />
                  {dict.hero.whatsapp}
                </m.a>
              </m.div>

              {/* Orbit interaction hint — desktop only, aria-hidden */}
              <m.p variants={staggerItem} className="orbit-hint hidden lg:block" aria-hidden="true">
                {dict.hero.orbitHint}
              </m.p>
            </m.div>
          </div>

          {/* 3D Orbit column */}
          <div className="flex w-full flex-col items-center justify-center lg:max-w-none">
            <HeroOrbit dict={dict} scrollProgress={scrollYProgress} />
            {/* Below `lg` the scene is static and touch-first; say so once. */}
            <p
              className="font-display mt-1 text-[0.68rem] font-semibold tracking-[0.14em] text-white/45 uppercase lg:hidden"
              aria-hidden="true"
            >
              {dict.hero.tapHint}
            </p>
          </div>
        </div>

        {/* Executive Stats Bar */}
        <m.dl
          variants={staggerContainer(0.08, 0.55)}
          animate={phase}
          className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md sm:mt-5 sm:grid-cols-4 sm:gap-6 sm:divide-x sm:divide-white/10"
        >
          {[
            { value: <CountUp target={3} />, label: dict.hero.stat1 },
            { value: "100%", label: dict.hero.stat2 },
            { value: "< 24h", label: dict.hero.stat3 },
            { value: "2025", label: dict.hero.stat4 },
          ].map((s, i) => (
            <m.div
              key={i}
              variants={staggerItem}
              className={`flex flex-col ${i > 0 ? "sm:pl-6" : ""}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="m-0">
                <b className="font-display block text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {s.value}
                </b>
                <span
                  className="text-[0.75rem] font-medium tracking-wide text-white/55 uppercase"
                  aria-hidden="true"
                >
                  {s.label}
                </span>
              </dd>
            </m.div>
          ))}
        </m.dl>
      </div>

      {/* Subtle scroll cue */}
      <m.div
        className="text-gold-soft/70 pointer-events-none flex flex-col items-center gap-1 pb-2"
        aria-hidden="true"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-display text-[0.58rem] font-bold tracking-[0.25em] uppercase opacity-75">
          Scroll
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </m.div>
    </section>
  );
}
