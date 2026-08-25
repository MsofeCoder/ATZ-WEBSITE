import Link from "next/link";
import type { Dict } from "@/dictionaries";
import { WA } from "./Header";

export default function Footer({ dict }: { dict: Dict }) {
  return (
    <footer className="bg-navy-deep px-0 pb-7 pt-16 text-white/70">
      <div className="mx-auto max-w-[1180px] px-8">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr] gap-10 border-b border-white/10 pb-11 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ATZ_LOGO.png" alt="ATZ Company Limited" className="h-[30px] w-[30px]" />
              <span className="font-display text-sm font-extrabold text-white">ATZ COMPANY LIMITED</span>
            </div>
            <p className="max-w-[280px] text-sm leading-relaxed">{dict.footer.tagline}</p>
          </div>
          <div>
            <h5 className="mb-4 font-display text-sm font-bold tracking-wide text-white">{dict.footer.companies}</h5>
            <a href="https://msofedesigner.blogspot.com/" target="_blank" rel="noopener" className="mb-2.5 block text-sm transition hover:text-gold-soft">Msofe Designer</a>
            <a href="https://adamuintelligence.github.io/portfolio/" target="_blank" rel="noopener" className="mb-2.5 block text-sm transition hover:text-gold-soft">Adam Intelligence</a>
            <a href="https://msofecoder.github.io/portfolio/" target="_blank" rel="noopener" className="mb-2.5 block text-sm transition hover:text-gold-soft">Msofe Coder</a>
          </div>
          <div>
            <h5 className="mb-4 font-display text-sm font-bold tracking-wide text-white">{dict.footer.company}</h5>
            <Link href="/#about" className="mb-2.5 block text-sm transition hover:text-gold-soft">{dict.footer.about}</Link>
            <Link href="/#values" className="mb-2.5 block text-sm transition hover:text-gold-soft">{dict.footer.values}</Link>
            <Link href="/#contact" className="mb-2.5 block text-sm transition hover:text-gold-soft">{dict.footer.contact}</Link>
          </div>
          <div>
            <h5 className="mb-4 font-display text-sm font-bold tracking-wide text-white">{dict.footer.reach}</h5>
            <p className="mb-2.5 block text-sm">{dict.footer.location}</p>
            <a href={WA} target="_blank" rel="noopener" className="mb-2.5 block text-sm transition hover:text-gold-soft">WhatsApp: +255 794 557 333</a>
            <a href="mailto:info@atzcompany.co.tz" className="block text-sm transition hover:text-gold-soft">info@atzcompany.co.tz</a>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2.5 pt-6 text-xs text-white/45">
          <span>&copy; 2026 ATZ Company Limited. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
