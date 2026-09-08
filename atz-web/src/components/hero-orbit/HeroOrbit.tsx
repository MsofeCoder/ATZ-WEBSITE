"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Dict } from "@/dictionaries";
import { BRAND_LIST, SUN, type BrandId, type BodyId } from "@/lib/brands";
import {
  createOrbitEngine,
  staticLayout,
  webglSupported,
  prefersLightweightScene,
  type OrbitEngine,
  type OrbitFrame,
  type ScreenPoint,
} from "./engine";
import OrbitDrawer from "./OrbitDrawer";

/**
 * The hero scene: a WebGL orbit system with a DOM overlay of real buttons
 * positioned to match it every frame.
 *
 * The overlay is what makes the scene accessible — the visible orbs are
 * canvas pixels, but every one of them has a focusable `<button>` tracking it,
 * so the whole thing is reachable by keyboard and screen reader. When WebGL is
 * unavailable, or the visitor is on a metered connection, those same buttons
 * lay out statically and three.js is never downloaded.
 */
export default function HeroOrbit({ dict }: { dict: Dict }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sunBtnRef = useRef<HTMLButtonElement>(null);
  const sunLabelRef = useRef<HTMLSpanElement>(null);
  const planetRefs = useRef<Map<BrandId, HTMLButtonElement>>(new Map());
  const tipRefs = useRef<Map<BrandId, HTMLDivElement>>(new Map());
  const engineRef = useRef<OrbitEngine | null>(null);
  const magnetRef = useRef<Map<BrandId, { x: number; y: number }>>(new Map());
  const ringRef = useRef<HTMLDivElement>(null);
  const drawerOpenRef = useRef(false);

  const [drawerBody, setDrawerBody] = useState<BodyId | null>(null);
  const [activePlanet, setActivePlanet] = useState<BrandId | null>(null);

  const openDrawer = useCallback((key: BodyId) => {
    drawerOpenRef.current = true;
    setDrawerBody(key);
    if (key !== "sun") setActivePlanet(key);
    engineRef.current?.pulse(key);
    engineRef.current?.setPlaying(false);
  }, []);

  const closeDrawer = useCallback(() => {
    drawerOpenRef.current = false;
    setDrawerBody(null);
    setActivePlanet(null);
    engineRef.current?.setPlaying(true);
  }, []);

  // Keep a stable reference the engine's event handlers can call without
  // being torn down and rebuilt whenever the callback identity changes.
  const openDrawerRef = useRef(openDrawer);
  useEffect(() => {
    openDrawerRef.current = openDrawer;
  }, [openDrawer]);

  /** Writes projected positions straight to the DOM — no React re-render. */
  const applyFrame = useCallback((f: OrbitFrame) => {
    const place = (
      el: HTMLElement | null | undefined,
      tip: HTMLElement | null | undefined,
      p: ScreenPoint,
      offset = { x: 0, y: 0 }
    ) => {
      if (el) {
        const x = p.x + offset.x;
        const y = p.y + offset.y;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%,-50%) scale(${p.scale})`;
        el.style.zIndex = String(p.z);
        el.style.opacity = String(p.opacity);
        if (tip) {
          tip.style.transform = `translate3d(${x}px, ${y - 34 * p.scale}px, 0) translate(-50%,-100%)`;
        }
      }
    };

    // The static layout supplies its own orbit ring; the WebGL scene draws
    // one in the canvas, so the DOM ring is hidden the moment it takes over.
    const ring = ringRef.current;
    if (ring) {
      if (f.ring) {
        const d = f.ring.r * 2;
        ring.style.width = `${d}px`;
        ring.style.height = `${d}px`;
        ring.style.transform = `translate3d(${f.ring.cx}px, ${f.ring.cy}px, 0) translate(-50%,-50%)`;
        ring.style.opacity = "1";
      } else {
        ring.style.opacity = "0";
      }
    }

    place(sunBtnRef.current, null, f.sun);
    if (sunLabelRef.current) {
      sunLabelRef.current.style.transform = `translate3d(${f.sun.x}px, ${
        f.sun.y + 66 * f.sun.scale
      }px, 0) translateX(-50%)`;
    }
    for (const [key, point] of f.planets) {
      place(
        planetRefs.current.get(key),
        tipRefs.current.get(key),
        point,
        magnetRef.current.get(key) ?? { x: 0, y: 0 }
      );
    }
  }, []);

  const setTooltip = (key: BrandId, visible: boolean) => {
    const tip = tipRefs.current.get(key);
    if (tip) tip.style.opacity = visible ? "1" : "0";
    planetRefs.current.get(key)?.classList.toggle("is-orbit-hot", visible);
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let cancelled = false;
    let cleanup = () => {};

    /**
     * Lay the orbs out statically and keep them positioned on resize.
     * Returns its own disposer rather than assigning `cleanup`, because this
     * runs *before* WebGL and has to be handed off cleanly when the engine
     * takes over.
     */
    const startStatic = () => {
      const place = () => applyFrame(staticLayout(wrap.clientWidth || 1, wrap.clientHeight || 1));
      place();
      const ro = new ResizeObserver(place);
      ro.observe(wrap);
      return () => ro.disconnect();
    };

    // The static arrangement paints immediately, on every device. The orbs are
    // visible and clickable from the first frame, so nothing about the hero
    // waits on a 177 KB download — and if that download never happens, the
    // visitor still has a complete scene rather than an empty canvas.
    let releaseStatic = startStatic();
    cleanup = () => releaseStatic();

    if (!webglSupported() || prefersLightweightScene()) {
      return () => {
        cancelled = true;
        cleanup();
      };
    }

    const upgradeToWebGL = async () => {
      if (cancelled) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        // Keep the static layout; it is already on screen.
        return;
      }
      if (cancelled) return;

      const engine = createOrbitEngine({
        THREE,
        canvas,
        wrap,
        reducedMotion,
        onFrame: applyFrame,
        onHoverChange: (key) => {
          for (const b of BRAND_LIST) setTooltip(b.id, b.id === key);
        },
      });

      // Context creation failed — the static scene stays exactly as it is.
      if (!engine) return;

      // The engine owns positioning from here; stand the static layout down.
      releaseStatic();
      releaseStatic = () => {};
      engineRef.current = engine;

      /**
       * Maps a pointer event into the stage's own normalised space, and
       * reports whether it actually landed inside the stage. Every caller must
       * check the flag: the hit test works on projected pixel positions, so a
       * point from outside the wrapper can still fall within an orb's radius
       * and open a drawer the visitor never asked for.
       */
      const pointerFromEvent = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        engine.setPointer((x / r.width) * 2 - 1, (y / r.height) * 2 - 1);
        return x >= 0 && x <= r.width && y >= 0 && y <= r.height;
      };

      const onMove = (e: PointerEvent) => pointerFromEvent(e);
      // Clicking the glowing orb itself (outside the small DOM chip) opens the
      // drawer; the chip handles its own click.
      const onDown = (e: PointerEvent) => {
        if (drawerOpenRef.current) return;
        if ((e.target as Element | null)?.closest("button")) return;
        if (!pointerFromEvent(e)) return;
        const hit = engine.hitTest();
        if (hit) openDrawerRef.current(hit);
      };
      const onStageEnter = () => engine.setStageHover(true);
      const onStageLeave = () => engine.setStageHover(false);

      // Scoped to the stage, not the window. The camera parallax still wants
      // window-wide movement so the scene reacts as the pointer approaches,
      // but anything that *acts* on a hit test is bound to the stage itself.
      if (!reducedMotion) {
        window.addEventListener("pointermove", onMove, { passive: true });
      }
      wrap.addEventListener("pointerdown", onDown, { passive: true });
      wrap.addEventListener("pointerenter", onStageEnter);
      wrap.addEventListener("pointerleave", onStageLeave);

      cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerdown", onDown);
        wrap.removeEventListener("pointerenter", onStageEnter);
        wrap.removeEventListener("pointerleave", onStageLeave);
        engineRef.current = null;
        engine.destroy();
      };
    };

    /**
     * Fetch three.js only when the hero is near the viewport *and* the main
     * thread has gone quiet.
     *
     * Previously the import fired during hydration, so 177 KB competed with
     * the work that makes the page interactive. Deferring it to idle costs the
     * visitor nothing — the static orbit is already on screen — and keeps the
     * download off the critical path. `rootMargin` starts the fetch just
     * before the hero scrolls into view, so the upgrade is usually complete by
     * the time anyone looks at it.
     */
    const idle: (cb: () => void) => number =
      typeof window.requestIdleCallback === "function"
        ? (cb) => window.requestIdleCallback(cb, { timeout: 2_000 })
        : (cb) => window.setTimeout(cb, 200);
    const cancelIdle = (id: number) =>
      typeof window.cancelIdleCallback === "function"
        ? window.cancelIdleCallback(id)
        : window.clearTimeout(id);

    let idleId = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        idleId = idle(() => void upgradeToWebGL());
      },
      { rootMargin: "200px" }
    );
    io.observe(wrap);

    const releaseScheduler = () => {
      io.disconnect();
      if (idleId) cancelIdle(idleId);
    };

    return () => {
      cancelled = true;
      releaseScheduler();
      cleanup();
    };
  }, [applyFrame]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height: "min(72vh, 640px)", minHeight: 380 }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

      {/* Accessible overlay, positioned to match the 3D scene each frame. */}
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div
          ref={ringRef}
          aria-hidden="true"
          className="absolute top-0 left-0 z-[1] rounded-full border border-dashed border-white/20 transition-opacity duration-300"
          style={{ opacity: 0 }}
        />
        <button
          ref={sunBtnRef}
          type="button"
          onClick={() => openDrawer("sun")}
          className="orbit-sun pointer-events-auto absolute top-0 left-0 z-[4] flex h-[100px] w-[100px] items-center justify-center rounded-full border-none p-0"
          style={{ opacity: 0, willChange: "transform" }}
          aria-label={`${SUN.name} — ${dict.solar.overviewAria}`}
        >
          <Image
            src={SUN.logo}
            alt=""
            width={72}
            height={72}
            priority
            className="h-[70%] w-[70%] object-contain"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
          />
        </button>
        <span
          ref={sunLabelRef}
          aria-hidden="true"
          className="font-display text-gold-soft absolute top-0 left-0 z-[4] text-center text-[0.72rem] font-extrabold tracking-[0.1em] whitespace-nowrap uppercase"
          style={{ transform: "translate(-50%,0)" }}
        >
          {dict.solar.centre}
        </span>

        {BRAND_LIST.map((brand) => {
          const copy = dict.solar[brand.id];
          return (
            <button
              key={brand.id}
              type="button"
              ref={(el) => {
                if (el) planetRefs.current.set(brand.id, el);
                else planetRefs.current.delete(brand.id);
              }}
              className="focus-visible:outline-gold pointer-events-auto absolute top-0 left-0 z-[3] flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-white/85 bg-white p-[6px] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
              style={{
                opacity: 0,
                willChange: "transform",
                transform: "translate3d(-200px,-200px,0)",
                boxShadow: `0 0 16px 3px ${brand.glow}${
                  activePlanet === brand.id ? ", 0 0 0 3px #C9A84C" : ""
                }`,
              }}
              aria-label={`${copy.title} — ${copy.tag} — ${dict.solar.openAria}`}
              onClick={() => openDrawer(brand.id)}
              onMouseEnter={() => {
                setTooltip(brand.id, true);
                engineRef.current?.setPlanetPaused(brand.id, true);
              }}
              onMouseLeave={() => {
                setTooltip(brand.id, false);
                engineRef.current?.setPlanetPaused(brand.id, false);
                magnetRef.current.set(brand.id, { x: 0, y: 0 });
              }}
              onFocus={() => {
                setTooltip(brand.id, true);
                engineRef.current?.setPlanetPaused(brand.id, true);
              }}
              onBlur={() => {
                setTooltip(brand.id, false);
                engineRef.current?.setPlanetPaused(brand.id, false);
              }}
              onPointerMove={(e) => {
                // Magnetic lean toward the pointer, clamped so the button
                // never separates from the orb it is tracking.
                const r = e.currentTarget.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                magnetRef.current.set(brand.id, {
                  x: Math.max(-7, Math.min(7, dx * 0.18)),
                  y: Math.max(-7, Math.min(7, dy * 0.18)),
                });
              }}
            >
              <Image
                src={brand.logo}
                alt=""
                width={46}
                height={46}
                className="h-full w-full rounded-full object-contain"
              />
            </button>
          );
        })}

        {BRAND_LIST.map((brand) => (
          <div
            key={`tip-${brand.id}`}
            aria-hidden="true"
            ref={(el) => {
              if (el) tipRefs.current.set(brand.id, el);
              else tipRefs.current.delete(brand.id);
            }}
            className="bg-navy-deep/95 pointer-events-none absolute top-0 left-0 z-[6] rounded-[3px] border border-white/15 px-3 py-[6px] text-[0.74rem] font-bold tracking-[0.02em] whitespace-nowrap text-white opacity-0 transition-opacity"
            style={{ transform: "translate3d(-200px,-200px,0)" }}
          >
            {dict.solar[brand.id].title}
            <span className="text-slate-onnavy mt-0.5 block text-[0.66rem] font-semibold tracking-[0.06em] uppercase">
              {dict.solar[brand.id].tag}
            </span>
          </div>
        ))}
      </div>

      {drawerBody && <OrbitDrawer bodyId={drawerBody} dict={dict} onClose={closeDrawer} />}
    </div>
  );
}
