/**
 * Validated environment access — the single place env vars are read.
 *
 * Server code imports `serverEnv`; anything rendered on the client must use
 * `SITE_URL` (derived from a NEXT_PUBLIC_ var, so it is inlined at build time).
 *
 * Validation is lazy and cached: importing this module never throws, so a
 * misconfigured preview build still renders. Callers that *require* a value
 * ask for it explicitly and handle the failure.
 */
import { z } from "zod";

/** Canonical origin, no trailing slash. Safe on both server and client. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://atzcompany.co.tz").replace(
  /\/+$/,
  ""
);

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Web3Forms access key for *browser* submissions. Web3Forms designs these keys
 * to be public (the free tier only accepts posts from the browser — server
 * calls get a 403 unless the Pro plan allow-lists the server IP), so it is a
 * NEXT_PUBLIC_ variable, inlined at build time. Empty string when unset.
 */
export const WEB3FORMS_PUBLIC_KEY = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "").trim();

const serverSchema = z.object({
  /** Server-side Web3Forms — Pro plan with the server IP allow-listed only. */
  WEB3FORMS_ACCESS_KEY: z.string().min(1).optional(),
  LEAD_WEBHOOK_URL: z.url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  LEAD_NOTIFY_EMAIL: z.email().default("info@atzcompany.co.tz"),
  LEAD_FROM_EMAIL: z.string().min(1).default("ATZ Website <onboarding@resend.dev>"),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/**
 * `.env.example` lists every variable, so an unused one is typically left as
 * `NAME=` — which loads as "" and would fail `z.url()` / `z.email()`, taking
 * the *whole* parse (and every valid key with it) down to defaults. Blank
 * means unset.
 */
function withoutBlanks(env: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) if (v !== undefined && v.trim() !== "") out[k] = v;
  return out;
}

/** Parsed server env. Falls back to defaults (never throws) so the app boots. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(withoutBlanks(process.env));
  if (!parsed.success) {
    console.error(
      "[env] invalid server environment; falling back to defaults:",
      z.treeifyError(parsed.error)
    );
    cached = serverSchema.parse({});
  } else {
    cached = parsed.data;
  }
  return cached;
}

/** True when at least one *server-side* lead-delivery backend is configured. */
export function hasLeadDelivery(): boolean {
  const env = serverEnv();
  return Boolean(env.WEB3FORMS_ACCESS_KEY || env.LEAD_WEBHOOK_URL || env.RESEND_API_KEY);
}

/** True when the browser will deliver the lead itself (Web3Forms free tier). */
export function hasClientDelivery(): boolean {
  return WEB3FORMS_PUBLIC_KEY.length > 0;
}

/** True when Upstash Redis credentials are present (durable store + rate limit). */
export function hasRedis(): boolean {
  const env = serverEnv();
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
