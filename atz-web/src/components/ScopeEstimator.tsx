"use client";

import { useId, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import type { Dict } from "@/dictionaries";
import { BRANDS, SUN, type BrandId } from "@/lib/brands";
import { waLink, fillTemplate } from "@/lib/site";
import { useConsultation } from "@/components/providers/ConsultationProvider";
import { EASE_OUT } from "@/components/motion/variants";
import { SCOPE_ID } from "@/lib/scope-routing";
import Reveal from "@/components/Reveal";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import ArrowRight from "@/components/icons/ArrowRight";

type Engine = "design" | "ai" | "code" | "unsure";

/** Engine → company. "unsure" routes to ATZ itself for triage. */
const ENGINE_BRAND: Record<Engine, BrandId | null> = {
  design: "md",
  ai: "ai",
  code: "mc",
  unsure: null,
};

/** Engine → the `dict.modal.opt*` label the consultation form should preselect. */
function serviceOption(dict: Dict, engine: Engine): string {
  return {
    design: dict.modal.opt1,
    ai: dict.modal.opt2,
    code: dict.modal.opt3,
    unsure: dict.modal.opt4,
  }[engine];
}

function brandCopy(dict: Dict, id: BrandId) {
  return id === "md" ? dict.md : id === "ai" ? dict.aiCo : dict.mc;
}

/**
 * Interactive scope card: four quick choices produce an instant routing —
 * which ATZ company, what the first step is, what the visitor receives —
 * and two hand-offs that carry those choices with them: the consultation
 * form (pre-filled) and WhatsApp (message pre-typed).
 *
 * It never quotes a price. The visitor states a budget band; we state the
 * team, the process and the deliverables. Anything more specific is what
 * the written scope is for.
 */
export default function ScopeEstimator({ dict }: { dict: Dict }) {
  const { open } = useConsultation();
  const groupId = useId();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>(dict.modal.budget2);
  const [timeline, setTimeline] = useState<string>(dict.modal.time2);

  const engines: Engine[] = ["design", "ai", "code", "unsure"];
  const budgets = [dict.modal.budget1, dict.modal.budget2, dict.modal.budget3, dict.modal.budget4];
  const timelines = [dict.modal.time1, dict.modal.time2, dict.modal.time3, dict.modal.time4];

  const brandId = engine ? ENGINE_BRAND[engine] : null;
  const brand = brandId ? BRANDS[brandId] : null;
  const copy = brandId ? brandCopy(dict, brandId) : null;
  const accent = brand?.accent ?? SUN.accentBright;
  const ink = brand?.accentInk ?? "var(--gold-ink)";

  const summary = engine
    ? [
        `${dict.scope.summaryPrefix}`,
        `${dict.scope.stepEngine} ${dict.scope.engines[engine].label}`,
        type ? `${dict.scope.stepType} ${type}` : null,
        `${dict.scope.stepBudget} ${budget}`,
        `${dict.scope.stepTimeline} ${timeline}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const waHref = engine
    ? waLink(
        fillTemplate(dict.wa.scope, {
          engine: dict.scope.engines[engine].label,
          project: type ? fillTemplate(dict.wa.scopeProject, { type }) : "",
          budget,
          timeline,
        })
      )
    : waLink(dict.wa.general);

  const openForm = () => {
    if (!engine) return;
    open({ service: serviceOption(dict, engine), message: summary });
  };

  const pill = (active: boolean) =>
    `font-display min-h-11 rounded-full border px-4 py-2 text-[0.8rem] font-bold transition-colors duration-200 ${
      active
        ? "border-navy-deep bg-navy-deep text-white"
        : "border-navy/15 bg-white text-navy hover:border-navy/40"
    }`;

  return (
    <Reveal className="mt-16">
      <div
        id={SCOPE_ID}
        className="border-navy/10 relative scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-[0_24px_60px_rgba(27,42,74,0.10)]"
        style={{ "--scope-a": accent, "--scope-ink": ink } as React.CSSProperties}
      >
        {/* Accent rail follows the chosen engine. */}
        <div
          className="absolute inset-x-0 top-0 h-1 transition-colors duration-500"
          style={{ background: "var(--scope-a)" }}
          aria-hidden="true"
        />

        <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Inputs */}
          <div>
            <span className="eyebrow-chip">{dict.scope.eyebrow}</span>
            <h3 className="font-display text-navy mt-3 text-2xl font-extrabold tracking-[-0.01em] text-balance md:text-[1.9rem]">
              {dict.scope.h2}
            </h3>
            <p className="text-slate-ink mt-2.5 max-w-[520px] text-pretty">{dict.scope.p}</p>

            {/* Step 1 — engine */}
            <fieldset className="mt-8">
              <legend className="font-display text-navy mb-3 text-xs font-bold tracking-wide uppercase">
                1 · {dict.scope.stepEngine}
              </legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup">
                {engines.map((e) => {
                  const b = ENGINE_BRAND[e] ? BRANDS[ENGINE_BRAND[e]!] : null;
                  const a = b?.accent ?? SUN.accentBright;
                  const active = engine === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setEngine(e);
                        setType(null);
                      }}
                      className={`flex min-h-[76px] flex-col items-start justify-center rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                        active
                          ? "shadow-[0_10px_24px_rgba(27,42,74,0.12)]"
                          : "border-navy/12 hover:border-navy/35 bg-white"
                      }`}
                      style={
                        active
                          ? { borderColor: a, background: `color-mix(in srgb, ${a} 9%, white)` }
                          : undefined
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: a }}
                          aria-hidden="true"
                        />
                        <span className="font-display text-navy text-sm font-extrabold">
                          {dict.scope.engines[e].label}
                        </span>
                      </span>
                      <span className="text-slate-light mt-1 text-[0.72rem] leading-snug">
                        {dict.scope.engines[e].hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Step 2 — project type, appears once an engine is chosen */}
            <AnimatePresence initial={false}>
              {engine && (
                <m.fieldset
                  key={engine}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="mt-7"
                >
                  <legend className="font-display text-navy mb-3 text-xs font-bold tracking-wide uppercase">
                    2 · {dict.scope.stepType}
                  </legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup">
                    {dict.scope.types[engine].map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={type === t}
                        onClick={() => setType(t)}
                        className={pill(type === t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </m.fieldset>
              )}
            </AnimatePresence>

            {/* Steps 3 & 4 */}
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${groupId}-budget`}
                  className="font-display text-navy mb-2 block text-xs font-bold tracking-wide uppercase"
                >
                  3 · {dict.scope.stepBudget}
                </label>
                <select
                  id={`${groupId}-budget`}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="border-navy/20 text-navy focus:border-gold focus:ring-gold/40 w-full rounded-lg border bg-white px-3.5 py-3 text-sm focus:ring-2 focus:outline-none"
                >
                  {budgets.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor={`${groupId}-timeline`}
                  className="font-display text-navy mb-2 block text-xs font-bold tracking-wide uppercase"
                >
                  4 · {dict.scope.stepTimeline}
                </label>
                <select
                  id={`${groupId}-timeline`}
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="border-navy/20 text-navy focus:border-gold focus:ring-gold/40 w-full rounded-lg border bg-white px-3.5 py-3 text-sm focus:ring-2 focus:outline-none"
                >
                  {timelines.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Routing result */}
          <div
            className="bg-navy-deep relative flex flex-col justify-between overflow-hidden rounded-xl p-6 text-white md:p-8"
            aria-live="polite"
          >
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl transition-colors duration-700"
              style={{ background: "var(--scope-a)" }}
              aria-hidden="true"
            />
            <div className="relative">
              <span className="font-display text-gold-soft text-[0.7rem] font-bold tracking-[0.2em] uppercase">
                {dict.scope.routedTo}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={engine ?? "none"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                  <p className="font-display mt-2 text-2xl leading-tight font-extrabold text-balance">
                    {brand ? brand.name : engine ? dict.scope.routedUnsure : "ATZ Company Limited"}
                  </p>
                  {copy && (
                    <p className="mt-1 text-sm text-white/65">
                      {copy.tag} · <em className="font-serif-accent">{copy.slogan}</em>
                    </p>
                  )}
                  {!engine && <p className="mt-1 text-sm text-white/65">{dict.hero.slogan}</p>}

                  <dl className="mt-6 space-y-4 text-sm">
                    <div>
                      <dt className="font-display text-[0.68rem] font-bold tracking-[0.16em] text-white/50 uppercase">
                        {dict.scope.firstStep}
                      </dt>
                      <dd className="mt-1 text-white/85">
                        {copy ? copy.p1 : dict.scope.firstStepUnsure}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-display text-[0.68rem] font-bold tracking-[0.16em] text-white/50 uppercase">
                        {dict.scope.youReceive}
                      </dt>
                      <dd className="mt-1 text-white/85">
                        {copy ? copy.proof : dict.scope.receiveUnsure}
                      </dd>
                    </div>
                  </dl>
                </m.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-8">
              <p className="text-gold-soft/80 mb-4 text-[0.72rem] leading-relaxed">
                {dict.scope.reply}
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={openForm}
                  disabled={!engine}
                  className="btn-primary font-display inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {dict.scope.ctaForm}
                  <ArrowRight />
                </button>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary font-display inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold"
                >
                  <WhatsAppIcon />
                  {dict.scope.ctaWa}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
