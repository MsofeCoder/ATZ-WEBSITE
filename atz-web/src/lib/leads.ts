/**
 * Lead persistence and delivery.
 *
 * Ordering matters: a lead is written to durable storage *before* any delivery
 * is attempted, so a webhook outage degrades to "we have it, nobody was
 * paged" rather than "the enquiry is gone". `deliverLead` reports per-backend
 * outcomes and the caller decides what the visitor sees.
 */
import { serverEnv, hasLeadDelivery } from "./env";
import { pushCapped, hasRedis } from "./redis";
import type { Lead } from "./validation";

export interface DeliveryReport {
  stored: boolean;
  attempted: number;
  succeeded: number;
  failures: string[];
}

const LEADS_KEY = "atz:leads";

/** Best-effort durable write. Returns false when no store is configured. */
export async function storeLead(lead: Lead): Promise<boolean> {
  if (!hasRedis()) return false;
  return pushCapped(LEADS_KEY, lead);
}

function leadAsText(lead: Lead): string {
  return [
    `Name:      ${lead.name}`,
    `Company:   ${lead.company || "—"}`,
    `Email:     ${lead.email}`,
    `Phone:     ${lead.phone || "—"}`,
    `Service:   ${lead.service || "—"}`,
    `Budget:    ${lead.budget || "—"}`,
    `Timeline:  ${lead.timeline || "—"}`,
    `Locale:    ${lead.locale}`,
    `Lead ID:   ${lead.id}`,
    `Received:  ${lead.receivedAt}`,
    "",
    "Details:",
    lead.message || "(none supplied)",
    "",
    `— Sent by the ATZ website. Reply directly to reach ${lead.name}.`,
  ].join("\n");
}

async function postJson(url: string, body: unknown, headers: HeadersInit = {}) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
}

/** Retries once on network failure or 5xx; 4xx is treated as permanent. */
async function withRetry(
  label: string,
  send: () => Promise<Response>,
  failures: string[]
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await send();
      if (res.ok) return true;
      if (res.status < 500) {
        failures.push(`${label}:${res.status}`);
        return false;
      }
      if (attempt === 1) failures.push(`${label}:${res.status}`);
    } catch {
      if (attempt === 1) failures.push(`${label}:network`);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

export async function deliverLead(lead: Lead): Promise<DeliveryReport> {
  const env = serverEnv();
  const failures: string[] = [];
  const stored = await storeLead(lead);
  let attempted = 0;
  let succeeded = 0;

  // Web3Forms: emails the lead to the address the access key was issued for.
  // The key is server-only — it never reaches the browser bundle — so the
  // form still goes through /api/lead and keeps the origin check, rate
  // limiter, honeypot and timing filter in front of it.
  if (env.WEB3FORMS_ACCESS_KEY) {
    attempted++;
    const ok = await withRetry(
      "web3forms",
      async () => {
        const res = await postJson("https://api.web3forms.com/submit", {
          access_key: env.WEB3FORMS_ACCESS_KEY,
          subject: `Consultation request — ${lead.company || lead.name}`,
          from_name: "ATZ Website",
          // Web3Forms reads these two for the notification's Reply-To.
          name: lead.name,
          email: lead.email,
          company: lead.company || "—",
          phone: lead.phone || "—",
          service: lead.service || "—",
          budget: lead.budget || "—",
          timeline: lead.timeline || "—",
          locale: lead.locale,
          lead_id: lead.id,
          received_at: lead.receivedAt,
          message: leadAsText(lead),
        });
        // Web3Forms answers 200 with {success:false} for a bad key, so treat
        // that as a permanent (4xx-class) failure rather than a success.
        if (res.ok) {
          const body = (await res
            .clone()
            .json()
            .catch(() => ({}))) as { success?: boolean };
          if (body.success === false) return new Response(null, { status: 422 });
        }
        return res;
      },
      failures
    );
    if (ok) succeeded++;
  }

  if (env.LEAD_WEBHOOK_URL) {
    attempted++;
    if (await withRetry("webhook", () => postJson(env.LEAD_WEBHOOK_URL!, lead), failures)) {
      succeeded++;
    }
  }

  if (env.RESEND_API_KEY) {
    attempted++;
    const ok = await withRetry(
      "resend",
      () =>
        postJson(
          "https://api.resend.com/emails",
          {
            from: env.LEAD_FROM_EMAIL,
            to: [env.LEAD_NOTIFY_EMAIL],
            reply_to: lead.email,
            subject: `Consultation request — ${lead.company || lead.name}`,
            text: leadAsText(lead),
          },
          { Authorization: `Bearer ${env.RESEND_API_KEY}` }
        ),
      failures
    );
    if (ok) succeeded++;
  }

  return { stored, attempted, succeeded, failures };
}

export { hasLeadDelivery };
