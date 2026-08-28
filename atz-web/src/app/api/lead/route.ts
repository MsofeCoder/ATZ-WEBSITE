import { NextResponse } from "next/server";
import { EMAIL_RE } from "@/lib/validation";

// Simple in-memory rate limit (per instance). Swap for Upstash Redis in multi-instance prod.
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  // Prune expired entries so the map cannot grow unbounded
  if (hits.size > 0) {
    for (const [key, rec] of hits) {
      if (now > rec.reset) hits.delete(key);
    }
  }
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // honeypot: bots fill hidden fields
  if (typeof body._gotcha === "string" && body._gotcha.length > 0) {
    // pretend success so bots learn nothing
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const lead = {
    name,
    email,
    company: String(body.company ?? "").slice(0, 200),
    phone: String(body.phone ?? "").slice(0, 50),
    service: String(body.service ?? "").slice(0, 120),
    budget: String(body.budget ?? "").slice(0, 60),
    timeline: String(body.timeline ?? "").slice(0, 60),
    message: String(body.message ?? "").slice(0, 5000),
    locale: body.locale === "sw" ? "sw" : "en",
    receivedAt: new Date().toISOString(),
  };

  // ---- Delivery backends -------------------------------------------------
  // 1. Webhook (Formspree / Zapier / Make / your endpoint) — set LEAD_WEBHOOK_URL
  // 2. Resend email — set RESEND_API_KEY + LEAD_NOTIFY_EMAIL
  // 3. Otherwise: log to server console so Vercel logs capture it.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.LEAD_NOTIFY_EMAIL ?? "info@atzcompany.co.tz";
  const failures: string[] = [];
  let attempted = 0;

  if (webhook) {
    attempted++;
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) failures.push(`webhook:${res.status}`);
    } catch {
      failures.push("webhook:network");
    }
  }

  if (resendKey) {
    attempted++;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ATZ Website <onboarding@resend.dev>",
          to: [notifyEmail],
          subject: `Consultation Request — ${lead.company || lead.name}`,
          text:
            `Name: ${lead.name}\nCompany: ${lead.company}\nEmail: ${lead.email}\n` +
            `Phone: ${lead.phone}\nService: ${lead.service}\nBudget: ${lead.budget}\n` +
            `Timeline: ${lead.timeline}\nLocale: ${lead.locale}\n\nDetails:\n${lead.message}\n`,
          reply_to: lead.email,
        }),
      });
      if (!res.ok) failures.push(`resend:${res.status}`);
    } catch {
      failures.push("resend:network");
    }
  }

  if (attempted === 0) {
    console.log("[LEAD]", JSON.stringify(lead));
  } else if (failures.length === attempted) {
    // Every configured delivery backend failed — surface it so the client can
    // fall back to WhatsApp instead of the lead being silently lost.
    console.error("[LEAD delivery failed]", failures, JSON.stringify(lead));
    return NextResponse.json({ error: "delivery_failed", failures }, { status: 502 });
  } else if (failures.length) {
    console.error("[LEAD partial delivery failures]", failures, JSON.stringify(lead));
  }

  return NextResponse.json({ ok: true });
}
