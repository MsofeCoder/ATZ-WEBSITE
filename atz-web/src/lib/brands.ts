/**
 * Single source of truth for the three ATZ companies.
 *
 * Every non-translatable fact about a brand — its URL, logo, colours, orbit
 * geometry — lives here. Copy lives in `@/dictionaries` under `solar.*`,
 * `md`/`aiCo`/`mc`. Nothing else in the codebase should hardcode a brand URL
 * or hex value.
 *
 * Orbit / visual parameters match the standalone reference repo
 * (atz-3d-solar-system-landing-page) so the two implementations stay aligned.
 */

export type BrandId = "md" | "ai" | "mc";
export type BodyId = BrandId | "sun";

export interface Brand {
  id: BrandId;
  /** Legal/marketing name — identical in every locale. */
  name: string;
  url: string;
  logo: string;
  /** Primary accent — fills, borders, chip tints and glows. */
  accent: string;
  /**
   * The accent as *text* on white. The bright accents above reach only
   * 2.1–3.5:1 on a white card, so anything that must be read — tags,
   * slogans, stat figures, the Details button — uses this darker shade,
   * which clears 4.5:1. Same split as `--gold` / `--gold-ink`.
   */
  accentInk: string;
  /** Secondary accent — the bright end of every gradient. */
  accentBright: string;
  gradient: string;
  /** Additive-blend glow colour for the WebGL hero. */
  glow: string;
  /** RGB triplet of `accentBright`, for canvas gradient generation. */
  rgb: readonly [number, number, number];
  /** Hex as a number, for three.js material colours. */
  hex: number;

  // ---- 3-D scene colours (matching the reference repo palette) --------
  /** Planet base surface colour (dark, sampled from the division mark). */
  baseHex: number;
  /** Primary accent as a hex number — planet rim, halo, badge ring. */
  accentHex: number;
  /** Secondary accent hex — used for banding gradient end. */
  accentSecondaryHex: number;

  // ---- Orbit parameters ----------------------------------------------
  orbit: {
    /** World-unit distance from the sun. */
    radius: number;
    /** Seconds for one full revolution. */
    period: number;
    /** Initial orbital angle so planets are spread across the sky. */
    startAngle: number;
    /** Axial tilt of the orbital plane, in radians. */
    tilt: number;
  };

  /**
   * Sphere radius in world units. Differentiated per company so the three
   * bodies read as distinct planets rather than one shape repeated.
   */
  bodyRadius: number;
}

export const BRANDS: Record<BrandId, Brand> = {
  ai: {
    id: "ai",
    name: "Adam Intelligence",
    url: "https://adamuintelligence.github.io/portfolio/",
    logo: "/brand-logos/ai-logo.png",
    accent: "#2b8cff",
    accentInk: "#1b63d6",
    accentBright: "#35d0f0",
    gradient: "linear-gradient(120deg,#1e6ff2,#35d0f0)",
    glow: "rgba(30,111,242,0.55)",
    rgb: [30, 111, 242],
    hex: 0x1e6ff2,
    // 3-D palette (from reference repo data.ts)
    baseHex: 0x0b1d47,
    accentHex: 0x1e6ff2,
    accentSecondaryHex: 0x35d0f0,
    orbit: { radius: 7.4, period: 34, startAngle: 0.4, tilt: 0.045 },
    bodyRadius: 1.25,
  },
  mc: {
    id: "mc",
    name: "Msofe Coder",
    url: "https://msofecoder.github.io/portfolio/",
    logo: "/brand-logos/mc-logo.png",
    accent: "#3fc9a3",
    accentInk: "#117a63",
    accentBright: "#7ce0ab",
    gradient: "linear-gradient(120deg,#1f9c8a,#7ce0ab)",
    glow: "rgba(31,156,138,0.5)",
    rgb: [31, 156, 138],
    hex: 0x1f9c8a,
    // 3-D palette
    baseHex: 0x0a2320,
    accentHex: 0x1f9c8a,
    accentSecondaryHex: 0x7ce0ab,
    orbit: { radius: 10.8, period: 52, startAngle: 2.5, tilt: -0.06 },
    bodyRadius: 1.4,
  },
  md: {
    id: "md",
    name: "Msofe Designer",
    url: "https://msofedesigner.blogspot.com/",
    logo: "/brand-logos/md-logo.png",
    accent: "#e8509f",
    accentInk: "#c4177a",
    accentBright: "#39c9e8",
    gradient: "linear-gradient(120deg,#e0419b,#39c9e8)",
    glow: "rgba(224,65,155,0.55)",
    rgb: [224, 65, 155],
    hex: 0xe0419b,
    // 3-D palette
    baseHex: 0x2a1038,
    accentHex: 0xe0419b,
    accentSecondaryHex: 0x39c9e8,
    orbit: { radius: 14.4, period: 74, startAngle: 4.6, tilt: 0.09 },
    bodyRadius: 1.6,
  },
};

/** Stable render order: innermost orbit first. */
export const BRAND_IDS: readonly BrandId[] = ["ai", "mc", "md"];

export const BRAND_LIST: readonly Brand[] = BRAND_IDS.map((id) => BRANDS[id]);

/** The parent company at the centre of the hero scene. */
export const SUN = {
  id: "sun" as const,
  name: "ATZ Company Limited",
  logo: "/ATZ_LOGO.png",
  gradient: "linear-gradient(120deg,#c9a63f,#f0c95a)",
  accentBright: "#f0c95a",
  glow: "rgba(201,166,63,0.55)",
  rgb: [201, 166, 63] as const,
  hex: 0xc9a63f,
};

/** Accent used for a body's drawer eyebrow — planets bright, sun soft gold. */
export function accentFor(id: BodyId): string {
  return id === "sun" ? SUN.accentBright : BRANDS[id].accentBright;
}
