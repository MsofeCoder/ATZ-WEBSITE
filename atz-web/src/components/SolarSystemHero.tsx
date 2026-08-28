"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { Dict } from "@/dictionaries";

type Brand = "md" | "ai" | "mc";
type SolarKey = Brand | "sun";

interface BodyMeta {
  key: SolarKey;
  logo: string;
  gradient: string;
  visit: string;
}

/** Non-translatable visual/link metadata. All copy comes from dict.solar.* */
const BODIES: Record<SolarKey, BodyMeta> = {
  sun: {
    key: "sun",
    logo: "/ATZ_LOGO.png",
    gradient: "linear-gradient(120deg,#C9A84C,#E4CE8F)",
    visit: "#",
  },
  md: {
    key: "md",
    logo: "/brand-logos/md-logo.png",
    gradient: "linear-gradient(120deg,#6A0DAD,#E91E8C)",
    visit: "https://msofedesigner.blogspot.com/",
  },
  ai: {
    key: "ai",
    logo: "/brand-logos/ai-logo.png",
    gradient: "linear-gradient(120deg,#0A2540,#00BCD4)",
    visit: "https://adamuintelligence.github.io/portfolio/",
  },
  mc: {
    key: "mc",
    logo: "/brand-logos/mc-logo.png",
    gradient: "linear-gradient(120deg,#1B5E20,#69F0AE)",
    visit: "https://msofecoder.github.io/portfolio/",
  },
};

const ORBITS = [
  { key: "md" as Brand, rxF: 0.30, ryF: 0.40, period: 16, startAngle: 0.4, stroke: ["#E91E8C", "#6A0DAD"] },
  { key: "ai" as Brand, rxF: 0.48, ryF: 0.42, period: 24, startAngle: 2.6, stroke: ["#00BCD4", "#0A2540"] },
  { key: "mc" as Brand, rxF: 0.66, ryF: 0.44, period: 34, startAngle: 4.6, stroke: ["#69F0AE", "#1B5E20"] },
];

type Props = {
  dict: Dict;
  onSelect?: (id: Brand) => void;
};

