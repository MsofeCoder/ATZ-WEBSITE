"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/**
 * One motion runtime for the whole document.
 *
 * `LazyMotion` with the `domAnimation` feature set (no layout projection, no
 * drag) keeps the animation runtime to a fraction of the full library — this
 * audience is largely on mobile data, and the hero already spends its budget
 * on three.js. Every animated element in the tree therefore uses `m.*`, never
 * `motion.*`; `strict` turns a slip into a loud error in development rather
 * than a silent full-bundle import.
 *
 * `reducedMotion="user"` makes every transform animation a no-op for a
 * visitor whose OS asks for less motion. Opacity still fades, which is the
 * behaviour WCAG 2.3.3 asks for — content arrives, it just doesn't travel.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
