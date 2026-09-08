"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery, FINE_POINTER, REDUCED_MOTION } from "@/hooks/useMediaQuery";

/**
 * Custom cursor: a gold dot that tracks the pointer exactly, plus a ring that
 * trails behind it.
 *
 * - Only on devices with a fine, hovering pointer. Touch devices render
 *   nothing and keep native behaviour.
 * - The ring expands over interactive elements, compresses on press, and
 *   fades over text fields so the native caret stays usable.
 * - Position and state are written straight to the DOM: this runs every frame
 *   and must never enter React's render path.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const finePointer = useMediaQuery(FINE_POINTER);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  // Matches the CSS gate in globals.css. A visitor who has asked for reduced
  // motion keeps their own pointer — the one their OS accessibility settings
  // may have deliberately enlarged or recoloured.
  const enabled = finePointer && !reducedMotion;

  // Signals to CSS that the native cursor should be hidden. Kept separate
  // from the animation effect so it is not re-applied on every restart.
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.customCursor = "on";
    return () => {
      delete document.documentElement.dataset.customCursor;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const INTERACTIVE =
      "a, button, [role='button'], input, textarea, select, label, summary, [data-cursor]";
    const TEXT_FIELDS =
      "input[type='text'], input:not([type]), input[type='email'], input[type='tel'], textarea";

    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let visible = false;
    let raf = 0;
    let lastT = 0;

    const apply = () => {
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0) translate(-50%, -50%)`;
    };

    const tick = (t: number) => {
      raf = 0;
      if (document.hidden) {
        lastT = 0;
        return;
      }
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0.016;
      lastT = t;
      // Frame-rate-independent lerp, so the trail feels identical at 60 and
      // 144 Hz.
      const k = 1 - Math.pow(0.001, dt);
      pos.rx += (pos.x - pos.rx) * k;
      pos.ry += (pos.y - pos.ry) * k;
      apply();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const setState = (el: HTMLElement, s: string) => {
      if (el.dataset.state !== s) el.dataset.state = s;
    };

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        pos.rx = pos.x;
        pos.ry = pos.y;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      const target = e.target as Element | null;
      const state = target?.closest?.(TEXT_FIELDS)
        ? "hidden"
        : target?.closest?.(INTERACTIVE)
          ? "hover"
          : "default";
      setState(dot, state);
      setState(ring, state);
    };

    const onDown = () => {
      setState(dot, "down");
      setState(ring, "down");
    };
    const onUp = (e: PointerEvent) => onMove(e);
    const hide = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="custom-cursor custom-cursor__ring"
        data-state="default"
        style={{ opacity: 0 }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="custom-cursor custom-cursor__dot"
        data-state="default"
        style={{ opacity: 0 }}
      />
    </>
  );
}
