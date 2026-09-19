"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Per-particle phase for the twinkle. */
  p: number;
}

/**
 * A constellation of drifting points that link up when they come close and
 * lean toward the pointer — the "particles background" pattern, on a plain
 * 2-D canvas.
 *
 * It fills its positioned parent and is purely decorative (`aria-hidden`,
 * `pointer-events: none`); pointer tracking listens on the parent, so the
 * section's own controls keep working. The loop runs only while the section
 * is on screen and the tab is visible, the pixel ratio is capped at 1.5, and
 * the particle budget scales with area up to a ceiling that stays cheap on a
 * mid-range phone. Under reduced motion it paints one static frame and stops.
 *
 * No three.js here on purpose: the hero already owns the WebGL budget, and a
 * second context for a background texture would be paying for depth nobody
 * would perceive.
 */
export default function ParticleField({
  color = "201, 168, 76",
  density = 1,
  maxCount = 110,
  linkDistance = 120,
  className = "",
}: {
  /** RGB triplet, e.g. "201, 168, 76". */
  color?: string;
  /** Multiplier on the area-derived count. */
  density?: number;
  maxCount?: number;
  /** Pixel distance under which two particles are joined by a line. */
  linkDistance?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let onScreen = false;
    const pointer = { x: -1e4, y: -1e4, active: false };

    const seed = () => {
      const target = Math.min(maxCount, Math.round(((w * h) / 14000) * density));
      particles = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 0.8 + Math.random() * 1.4,
        p: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const link2 = linkDistance * linkDistance;

      // Links first so the dots sit on top.
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > link2) continue;
          const alpha = (1 - d2 / link2) * 0.28;
          ctx.strokeStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // A brighter thread from the pointer to whatever is near it.
      if (pointer.active) {
        const reach2 = 160 * 160;
        for (const a of particles) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > reach2) continue;
          ctx.strokeStyle = `rgba(${color}, ${((1 - d2 / reach2) * 0.5).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      for (const a of particles) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.0012 + a.p);
        ctx.fillStyle = `rgba(${color}, ${(0.35 + 0.5 * twinkle).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (t: number) => {
      if (!running) return;
      for (const a of particles) {
        // Gentle pull toward the pointer, falling off with distance.
        if (pointer.active) {
          const dx = pointer.x - a.x;
          const dy = pointer.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 220 * 220 && d2 > 1) {
            const f = 0.0009 * (1 - d2 / (220 * 220));
            a.vx += dx * f;
            a.vy += dy * f;
          }
        }
        // Keep velocities in a narrow band so the field never boils.
        a.vx *= 0.985;
        a.vy *= 0.985;
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -8) a.x = w + 8;
        else if (a.x > w + 8) a.x = -8;
        if (a.y < -8) a.y = h + 8;
        else if (a.y > h + 8) a.y = -8;
      }
      draw(t);
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const sync = () => {
      if (onScreen && document.visibilityState === "visible") start();
      else stop();
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        sync();
      },
      { rootMargin: "80px" }
    );
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [color, density, maxCount, linkDistance]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 block h-full w-full ${className}`}
    />
  );
}
