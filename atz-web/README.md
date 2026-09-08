# ATZ Company Limited — Website

Marketing site for ATZ Company Limited, the Tanzanian parent company behind
Msofe Designer (creative studio), Adam Intelligence (AI consultancy), and
Msofe Coder (development agency).

Built with **Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 ·
GSAP · Three.js**.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Testing

```bash
npm run lint                  # ESLint
npx playwright test           # e2e suite (spins up a prod server on :3311)
```

The e2e suite (`e2e/lead-funnel.spec.ts`) covers hero/section rendering, the
Swahili locale route, modal focus management, form validation, the lead API
contract, and the ecosystem card layout.

## Architecture

```
src/
  app/            App Router pages (/, /sw, /contact), robots, sitemap, JSON-LD
  components/     UI components (client components are marked "use client")
    HeroOrbit.tsx   ← Three.js WebGL hero (see below)
    Hero.tsx        ← Hero layout: copy, CTAs, stats, modal
    ...             ← Ecosystem, Testimonials, FounderQuote, CtaBand, Header, Footer
  dictionaries/   EN + SW copy (single source of truth for all text)
  lib/            site config, SEO helpers, validation
```

### The Three.js hero (`src/components/HeroOrbit.tsx`)

A WebGL scene depicting the ATZ ecosystem: a fresnel-shaded glowing gold sun
(the parent company) with three brand-colored planets (the three companies)
orbiting on a plane, elliptical orbit lines swept by light "sparks", an
additive-blended starfield, and mouse parallax.

**Interaction model** (designed so moving bodies never fight the cursor):

- **Precision mode** — when the pointer enters the orbit stage, the whole
  system eases to a crawl; when you hover or keyboard-focus a planet, that
  planet eases to a full stop. Leaving the stage restores full speed.
- The **entire glowing orb is interactive** (generous 2D projected hit radius),
  not just the small logo chip — hovering anywhere on the glow highlights it
  and shows the tooltip; clicking it opens the company drawer.
- **Magnetic chips** lean subtly toward the pointer.
- Clicking any body fires a 3D pulse shockwave, opens the localized detail
  drawer, and (for planets) scrolls to and force-opens the matching company
  card in the ecosystem section.

Accessible DOM overlay buttons (real `<button>` elements with logos and
tooltips) are synced to the 3D bodies each frame via camera projection, so the
scene stays fully keyboard-accessible and localized.

Production safeguards built in:

- `prefers-reduced-motion` → scene renders a single static frame, no loop
- Tab hidden / hero off-screen → animation pauses (IntersectionObserver +
  `visibilitychange`)
- Device pixel ratio clamped to 2 for GPU headroom
- No WebGL / Three.js load failure → static positioned fallback (buttons
  remain usable)
- All geometries, materials, textures, and the renderer are disposed on
  unmount

## Lead capture (`/api/lead`)

POST endpoint with in-memory rate limiting, honeypot field, server-side
validation, and three delivery backends (configurable via env):

1. `LEAD_WEBHOOK_URL` — generic webhook (Formspree / Zapier / Make / custom)
2. `RESEND_API_KEY` (+ optional `LEAD_NOTIFY_EMAIL`) — email via Resend
3. Fallback — logs the lead to server console (visible in Vercel logs)

Copy `.env.example` to `.env.local` to configure.
