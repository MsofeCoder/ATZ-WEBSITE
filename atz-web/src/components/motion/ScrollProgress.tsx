"use client";

import { m, useScroll, useSpring } from "motion/react";

/**
 * A thin reading-progress line along the bottom edge of the sticky header.
 *
 * Scroll-linked (`useScroll`) rather than animated, so it tracks the page
 * exactly; the spring only smooths the scrubbing. Purely decorative — the
 * scrollbar remains the accessible indicator — so it is hidden from AT.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <m.div
      aria-hidden="true"
      className="bg-gold pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left"
      style={{ scaleX }}
    />
  );
}
