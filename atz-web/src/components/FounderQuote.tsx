import type { Dict, Lang } from "@/dictionaries";
import { getDictionary } from "@/dictionaries";
import Reveal from "@/components/Reveal";

export function FounderQuoteAndValues({ dict }: { dict: Dict; lang: Lang }) {
  const values = [
    { l: "A.", h: dict.values.v1h, p: dict.values.v1p },
    { l: "T.", h: dict.values.v2h, p: dict.values.v2p },
    { l: "Z.", h: dict.values.v3h, p: dict.values.v3p },
    { l: "A.", h: dict.values.v4h, p: dict.values.v4p },
    { l: "T.", h: dict.values.v5h, p: dict.values.v5p },
  ];
  return (
    <>
      {/* Founder quote strip */}
      <section id="about" className="bg-navy py-[90px] text-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-15 px-8 lg:grid-cols-[1.1fr_1fr] max-lg:grid-cols-1">
          <Reveal>
            <blockquote className="font-serif-accent text-2xl italic leading-snug text-gold-soft md:text-[1.9rem]">
              &ldquo;{dict.about.quote}&rdquo;
              <cite className="mt-5 block font-display not-italic text-xs font-bold tracking-wide text-white/60">
                — ADAM MOHAMED MSOFE, FOUNDER &amp; CEO
              </cite>
            </blockquote>
          </Reveal>
          <Reveal delay={150}>
            <div className="grid grid-cols-2 gap-7">
              {[
                ["3", dict.about.ps1],
                ["Morogoro", dict.about.ps2],
                ["50+", dict.about.ps3],
                ["2025", dict.about.ps4],
              ].map(([b, s]) => (
                <div key={s} className="border-l-2 border-gold pl-4">
                  <b className="block font-display text-3xl font-black text-white">{b}</b>
                  <span className="text-sm text-white/65">{s}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="py-[110px]">
        <div className="mx-auto max-w-[1180px] px-8">
          <Reveal>
            <div className="mx-auto mb-14 max-w-[660px]">
              <span className="mb-3.5 inline-flex items-center gap-2.5 font-display text-xs font-bold uppercase tracking-widest text-navy before:h-0.5 before:w-[26px] before:bg-gold">
                {dict.values.eyebrow}
              </span>
              <h2 className="font-display text-4xl font-extrabold text-navy md:text-[2.7rem]">{dict.values.h2}</h2>
              <p className="mt-4 max-w-[560px] text-slate-ink">{dict.values.p}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid grid-cols-5 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {values.map((v) => (
                <div key={v.h} className="border-t border-navy/[0.14] px-1 py-6">
                  <div className="mb-2.5 font-serif-accent text-[1.8rem] font-semibold italic text-gold">{v.l}</div>
                  <h4 className="mb-1.5 text-base font-bold text-navy">{v.h}</h4>
                  <p className="text-sm text-slate-ink">{v.p}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

// keep import used
void getDictionary;
