"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "rgba(201,168,76,",
  "rgba(0,188,212,",
  "rgba(233,30,140,",
  "rgba(105,240,174,",
];

type P = {
  x: number; y: number; vx: number; vy: number;
  r: number; c: string; tw: number;
};

export default function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, raf = 0;
    let pts: P[] = [];

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      W = canvas!.width = rect.width;
      H = canvas!.height = rect.height;
      const n = Math.min(70, Math.floor((W * H) / 16000));
      pts = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        c: COLORS[i % COLORS.length],
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function tick() {
      ctx!.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx!.strokeStyle = `rgba(201,168,76,${0.1 * (1 - d / 130)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(pts[i].x, pts[i].y);
            ctx!.lineTo(pts[j].x, pts[j].y);
            ctx!.stroke();
          }
        }
      }
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const alpha = 0.35 + 0.3 * Math.sin(p.tw);
        ctx!.fillStyle = p.c + alpha + ")";
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    const onResize = () => { cancelAnimationFrame(raf); resize(); tick(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-85 motion-reduce:hidden"
    />
  );
}
