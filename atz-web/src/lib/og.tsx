import { ImageResponse } from "next/og";
import type { Lang } from "@/lib/locales";
import { getDictionary } from "@/dictionaries";

/** Facebook, LinkedIn, X and WhatsApp all render link previews at 1200×630. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const SLOGAN: Record<Lang, string> = {
  en: "Empowering Vision. Engineering the Future.",
  sw: "Kuwezesha Maono. Kujenga Mustakabali.",
};

const BRANDS = ["Msofe Designer", "Adam Intelligence", "Msofe Coder"];

/**
 * The shared Open Graph card.
 *
 * The site previously pointed `summary_large_image` at a 512×512 logo, which
 * platforms letterbox or silently downgrade to a small square. That matters
 * more here than on most sites: WhatsApp is the primary channel this business
 * is shared through, and the preview card is the first thing a referred
 * visitor sees. Drawn with layout primitives rather than a bitmap so each
 * locale renders its own copy.
 */
export function ogImage(lang: Lang) {
  const d = getDictionary(lang);
  const h = d.hero;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0E1730",
        padding: "68px 76px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Gold rule, echoing the eyebrow mark used across the site. */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 74, height: 5, background: "#C9A84C", display: "flex" }} />
        <div
          style={{
            color: "#E4CE8F",
            fontSize: 25,
            letterSpacing: 5,
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
          }}
        >
          {d.hero.eyebrow}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 1040,
          }}
        >
          {/* Satori ignores `gap` on a wrapping flex row, so the words are
                spaced with an explicit margin instead. */}
          {(
            [
              [h.h1a, "#FFFFFF"],
              [h.design, "#E91E8C"],
              [h.ai, "#00BCD4"],
              [h.code, "#69F0AE"],
              [h.h1b, "#FFFFFF"],
            ] as const
          ).map(([word, color]) => (
            <span key={word} style={{ color, marginRight: 18, display: "flex" }}>
              {word}
            </span>
          ))}
        </div>
        <div
          style={{
            color: "#E4CE8F",
            fontSize: 32,
            fontStyle: "italic",
            display: "flex",
          }}
        >
          {SLOGAN[lang]}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.16)",
          paddingTop: 28,
        }}
      >
        <div style={{ display: "flex", gap: 30 }}>
          {BRANDS.map((b) => (
            <div key={b} style={{ color: "rgba(255,255,255,0.72)", fontSize: 25, display: "flex" }}>
              {b}
            </div>
          ))}
        </div>
        <div
          style={{
            color: "#C9A84C",
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: 1,
            display: "flex",
          }}
        >
          atzcompany.co.tz
        </div>
      </div>
    </div>,
    OG_SIZE
  );
}
