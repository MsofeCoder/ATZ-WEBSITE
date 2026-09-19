"use client";

import { useId, useState } from "react";
import type { Dict } from "@/dictionaries";
import { m } from "motion/react";
import { BRAND_LIST, type Brand, type BrandId } from "@/lib/brands";
import SectionHeading from "@/components/sections/SectionHeading";
import ScopeEstimator from "@/components/ScopeEstimator";
import TiltCard from "@/components/motion/TiltCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { PRESS } from "@/components/motion/variants";

/** Maps a brand to its dictionary branch — the keys differ by history. */
function copyFor(dict: Dict, id: BrandId) {
  return id === "md" ? dict.md : id === "ai" ? dict.aiCo : dict.mc;
}

function CompanyCard({ brand, dict }: { brand: Brand; dict: Dict }) {
  const [isOpen, setOpen] = useState(false);
  const panelId = useId();
  const d = copyFor(dict, brand.id);

  return (
    <TiltCard
      className="h-full rounded-md"
      glareColor={brand.rgb.join(", ")}
      // `--card-a` tints fills and borders; `--card-ink` is for text on white.
      style={{ "--card-a": brand.accent, "--card-ink": brand.accentInk } as React.CSSProperties}
      data-brand={brand.id}
    >
      <div
        className="border-navy/10 flex h-full flex-col overflow-hidden rounded-md border bg-white shadow-sm transition-shadow duration-300 hover:shadow-[0_24px_48px_rgba(27,42,74,0.12)]"
        style={{ borderTopColor: brand.accent, borderTopWidth: 4 }}
      >
        <div className="flex flex-1 flex-col px-7 pt-9 pb-8">
          <span
            className="font-display mb-4 block text-xs font-bold tracking-widest uppercase"
            style={{ color: "var(--card-ink)" }}
          >
            {d.tag}
          </span>
          <h3 className="font-display text-navy text-xl font-extrabold">{brand.name}</h3>
          <p
            className="font-serif-accent mb-4 text-base italic"
            style={{ color: "var(--card-ink)" }}
          >
            &ldquo;{d.slogan}&rdquo;
          </p>
          <p className="text-slate-ink mb-5 text-sm">{d.desc}</p>

          <ul className="mb-5 grid grid-cols-3 gap-2.5">
            {d.st.map(([num, label]) => (
              <li
                key={label}
                className="text-slate-ink flex flex-col items-center gap-0.5 rounded-md border px-1.5 py-2 text-center text-[0.68rem] leading-tight"
                style={{
                  background: "color-mix(in srgb, var(--card-a) 8%, white)",
                  borderColor: "color-mix(in srgb, var(--card-a) 22%, white)",
                }}
              >
                <b
                  className="font-display text-[0.92rem] font-extrabold"
                  style={{ color: "var(--card-ink)" }}
                >
                  {num}
                </b>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 pt-1.5">
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group font-display text-navy inline-flex items-center gap-2 text-sm font-bold"
            >
              {dict.solar[brand.id].visitLabel}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
            <m.button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={PRESS}
              className="font-display inline-flex min-h-11 items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-bold text-white"
              style={{ background: "var(--card-ink)" }}
            >
              <span>{isOpen ? dict.common.close : dict.common.details}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </m.button>
          </div>
        </div>

        <div
          id={panelId}
          // `grid-template-rows` animates cleanly from nothing to auto height —
          // no magic max-height that clips longer translations.
          className="border-navy/[0.08] grid border-t transition-[grid-template-rows] duration-500 ease-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
          // Clipping with overflow removes the panel visually but leaves it in
          // the accessibility tree, so a screen-reader user heard all three
          // brands' services, process and deliverables no matter what
          // `aria-expanded` claimed. `inert` takes it out for real.
          inert={!isOpen}
        >
          <div className="overflow-hidden">
            <div className="px-7 pt-6 pb-8">
              <h4
                className="font-display mb-3 text-xs font-extrabold tracking-widest uppercase"
                style={{ color: "var(--card-ink)" }}
              >
                {dict.common.services}
              </h4>
              <ul className="mb-5">
                {[d.s1, d.s2, d.s3].map((s) => (
                  <li
                    key={s}
                    className="border-navy/10 text-slate-ink relative border-b border-dashed py-2 pl-5 text-sm last:border-none"
                  >
                    <span
                      className="absolute top-4 left-0 h-2 w-2 rounded-full"
                      style={{ background: "var(--card-a)" }}
                      aria-hidden="true"
                    />
                    {s}
                  </li>
                ))}
              </ul>
              <h4
                className="font-display mb-3 text-xs font-extrabold tracking-widest uppercase"
                style={{ color: "var(--card-ink)" }}
              >
                {dict.common.process}
              </h4>
              <ol className="mb-5">
                {[d.p1, d.p2, d.p3].map((s) => (
                  <li
                    key={s}
                    className="border-navy/10 text-slate-ink relative border-b border-dashed py-2 pl-5 text-sm last:border-none"
                  >
                    <span
                      className="absolute top-4 left-0 h-2 w-2 rounded-full"
                      style={{ background: "var(--card-a)" }}
                      aria-hidden="true"
                    />
                    {s}
                  </li>
                ))}
              </ol>
              <h4
                className="font-display mb-2 text-xs font-extrabold tracking-widest uppercase"
                style={{ color: "var(--card-ink)" }}
              >
                {dict.common.deliverables}
              </h4>
              <p className="text-slate-ink text-sm leading-relaxed">{d.proof}</p>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export default function Ecosystem({ dict }: { dict: Dict }) {
  return (
    <section id="ecosystem" className="scroll-mt-24 bg-[#F3F4F7] pt-20 pb-24 md:pt-[120px]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <SectionHeading eyebrow={dict.eco.eyebrow} title={dict.eco.h2} lede={dict.eco.p} />
        <Stagger className="grid gap-6 lg:grid-cols-3" stagger={0.14}>
          {BRAND_LIST.map((brand) => (
            <StaggerItem key={brand.id} className="h-full">
              <CompanyCard brand={brand} dict={dict} />
            </StaggerItem>
          ))}
        </Stagger>
        {/* Instant routing: pick an engine, get the team, first step and
            deliverables — with the choices carried into the form / WhatsApp. */}
        <ScopeEstimator dict={dict} />
      </div>
    </section>
  );
}
