"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Dict } from "@/dictionaries";
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

  const isSun = bodyId === "sun";
  const meta = isSun ? SUN : BRANDS[bodyId];
  const copy = dict.solar[bodyId];
  const href = isSun ? undefined : BRANDS[bodyId].url;

  return (
    <>
      <div
        className="backdrop-in bg-navy-deep/55 fixed inset-0 z-[190] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbit-drawer-title"
        className="drawer-in bg-navy-deep fixed top-0 right-0 bottom-0 z-[191] flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-white/10"
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

        <div className="px-[30px] pt-8 pb-10">
          <div
            className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white p-3"
            style={{ boxShadow: "0 0 0 4px rgba(248,249,250,0.06)" }}
          >
            <Image
              src={meta.logo}
              alt=""
              width={88}
              height={88}
              className="h-full w-full object-contain"
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

          {/* Every path out of this drawer used to lead off-site. The visitor
              is one click from an enquiry here, so the consultation form is
              offered alongside — and for ATZ itself, which has no external
              site, it replaces what was a dead greyed-out pill. */}
          <div className="flex flex-col items-start gap-3">
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-navy-deep inline-flex items-center gap-2.5 rounded-[2px] px-[22px] py-3.5 text-[0.86rem] font-bold transition-transform hover:-translate-y-0.5"
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
                  ? "font-display inline-flex items-center gap-2.5 rounded-[2px] border border-white/25 px-[22px] py-3.5 text-[0.86rem] font-bold text-white transition-colors hover:bg-white/10"
                  : "bg-gold font-display text-navy-deep inline-flex items-center gap-2.5 rounded-[2px] px-[22px] py-3.5 text-[0.86rem] font-bold transition-transform hover:-translate-y-0.5"
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
      </aside>
    </>
  );
}
