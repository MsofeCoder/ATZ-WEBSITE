# ATZ Company Limited — Production Implementation Plan

**From prototype (`index-v6.html`) to a production-grade web platform.**
Owner: Adamu Mohamed Msofe (ATZ / Adamu Intelligence) · Last updated: 2026-08-25

---

## 1. Vision & Scope

The prototype proves the brand system (navy/gold, three sub-brands MD/AI/MC, values, testimonials,
consultation funnel). Production turns it into a fast, multilingual, SEO-strong, multi-page platform
that can grow per-company without rewrites.

**Production goals (in priority order):**

1. Real lead pipeline — form submissions land in email + a dashboard, with spam protection.
2. Performance — Lighthouse ≥ 95 across the board on 3G-class Tanzanian mobile networks.
3. Bilingual EN/SW as first-class routing (`/` and `/sw/`), not a client-side toggle.
4. Animated hero upgraded to WebGL (Three.js) with a graceful static fallback.
5. Room to scale: blog/case studies, per-company landing pages, admin visibility into leads.

**Non-goals for v1:** user accounts, payments/e-commerce, native apps.

---

## 2. Technology Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router, TypeScript)** | SSG + ISR, file-based i18n routing, best-in-class SEO, image optimization |
| Styling | **Tailwind CSS v4** + CSS custom properties | The prototype's design tokens map 1:1 to `@theme`; zero runtime cost |
| Animations | **Framer Motion** (UI) + **Three.js via @react-three/fiber** (hero) | Declarative scroll reveals; R3F gives the orbit scene without raw GL boilerplate |
| Forms | **react-hook-form + zod** → **Resend** (email) + **Neon Postgres** or **Supabase** (leads) | Typed validation shared client/server; Resend is free-tier friendly |
| Content | **MDX + Contentlayer-style local content** (v1) → Sanity/Decap CMS later | Case studies/blog without backend lock-in at launch |
| Hosting | **Vercel** (primary) or Cloudflare Pages | Edge CDN in/near East Africa regions, preview deploys, analytics |
| Analytics | Vercel Analytics + Umami (self-host or cloud) | Privacy-friendly, no cookie banner needed |
| Testing | Vitest + Playwright | Unit + E2E of the lead funnel |

**Why not plain HTML?** The prototype stays as the design spec; production needs component reuse
across ~10+ planned pages, typed i18n dictionaries, and server-side form handling — all painful
in static files by page 4.

---

## 3. Design Token Contract

Port these from the prototype verbatim — they are now the single source of truth:

```
--navy:#1B2A4A   --navy-deep:#0E1730
--gold:#C9A84C   --gold-soft:#E4CE8F
--white:#F8F9FA  --slate:#4A4A4A
--md-a:#6A0DAD --md-b:#E91E8C     (Msofe Designer)
--ai-a:#00BCD4 --ai-b:#0A2540     (Adam Intelligence)
--mc-a:#1B5E20 --mc-b:#69F0AE     (Msofe Coder)
Fonts: Montserrat (display) · Open Sans (body) · Playfair Display italic (slogans)
Radius: 2px buttons / 6px cards · Gold focus ring: 3px solid #C9A84C offset 3px
```

Rules carried over: gold focus-visible everywhere, `prefers-reduced-motion` kills all animation,
sub-brand colors only appear as accents (tags, chips, avatars) never as backgrounds.

---

## 4. Information Architecture

```
/                    Home (hero, ecosystem, testimonials, founder quote, values, CTA)
/sw/                 Swahili home (same sections, SW copy)
/company/[slug]      msofe-designer | adam-intelligence | msofe-coder  (v1.1)
/work                Case studies index            (v1.2)
/work/[slug]         Case study detail             (v1.2)
/contact             Standalone contact page       (v1.1)
/legal/privacy       Privacy policy                (required for form/analytics)
sitemap.xml, robots.txt, OG images (dynamic per page)
```

---

## 5. Phased Delivery Plan

### Phase 0 — Foundation (Week 1)
- [ ] Repo: `atz-web` monorepo (pnpm), Next.js 15 + TS strict + ESLint/Prettier
- [ ] Tailwind theme = token contract above; base layout components (Header, Footer, WhatsAppFab, Container)
- [ ] Port prototype sections into components: `Hero`, `EcosystemCards`, `Testimonials`, `FounderQuote`, `ValuesGrid`, `CtaBand`
- [ ] CI: GitHub Actions — typecheck, lint, build on every PR

