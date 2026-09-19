"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, motionValue, useMotionValueEvent, type MotionValue } from "motion/react";
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
 * so the whole thing is reachable by keyboard and screen reader.
 *
 * WebGL is an enhancement layered on top, never a prerequisite. The static
 * layout paints first on every device and those same buttons stay usable;
 * three.js is fetched afterwards, on idle, and only where
 * `prefersLightweightScene()` allows it — so phones, low-memory devices, 2G
 * and Data Saver never download it at all.
 */
export default function HeroOrbit({
  dict,
  scrollProgress,
}: {
  dict: Dict;
  /** The hero's scroll progress (0 at rest, 1 scrolled out) — see `Hero`. */
  scrollProgress?: MotionValue<number>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sunBtnRef = useRef<HTMLButtonElement>(null);
  const sunTipRef = useRef<HTMLDivElement>(null);
  const planetRefs = useRef<Map<BrandId, HTMLButtonElement>>(new Map());
  const tipRefs = useRef<Map<BrandId, HTMLDivElement>>(new Map());
  const engineRef = useRef<OrbitEngine | null>(null);
  const magnetRef = useRef<Map<BrandId, { x: number; y: number }>>(new Map());
  const ringRef = useRef<HTMLDivElement>(null);
  const drawerOpenRef = useRef(false);

  const [drawerBody, setDrawerBody] = useState<BodyId | null>(null);
  const [activePlanet, setActivePlanet] = useState<BrandId | null>(null);
  // "static" until three.js takes over; the CSS uses it to show the logo
  // fills that stand in for the rendered bodies.
  const [scene, setScene] = useState<"static" | "webgl">("static");
  // WCAG 2.2.2: anything that moves for more than five seconds needs a
  // control to stop it. This is that control; the drawer's own pausing must
  // not silently override a visitor's choice, hence the ref.
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);

  const openDrawer = useCallback((key: BodyId) => {
    drawerOpenRef.current = true;
    setDrawerBody(key);
    if (key !== "sun") setActivePlanet(key);
    engineRef.current?.pulse(key);
    engineRef.current?.setPlaying(false);
    // Fade the hero text column so the focused planet + drawer are unobstructed.
    document.getElementById("hero-section")?.classList.add("hero-orbit-focused");
  }, []);

  const closeDrawer = useCallback(() => {
    drawerOpenRef.current = false;
    setDrawerBody(null);
    setActivePlanet(null);
    if (!userPausedRef.current) engineRef.current?.setPlaying(true);
    // Restore the hero text column.
    document.getElementById("hero-section")?.classList.remove("hero-orbit-focused");
  }, []);

  const togglePaused = useCallback(() => {
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setUserPaused(next);
    if (!drawerOpenRef.current) engineRef.current?.setPlaying(!next);
  }, []);

  // Scroll-linked camera. A MotionValue subscription, not React state: it
  // changes every scrolled pixel and must never re-render the overlay.
  useMotionValueEvent(scrollProgress ?? fallbackMotionValue, "change", (v) => {
    engineRef.current?.setScrollProgress(v);
  });

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
        if (tip) placeTip(tip, x, y, p.scale);
      }
    };

    /**
     * Tooltips are clamped to the stage so a body near an edge never pushes
     * its card off-screen (on a 375px phone the nowrap card was half gone),
     * and flipped underneath when there is no room above. The notch is
     * shifted back by the clamp amount so it still points at the body.
     * offsetWidth/Height are layout reads, but transforms don't dirty
     * layout, so they cost nothing in the steady state.
     */
    const placeTip = (tip: HTMLElement, x: number, y: number, scale: number) => {
      const stage = wrapRef.current;
      const sw = stage?.clientWidth ?? 0;
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const margin = 8;
      const half = tw / 2;
      const cx =
        sw > tw + margin * 2 ? Math.min(Math.max(x, half + margin), sw - half - margin) : x;
      const gap = 44 * scale;
      const below = y - gap - th < 0;
      tip.classList.toggle("is-below", below);
      tip.style.setProperty("--notch-x", `${(x - cx).toFixed(1)}px`);
      tip.style.transform = below
        ? `translate3d(${cx}px, ${y + gap}px, 0) translate(-50%, 0)`
        : `translate3d(${cx}px, ${y - gap}px, 0) translate(-50%, -100%)`;
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

    place(sunBtnRef.current, sunTipRef.current, f.sun);
    for (const [key, point] of f.planets) {
      const el = planetRefs.current.get(key);
      place(el, tipRefs.current.get(key), point, magnetRef.current.get(key) ?? { x: 0, y: 0 });

      // Light the chip from wherever the star actually is on screen.
      if (el) {
        const dx = f.sun.x - point.x;
        const dy = f.sun.y - point.y;
        const len = Math.hypot(dx, dy) || 1;
        el.style.setProperty("--lx", `${((dx / len) * 30).toFixed(1)}%`);
        el.style.setProperty("--ly", `${((dy / len) * 30).toFixed(1)}%`);
      }
    }
  }, []);

  const setTooltip = (key: BodyId, visible: boolean) => {
    if (key === "sun") {
      if (sunTipRef.current) sunTipRef.current.style.opacity = visible ? "1" : "0";
    } else {
      const tip = tipRefs.current.get(key);
      if (tip) tip.style.opacity = visible ? "1" : "0";
      planetRefs.current.get(key)?.classList.toggle("is-orbit-hot", visible);
    }
  };

  /**
   * Touch has no hover, so a finger never sees the label before committing.
   * On a touch pointer the first tap shows the card and *arms* the body; a
   * second tap on the same body opens it. Tapping anything else, or waiting
   * four seconds, disarms. Mouse and pen open on the first click as before,
   * and so does keyboard activation (a click event with no pointerType).
   */
  const armedRef = useRef<BodyId | null>(null);
  const armTimerRef = useRef(0);
  const disarm = useCallback(() => {
    const prev = armedRef.current;
    armedRef.current = null;
    window.clearTimeout(armTimerRef.current);
    if (prev) setTooltip(prev, false);
  }, []);
  const activate = useCallback(
    (key: BodyId, pointerType: string | undefined) => {
      if (pointerType === "touch" && armedRef.current !== key) {
        disarm();
        armedRef.current = key;
        setTooltip(key, true);
        armTimerRef.current = window.setTimeout(disarm, 4000);
        return;
      }
      disarm();
      openDrawer(key);
    },
    [disarm, openDrawer]
  );
  useEffect(() => {
    const onDocDown = (e: PointerEvent) => {
      if (!armedRef.current) return;
      if ((e.target as Element | null)?.closest(".orbit-stage button")) return;
      disarm();
    };
    document.addEventListener("pointerdown", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDocDown);
      window.clearTimeout(armTimerRef.current);
    };
  }, [disarm]);
  const activateRef = useRef(activate);
  useEffect(() => {
    activateRef.current = activate;
  }, [activate]);

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
      let OrbitControls: (typeof import("three/examples/jsm/controls/OrbitControls.js"))["OrbitControls"];
      try {
        const [threeModule, orbitModule] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        THREE = threeModule;
        OrbitControls = orbitModule.OrbitControls;
      } catch {
        // Keep the static layout; it is already on screen.
        return;
      }
      if (cancelled) return;

      const engine = createOrbitEngine({
        THREE,
        OrbitControls,
        canvas,
        wrap,
        reducedMotion,
        onFrame: applyFrame,
        onHoverChange: (key) => {
          for (const b of BRAND_LIST) setTooltip(b.id, b.id === key);
          setTooltip("sun", key === "sun");
        },
      });

      // Context creation failed — the static scene stays exactly as it is.
      if (!engine) return;

      // The engine owns positioning from here; stand the static layout down.
      releaseStatic();
      releaseStatic = () => {};
      engineRef.current = engine;
      setScene("webgl");
      if (userPausedRef.current) engine.setPlaying(false);

      const onResize = () => engine.applyHome();
      window.addEventListener("resize", onResize, { passive: true });

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

      // Track pointer-down position so we can distinguish drag from click.
      let pointerDownAt: { x: number; y: number } | null = null;
      const onPointerDown = (e: PointerEvent) => {
        pointerDownAt = { x: e.clientX, y: e.clientY };
      };

      // Clicking the glowing orb itself (outside the small DOM chip) opens the
      // drawer; the chip handles its own click. Movements > 6px are drags.
      const onDown = (e: PointerEvent) => {
        if (drawerOpenRef.current) return;
        if ((e.target as Element | null)?.closest("button")) return;
        if (!pointerFromEvent(e)) return;

        // Distinguish orbit-drag from tap using the ≤6px threshold.
        if (pointerDownAt) {
          const dx = e.clientX - pointerDownAt.x;
          const dy = e.clientY - pointerDownAt.y;
          pointerDownAt = null;
          if (Math.hypot(dx, dy) > 6) return;
        }

        const hit = engine.hitTest();
        if (hit) activateRef.current(hit, e.pointerType);
      };
      const onStageEnter = () => engine.setStageHover(true);
      const onStageLeave = () => engine.setStageHover(false);

      // Scoped to the stage, not the window. The camera parallax still wants
      // window-wide movement so the scene reacts as the pointer approaches,
      // but anything that *acts* on a hit test is bound to the stage itself.
      if (!reducedMotion) {
        window.addEventListener("pointermove", onMove, { passive: true });
      }
      wrap.addEventListener("pointerdown", onPointerDown, { passive: true });
      wrap.addEventListener("pointerup", onDown, { passive: true });
      wrap.addEventListener("pointerenter", onStageEnter);
      wrap.addEventListener("pointerleave", onStageLeave);

      cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        wrap.removeEventListener("pointerdown", onPointerDown);
        wrap.removeEventListener("pointerup", onDown);
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
    <div ref={wrapRef} className="orbit-stage relative w-full" data-scene={scene}>
      {/* The canvas is aria-hidden and the orbs are real buttons, so assistive
          tech gets the structure; this line gives it the picture. */}
      <p className="sr-only">{dict.hero.sceneAlt}</p>
      {/* Masked so the scene fades into the section rather than sitting in a
          hard-edged rectangle: the renderer clears to a deeper black than the
          hero's navy. The orbits stay inside the solid 60% core. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{
          maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 50% 50% at 50% 50%, black 60%, transparent 100%)",
        }}
      />

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
          onClick={(e) => activate("sun", (e.nativeEvent as PointerEvent).pointerType)}
          onMouseEnter={() => setTooltip("sun", true)}
          onMouseLeave={() => setTooltip("sun", false)}
          onFocus={() => setTooltip("sun", true)}
          onBlur={() => setTooltip("sun", false)}
          className="group pointer-events-auto absolute top-0 left-0 z-[4] flex h-[130px] w-[130px] cursor-pointer items-center justify-center rounded-full border-none p-0 transition-transform duration-300 hover:scale-110"
          style={{ opacity: 0, willChange: "transform" }}
          aria-label={`${SUN.name} — ${dict.solar.overviewAria}`}
        >
          {/* Subtle targeting reticle: pure transparency lets the 3D celestial Star shine through! */}
          <span
            aria-hidden="true"
            className="pointer-events-none flex h-[104px] w-[104px] items-center justify-center rounded-full transition-all duration-300 group-hover:scale-115"
          >
            <span
              className="border-gold/35 group-hover:border-gold/85 h-full w-full rounded-full border border-dashed transition-all duration-300 group-hover:border-solid"
              style={{
                boxShadow: "0 0 35px rgba(201,168,76,0.4)",
              }}
            />
            {/* Static-scene body: the star as a lit gold disc carrying the mark.
                Hidden the moment WebGL renders the real one. */}
            <span className="orb-fill orb-fill--sun">
              <Image src={SUN.logo} alt="" width={64} height={64} priority />
            </span>
          </span>
        </button>

        {/* Sun hover / tap card */}
        <div
          ref={sunTipRef}
          aria-hidden="true"
          className="orb-tip"
          style={
            {
              "--tip-accent": SUN.accentBright,
              "--tip-glow": SUN.glow,
            } as CSSProperties
          }
        >
          <div className="orb-tip__card">
            <div className="orb-tip__logo">
              <Image src={SUN.logo} alt="" width={40} height={40} />
            </div>
            <div className="orb-tip__body">
              <div className="orb-tip__row">
                <span className="orb-tip__title">{SUN.name}</span>
                <span className="orb-tip__tag orb-tip__tag--sun">{dict.solar.parentBadge}</span>
              </div>
              <span className="orb-tip__hint">
                <span>{dict.solar.clickOverview}</span>
                <ArrowGlyph />
              </span>
            </div>
          </div>
          <div className="orb-tip__notch" />
        </div>

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
              className="group focus-visible:outline-gold pointer-events-auto absolute top-0 left-0 z-[3] flex h-[76px] w-[76px] items-center justify-center rounded-full border-none bg-transparent p-0 transition-[filter,transform] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
              style={{
                opacity: 0,
                willChange: "transform",
                transform: "translate3d(-200px,-200px,0)",
              }}
              aria-label={`${copy.title} — ${copy.tag} — ${dict.solar.openAria}`}
              onClick={(e) => activate(brand.id, (e.nativeEvent as PointerEvent).pointerType)}
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
                const r = e.currentTarget.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                magnetRef.current.set(brand.id, {
                  x: Math.max(-7, Math.min(7, dx * 0.18)),
                  y: Math.max(-7, Math.min(7, dy * 0.18)),
                });
              }}
            >
              {/* Subtle targeting reticle: pure transparency lets the 3D procedural object shine through! */}
              <span
                aria-hidden="true"
                className="pointer-events-none flex h-[56px] w-[56px] items-center justify-center rounded-full transition-all duration-300 group-hover:scale-115"
              >
                <span
                  className="h-full w-full rounded-full border border-dashed border-white/30 transition-all duration-300 group-hover:border-solid group-hover:border-white/70"
                  style={{
                    boxShadow: activePlanet === brand.id ? `0 0 24px ${brand.glow}` : "none",
                  }}
                />
                {/* Static-scene body: a brand-lit chip with the company mark. */}
                <span
                  className="orb-fill orb-fill--planet"
                  style={{
                    borderColor: brand.accentBright,
                    boxShadow: `0 0 22px ${brand.glow}, inset 0 0 12px ${brand.glow}`,
                  }}
                >
                  <Image src={brand.logo} alt="" width={40} height={40} />
                </span>
              </span>
            </button>
          );
        })}

        {/* Hover / tap cards for each company */}
        {BRAND_LIST.map((brand) => {
          const copy = dict.solar[brand.id];
          return (
            <div
              key={`tip-${brand.id}`}
              aria-hidden="true"
              ref={(el) => {
                if (el) tipRefs.current.set(brand.id, el);
                else tipRefs.current.delete(brand.id);
              }}
              className="orb-tip"
              style={
                {
                  "--tip-accent": brand.accentBright,
                  "--tip-glow": brand.glow,
                } as CSSProperties
              }
            >
              <div className="orb-tip__card">
                <div className="orb-tip__logo">
                  <Image src={brand.logo} alt="" width={40} height={40} />
                </div>
                <div className="orb-tip__body">
                  <div className="orb-tip__row">
                    <span className="orb-tip__title">{copy.title}</span>
                    <span className="orb-tip__tag">{copy.tag}</span>
                  </div>
                  <span className="orb-tip__hint">
                    <span>{dict.solar.clickExplore}</span>
                    <ArrowGlyph />
                  </span>
                </div>
              </div>
              <div className="orb-tip__notch" />
            </div>
          );
        })}
      </div>

      {/* Motion control — only meaningful once the scene actually moves. */}
      {scene === "webgl" && (
        <button
          type="button"
          onClick={togglePaused}
          aria-pressed={userPaused}
          className="orbit-pause font-display focus-visible:outline-gold bg-navy-deep/70 absolute right-2 bottom-2 z-[5] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[0.68rem] font-bold tracking-[0.16em] text-white/80 uppercase backdrop-blur-md transition-colors duration-200 hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {userPaused ? <path d="M7 5v14l12-7z" /> : <path d="M6 5h4v14H6zM14 5h4v14h-4z" />}
          </svg>
          {userPaused ? dict.hero.playOrbit : dict.hero.pauseOrbit}
        </button>
      )}

      <AnimatePresence>
        {drawerBody && (
          <OrbitDrawer key={drawerBody} bodyId={drawerBody} dict={dict} onClose={closeDrawer} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * `useMotionValueEvent` needs a value to subscribe to on every render; when
 * the parent passes none, this inert one keeps the hook order stable.
 */
const fallbackMotionValue = motionValue(0);

function ArrowGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
