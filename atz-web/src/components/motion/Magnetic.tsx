"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { m, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { useMediaQuery, FINE_POINTER } from "@/hooks/useMediaQuery";

/**
 * Pulls its child a few pixels toward the pointer while hovered and springs
 * back on leave — the "magnetic button" pattern.
 *
 * `strength` is the fraction of the pointer's offset from centre the element
 * follows; 0.25 at a 160px-wide button means it moves at most ~20px. Fine
 * pointers only, and a transform, so reduced-motion neutralises it.
 */
export default function Magnetic({
  children,
  strength = 0.25,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const finePointer = useMediaQuery(FINE_POINTER);
  const reduced = useReducedMotion();
  const interactive = finePointer && !reduced;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.5 });
  const y = useSpring(my, { stiffness: 260, damping: 18, mass: 0.5 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <m.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </m.div>
  );
}
