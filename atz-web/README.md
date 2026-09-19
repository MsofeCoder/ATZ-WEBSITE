# ATZ Company Limited — Website

Marketing site for ATZ Company Limited, the Tanzanian parent company behind
Msofe Designer (creative studio), Adam Intelligence (AI consultancy), and
Msofe Coder (development agency).

Built with **Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 ·
Three.js**. Bilingual: English at the root, Swahili under `/sw`.

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then fill it in — every variable is documented there
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Testing

```bash
npm run verify        # lint + typecheck + unit tests + build — what CI runs
npm test              # Vitest unit tests (lib/ and robots)
npx playwright test   # e2e, spins up a prod server on :3311
npm run format:check  # Prettier
```

Unit tests cover validation, the rate limiter, locale path helpers, and
`robots.ts`. The e2e suite covers the lead funnel, i18n routing (every
in-page link on a Swahili page must stay in the Swahili tree), the lead API
contract, and accessibility — axe against WCAG 2.1 A/AA on all six pages plus
the open consultation dialog. Both Playwright projects are Chromium-based
(desktop and Pixel 7) so CI needs only one browser download.

## Architecture

```
src/
  app/
    (en)/ (sw)/     one root layout per locale, so <html lang> is correct in
                    the server-rendered HTML rather than patched after hydration
    api/lead/       lead capture endpoint
    og/en  og/sw    generated 1200×630 Open Graph cards
    manifest.ts  robots.ts  sitemap.ts  icon.png  apple-icon.png
  proxy.ts          per-request CSP nonce (Next 16's renamed `middleware`)
  components/
    hero-orbit/     WebGL hero — engine.ts (three.js, no React), HeroOrbit.tsx
                    (React host + accessible overlay), OrbitDrawer.tsx
    layout/         SiteHeader, SiteFooter, LocaleShell, SkipLink, JsonLd, WhatsAppFab,
                    LangToggle (3-D pill; plays public/audio/{karibu,welcome}.mp3)
    SendButton.tsx  animated submit: idle → sending → sent
    pages/          HomeView, ContactView, LegalView
    sections/       HomeSections, Approach
    providers/      ConsultationProvider — owns the single consultation dialog
  dictionaries/     en.ts and sw.ts. `en` generates the Dict type, so an
                    untranslated key is a compile error. Split per locale so a
                    page ships only the language it renders.
  hooks/            useFocusTrap, useScrollLock, useMediaQuery
  lib/              site config, brands, SEO, validation, rate limiting, Redis,
                    env parsing, locales, OG rendering
```

Nothing outside `dictionaries/` should contain user-visible text, and nothing
outside `lib/brands.ts` should hardcode a brand URL or hex value.

### The WebGL hero

A scene depicting the ATZ ecosystem: a fresnel-shaded gold sun (the parent
company) with three brand-coloured planets orbiting on a plane, orbit lines
swept by light "sparks", an additive-blended starfield, and pointer parallax.

Real `<button>` elements are synced to the 3D bodies each frame via camera
projection, so the scene is fully keyboard-accessible and localised — the
visible orbs are canvas pixels, but everything they do is reachable without
them.

**Interaction.** Clicking a body opens its detail drawer, in place. Hovering
or keyboard-focusing a planet brings that planet to a full stop, so it is a
stationary target; the whole system eases to a crawl while the pointer is over
the stage. The entire glowing orb is clickable, not just the logo chip.

**Three.js is a progressive enhancement, not a dependency.** The static scene
paints first on every device — three brands on an even 120° circle with a
drawn orbit ring — and the 177 KB WebGL upgrade loads on idle once the hero
nears the viewport. It is skipped entirely on Data Saver, 2G, devices
reporting ≤2 GB of memory, and any viewport below `lg`, where the canvas
renders too small for the depth and shading to read. A Pixel 7 transfers
about 247 KB of JavaScript; a desktop about 427 KB.

Also built in: `prefers-reduced-motion` renders a single static frame;
animation pauses when the tab is hidden or the hero scrolls off screen; device
pixel ratio is clamped to 2; every geometry, material, texture and the
renderer are disposed on unmount.

## Lead capture (`/api/lead`)

POST endpoint with same-origin checks, rate limiting, a honeypot field, a
too-fast-to-be-human timing filter, and shared server-side validation.

Ordering matters: a lead is written to durable storage **before** any delivery
is attempted, so a webhook outage degrades to "we have it, nobody was paged"
rather than losing the enquiry.

Delivery backends, configured via env (see `.env.example`):

1. `NEXT_PUBLIC_WEB3FORMS_KEY` — email via [Web3Forms](https://web3forms.com)
   (free tier; the recommended default). Web3Forms' free tier only accepts
   posts from the browser, so the page posts to `/api/lead` first (validation,
   bot filters, storage) and then to Web3Forms itself when the server answers
   `clientDelivery: true`. Web3Forms access keys are public by design.
2. `LEAD_WEBHOOK_URL` — generic webhook (Formspree / Zapier / Make / custom)
3. `RESEND_API_KEY` (+ `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL`) — email via Resend
4. `WEB3FORMS_ACCESS_KEY` — server-side Web3Forms; Pro plan with the server IP
   allow-listed only

Backends 2–4 are server-only and never reach the client bundle.

**With none configured, production returns 503 and refuses the
submission.** There is deliberately no console-logging fallback: a log line
nobody reads is not a delivery mechanism, and accepting an enquiry that will
never reach anyone is worse than declining it. In development it logs and
returns ok so the form stays testable.

`UPSTASH_REDIS_REST_URL` / `_TOKEN` enable the durable store and a rate
limiter that holds across serverless instances. Both degrade gracefully but
silently, so set them in production.

## Security headers

`src/proxy.ts` sets a per-request Content-Security-Policy carrying a script
nonce, which is why `script-src` does not rely on `'unsafe-inline'`. The
trade-off — the four routes that emit JSON-LD render on demand rather than
statically, because a nonce cannot be baked into a prerendered page — is
documented in that file, along with how to revert it. The remaining static
headers (HSTS, frame options, referrer policy, permissions policy) live in
`next.config.ts`.
