"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { m, useInView } from "motion/react";
import { useEntrance } from "@/components/motion/useEntrance";
import { staggerContainer, staggerItem } from "@/components/motion/variants";

type ContainerTag = "div" | "ul" | "ol" | "dl";
type ItemTag = "div" | "li" | "article";

/**
 * Reveals its `<StaggerItem>` children one after another when scrolled into
 * view. Same no-JS guarantee as `<Reveal>`: the server markup is visible and
 * the hiding happens after hydration, only for content below the fold.
 */
export function Stagger({
  children,
  className = "",
  as = "div",
  stagger = 0.1,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: ContainerTag;
  /** Seconds between each child. */
  stagger?: number;
  /** Seconds before the first child. */
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const phase = useEntrance({ enabled: inView, skipIfInFirstViewport: ref });
  const Tag = m[as];

  return (
    <Tag
      ref={
        ref as React.RefObject<
          HTMLDivElement & HTMLUListElement & HTMLOListElement & HTMLDListElement
        >
      }
      className={className}
      variants={staggerContainer(stagger, delay)}
      animate={phase}
    >
      {children}
    </Tag>
  );
}

/** One child of `<Stagger>`. Inherits the parent's phase through variants. */
export function StaggerItem({
  children,
  className = "",
  as = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: ItemTag;
  style?: React.CSSProperties;
}) {
  const Tag = m[as];
  return (
    <Tag className={className} variants={staggerItem} style={style}>
      {children}
    </Tag>
  );
}
