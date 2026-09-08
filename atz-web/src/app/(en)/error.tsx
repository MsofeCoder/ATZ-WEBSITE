"use client";

import { useEffect } from "react";
import Link from "next/link";
import dict from "@/dictionaries/en";
import { localePath } from "@/lib/site";

/** Route-level error boundary. The layout (header/footer) stays mounted. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F3F4F7] px-5 py-24">
      <div className="max-w-[520px] text-center">
        <h1 className="font-display text-navy text-2xl font-extrabold md:text-3xl">
          {dict.errors.errorTitle}
        </h1>
        <p className="text-slate-ink mt-3">{dict.errors.errorBody}</p>
        {error.digest && (
          <p className="text-slate-light mt-2 font-mono text-xs">ref: {error.digest}</p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-navy font-display hover:bg-gold hover:text-navy-deep rounded-sm px-6 py-3.5 text-sm font-bold text-white transition"
          >
            {dict.errors.retry}
          </button>
          <Link
            href={localePath("en", "/")}
            className="border-navy/20 font-display text-navy hover:bg-navy/5 rounded-sm border px-6 py-3.5 text-sm font-bold transition"
          >
            {dict.errors.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
