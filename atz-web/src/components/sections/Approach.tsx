import type { Dict } from "@/dictionaries";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/sections/SectionHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import HoverLift from "@/components/motion/HoverLift";

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
    <section
      id="approach"
      className="relative scroll-mt-24 overflow-hidden bg-white py-20 md:py-[110px]"
    >
      {/* Faint dot grid so the white section reads as a surface, not a gap */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgba(27,42,74,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1180px] px-5 md:px-8">
        <SectionHeading
          eyebrow={dict.approach.eyebrow}
          title={dict.approach.h2}
          lede={dict.approach.p}
        />

        <div className="relative">
          {/* Connector between the three steps, desktop only. Outside the
              list so it is not counted as a fourth item. */}
          <div
            aria-hidden="true"
            className="from-gold/0 via-gold/50 to-gold/0 pointer-events-none absolute top-[54px] right-[12%] left-[12%] hidden h-px bg-gradient-to-r lg:block"
          />
          <Stagger as="ol" className="relative grid gap-6 lg:grid-cols-3" stagger={0.12}>
            {steps.map((s, i) => (
              <StaggerItem key={s.h} as="li" className="h-full">
                <HoverLift className="border-navy/10 relative flex h-full flex-col rounded-md border bg-white p-8 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="bg-gold/12 text-gold-ink ring-gold/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 ring-inset">
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
                  <p className="text-slate-ink mt-2.5 text-sm leading-relaxed text-pretty">{s.p}</p>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Reveal delay={360}>
          <p className="font-serif-accent text-slate-ink mx-auto mt-10 max-w-[620px] text-center text-base text-pretty italic">
            {dict.approach.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
