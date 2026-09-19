import type { Transition, Variants } from "motion/react";

/**
 * The house easing — the same curve the CSS keyframes used, so motion-driven
 * and CSS-driven movement feel like one system.
 */
export const EASE_OUT: [number, number, number, number] = [0.22, 0.9, 0.35, 1];

/** Standard reveal timing. Exit/hide is instant: nothing should fade *out* on scroll. */
export const REVEAL: Transition = { duration: 0.7, ease: EASE_OUT };
export const INSTANT: Transition = { duration: 0 };

/** Fade + rise. `custom` is the delay in seconds. */
export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 24, transition: INSTANT },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...REVEAL, delay },
  }),
};

/** A parent that reveals its `staggerItem` children one after another. */
export const staggerContainer = (stagger = 0.1, delayChildren = 0): Variants => ({
  hidden: { transition: INSTANT },
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, transition: INSTANT },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Springy hover/tap for buttons and cards. */
export const PRESS: Transition = { type: "spring", stiffness: 420, damping: 26, mass: 0.6 };
