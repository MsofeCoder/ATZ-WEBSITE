import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

/**
 * Static security headers.
 *
 * The Content-Security-Policy is NOT here: it carries a per-request nonce and
 * is set in `src/middleware.ts`. Headers declared in this file are static, and
 * a static CSP cannot have a nonce — which is why `script-src` used to fall
 * back to `'unsafe-inline'` in production.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework.
  poweredByHeader: false,
  // Trailing slashes create duplicate URLs for crawlers.
  trailingSlash: false,

  // Pin the workspace root so Turbopack doesn't infer it from a stray parent
  // lockfile.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Every image is local and served from /public.
    remotePatterns: [],
  },

  experimental: {
    // Ship only the icon/helper modules actually imported.
    optimizePackageImports: ["three"],
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Next already serves /_next/static as immutable; overriding it here
      // breaks dev-server revalidation for no gain.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  async redirects() {
    return [
      // The English tree lives at the root; /en/* was never canonical.
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
