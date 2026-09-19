"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { m } from "motion/react";
import type { Dict } from "@/dictionaries";
import { EASE_OUT } from "@/components/motion/variants";
import { BRANDS, SUN, accentFor, type BodyId } from "@/lib/brands";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useConsultation } from "@/components/providers/ConsultationProvider";
import CloseIcon from "@/components/icons/Close";

/** Side panel describing one body in the hero scene. */
export default function OrbitDrawer({
  bodyId,
  dict,
  onClose,
}: {
  bodyId: BodyId;
  dict: Dict;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const { open: openConsultation } = useConsultation();
  useScrollLock(true);
  useFocusTrap(panelRef, true, onClose);

  /**
   * Hand the visitor to the consultation form.
   *
   * The drawer closes first rather than stacking: two overlays would mean two
   * focus traps racing for the same Escape key, and the scroll lock is
   * ref-counted precisely so this hand-off doesn't unlock the page mid-way.
   */
  const requestConsultation = () => {
    onClose();
    openConsultation();
  };

  // Rendered into <body> rather than in place.
  //
  // The drawer lives inside the hero, whose content wrapper is
  // `relative z-[1]` — and that establishes a stacking context. Everything
  // inside it is therefore stacked *within* z-index 1, so this panel's
  // z-index of 191 only ever competed with its own siblings. The sticky
  // header (z-50) and the WhatsApp button (z-40) sit at the root, above that
  // whole context, and painted straight over the drawer: the brand logo was
  // sliced off by the header and the green button floated in the middle of
  // the content.
  //
  // Raising the number would not have helped — no value beats an ancestor
  // context. A portal takes the panel out of the hero's subtree so its
  // z-index is finally measured against the header and the button directly.
  // This is the same reason ConsultationModal never had the problem: it is
  // mounted by the provider up in LocaleShell, not inside a section.
  if (typeof document === "undefined") return null;

  const isSun = bodyId === "sun";
  const meta = isSun ? SUN : BRANDS[bodyId];
  const copy = dict.solar[bodyId];
  const href = isSun ? undefined : BRANDS[bodyId].url;

  return createPortal(
    <>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3 }}
        className="bg-navy-deep/55 fixed inset-0 z-[190] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <m.aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbit-drawer-title"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
        transition={{ duration: 0.34, ease: EASE_OUT }}
        className="bg-navy-deep fixed top-0 right-0 bottom-0 z-[191] flex w-full max-w-[420px] flex-col overflow-hidden border-l border-white/10"
      >
        <div className="h-1.5 w-full flex-none" style={{ background: meta.gradient }} />
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="absolute top-[18px] right-[18px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <CloseIcon size={16} />
        </button>

        {/* Only this region scrolls. The actions below stay pinned, so on a
            short window the primary CTA is never the thing that falls off the
            bottom edge — it used to be clipped at 600px tall with no
            indication there was anything below it. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[30px] pt-8 pb-6">
          {/* Round plate. `overflow-hidden` is what actually enforces the
              circle: a square source (or one with its own background) is
              clipped at the disc instead of poking past it. */}
          <div
            className="relative mb-5 h-[88px] w-[88px] overflow-hidden rounded-full border-2 border-white/10 bg-white p-3"
            style={{ boxShadow: `0 0 0 4px rgba(248,249,250,0.06), 0 0 18px ${meta.glow}` }}
          >
            <Image
              src={meta.logo}
              alt=""
              width={88}
              height={88}
              className="h-full w-full rounded-full object-contain"
            />
          </div>
          <p
            className="font-display mb-2.5 text-[0.68rem] font-bold tracking-[0.2em] uppercase"
            style={{ color: accentFor(bodyId) }}
          >
            {copy.tag}
          </p>
          <h2
            id="orbit-drawer-title"
            className="font-display mb-2.5 text-[1.5rem] font-extrabold text-white"
          >
            {copy.title}
          </h2>
          <p className="font-serif-accent text-gold-soft mb-4 text-[1.05rem] leading-relaxed italic">
            {copy.slogan}
          </p>
          <p className="mb-5 text-[0.92rem] leading-[1.7] text-white/70">{copy.desc}</p>

          <dl className="mb-6">
            {copy.facts.map(([label, value]) => (
              <div
                key={label}
                className="flex gap-2.5 border-t border-white/10 py-2.5 text-[0.86rem] text-white/80 first:border-t-0"
              >
                <dt className="min-w-[92px] flex-none font-bold text-white">{label}</dt>
                <dd className="m-0">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Every path out of this drawer used to lead off-site. The visitor is
            one click from an enquiry here, so the consultation form is offered
            alongside — and for ATZ itself, which has no external site, it
            replaces what was a dead greyed-out pill. */}
        <div className="flex-none border-t border-white/10 px-[30px] pt-5 pb-6">
          <div className="flex flex-col items-stretch gap-2.5">
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-navy-deep flex items-center justify-center gap-2.5 rounded-[2px] px-[22px] py-3.5 text-[0.86rem] font-bold transition-transform hover:-translate-y-0.5"
                style={{ background: meta.gradient }}
              >
                <span>{copy.visitLabel}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            )}

            <button
              type="button"
              onClick={requestConsultation}
              className={
                href
                  ? "font-display flex items-center justify-center gap-2.5 rounded-[2px] border border-white/25 px-[22px] py-3.5 text-[0.86rem] font-bold text-white transition-colors hover:bg-white/10"
                  : "bg-gold font-display text-navy-deep flex items-center justify-center gap-2.5 rounded-[2px] px-[22px] py-3.5 text-[0.86rem] font-bold transition-transform hover:-translate-y-0.5"
              }
            >
              {dict.nav.cta}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </m.aside>
    </>,
    document.body
  );
}
