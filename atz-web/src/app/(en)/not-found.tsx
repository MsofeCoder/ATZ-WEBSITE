import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { localePath } from "@/lib/site";

const dict = getDictionary("en");

export const metadata: Metadata = {
  title: dict.seo.notFoundTitle,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F3F4F7] px-5 py-24">
      <div className="max-w-[520px] text-center">
        <p aria-hidden="true" className="font-display text-navy/20 text-6xl font-extrabold">
          {dict.errors.notFoundCode}
        </p>
        <h1 className="font-display text-navy mt-2 text-2xl font-extrabold md:text-3xl">
          {dict.errors.notFoundTitle}
        </h1>
        <p className="text-slate-ink mt-3">{dict.errors.notFoundBody}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={localePath("en", "/")}
            className="bg-navy font-display hover:bg-gold hover:text-navy-deep rounded-sm px-6 py-3.5 text-sm font-bold text-white transition"
          >
            {dict.errors.backHome}
          </Link>
          <Link
            href={localePath("en", "/contact")}
            className="border-navy/20 font-display text-navy hover:bg-navy/5 rounded-sm border px-6 py-3.5 text-sm font-bold transition"
          >
            {dict.errors.goContact}
          </Link>
        </div>
      </div>
    </div>
  );
}
