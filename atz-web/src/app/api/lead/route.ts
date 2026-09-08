import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { leadSchema, MIN_FILL_MS, type Lead } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { deliverLead, hasLeadDelivery } from "@/lib/leads";
import { SITE_URL, IS_PRODUCTION } from "@/lib/env";

export const runtime = "nodejs";
/** Never cached — every call mutates state. */
export const dynamic = "force-dynamic";

/**
 * Rejects cross-site posts. The form is same-origin, so a missing or foreign
 * Origin is either a bot or a CSRF attempt. Requests without an Origin header
 * at all (curl, server-to-server) are allowed outside production so the e2e
 * API contract test can run.
 */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return !IS_PRODUCTION;
  try {
    const host = req.headers.get("host");
    const url = new URL(origin);
    if (host && url.host === host) return true;
    return url.origin === SITE_URL;
  } catch {
    return false;
  }
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Bots learn nothing from this: it is indistinguishable from success. */
const silentOk = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  const ip = clientIp(req);
  const limit = await checkRateLimit(`lead:${ip}`, { limit: 5, windowSeconds: 60 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.resetSeconds),
          "RateLimit-Limit": String(limit.limit),
          "RateLimit-Remaining": String(limit.remaining),
        },
      }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: Object.keys(parsed.error.flatten().fieldErrors) },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Two cheap bot filters before any outbound work: a hidden field humans
  // never see, and a form submitted faster than a person can type. Both are
  // logged: the response is deliberately indistinguishable from success, so
  // without a log line a false positive is invisible and a real enquiry
  // vanishes without trace.
  if (input._gotcha) {
    console.warn("[lead] honeypot filled — dropping", { ip });
    return silentOk();
  }
  if (input._elapsed !== undefined && input._elapsed < MIN_FILL_MS) {
    console.warn("[lead] submitted faster than a human could type — dropping", {
      ip,
      elapsedMs: input._elapsed,
    });
    return silentOk();
  }

  const lead: Lead = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    company: input.company,
    phone: input.phone,
    service: input.service,
    budget: input.budget,
    timeline: input.timeline,
    message: input.message,
    locale: input.locale,
  };

  // No delivery backend configured: refuse rather than accept a lead that
  // nobody will ever read. A console log is not a delivery mechanism.
  if (!hasLeadDelivery()) {
    if (IS_PRODUCTION) {
      console.error("[lead] no delivery backend configured — refusing", { id: lead.id });
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    console.warn("[lead] dev mode, no backend configured:", JSON.stringify(lead));
    return NextResponse.json({ ok: true, id: lead.id, dev: true });
  }

  const report = await deliverLead(lead);

  if (report.succeeded === 0) {
    console.error("[lead] delivery failed", {
      id: lead.id,
      stored: report.stored,
      failures: report.failures,
    });
    // Stored but undeliverable is still a captured lead — tell the visitor it
    // landed. Neither stored nor delivered is a genuine failure.
    if (report.stored) return NextResponse.json({ ok: true, id: lead.id, degraded: true });
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  if (report.failures.length) {
    console.warn("[lead] partial delivery", { id: lead.id, failures: report.failures });
  }

  return NextResponse.json({ ok: true, id: lead.id });
}

/** Explicitly reject everything else rather than returning Next's 405 page. */
export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
