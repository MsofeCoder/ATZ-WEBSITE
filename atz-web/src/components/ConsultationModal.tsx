"use client";

import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import type { Dict } from "@/dictionaries";
import { EASE_OUT } from "@/components/motion/variants";
import { waLink, fillTemplate, EMAIL, PHONE_DISPLAY } from "@/lib/site";
import { isValidEmail } from "@/lib/validation";
import { vaultLead, markLead } from "@/lib/lead-vault";
import { postToWeb3Forms } from "@/lib/web3forms";
import type { ConsultationPreset } from "@/components/providers/ConsultationProvider";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import SendButton, { type SendState } from "@/components/SendButton";
import CloseIcon from "@/components/icons/Close";

type Status =
  | { kind: "idle" }
  | { kind: "error"; msg: string; showFallback?: boolean }
  | { kind: "success"; name: string; service: string; devOnly: boolean };

/** How long the "Sent" state shows before the confirmation panel takes over. */
const SENT_BEAT_MS = 1100;

const FIELD =
  "w-full rounded-sm border border-navy/20 bg-white px-3.5 py-3 text-sm text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40";
const LABEL = "mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy";

/**
 * Mounted by <ConsultationProvider> only while the dialog is open, so every
 * opening gets a fresh component instance. That removes the need for a reset
 * effect and guarantees the form never reopens showing a stale error.
 */
