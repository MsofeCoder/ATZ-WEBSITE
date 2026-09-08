import type { Dict, Lang } from "@/dictionaries";
import { LOCALITY, FOUNDING_YEAR } from "@/lib/site";
import { BRAND_IDS } from "@/lib/brands";
import Reveal from "@/components/Reveal";

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
        className="bg-navy scroll-mt-24 py-20 text-white md:py-[90px]"
      >
        <h2 id="about-heading" className="sr-only">
          {dict.footer.about}
        </h2>
        <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-15">
          <Reveal>
            <figure className="m-0">
              <blockquote className="font-serif-accent text-gold-soft m-0 text-2xl leading-snug italic md:text-[1.9rem]">
                &ldquo;{dict.about.quote}&rdquo;
              </blockquote>
              <figcaption className="font-display mt-5 text-xs font-bold tracking-wide text-white/60 uppercase">
                — {FOUNDER}, {FOUNDER_ROLE}
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={150}>
            <dl className="grid grid-cols-2 gap-7">
              {facts.map(([value, label]) => (
                <div key={label} className="border-gold border-l-2 pl-4">
                  <dt className="sr-only">{label}</dt>
                  <dd className="m-0">
                    <b className="font-display block text-2xl font-extrabold text-white md:text-3xl">
                      {value}
                    </b>
                    <span className="text-sm text-white/65" aria-hidden="true">
                      {label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="values" className="scroll-mt-24 py-20 md:py-[110px]">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8">
          <Reveal>
            <div className="mx-auto mb-14 max-w-[660px]">
              <span className="eyebrow-chip">{dict.values.eyebrow}</span>
              <h2 className="font-display text-navy mt-3.5 text-3xl font-extrabold md:text-[2.7rem]">
                {dict.values.h2}
              </h2>
              <p className="text-slate-ink mt-4 max-w-[560px]">{dict.values.p}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {values.map((v) => (
                <li key={v.h} className="border-navy/[0.14] border-t px-1 py-6">
                  <span
                    className="font-serif-accent text-gold-ink mb-2.5 block text-[1.8rem] italic"
                    aria-hidden="true"
                  >
                    {v.letter}
                  </span>
                  <h3 className="font-display text-navy mb-1.5 text-base font-bold">{v.h}</h3>
                  <p className="text-slate-ink text-sm">{v.p}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
