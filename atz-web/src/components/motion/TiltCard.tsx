"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { m, useMotionTemplate, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { useMediaQuery, FINE_POINTER } from "@/hooks/useMediaQuery";

/**
 * A card that tilts toward the pointer in 3-D, with a soft light spot that
 * follows the cursor across its surface.
 *
 * Two constraints keep it honest:
 * - Fine pointers only. On touch there is no hover, and a card that lurches
 *   when you try to scroll past it is worse than a flat one.
 * - Tilt is a transform, so `MotionConfig reducedMotion="user"` neutralises
 *   it automatically; the glare is gated on the same preference here because
 *   it is a background, not a transform.
 *
 * The tilt angles are deliberately small (±7°). This is a company card, not a
 * trading card; the effect should register as depth, not as a gimmick.
 */
export default function TiltCard({
  children,
  className = "",
  maxTilt = 7,
  glareColor = "255, 255, 255",
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** Degrees at the card's edge. */
  maxTilt?: number;
  /** RGB triplet for the light spot. */
  glareColor?: string;
  style?: React.CSSProperties;
  [key: `data-${string}`]: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const finePointer = useMediaQuery(FINE_POINTER);
  const reduced = useReducedMotion();
  const interactive = finePointer && !reduced;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.6 });
  const rotateY = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.6 });

  // Glare position in %, default to the top-left where light usually comes from.
  const gx = useMotionValue(30);
  const gy = useMotionValue(20);
  const glareOpacity = useMotionValue(0);
  const glareOp = useSpring(glareOpacity, { stiffness: 200, damping: 30 });
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgba(${glareColor}, 0.22), transparent 60%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * maxTilt);
    rx.set(-(py - 0.5) * 2 * maxTilt);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onEnter = () => {
    if (interactive) glareOpacity.set(1);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glareOpacity.set(0);
  };

  return (
    <div className={className} style={{ perspective: 1100, ...style }} {...rest}>
      <m.div
        ref={ref}
        onPointerMove={onMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        whileHover={interactive ? { y: -6 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-full rounded-[inherit] will-change-transform"
      >
        {children}
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
          style={{ background: glare, opacity: glareOp }}
        />
      </m.div>
    </div>
  );
}
