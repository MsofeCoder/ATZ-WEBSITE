"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import type { Dict } from "@/dictionaries";
import ConsultationModal from "@/components/ConsultationModal";

/** Fields a CTA can pre-fill — the scope card hands over what it collected. */
export interface ConsultationPreset {
  /** Must match one of the `dict.modal.opt*` labels to select it. */
  service?: string;
  message?: string;
}

interface ConsultationContextValue {
  open: (preset?: ConsultationPreset) => void;
  close: () => void;
  isOpen: boolean;
}

const ConsultationContext = createContext<ConsultationContextValue | null>(null);

/**
 * Owns the one consultation dialog for the whole page.
 *
 * Previously the modal was mounted separately by the header, the hero and the
 * CTA band — three copies of the form, three focus traps, three key handlers.
 * Any CTA anywhere in the tree now calls `useConsultation().open()`.
 */
export function ConsultationProvider({ dict, children }: { dict: Dict; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<ConsultationPreset | undefined>(undefined);
  const open = useCallback((p?: ConsultationPreset) => {
    setPreset(p);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <ConsultationContext.Provider value={value}>
      {children}
      {/* AnimatePresence keeps the dialog mounted through its exit animation. */}
      <AnimatePresence>
        {isOpen && (
          <ConsultationModal key="consultation" dict={dict} preset={preset} onClose={close} />
        )}
      </AnimatePresence>
    </ConsultationContext.Provider>
  );
}

export function useConsultation(): ConsultationContextValue {
  const ctx = useContext(ConsultationContext);
  if (!ctx) {
    throw new Error("useConsultation must be used inside <ConsultationProvider>");
  }
  return ctx;
}
