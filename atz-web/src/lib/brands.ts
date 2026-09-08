/**
 * Single source of truth for the three ATZ companies.
 *
 * Every non-translatable fact about a brand — its URL, logo, colours, orbit
 * geometry — lives here. Copy lives in `@/dictionaries` under `solar.*`,
 * `md`/`aiCo`/`mc`. Nothing else in the codebase should hardcode a brand URL
 * or hex value.
 */

export type BrandId = "md" | "ai" | "mc";
export type BodyId = BrandId | "sun";

export interface Brand {
  id: BrandId;
  /** Legal/marketing name — identical in every locale. */
  name: string;
  url: string;
  logo: string;
  /** Primary accent, used for card borders, chips and headings. */
  accent: string;
  /** Secondary accent — the bright end of every gradient. */
  accentBright: string;
  gradient: string;
  /** Additive-blend glow colour for the WebGL hero. */
  glow: string;
  /** RGB triplet of `accentBright`, for canvas gradient generation. */
  rgb: readonly [number, number, number];
  /** Hex as a number, for three.js material colours. */
  hex: number;
  orbit: { radius: number; period: number; startAngle: number };
}

export const BRANDS: Record<BrandId, Brand> = {
  md: {
    id: "md",
    name: "Msofe Designer",
    url: "https://msofedesigner.blogspot.com/",
    logo: "/brand-logos/md-logo.png",
    accent: "#6A0DAD",
    accentBright: "#E91E8C",
    gradient: "linear-gradient(120deg,#6A0DAD,#E91E8C)",
    glow: "rgba(233,30,140,0.55)",
    rgb: [233, 30, 140],
    hex: 0xe91e8c,
    orbit: { radius: 1.7, period: 16, startAngle: 0.4 },
  },
  ai: {
    id: "ai",
    name: "Adam Intelligence",
    url: "https://adamuintelligence.github.io/portfolio/",
    logo: "/brand-logos/ai-logo.png",
    accent: "#0A2540",
    accentBright: "#00BCD4",
    gradient: "linear-gradient(120deg,#0A2540,#00BCD4)",
    glow: "rgba(0,188,212,0.55)",
    rgb: [0, 188, 212],
    hex: 0x00bcd4,
    orbit: { radius: 2.55, period: 24, startAngle: 2.6 },
  },
  mc: {
    id: "mc",
    name: "Msofe Coder",
    url: "https://msofecoder.github.io/portfolio/",
    logo: "/brand-logos/mc-logo.png",
    accent: "#1B5E20",
    accentBright: "#69F0AE",
    gradient: "linear-gradient(120deg,#1B5E20,#69F0AE)",
    glow: "rgba(105,240,174,0.5)",
    rgb: [105, 240, 174],
    hex: 0x69f0ae,
    orbit: { radius: 3.4, period: 34, startAngle: 4.6 },
  },
};

/** Stable render order: innermost orbit first. */
export const BRAND_IDS: readonly BrandId[] = ["md", "ai", "mc"];

export const BRAND_LIST: readonly Brand[] = BRAND_IDS.map((id) => BRANDS[id]);

/** The parent company at the centre of the hero scene. */
export const SUN = {
  id: "sun" as const,
  name: "ATZ Company Limited",
  logo: "/ATZ_LOGO.png",
  gradient: "linear-gradient(120deg,#C9A84C,#E4CE8F)",
  accentBright: "#E4CE8F",
  glow: "rgba(201,168,76,0.55)",
  rgb: [201, 168, 76] as const,
  hex: 0xc9a84c,
};

/** Accent used for a body's drawer eyebrow — planets bright, sun soft gold. */
export function accentFor(id: BodyId): string {
  return id === "sun" ? SUN.accentBright : BRANDS[id].accentBright;
}