### Phase 1 — Lead Pipeline (Week 2)  ← highest business value
- [ ] `/api/lead` route handler: zod validation, rate-limit (upstash), honeypot + Turnstile
- [ ] Store lead in Neon/Supabase (`leads` table: name, company, email, phone, service, budget, timeline, message, locale, source, created_at)
- [ ] Email notification via Resend → info@atzcompany.co.tz (+ WhatsApp click-to-chat link in the email body)
- [ ] Success/error states exactly as prototyped; loading state on submit button
- [ ] Playwright test: fill form → assert API called → success view shown

### Phase 2 — i18n & SEO (Week 2–3)
- [ ] Move EN/SW dictionaries from the prototype JS object to typed JSON (`dictionaries/en.json`, `sw.json`) — keys already match (`data-i18n` names become the key schema)
- [ ] `[lang]` dynamic segment; hreflang alternates; localized metadata per page
- [ ] Sitemap, robots, JSON-LD Organization schema (with the three sub-organizations)
- [ ] Native speaker review pass on all Swahili strings (prototype SW is good but should be proofread)

### Phase 3 — Motion & WebGL Hero (Week 3–4)
- [ ] Framer Motion equivalents of: staggered card reveal, count-up stats, headline rise-in
- [ ] R3F hero scene: particle constellation + orbiting MD/AI/MC satellites around ATZ core (reuse prototype canvas logic as the 2D fallback)
- [ ] `<Suspense>` + poster image while loading; auto-fallback to canvas/static when: reduced-motion, WebGL unavailable, or Save-Data header present
- [ ] Budget: hero scene ≤ 150KB gz including three.js — lazy-load below fold if exceeded

### Phase 4 — Performance & A11y hardening (Week 4)
- [ ] `next/font` self-hosted fonts (drop Google Fonts request), font-display swap
- [ ] Image pipeline: ATZ_LOGO as optimized SVG where possible; OG image generation via `@vercel/og`
- [ ] Axe + manual screen-reader pass (modal trap already specced in prototype)
- [ ] Targets: LCP < 2.0s on Moto G-class + Slow 4G, CLS < 0.05, TBT < 200ms

### Phase 5 — Launch & Growth (Week 5+)
- [ ] Domain: atzcompany.co.tz on Vercel, DNS + HTTPS verified
- [ ] Netlify→Vercel decision finalized (form strategy follows host choice)
- [ ] v1.1: per-company pages + standalone contact route
- [ ] v1.2: case-study system (MDX), then optional Sanity CMS if non-dev editing is needed
- [ ] Leads dashboard: simple protected `/admin/leads` table (Supabase auth) — even a read-only list beats inbox-only

---

## 6. Migration Map (prototype → codebase)

| Prototype artifact | Production home |
|---|---|
| `:root` tokens | `globals.css` / Tailwind `@theme` |
| `I18N` object (en/sw) | `dictionaries/{en,sw}.json` + `getDictionary(lang)` |
| `FORM_ENDPOINT` const | `.env.local`: `RESEND_API_KEY`, `LEAD_WEBHOOK_URL` |
| Modal focus-trap logic | `ConsultationModal` component (Radix Dialog could replace it — keep the trap semantics) |
| Hero canvas IIFE | `components/hero/ConstellationCanvas.tsx` (fallback) → `OrbitScene.tsx` (R3F) |
| Hidden Netlify form | Delete once API route ships (Netlify only) |
| Testimonial data | `content/testimonials.ts` (typed array; move to CMS in v1.2) |

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Three.js bundle hurts mobile perf | Lazy-load + strict size budget + canvas fallback already built |
| Swahili quality | Professional proofread before launch; locale switcher keeps EN default |
| Form spam once public | Cloudflare Turnstile + honeypot + rate limit from day one |
| Single-maintainer bandwidth | Ship Phases 0–2 first (they generate leads); motion polish after |
| Sub-brand sites diverging | Publish the token contract as an internal one-pager; review quarterly |

---

## 8. Definition of Done (v1 launch)

- All six prototype features work in production (form endpoint, focus trap, even chips, SW toggle as routes, testimonials, animated hero)
- Lighthouse ≥ 95 performance / ≥ 95 accessibility on mobile
- Every lead reaches email + database reliably; tested end-to-end with real submission
- EN and SW fully indexed with hreflang; Organization JSON-LD validates
- Deployed on atzcompany.co.tz with analytics live and rollback via Git trivial
