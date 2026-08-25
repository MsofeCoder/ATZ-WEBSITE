import type { Dict } from "@/dictionaries";
import Reveal from "./Reveal";

const STAR = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </svg>
);

const TINTS: Record<string, string> = { md: "#6A0DAD", ai: "#00BCD4", mc: "#1B5E20" };

export default function Testimonials({ dict }: { dict: Dict }) {
  const items = [
    { brand: "md", quote: dict.testi.q1, name: "Amina M.", role: dict.testi.r1, initials: "AM" },
    { brand: "ai", quote: dict.testi.q2, name: "Juma K.", role: dict.testi.r2, initials: "JK" },
    { brand: "mc", quote: dict.testi.q3, name: "Neema S.", role: dict.testi.r3, initials: "NS" },
  ];
  return (
    <section id="testimonials" className="bg-white py-[110px]">
      <div className="mx-auto max-w-[1180px] px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-[660px]">
            <span className="mb-3.5 inline-flex items-center gap-2.5 font-display text-xs font-bold uppercase tracking-widest text-navy before:h-0.5 before:w-[26px] before:bg-gold">
              {dict.testi.eyebrow}
            </span>
            <h2 className="font-display text-4xl font-extrabold text-navy md:text-[2.7rem]">{dict.testi.h2}</h2>
            <p className="mt-4 max-w-[560px] text-slate-ink">{dict.testi.p}</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          {items.map((t, i) => {
            const tint = TINTS[t.brand];
            return (
              <Reveal key={t.name} delay={i * 140}>
                <figure
                  className="relative flex h-full flex-col gap-4 rounded-md border border-navy/10 bg-white p-8 shadow-sm transition hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(27,42,74,0.1)]"
                  style={{ ["--tint" as string]: tint }}
                >
                  <span
                    className="absolute right-6 top-2 select-none font-serif-accent text-[4.4rem] leading-none"
                    style={{ color: `color-mix(in srgb, ${tint} 22%, transparent)` }}
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <div className="flex gap-1" role="img" aria-label="5 out of 5 stars" style={{ color: tint }}>
                    {STAR}{STAR}{STAR}{STAR}{STAR}
                  </div>
                  <blockquote className="flex-1 text-[0.95rem] leading-relaxed text-slate-ink">{t.quote}</blockquote>
                  <figcaption className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-sm font-extrabold text-white"
                      style={{ background: `linear-gradient(135deg, ${tint}, color-mix(in srgb, ${tint} 55%, #0E1730))` }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <b className="block font-display text-sm font-bold text-navy">{t.name}</b>
                      <span className="text-xs text-slate-light">{t.role}</span>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
