/**
 * Browser-side Web3Forms delivery.
 *
 * Web3Forms' free tier only accepts submissions from the browser (a server
 * call answers 403 unless the Pro plan allow-lists the server IP), so the
 * consultation form posts the lead here *after* `/api/lead` has validated it,
 * run the bot filters and — when a store is configured — recorded it. The
 * access key is public by Web3Forms' design; the notification goes to the
 * inbox the key was issued for.
 */
import { WEB3FORMS_PUBLIC_KEY } from "./env";

const ENDPOINT = "https://api.web3forms.com/submit";

export interface Web3FormsLead {
  /** Server-issued lead id, echoed in the email for cross-referencing. */
  id: string;
  locale: string;
  fields: Record<string, string>;
}

/** Resolves true when Web3Forms confirmed the submission, false otherwise. */
export async function postToWeb3Forms({ id, locale, fields }: Web3FormsLead): Promise<boolean> {
  if (!WEB3FORMS_PUBLIC_KEY) return false;
  const { name = "", email = "", message = "", ...rest } = fields;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_PUBLIC_KEY,
        subject: `Consultation request — ${rest.company || name}`,
        from_name: "ATZ Website",
        // `name` + `email` become the notification's Reply-To.
        name,
        email,
        ...rest,
        message: message || "(no details supplied)",
        locale,
        lead_id: id,
        // Web3Forms' own honeypot; ours ran server-side already.
        botcheck: "",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!res.ok || body.success !== true) {
      console.error("[lead] web3forms rejected the submission:", res.status, body.message ?? "");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[lead] web3forms request failed:", err);
    return false;
  }
}
