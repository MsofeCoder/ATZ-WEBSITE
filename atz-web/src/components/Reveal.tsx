"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { m, useInView } from "motion/react";
import { useEntrance } from "@/components/motion/useEntrance";
import { riseVariants } from "@/components/motion/variants";

/**
 * Fades content in as it scrolls into view.
 *
 * Two deliberate choices survive from the previous, hand-rolled version:
 *
 * 1. The server-rendered markup is fully visible. `useEntrance` only hides
 *    the element after hydration, so a visitor with JS disabled — or whose
 *    bundle fails — still sees every section.
 * 2. Elements already on screen at mount (above the fold) are left alone
 *    rather than hidden just to fade straight back in.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  /** Milliseconds, to stay compatible with existing call sites. */
  delay?: number;
  className?: string;
  /** Element to render as — use "li" inside a list, where a div is invalid. */
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.18 });
  const phase = useEntrance({ enabled: inView, skipIfInFirstViewport: ref });

  const Tag = as === "li" ? m.li : m.div;
  return (
    <Tag
      ref={ref}
      className={className}
      variants={riseVariants}
      custom={delay / 1000}
      animate={phase}
    >
      {children}
    </Tag>
  );
}
