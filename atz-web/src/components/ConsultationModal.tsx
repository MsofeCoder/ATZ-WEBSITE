"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/dictionaries";
import { WA_URL as WA } from "@/lib/site";
import { isValidEmail } from "@/lib/validation";
const WHATSAPP_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" />
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
  </svg>
);

export default function ConsultationModal({
  dict,
  open,
  onClose,
}: {
  dict: Dict;
  open: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<{ kind: "error" | "idle"; msg?: string }>({ kind: "idle" });
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      const first = modalRef.current?.querySelector("input, select, textarea, button");
      setTimeout(() => (first as HTMLElement)?.focus(), 40);
      // Reset state using requestAnimationFrame to avoid cascading renders
      requestAnimationFrame(() => {
        setStatus({ kind: "idle" });
        setSuccess(false);
      });
    } else {
      document.body.style.overflow = "";
      lastFocused.current?.focus();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const f = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    if (!name || !email || !isValidEmail(email)) {
      setStatus({ kind: "error", msg: dict.modal.errRequired });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
      form.reset();
    } catch {
      setStatus({ kind: "error", msg: dict.modal.errNetwork });
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-deep/60 p-6 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-title"
        className="relative max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded bg-white p-9 md:p-10"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-slate-ink hover:text-navy"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {!success ? (
          <>
            <h3 id="consultation-title" className="font-display text-2xl font-extrabold text-navy">{dict.modal.title}</h3>
            <p className="mb-6 mt-2 text-sm text-slate-ink">{dict.modal.sub}</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
                <div className="mb-4">
                  <label htmlFor="cf-name" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.name}</label>
                  <input id="cf-name" name="name" type="text" required className="w-full rounded-sm border border-navy/20 px-3.5 py-3 text-sm text-navy" />
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-company" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.company}</label>
                  <input id="cf-company" name="company" type="text" className="w-full rounded-sm border border-navy/20 px-3.5 py-3 text-sm text-navy" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
                <div className="mb-4">
                  <label htmlFor="cf-email" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">Email</label>
                  <input id="cf-email" name="email" type="email" required className="w-full rounded-sm border border-navy/20 px-3.5 py-3 text-sm text-navy" />
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-phone" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.phone}</label>
                  <input id="cf-phone" name="phone" type="tel" className="w-full rounded-sm border border-navy/20 px-3.5 py-3 text-sm text-navy" />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="cf-service" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.service}</label>
                <select id="cf-service" name="service" className="w-full rounded-sm border border-navy/20 bg-white px-3.5 py-3 text-sm text-navy">
                  <option>{dict.modal.opt1}</option>
                  <option>{dict.modal.opt2}</option>
                  <option>{dict.modal.opt3}</option>
                  <option>{dict.modal.opt4}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
                <div className="mb-4">
                  <label htmlFor="cf-budget" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.budget}</label>
                  <select id="cf-budget" name="budget" className="w-full rounded-sm border border-navy/20 bg-white px-3.5 py-3 text-sm text-navy">
                    <option>Under 500,000</option>
                    <option>500,000 – 2,000,000</option>
                    <option>2,000,000 – 10,000,000</option>
                    <option>Above 10,000,000</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="cf-timeline" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.timeline}</label>
                  <select id="cf-timeline" name="timeline" className="w-full rounded-sm border border-navy/20 bg-white px-3.5 py-3 text-sm text-navy">
                    <option>ASAP</option>
                    <option>Within 1 month</option>
                    <option>1–3 months</option>
                    <option>Just exploring</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="cf-message" className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-navy">{dict.modal.details}</label>
                <textarea id="cf-message" name="message" rows={4} placeholder={dict.modal.detailsPh} className="w-full resize-y rounded-sm border border-navy/20 px-3.5 py-3 text-sm text-navy" />
              </div>

              {/* honeypot — invisible to humans */}
              <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              <button
                type="submit"
                disabled={sending}
                className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-sm bg-gold px-7 py-4 font-display text-sm font-bold text-navy-deep transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {sending ? dict.modal.sending : dict.modal.send}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </button>

              {status.kind === "error" && (
                <p role="alert" className="mt-3.5 rounded border border-red-300 bg-red-50 px-3.5 py-3 text-sm text-red-900">{status.msg}</p>
              )}
            </form>
          </>
        ) : (
          <div className="py-5 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 h-12 w-12 text-gold" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            <h4 className="font-display text-xl font-extrabold text-navy">{dict.modal.successTitle}</h4>
            <p className="mt-2 text-sm text-slate-ink">{dict.modal.successBody}</p>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 font-display text-sm font-bold text-navy-deep transition hover:-translate-y-0.5">
              {WHATSAPP_ICON} WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
