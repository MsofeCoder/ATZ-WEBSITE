import { getDictionary, type Lang } from "@/dictionaries";
import { EMAIL, LOCALITY, localePath } from "@/lib/site";
import Link from "next/link";

/**
 * Shared template for the privacy policy and the terms of service.
 *
 * Both documents are seven headed sections plus an intro, so they share one
 * renderer and differ only in which dictionary branch they read.
 */
export default function LegalView({
  lang,
  doc,
  updated,
}: {
  lang: Lang;
  doc: "privacy" | "terms";
  /** ISO date this document was last revised. */
  updated: string;
}) {
  const dict = getDictionary(lang);
  const t = dict[doc];
  const sections = [
    { h: t.s1h, p: t.s1p },
    { h: t.s2h, p: t.s2p },
    { h: t.s3h, p: t.s3p },
    { h: t.s4h, p: t.s4p },
    { h: t.s5h, p: t.s5p },
    { h: t.s6h, p: t.s6p },
  ];
  const formatted = new Intl.DateTimeFormat(lang === "sw" ? "sw-TZ" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(updated));

  return (
    <div className="bg-[#F3F4F7] py-20 md:py-[120px]">
      <div className="mx-auto max-w-[760px] px-5 md:px-8">
        <h1 className="font-display text-navy text-3xl font-extrabold md:text-[2.5rem]">
          {t.title}
        </h1>
        <p className="text-slate-light mt-2 text-sm">
          {t.updated}: <time dateTime={updated}>{formatted}</time>
        </p>

        <div className="border-navy/10 mt-8 rounded-md border bg-white p-7 shadow-sm md:p-10">
          <p className="text-slate-ink text-[0.98rem] leading-[1.8]">{t.intro}</p>

          {sections.map((s, i) => (
            <section key={s.h} className="mt-9">
              <h2 className="font-display text-navy text-lg font-extrabold">
                <span className="text-gold-ink mr-2">{i + 1}.</span>
                {s.h}
              </h2>
              <p className="text-slate-ink mt-2.5 text-[0.98rem] leading-[1.8]">{s.p}</p>
            </section>
          ))}

          <section className="border-navy/10 mt-9 border-t pt-8">
            <h2 className="font-display text-navy text-lg font-extrabold">
              <span className="text-gold-ink mr-2">7.</span>
              {t.s7h}
            </h2>
            <p className="text-slate-ink mt-2.5 text-[0.98rem] leading-[1.8]">{t.s7p}</p>
            <address className="text-slate-ink mt-3 text-[0.98rem] leading-[1.9] not-italic">
              <strong className="font-display text-navy font-bold">ATZ Company Limited</strong>
              <br />
              {LOCALITY}, Tanzania
              <br />
              <a href={`mailto:${EMAIL}`} className="text-gold-ink hover:text-navy underline">
                {EMAIL}
              </a>
            </address>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link
            href={localePath(lang, doc === "privacy" ? "/terms" : "/privacy")}
            className="text-navy hover:text-gold-ink underline transition"
          >
            {doc === "privacy" ? dict.footer.terms : dict.footer.privacy}
          </Link>
          <Link
            href={localePath(lang, "/contact")}
            className="text-navy hover:text-gold-ink underline transition"
          >
            {dict.footer.contact}
          </Link>
        </div>
      </div>
    </div>
  );
}