export default function ConsultationModal({
  dict,
  preset,
  onClose,
}: {
  dict: Dict;
  preset?: ConsultationPreset;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // idle → sending → sent, then the success panel replaces the form. The
  // "sent" beat gives the checkmark time to land before the swap.
  const [phase, setPhase] = useState<SendState>("idle");
  const titleId = useId();
  const descId = useId();
  // Recorded at mount so the server can reject submissions that arrive faster
  // than a human could plausibly have typed them.
  const [openedAt] = useState(() => Date.now());

  useScrollLock(true);
  useFocusTrap(dialogRef, true, onClose);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();

    if (name.length < 2 || !isValidEmail(email)) {
      setStatus({ kind: "error", msg: dict.modal.errRequired });
      form.querySelector<HTMLElement>(name.length < 2 ? "#cf-name" : "#cf-email")?.focus();
      return;
    }

    setStatus({ kind: "idle" });
    setPhase("sending");

    // Captured once, before anything can fail: the fields the visitor typed,
    // as plain strings (the honeypot excluded).
    const fields: Record<string, string> = {};
    for (const [k, v] of fd.entries()) if (k !== "_gotcha") fields[k] = String(v);
    const service = fields.service ?? "";
    // Safety net first, network second — see lib/lead-vault.ts.
    const vaultId = vaultLead({ ...fields, locale: dict.meta.lang });

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(fd.entries()),
          locale: dict.meta.lang,
          _elapsed: Date.now() - openedAt,
        }),
      });
      if (res.status === 429) {
        markLead(vaultId, "failed");
        setStatus({ kind: "error", msg: dict.modal.errRateLimited });
        return;
      }
      // 502 (delivery failed) and 503 (no backend configured) are our problem,
      // not the visitor's connection. Saying "check your network" would send
      // them to debug something that is working — so name it honestly and put
      // the direct channels in front of them instead.
      if (res.status === 502 || res.status === 503) {
        markLead(vaultId, "failed");
        console.error(
          `[lead] /api/lead answered ${res.status}: ${
            res.status === 503
              ? "no delivery backend configured (set NEXT_PUBLIC_WEB3FORMS_KEY, LEAD_WEBHOOK_URL or RESEND_API_KEY in .env.local)"
              : "every configured backend failed"
          }. Lead kept in localStorage["atz:leads"] as ${vaultId}.`
        );
        setStatus({ kind: "error", msg: dict.modal.errUnavailable, showFallback: true });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        dev?: boolean;
        degraded?: boolean;
        /** Server validated + filtered; the browser must post to Web3Forms. */
        clientDelivery?: boolean;
        stored?: boolean;
      };

      // Web3Forms free tier: the notification email is sent from here. If it
      // fails and nothing server-side delivered or stored the lead, the
      // visitor must be told — a success screen over a lost enquiry is the
      // one outcome this form must never produce.
      if (body.clientDelivery) {
        const sent = await postToWeb3Forms({
          id: body.id ?? vaultId,
          locale: dict.meta.lang,
          fields,
        });
        if (sent) {
          body.degraded = false;
        } else if (body.degraded || !body.stored) {
          markLead(vaultId, "failed");
          console.error(
            `[lead] web3forms delivery failed and nothing else has the lead. Kept in localStorage["atz:leads"] as ${vaultId}.`
          );
          setStatus({ kind: "error", msg: dict.modal.errUnavailable, showFallback: true });
          return;
        }
      }

      // Dev-mode acceptance is not delivery. Say so where a developer will
      // see it, and mark the vault entry accordingly.
      if (body.dev) {
        markLead(vaultId, "dev", body.id);
        console.warn(
          "%c[lead] DEV MODE — this request was NOT delivered anywhere.",
          "color:#c9a84c;font-weight:bold",
          "\nNo NEXT_PUBLIC_WEB3FORMS_KEY, LEAD_WEBHOOK_URL or RESEND_API_KEY is set, so /api/lead only logged it to the terminal.",
          '\nA copy is in localStorage["atz:leads"] under id',
          vaultId,
          "\nFields:",
          fields
        );
      } else {
        markLead(vaultId, "sent", body.id);
        // eslint-disable-next-line no-console -- deliberate diagnostic: confirms delivery with the server id
        console.info(
          `[lead] delivered — server id ${body.id ?? "?"}${body.degraded ? " (stored, notification failed)" : ""}`
        );
      }
      setPhase("sent");
      await new Promise((r) => setTimeout(r, SENT_BEAT_MS));
      setStatus({ kind: "success", name: fields.name ?? "", service, devOnly: Boolean(body.dev) });
      form.reset();
      return;
    } catch {
      markLead(vaultId, "failed");
      console.error(
        `[lead] network failure — lead kept in localStorage["atz:leads"] as ${vaultId}.`
      );
      setStatus({ kind: "error", msg: dict.modal.errNetwork });
    } finally {
      setPhase("idle");
    }
  }

  const succeeded = status.kind === "success";
  const fallbackWa = waLink(dict.wa.general);
  /** After a successful submit, WhatsApp opens with the visitor's own details. */
  const successWa =
    status.kind === "success"
      ? waLink(
          fillTemplate(dict.wa.afterSubmit, {
            name: status.name,
            service: status.service || dict.modal.opt4,
          })
        )
      : fallbackWa;

  return createPortal(
    <m.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25 }}
      className="bg-navy-deep/60 fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm md:p-6"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <m.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={succeeded ? undefined : descId}
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="relative my-auto max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-lg bg-white p-6 shadow-2xl md:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="text-slate-ink hover:bg-navy/5 hover:text-navy absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full transition"
        >
          <CloseIcon />
        </button>

        {succeeded ? (
          <div className="py-6 text-center" role="status">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-gold mx-auto mb-4 h-12 w-12"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <h2 id={titleId} className="font-display text-navy text-xl font-extrabold">
              {dict.modal.successTitle}
            </h2>
            <p className="text-slate-ink mx-auto mt-2 max-w-[38ch] text-sm">
              {dict.modal.successBody}
            </p>
            <a
              href={successWa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-navy-deep mt-6 inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="font-display text-navy pr-8 text-2xl font-extrabold">
              {dict.modal.title}
            </h2>
            <p id={descId} className="text-slate-ink mt-2 mb-6 text-sm">
              {dict.modal.sub}
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-x-3.5 md:grid-cols-2">
                <div className="mb-4">
                  <label htmlFor="cf-name" className={LABEL}>
                    {dict.modal.name} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="cf-name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    className={FIELD}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-company" className={LABEL}>
                    {dict.modal.company}
                  </label>
                  <input
                    id="cf-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    className={FIELD}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-email" className={LABEL}>
                    {dict.modal.emailLabel} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="cf-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    className={FIELD}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-phone" className={LABEL}>
                    {dict.modal.phone}
                  </label>
                  <input
                    id="cf-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="cf-service" className={LABEL}>
                  {dict.modal.service}
                </label>
                <select
                  id="cf-service"
                  name="service"
                  className={FIELD}
                  defaultValue={preset?.service ?? dict.modal.opt1}
                >
                  {[dict.modal.opt1, dict.modal.opt2, dict.modal.opt3, dict.modal.opt4].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-x-3.5 md:grid-cols-2">
                <div className="mb-4">
                  <label htmlFor="cf-budget" className={LABEL}>
                    {dict.modal.budget}
                  </label>
                  <select
                    id="cf-budget"
                    name="budget"
                    className={FIELD}
                    defaultValue={dict.modal.budget1}
                  >
                    {[
                      dict.modal.budget1,
                      dict.modal.budget2,
                      dict.modal.budget3,
                      dict.modal.budget4,
                    ].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-timeline" className={LABEL}>
                    {dict.modal.timeline}
                  </label>
                  <select
                    id="cf-timeline"
                    name="timeline"
                    className={FIELD}
                    defaultValue={dict.modal.time1}
                  >
                    {[dict.modal.time1, dict.modal.time2, dict.modal.time3, dict.modal.time4].map(
                      (o) => (
                        <option key={o}>{o}</option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="cf-message" className={LABEL}>
                  {dict.modal.details}
                </label>
                <textarea
                  id="cf-message"
                  name="message"
                  rows={4}
                  maxLength={5000}
                  placeholder={dict.modal.detailsPh}
                  defaultValue={preset?.message}
                  className={`${FIELD} resize-y`}
                />
              </div>

              {/* Honeypot — moved off-screen rather than display:none, so that
                  bots which skip hidden inputs still fill it in. */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-[-9999px] h-0 w-0 overflow-hidden"
              >
                <label htmlFor="cf-gotcha">Leave this field empty</label>
                <input id="cf-gotcha" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
              </div>

              <SendButton
                state={phase}
                labels={{
                  idle: dict.modal.send,
                  sending: dict.modal.sending,
                  sent: dict.modal.sent,
                }}
              />

              <p className="text-slate-ink/80 mt-3 text-center text-xs leading-relaxed">
                {dict.modal.consent}{" "}
                <a href={`mailto:${EMAIL}`} className="hover:text-navy underline">
                  {EMAIL}
                </a>
                .
              </p>

              <div aria-live="polite" aria-atomic="true">
                {status.kind === "error" && (
                  <div
                    role="alert"
                    className="mt-3.5 rounded border border-red-300 bg-red-50 px-3.5 py-3 text-sm text-red-900"
                  >
                    <p>{status.msg}</p>
                    {status.showFallback && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <a
                          href={fallbackWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-display text-navy-deep inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-3.5 py-2 text-xs font-bold"
                        >
                          <WhatsAppIcon size={14} /> {PHONE_DISPLAY}
                        </a>
                        <a href={`mailto:${EMAIL}`} className="underline">
                          {EMAIL}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </>
        )}
      </m.div>
    </m.div>,
    document.body
  );
}
