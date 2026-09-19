import { BRANDS } from "@/lib/brands";
import { getDictionary } from "@/dictionaries";
import type { Lang } from "@/lib/locales";

/**
 * Route-transition loading screen: "ATZ" drawn letter by letter as an SVG
 * stroke (`stroke-dasharray` / `stroke-dashoffset`), each glyph in the colour
 * of one of the three companies — A for Adam Intelligence, T for Msofe
 * Designer, Z for Msofe Coder — and filling in once its outline completes.
 * The delays cascade the three strokes. Styles live in globals.css under
 * `.atz-dash`; reduced motion collapses the animation to the filled state.
 *
 * Rendered by each locale tree's `loading.tsx`, so it is a server component
 * and reads its one label from the dictionary directly.
 */
export default function AtzLoader({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  const letters: { glyph: string; color: string; delay: string }[] = [
    { glyph: "A", color: BRANDS.ai.accentBright, delay: "0s" },
    { glyph: "T", color: BRANDS.md.accent, delay: "0.3s" },
    { glyph: "Z", color: BRANDS.mc.accentBright, delay: "0.6s" },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={dict.a11y.loading}
      className="bg-navy-deep fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <svg
        viewBox="0 0 300 100"
        className="h-auto w-80 drop-shadow-[0_0_18px_rgba(255,255,255,0.08)] md:w-[30rem]"
        aria-hidden="true"
        focusable="false"
      >
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="font-display text-6xl font-black tracking-[0.2em] md:text-7xl"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          {letters.map(({ glyph, color, delay }) => (
            <tspan
              key={glyph}
              className="atz-dash"
              fill="transparent"
              style={{ color, stroke: "currentColor", animationDelay: delay }}
            >
              {glyph}
            </tspan>
          ))}
        </text>
      </svg>
      <span className="sr-only">{dict.a11y.loading}…</span>
    </div>
  );
}
