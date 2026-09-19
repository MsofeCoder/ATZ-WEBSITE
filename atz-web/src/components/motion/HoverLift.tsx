"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";

/**
 * Lifts a card a few pixels on hover with a spring, and deepens its shadow.
 *
 * Replaces the `hover:-translate-y-1.5` utility on cards that now sit inside
 * motion containers: an inline transform written by motion would silently
 * override the Tailwind hover transform, so the lift is expressed here too.
 */
export default function HoverLift({
  children,
  className = "",
  lift = 6,
  shadow = true,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
  /** Deepen the shadow on hover — off for flat, borderless items. */
  shadow?: boolean;
}) {
  return (
    <m.div
      whileHover={
        shadow ? { y: -lift, boxShadow: "0 20px 40px rgba(27,42,74,0.10)" } : { y: -lift }
      }
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={className}
    >
      {children}
    </m.div>
  );
}
