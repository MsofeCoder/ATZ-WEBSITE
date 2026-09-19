"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import type { Dict } from "@/dictionaries";
import ConsultationModal from "@/components/ConsultationModal";

interface ConsultationContextValue {
  open: () => void;
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
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <ConsultationContext.Provider value={value}>
      {children}
      {/* AnimatePresence keeps the dialog mounted through its exit animation. */}
      <AnimatePresence>
        {isOpen && <ConsultationModal key="consultation" dict={dict} onClose={close} />}
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
