"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query.
 *
 * `useSyncExternalStore` is the right primitive here: the match state lives
 * outside React, and this returns the server snapshot (`false`) during SSR so
 * hydration is consistent rather than mismatching.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    // Server snapshot: assume the feature is absent, then correct on hydrate.
    () => false
  );
}

/** True on devices with a precise, hovering pointer (mouse/trackpad). */
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** True when the visitor has asked the OS to reduce motion. */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
