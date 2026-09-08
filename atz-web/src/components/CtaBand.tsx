import type { Dict } from "@/dictionaries";
import { WA_URL } from "@/lib/site";
import ConsultationCta from "@/components/ConsultationCta";

export default function CtaBand({ dict }: { dict: Dict }) {
  return (
    <section id="contact-cta" className="bg-gold relative overflow-hidden py-20">
      <div
        className="border-navy/[0.06] absolute -top-15 -right-15 h-[280px] w-[280px] rounded-full border-[40px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-10 px-5 md:px-8">
        <div>
          <h2 className="font-display text-navy-deep max-w-[520px] text-2xl font-extrabold md:text-3xl">
            {dict.cta.h2}
          </h2>
          <p className="text-navy-deep/75 mt-2.5 max-w-[440px]">{dict.cta.p}</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <ConsultationCta
            label={dict.nav.cta}
            className="bg-navy-deep font-display inline-flex items-center gap-2.5 rounded-sm px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-xl"
          />
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-navy-deep/15 bg-navy-deep/[0.08] font-display text-navy-deep inline-flex items-center gap-2.5 rounded-sm border px-6 py-4 text-sm font-bold transition hover:bg-[#25D366]"
          >
            {dict.cta.whatsapp}
          </a>
        </div>
      </div>
    </section>
  );
}
