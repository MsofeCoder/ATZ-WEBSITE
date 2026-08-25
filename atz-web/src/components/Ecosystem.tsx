"use client";

import { useState } from "react";
import type { Dict } from "@/dictionaries";
import Reveal from "./Reveal";

type Brand = "md" | "ai" | "mc";

function CompanyCard({ id, dict }: { id: Brand; dict: Dict }) {
  const [open, setOpen] = useState(false);
  const d = id === "md" ? dict.md : id === "ai" ? dict.aiCo : dict.mc;
  const visitUrl =
    id === "md"
      ? "https://msofedesigner.blogspot.com/"
      : id === "ai"
        ? "https://adamuintelligence.github.io/portfolio/"
        : "https://msofecoder.github.io/portfolio/";
  const visitLabel =
    id === "md" ? "Visit Msofe Designer" : id === "ai" ? "Visit Adam Intelligence" : "Visit Msofe Coder";
  const services = [d.s1, d.s2, d.s3];
  const process = [d.p1, d.p2, d.p3];

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-md border border-navy/10 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(27,42,74,0.1)] ${
        open ? "" : ""
      }`}
      style={{ borderTopColor: "var(--card-a)", borderTopWidth: 4 }}
      data-brand={id}
    >
      <style jsx>{`
        div {
          --card-a: ${id === "md" ? "#6A0DAD" : id === "ai" ? "#0A2540" : "#1B5E20"};
        }
      `}</style>
      <div className="flex flex-1 flex-col px-7 pb-8 pt-9">
        <span className="mb-4 block font-display text-xs font-bold uppercase tracking-widest text-navy" style={{ color: "var(--card-a)" }}>
          {d.tag}
        </span>
        <h3 className="font-display text-xl font-extrabold text-navy">
          {id === "md" ? "Msofe Designer" : id === "ai" ? "Adam Intelligence" : "Msofe Coder"}
        </h3>
        <div className="mb-4 font-serif-accent text-base italic" style={{ color: "var(--card-a)" }}>
          &ldquo;{d.slogan}&rdquo;
        </div>
        <p className="mb-5 text-sm text-slate-ink">{d.desc}</p>
        {/* exactly 3 equal chips per card */}
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          {d.st.map(([num, label]) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 rounded-md border px-1.5 py-2 text-center text-[0.68rem] leading-tight text-slate-ink"
              style={{
                background: "color-mix(in srgb, var(--card-a) 8%, white)",
                borderColor: "color-mix(in srgb, var(--card-a) 22%, white)",
              }}
            >
              <b className="font-display text-[0.92rem] font-extrabold" style={{ color: "var(--card-a)" }}>{num}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 pt-1.5">
          <a href={visitUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-display text-sm font-bold text-navy group">
            {visitLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 font-display text-sm font-bold text-white"
            style={{ background: "var(--card-a)" }}
          >
            <span>{open ? dict.common.close : dict.common.details}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
      </div>
      <div
        className="overflow-hidden border-t border-navy/[0.08] transition-all duration-500"
        style={{ maxHeight: open ? 900 : 0 }}
      >
        <div className="px-7 pb-8 pt-6">
          <h5 className="mb-3 font-display text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--card-a)" }}>{dict.common.services}</h5>
          <ul className="mb-5">
            {services.map((s) => (
              <li key={s} className="relative border-b border-dashed border-navy/10 py-2 pl-5 text-sm text-slate-ink last:border-none">
                <span className="absolute left-0 top-4 h-2 w-2 rounded-full" style={{ background: "var(--card-a)" }} aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
          <h5 className="mb-3 font-display text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--card-a)" }}>{dict.common.process}</h5>
          <ul className="mb-5">
            {process.map((s) => (
              <li key={s} className="relative border-b border-dashed border-navy/10 py-2 pl-5 text-sm text-slate-ink last:border-none">
                <span className="absolute left-0 top-4 h-2 w-2 rounded-full" style={{ background: "var(--card-a)" }} aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
          <p className="font-serif-accent text-sm italic text-navy">{d.proof}</p>
        </div>
      </div>
    </div>
  );
}

export default function Ecosystem({ dict }: { dict: Dict }) {
  return (
    <section id="ecosystem" className="bg-[#F3F4F7] pb-24 pt-[120px]">
      <div className="mx-auto max-w-[1180px] px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-[660px]">
            <span className="eyebrow-chip">{dict.eco.eyebrow}</span>
            <h2 className="mt-3.5 font-display text-4xl font-extrabold text-navy md:text-[2.7rem]">{dict.eco.h2}</h2>
            <p className="mt-4 max-w-[560px] text-slate-ink">{dict.eco.p}</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          {(["md", "ai", "mc"] as Brand[]).map((b, i) => (
            <Reveal key={b} delay={i * 160} className="h-full">
              <CompanyCard id={b} dict={dict} />
            </Reveal>
          ))}
        </div>
      </div>
      <style jsx global>{`
        .eyebrow-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--navy);
        }
        .eyebrow-chip::before {
          content: "";
          width: 26px;
          height: 2px;
          background: var(--gold);
        }
      `}</style>
    </section>
  );
}
