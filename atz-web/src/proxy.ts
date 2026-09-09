import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a script nonce.
 *
 * Lives in `proxy.ts`: Next 16 deprecated the `middleware` file convention
 * and renamed it, and the build warns on the old name.
 *
 * The policy previously lived in `next.config.ts`, where headers are static —
 * and a static policy cannot carry a nonce, so `script-src` kept
 * `'unsafe-inline'` in production. That single token defeats most of what CSP
 * exists to prevent: an injected `<script>` in the page executes normally.
 *
 * Next reads the nonce out of this header and stamps it onto its own bootstrap
 * and hydration scripts; the one inline script we author ourselves — the
 * JSON-LD block — reads it back through `headers()`.
 *
 * The production policy is the standard CSP Level 3 pattern, and it looks
 * contradictory until you know the precedence rules. A browser that
 * understands `'strict-dynamic'` ignores both `'unsafe-inline'` and the `https:`
 * host source, and trusts only the nonce plus whatever those nonced scripts
 * load themselves. A browser that does not falls back to the older, weaker
 * allowances rather than to a blank page. So the two trailing tokens are a
 * legacy fallback, not a hole.
 *
 * `style-src` genuinely still needs `'unsafe-inline'`: `next/font` injects the
 * critical font CSS as an inline `<style>` with no nonce hook.
 *
 * COST, stated plainly: a per-request nonce cannot be baked into a
 * prerendered page, so the four routes that emit JSON-LD (`/`, `/contact` and
 * their Swahili counterparts) render on demand instead of statically. Measured
 * locally that is roughly 100ms against 35ms for a static route. It is a real
 * trade and it was made deliberately: the alternative is `'unsafe-inline'` in
 * `script-src`, which defeats most of what CSP is for, and this site is headed
 * for a CMS — the moment editor-authored content reaches the page, an
 * injection vector exists that does not exist today. Retrofitting CSP after
 * that is much harder than carrying it now. To revert, delete this file and
 * put the static policy back in `next.config.ts`.
 */
export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const csp = [
    "default-src 'self'",
    // Turbopack's HMR client is injected inline and eval'd in development.
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  const headers = new Headers(request.headers);
  // Read by server components (JsonLd) for their own inline script.
  headers.set("x-nonce", nonce);
  // Read by Next itself, which parses the nonce out of the *request* CSP
  // header to stamp its bootstrap and hydration scripts. Without this the
  // framework's own scripts go out nonce-less and 'strict-dynamic' blocks
  // them — the page renders and then never hydrates.
  headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /**
     * HTML documents only. Static assets, images and the favicon carry no
     * inline scripts, and running middleware on them would mint a nonce per
     * asset for nothing.
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|webmanifest)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
