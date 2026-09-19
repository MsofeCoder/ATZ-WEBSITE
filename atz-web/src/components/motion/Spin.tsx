"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";

/** Rotates its child continuously — for decorative rings. Reduced motion: still. */
export default function Spin({
  children,
  duration = 60,
  className = "",
}: {
  children?: ReactNode;
  /** Seconds per revolution. */
  duration?: number;
  className?: string;
}) {
  return (
    <m.div
      aria-hidden="true"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </m.div>
  );
}
