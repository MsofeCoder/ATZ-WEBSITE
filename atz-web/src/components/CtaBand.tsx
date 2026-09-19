import type { Dict } from "@/dictionaries";
import { waLink } from "@/lib/site";
import TrustBadges from "@/components/TrustBadges";
import ConsultationCta from "@/components/ConsultationCta";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import Spin from "@/components/motion/Spin";
import WhatsAppIcon from "@/components/icons/WhatsApp";

/**
 * The closing call to action — the "climax CTA" of the page's narrative.
 *
 * Two buttons only, primary first. A thin dashed orbit in the corner turns
 * slowly (80s per revolution) so the band feels alive without competing with
 * the copy; both buttons are magnetic on fine pointers.
 */
export default function CtaBand({ dict }: { dict: Dict }) {
  return (
    <section id="contact-cta" className="bg-gold relative overflow-hidden py-20 md:py-24">
      <div
        className="border-navy/[0.06] pointer-events-none absolute -top-15 -right-15 h-[280px] w-[280px] rounded-full border-[40px] md:-top-20 md:-right-20 md:h-[360px] md:w-[360px]"
        aria-hidden="true"
      />
      <Spin
        duration={80}
        className="pointer-events-none absolute -top-15 -right-15 h-[280px] w-[280px] md:-top-20 md:-right-20 md:h-[360px] md:w-[360px]"
      >
        <div className="border-navy/[0.14] h-full w-full rounded-full border-2 border-dashed" />
      </Spin>
      <div
        className="bg-navy/[0.05] pointer-events-none absolute -bottom-24 -left-24 h-[260px] w-[260px] rounded-full blur-2xl"
        aria-hidden="true"
      />
      <Reveal className="relative mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-10 px-5 md:px-8">
        <div>
          <h2 className="font-display text-navy-deep max-w-[520px] text-2xl font-extrabold text-balance md:text-3xl">
            {dict.cta.h2}
          </h2>
          <p className="text-navy-deep/75 mt-2.5 max-w-[440px] text-pretty">{dict.cta.p}</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <Magnetic>
            <ConsultationCta
              label={dict.nav.cta}
              className="bg-navy-deep font-display inline-flex min-h-12 items-center gap-2.5 rounded-sm px-7 py-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(14,23,48,0.25)] transition-shadow hover:shadow-[0_14px_36px_rgba(14,23,48,0.35)]"
            />
          </Magnetic>
          <Magnetic strength={0.15}>
            <a
              href={waLink(dict.wa.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="border-navy-deep/15 bg-navy-deep/[0.08] font-display text-navy-deep inline-flex min-h-12 items-center gap-2.5 rounded-sm border px-6 py-4 text-sm font-bold transition-colors hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              <WhatsAppIcon />
              {dict.cta.whatsapp}
            </a>
          </Magnetic>
        </div>
        <div className="basis-full">
          <TrustBadges dict={dict} tone="light" />
        </div>
      </Reveal>
    </section>
  );
}
