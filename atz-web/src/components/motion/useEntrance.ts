"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type EntrancePhase = "hidden" | "visible";

/**
 * Drives an entrance animation without ever hiding content in the server HTML.
 *
 * The obvious `initial="hidden"` renders `opacity: 0` into the markup, which
 * means a visitor whose bundle never runs — JS disabled, a flaky connection,
 * an extension that blocks scripts — sees nothing. This site has been bitten
 * by that before, so the rule is: the document is complete without JS.
 *
 * So the phase starts `visible` (what the server renders), flips to `hidden`
 * in a layout effect — before the browser paints the hydrated frame, so there
 * is no flash — and returns to `visible` two frames later, once the hidden
 * state has actually been committed and the animation has somewhere to
 * travel from. Under reduced motion it simply never leaves `visible`.
 *
 * - `skipIfInFirstViewport`: pass the element's ref and anything already on
 *   screen at mount is left alone rather than hidden just to fade back in.
 * - `enabled`: hold the element hidden until this becomes true (an in-view
 *   observer, typically) — see `<Reveal>`.
 */
export function useEntrance({
  enabled = true,
  skipIfInFirstViewport,
}: {
  enabled?: boolean;
  skipIfInFirstViewport?: RefObject<HTMLElement | null>;
} = {}) {
  // `primed` records that the hide actually happened, so the reveal only
  // ever follows a hide — never fires on an element that was left visible.
  const [state, setState] = useState<{ phase: EntrancePhase; primed: boolean }>({
    phase: "visible",
    primed: false,
  });

  // Mount only: whether to hide is a one-time decision about the first paint.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = skipIfInFirstViewport?.current;
    if (el && el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    // The synchronous set is the point: it has to land before first paint,
    // which is exactly what a layout effect is for. (CountUp winds its figure
    // back to zero the same way.)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ phase: "hidden", primed: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!state.primed || !enabled) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setState({ phase: "visible", primed: true }));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [state.primed, enabled]);

  return state.phase;
}
