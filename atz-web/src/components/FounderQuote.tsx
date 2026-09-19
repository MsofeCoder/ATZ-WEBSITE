import type { Dict, Lang } from "@/dictionaries";
import { LOCALITY, FOUNDING_YEAR } from "@/lib/site";
import { BRAND_IDS } from "@/lib/brands";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/sections/SectionHeading";
import ParticleField from "@/components/motion/ParticleField";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import HoverLift from "@/components/motion/HoverLift";

const FOUNDER = "Adam Mohamed Msofe";
const FOUNDER_ROLE = "Founder & CEO";

export function FounderQuoteAndValues({ dict }: { dict: Dict; lang: Lang }) {
  const values = [
    { letter: "A.", h: dict.values.v1h, p: dict.values.v1p },
    { letter: "T.", h: dict.values.v2h, p: dict.values.v2p },
    { letter: "Z.", h: dict.values.v3h, p: dict.values.v3p },
    { letter: "A.", h: dict.values.v4h, p: dict.values.v4p },
    { letter: "T.", h: dict.values.v5h, p: dict.values.v5p },
  ];

  const facts: [string, string][] = [
    [String(BRAND_IDS.length), dict.about.ps1],
    [LOCALITY, dict.about.ps2],
    ["3", dict.about.ps3],
    [String(FOUNDING_YEAR), dict.about.ps4],
  ];

  return (
    <>
      <section
        id="about"
        aria-labelledby="about-heading"
        className="bg-navy relative scroll-mt-24 overflow-hidden py-20 text-white md:py-[90px]"
      >
        {/* Interactive constellation behind the quote — decorative, pointer-aware */}
        <ParticleField color="201, 168, 76" density={0.9} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 400px at 15% 50%, rgba(201,168,76,0.10), transparent 65%)",
          }}
          aria-hidden="true"
        />
        <h2 id="about-heading" className="sr-only">
          {dict.footer.about}
        </h2>
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-15">
          <Reveal>
            <figure className="m-0">
              <span
                aria-hidden="true"
                className="font-serif-accent text-gold/40 block text-[4rem] leading-[0.6] select-none"
              >
                &ldquo;
              </span>
              <blockquote className="font-serif-accent text-gold-soft m-0 text-2xl leading-snug text-pretty italic md:text-[1.9rem]">
                {dict.about.quote}
              </blockquote>
              <figcaption className="font-display mt-5 text-xs font-bold tracking-wide text-white/60 uppercase">
                — {FOUNDER}, {FOUNDER_ROLE}
              </figcaption>
            </figure>
          </Reveal>
          <Stagger as="dl" className="grid grid-cols-2 gap-7" stagger={0.1} delay={0.15}>
            {facts.map(([value, label]) => (
              <StaggerItem key={label} className="border-gold border-l-2 pl-4">
                <dt className="sr-only">{label}</dt>
                <dd className="m-0">
                  <b className="font-display block text-2xl font-extrabold text-white md:text-3xl">
                    {value}
                  </b>
                  <span className="text-sm text-white/65" aria-hidden="true">
                    {label}
                  </span>
                </dd>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="values" className="scroll-mt-24 py-20 md:py-[110px]">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8">
          <SectionHeading
            eyebrow={dict.values.eyebrow}
            title={dict.values.h2}
            lede={dict.values.p}
          />
          <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5" stagger={0.08}>
            {values.map((v) => (
              <StaggerItem key={v.h} as="li" className="h-full">
                <HoverLift
                  lift={4}
                  shadow={false}
                  className="group border-navy/[0.14] h-full rounded-md border-t px-1 py-6"
                >
                  <span
                    className="font-serif-accent text-gold-ink mb-2.5 block text-[1.8rem] italic transition-transform duration-300 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  >
                    {v.letter}
                  </span>
                  <h3 className="font-display text-navy mb-1.5 text-base font-bold">{v.h}</h3>
                  <p className="text-slate-ink text-sm text-pretty">{v.p}</p>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
