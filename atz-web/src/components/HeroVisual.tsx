"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

const OrbitScene = dynamic(() => import("./OrbitScene"), {
  ssr: false,
  loading: () => null,
});

export default function HeroVisual({ onSelect }: { onSelect?: (id: "md" | "ai" | "mc") => void }) {
  const [mode, setMode] = useState<"checking" | "webgl" | "canvas" | "none">("checking");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduce || saveData) {
      setMode("none");
      return;
    }
    // WebGL support probe
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") ?? c.getContext("webgl");
      setMode(gl ? "webgl" : "canvas");
    } catch {
      setMode("canvas");
    }
  }, []);

  if (mode === "webgl" && !failed) {
    return (
      <ErrorBoundary fallback={<CssOrbit />} onFail={() => setFailed(true)}>
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <OrbitScene onSelect={onSelect} />
        </div>
      </ErrorBoundary>
    );
  }

  if (mode === "canvas") {
    // CSS-only orbit fallback (no JS animation cost)
    return <CssOrbit />;
  }

  return (
    <div className="mx-auto flex aspect-square w-full max-w-[300px] items-center justify-center">
      <div className="orbit-core-static font-display text-4xl font-black text-gold-soft">ATZ</div>
      <style jsx>{`
        .orbit-core-static {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, #24365c, #0e1730);
          border: 1px solid rgba(201, 168, 76, 0.45);
          box-shadow: 0 0 60px rgba(201, 168, 76, 0.22), inset 0 0 26px rgba(201, 168, 76, 0.12);
        }
      `}</style>
    </div>
  );
}

class ErrorBoundary extends Component<
  { fallback: ReactNode; onFail?: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function CssOrbit() {
  const sats = [
     { label: "MD", cls: "f-sat-md", ring: "f-ring-3", delay: "0s" },
    { label: "AI", cls: "f-sat-ai", ring: "f-ring-2", delay: ".9s" },
    { label: "MC", cls: "f-sat-mc", ring: "f-ring-1", delay: "1.7s" },
  ];
  return (
    <div className="relative mx-auto aspect-square w-[min(360px,80vw)]" aria-hidden="true">
      {[3, 2, 1].map((r) => (
        <div key={r} className={`fallback-ring f-ring-${r}`}>
          {sats
            .filter((s) => s.ring === `f-ring-${r}`)
            .map((s) => (
              <div key={s.label} className={`fallback-satellite ${s.cls} pulse`} style={{ animationDelay: s.delay }}>
                {s.label}
              </div>
            ))}
        </div>
      ))}
      <div className="fallback-core"><span>ATZ</span></div>
      <style jsx global>{`
        .fallback-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px dashed rgba(248, 249, 250, 0.14);
        }
        .f-ring-1 { width: 190px; height: 190px; animation: orbitSpin 26s linear infinite; }
        .f-ring-2 { width: 280px; height: 280px; animation: orbitSpin 40s linear infinite reverse; }
        .f-ring-3 { width: 355px; height: 355px; animation: orbitSpin 58s linear infinite; }
        @keyframes orbitSpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .fallback-satellite {
          position: absolute;
          top: -17px;
          left: calc(50% - 17px);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 800;
          font-size: 0.62rem;
          color: #fff;
        }
        .f-sat-md { background: linear-gradient(135deg, #6A0DAD, #E91E8C); box-shadow: 0 0 18px rgba(233,30,140,0.5); }
        .f-sat-ai { background: linear-gradient(135deg, #0A2540, #00BCD4); box-shadow: 0 0 18px rgba(0,188,212,0.5); }
        .f-sat-mc { background: linear-gradient(135deg, #1B5E20, #69F0AE); box-shadow: 0 0 18px rgba(105,240,174,0.45); color: #0E1730; }
        .fallback-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 112px;
          height: 112px;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, #24365c, #0e1730);
          border: 1px solid rgba(201, 168, 76, 0.45);
          box-shadow: 0 0 60px rgba(201, 168, 76, 0.22), inset 0 0 26px rgba(201, 168, 76, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .fallback-core span {
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 900;
          font-size: 1.6rem;
          color: #e4ce8f;
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
}
