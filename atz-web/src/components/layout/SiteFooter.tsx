import Link from "next/link";
import Image from "next/image";
import type { Dict, Lang } from "@/dictionaries";
import { BRAND_LIST } from "@/lib/brands";
import { WA_URL, EMAIL, PHONE_DISPLAY, localePath, sectionHref, currentYear } from "@/lib/site";

export default function SiteFooter({ dict, lang }: { dict: Dict; lang: Lang }) {
  return (
    <footer className="bg-navy-deep pt-16 pb-7 text-white/70">
      <nav aria-label={dict.a11y.footerNav} className="mx-auto max-w-[1180px] px-5 md:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-11 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              <Image
                src="/ATZ_LOGO.png"
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-[30px]"
              />
              <span className="font-display text-sm font-extrabold text-white">
                ATZ COMPANY LIMITED
              </span>
            </div>
            <p className="max-w-[280px] text-sm leading-relaxed">{dict.footer.tagline}</p>
          </div>

          <div>
            <h2 className="font-display mb-4 text-sm font-bold tracking-wide text-white">
              {dict.footer.companies}
            </h2>
            {BRAND_LIST.map((b) => (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold-soft mb-2.5 block text-sm transition"
              >
                {b.name}
              </a>
            ))}
          </div>

          <div>
            <h2 className="font-display mb-4 text-sm font-bold tracking-wide text-white">
              {dict.footer.company}
            </h2>
            <Link
              href={sectionHref(lang, "about")}
              className="hover:text-gold-soft mb-2.5 block text-sm transition"
            >
              {dict.footer.about}
            </Link>
            <Link
              href={sectionHref(lang, "values")}
              className="hover:text-gold-soft mb-2.5 block text-sm transition"
            >
              {dict.footer.values}
            </Link>
            <Link
              href={localePath(lang, "/contact")}
              className="hover:text-gold-soft mb-2.5 block text-sm transition"
            >
              {dict.footer.contact}
            </Link>
          </div>

          <div>
            <h2 className="font-display mb-4 text-sm font-bold tracking-wide text-white">
              {dict.footer.reach}
            </h2>
            <p className="mb-2.5 text-sm">{dict.footer.location}</p>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-soft mb-2.5 block text-sm transition"
            >
              WhatsApp: {PHONE_DISPLAY}
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="hover:text-gold-soft block text-sm break-all transition"
            >
              {EMAIL}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-6 text-xs text-white/55">
          <span>
            &copy; {currentYear()} ATZ Company Limited. {dict.footer.rights}
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href={localePath(lang, "/privacy")} className="hover:text-gold-soft transition">
              {dict.footer.privacy}
            </Link>
            <Link href={localePath(lang, "/terms")} className="hover:text-gold-soft transition">
              {dict.footer.terms}
            </Link>
          </div>
        </div>
      </nav>
    </footer>
  );
}
