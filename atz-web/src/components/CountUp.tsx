"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(`0${suffix}`);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting || done.current) return;
          done.current = true;
          if (reduce) { setText(`${target}${suffix}`); return; }
          const t0 = performance.now();
          const dur = 1400;
          const step = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setText(`${Math.round(target * eased)}${suffix}`);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, suffix]);

  return <span ref={ref}>{text}</span>;
}
