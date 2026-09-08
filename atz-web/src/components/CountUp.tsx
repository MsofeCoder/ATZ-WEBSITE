"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * The distinction matters here: the component renders its *final* value so the
 * server HTML is correct, then resets to zero before the browser paints. Doing
 * that in a plain effect would flash the answer, then wind it back to zero.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Counts up to `target` when scrolled into view.
 *
 * The rendered output starts at the target, not at zero, so the figure is
 * right in the server-rendered HTML and stays right for a visitor with no
 * JavaScript. (It previously initialised to "0", which meant the hero read
 * "0 specialist companies" whenever the bundle failed to run.)
 */
export default function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(`${target}${suffix}`);
  const started = useRef(false);

  // Wind back to zero before first paint, so the animation has somewhere to
  // travel from. Skipped entirely under reduced motion, where the value simply
  // stays where the server put it.
  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      started.current = true;
      return;
    }
    setText(`0${suffix}`);
  }, [suffix]);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return;
        started.current = true;
        io.disconnect();

        const t0 = performance.now();
        const dur = 1400;
        const step = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setText(`${Math.round(target * eased)}${suffix}`);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      // Without this the loop keeps setting state after unmount, and a visitor
      // who navigates away mid-count leaves a timer running.
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, suffix]);

  return <span ref={ref}>{text}</span>;
}
