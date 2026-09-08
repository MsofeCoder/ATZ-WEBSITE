"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Fades content in as it scrolls into view.
 *
 * Two deliberate choices here:
 *
 * 1. The server-rendered markup is fully visible. The hidden state is added by
 *    the effect, so a visitor with JS disabled — or whose bundle fails — still
 *    sees every section. (This previously rendered at `opacity: 0` and relied
 *    on JS to reveal it, with a 2.5s timer as a safety net.)
 * 2. Visibility is toggled by touching `classList` rather than React state.
 *    Nothing about the reveal belongs in the render tree, and animating dozens
 *    of these through state churns re-renders for no benefit.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Element to render as — use "li" inside a list, where a div is invalid. */
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen at mount (above the fold): leave it visible rather
    // than hiding it just to fade it straight back in.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.classList.add("reveal-hidden");

    let timer: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          timer = window.setTimeout(() => el.classList.remove("reveal-hidden"), delay);
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      // If this unmounts mid-animation, don't leave the node hidden for a
      // future consumer of the same DOM element.
      el.classList.remove("reveal-hidden");
    };
  }, [delay]);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLLIElement>}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
