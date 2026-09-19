import Reveal from "@/components/Reveal";

/**
 * The eyebrow / heading / lede that opens every home-page section.
 *
 * One component so the hierarchy is identical everywhere: a 0.72rem tracked
 * eyebrow, a 3xl–2.7rem display heading, and a lede capped at 560px so line
 * length stays readable. `tone="dark"` is for sections on navy.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lede,
  tone = "light",
  align = "left",
  id,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  id?: string;
}) {
  const dark = tone === "dark";
  return (
    <Reveal>
      <div className={`mx-auto mb-14 max-w-[660px] ${align === "center" ? "text-center" : ""}`}>
        <span className={`eyebrow-chip ${dark ? "eyebrow-chip--dark" : ""}`}>{eyebrow}</span>
        <h2
          id={id}
          className={`font-display mt-3.5 text-3xl font-extrabold tracking-[-0.01em] text-balance md:text-[2.7rem] md:leading-[1.1] ${
            dark ? "text-white" : "text-navy"
          }`}
        >
          {title}
        </h2>
        {lede && (
          <p
            className={`mt-4 max-w-[560px] text-pretty ${align === "center" ? "mx-auto" : ""} ${
              dark ? "text-white/70" : "text-slate-ink"
            }`}
          >
            {lede}
          </p>
        )}
      </div>
    </Reveal>
  );
}
