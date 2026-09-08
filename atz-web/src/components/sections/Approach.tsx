import type { Dict } from "@/dictionaries";
import Reveal from "@/components/Reveal";

const STEP_ICONS = [
  // One point of contact
  <path key="a" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  // A scope you approve first
  <g key="b">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 15l2 2 4-4" />
  </g>,
  // You own what we build
  <g key="c">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </g>,
];

/**
 * Replaces the previous testimonials block.
 *
 * The prior section attributed 5-star quotes to three named people who do not
 * exist. This states how an engagement actually runs — verifiable, and it
 * answers the question a prospect is really asking.
 */
export default function Approach({ dict }: { dict: Dict }) {
  const steps = [
    { h: dict.approach.s1h, p: dict.approach.s1p },
    { h: dict.approach.s2h, p: dict.approach.s2p },
    { h: dict.approach.s3h, p: dict.approach.s3p },
  ];

  return (
    <section id="approach" className="scroll-mt-24 bg-white py-20 md:py-[110px]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-[660px]">
            <span className="eyebrow-chip">{dict.approach.eyebrow}</span>
            <h2 className="font-display text-navy mt-3.5 text-3xl font-extrabold md:text-[2.7rem]">
              {dict.approach.h2}
            </h2>
            <p className="text-slate-ink mt-4 max-w-[560px]">{dict.approach.p}</p>
          </div>
        </Reveal>

        <ol className="grid gap-6 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal
              key={s.h}
              as="li"
              delay={i * 120}
              className="border-navy/10 flex h-full flex-col rounded-md border bg-white p-8 shadow-sm transition hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(27,42,74,0.1)]"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="bg-gold/12 text-gold flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    {STEP_ICONS[i]}
                  </svg>
                </span>
                <span className="font-display text-slate-light text-xs font-bold tracking-widest uppercase">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-navy text-lg font-extrabold">{s.h}</h3>
              <p className="text-slate-ink mt-2.5 text-sm leading-relaxed">{s.p}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={360}>
          <p className="font-serif-accent text-slate-ink mx-auto mt-10 max-w-[620px] text-center text-base italic">
            {dict.approach.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