export default function SolarSystemHero({ dict, onSelect }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const anglesRef = useRef<Map<Brand, number>>(new Map());
  const planetElsRef = useRef<Map<Brand, HTMLButtonElement>>(new Map());
  const tipElsRef = useRef<Map<Brand, HTMLDivElement>>(new Map());
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const playingRef = useRef(true);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [drawerKey, setDrawerKey] = useState<SolarKey | null>(null);
  const [activePlanet, setActivePlanet] = useState<Brand | null>(null);

  // Derived drawer data — all copy localized via dict.solar
  const drawerMeta = drawerKey ? BODIES[drawerKey] : null;
  const drawerCopy = drawerKey ? dict.solar[drawerKey] : null;

  const cxRef = useRef(0);
  const cyRef = useRef(0);
  const dimsRef = useRef<{ rx: number; ry: number }[]>([]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    cxRef.current = rect.width / 2;
    cyRef.current = rect.height / 2;
    const base = Math.min(rect.width, rect.height * 1.7);
    dimsRef.current = ORBITS.map((o) => ({
      rx: base * o.rxF,
      ry: base * o.rxF * o.ryF,
    }));
    // Update SVG ellipses
    const svg = svgRef.current;
    if (svg) {
      ORBITS.forEach((o, i) => {
        const el = svg.querySelector(`ellipse[data-key="${o.key}"]`);
        if (el) {
          el.setAttribute("cx", String(cxRef.current));
          el.setAttribute("cy", String(cyRef.current));
          el.setAttribute("rx", String(dimsRef.current[i].rx));
          el.setAttribute("ry", String(dimsRef.current[i].ry));
        }
      });
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Place planets at their start angles without animating
      ORBITS.forEach((o) => {
        if (!anglesRef.current.has(o.key)) anglesRef.current.set(o.key, o.startAngle);
      });
      measure();
      updatePositions();
      return;
    }

    measure();

    function updatePositions() {
      const stage = stageRef.current;
      if (!stage) return;
      const cx = cxRef.current;
      const cy = cyRef.current;
      const dims = dimsRef.current;

      ORBITS.forEach((o, i) => {
        const ang = anglesRef.current.get(o.key) ?? o.startAngle;
        const x = cx + dims[i].rx * Math.cos(ang);
        const y = cy + dims[i].ry * Math.sin(ang);
        const depth = (Math.sin(ang) + 1) / 2; // 0 = back, 1 = front
        const scale = 0.8 + 0.36 * depth;
        const opacity = 0.55 + 0.45 * depth;
        const z = depth > 0.5 ? 5 : 2;

        const btn = planetElsRef.current.get(o.key);
        if (btn) {
          btn.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${scale})`;
          btn.style.opacity = String(opacity);
          btn.style.zIndex = String(z);
        }
        const tip = tipElsRef.current.get(o.key);
        if (tip) {
          tip.style.transform = `translate(${x}px, ${y - 34 * scale}px) translate(-50%,-100%)`;
        }
      });
    }

    function frame(t: number) {
      if (!playingRef.current) {
        lastTRef.current = t;
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min((t - lastTRef.current) / 1000, 0.05);
      lastTRef.current = t;

      ORBITS.forEach((o) => {
        const prev = anglesRef.current.get(o.key) ?? o.startAngle;
        anglesRef.current.set(o.key, prev + dt * (2 * Math.PI / o.period));
      });

      updatePositions();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    const onResize = () => {
      measure();
      updatePositions();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  function openDrawer(key: SolarKey) {
    setDrawerKey(key);
    if (key !== "sun") {
      setActivePlanet(key);
      onSelect?.(key);
    }
    playingRef.current = false;
  }

  function closeDrawer() {
    setDrawerKey(null);
    setActivePlanet(null);
    playingRef.current = true;
  }

  // Escape closes the drawer; focus moves to the close button when it opens
  useEffect(() => {
    if (!drawerKey) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerKey]);

  return (
    <div className="relative w-full" style={{ height: "min(72vh, 640px)", minHeight: 380 }}>
      {/* SVG orbit paths */}
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {ORBITS.map((o) => (
            <linearGradient key={o.key} id={`grad-${o.key}`} x1="0%" x2="100%">
              <stop offset="0%" stopColor={o.stroke[0]} />
              <stop offset="100%" stopColor={o.stroke[1]} />
            </linearGradient>
          ))}
        </defs>
        {ORBITS.map((o) => (
          <ellipse
            key={o.key}
            data-key={o.key}
            fill="none"
            strokeWidth={1.4}
            strokeDasharray="2 7"
            stroke={`url(#grad-${o.key})`}
            strokeOpacity={0.55}
            // Initial values only — measure() sets real geometry via DOM after mount
            cx={0}
            cy={0}
            rx={0}
            ry={0}
          />
        ))}
      </svg>

      {/* Stage container for planets */}
      <div ref={stageRef} className="absolute inset-0" style={{ zIndex: 2 }}>
        {/* Sun button */}
        <button
          onClick={() => openDrawer("sun")}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[4] rounded-full border-none p-0"
          style={{
            width: 104,
            height: 104,
            background: "radial-gradient(circle at 35% 30%, #fff8e6, #E4CE8F 40%, #C9A84C 78%)",
            boxShadow: "0 0 30px 10px rgba(201,168,76,0.35), 0 0 90px 30px rgba(201,168,76,0.16)",
            animation: "pulseSun 5s ease-in-out infinite",
          }}
          aria-label={`ATZ Company Limited — ${dict.solar.overviewAria}`}
        >
          <Image
            src="/ATZ_LOGO.png"
            alt=""
            width={72}
            height={72}
            className="h-[70%] w-[70%] object-contain"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
          />
        </button>
        <span
          className="pointer-events-none absolute left-1/2 z-[4] whitespace-nowrap text-center font-display text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-gold-soft"
          style={{ top: "calc(50% + 66px)", transform: "translateX(-50%)" }}
        >
          {dict.solar.centre}
        </span>

        {/* Planet buttons */}
        {ORBITS.map((o) => {
          const b = BODIES[o.key];
          const copy = dict.solar[o.key];
          return (
            <button
              key={o.key}
              ref={(el) => {
                if (el) planetElsRef.current.set(o.key, el);
              }}
              className="absolute left-0 top-0 z-[3] flex items-center justify-center rounded-full border-2 border-white/85 bg-white p-[6px] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-gold"
              style={{
                width: 60,
                height: 60,
                willChange: "transform",
                boxShadow: `0 0 16px 3px ${
                  o.key === "md"
                    ? "rgba(233,30,140,0.55)"
                    : o.key === "ai"
                      ? "rgba(0,188,212,0.55)"
                      : "rgba(105,240,174,0.5)"
                }${activePlanet === o.key ? ", 0 0 0 3px #C9A84C" : ""}`,
                transform: "translate(0,0) translate(-50%,-50%) scale(0.8)",
              }}
              aria-label={`${copy.title} — ${copy.tag} — ${dict.solar.openAria}`}
              onClick={() => openDrawer(o.key)}
              onMouseEnter={() => {
                const tip = tipElsRef.current.get(o.key);
                if (tip) tip.style.opacity = "1";
              }}
              onMouseLeave={() => {
                const tip = tipElsRef.current.get(o.key);
                if (tip) tip.style.opacity = "0";
              }}
            >
              <Image
                src={b.logo}
                alt=""
                width={48}
                height={48}
                className="h-full w-full rounded-full object-contain"
              />
            </button>
          );
        })}

        {/* Tooltips */}
        {ORBITS.map((o) => {
          const copy = dict.solar[o.key];
          return (
            <div
              key={`tip-${o.key}`}
              ref={(el) => {
                if (el) tipElsRef.current.set(o.key, el);
              }}
              className="pointer-events-none absolute left-0 top-0 z-[6] whitespace-nowrap rounded-[3px] border border-white/14 bg-navy-deep/92 px-3 py-[6px] text-[0.74rem] font-bold tracking-[0.02em] text-white opacity-0 transition-opacity"
              style={{ transform: "translate(-50%,-100%)" }}
            >
              {copy.title}
              <span className="mt-0.5 block text-[0.66rem] font-medium uppercase tracking-[0.06em] text-slate-light">
                {copy.tag}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detail Drawer */}
      {drawerMeta && drawerCopy && (
        <>
          <div
            className="fixed inset-0 z-[20] bg-navy-deep/55 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawerTitle"
            className="fixed bottom-0 right-0 top-0 z-[21] flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-white/10 bg-navy-deep"
            style={{ transform: "translateX(0)", transition: "transform 0.32s cubic-bezier(.22,.9,.35,1)" }}
          >
            <div
              className="h-1.5 w-full flex-none"
              style={{ background: drawerMeta.gradient }}
            />
            <button
              ref={closeBtnRef}
              onClick={closeDrawer}
              aria-label="Close"
              className="absolute right-[18px] top-[18px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/16"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className="px-[30px] pb-10 pt-8">
              <div
                className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white p-3"
                style={{ boxShadow: "0 0 0 4px rgba(248,249,250,0.06)" }}
              >
                <Image
                  src={drawerMeta.logo}
                  alt=""
                  width={88}
                  height={88}
                  className="h-full w-full object-contain"
                />
              </div>
              <div
                className="mb-2.5 text-[0.68rem] font-bold uppercase tracking-[0.2em]"
                style={{ color: drawerMeta.key === "md" ? "#E91E8C" : drawerMeta.key === "ai" ? "#00BCD4" : drawerMeta.key === "mc" ? "#69F0AE" : "#E4CE8F" }}
              >
                {drawerCopy.tag}
              </div>
              <h2 id="drawerTitle" className="mb-2.5 text-[1.5rem] font-extrabold text-white">
                {drawerCopy.title}
              </h2>
              <p className="mb-4 font-serif-accent text-[1.05rem] italic leading-relaxed text-gold-soft">
                {drawerCopy.slogan}
              </p>
              <p className="mb-5 text-[0.92rem] leading-[1.7] text-white/72">
                {drawerCopy.desc}
              </p>
              <ul className="mb-6">
                {drawerCopy.facts.map(([label, value]) => (
                  <li
                    key={label}
                    className="flex gap-2.5 border-t border-white/8 py-2.5 text-[0.86rem] text-white/82 first:border-t-0"
                  >
                    <b className="min-w-[92px] flex-none font-bold text-white">{label}</b>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
              <a
                href={drawerMeta.visit}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-[2px] px-[22px] py-3.5 text-[0.86rem] font-bold text-navy-deep transition-transform hover:-translate-y-0.5"
                style={{
                  background: drawerMeta.gradient,
                  pointerEvents: drawerMeta.visit === "#" ? "none" : "auto",
                  opacity: drawerMeta.visit === "#" ? 0.55 : 1,
                }}
              >
                <span>{drawerCopy.visitLabel}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
          </aside>
        </>
      )}

      <style jsx global>{`
        @keyframes pulseSun {
          0%, 100% { box-shadow: 0 0 30px 10px rgba(201,168,76,0.35), 0 0 90px 30px rgba(201,168,76,0.16); }
          50% { box-shadow: 0 0 38px 14px rgba(201,168,76,0.5), 0 0 110px 40px rgba(201,168,76,0.24); }
        }
      `}</style>
    </div>
  );
}
