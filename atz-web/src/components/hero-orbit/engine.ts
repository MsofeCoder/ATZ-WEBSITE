/**
 * The WebGL orbit scene — pure three.js, no React.
 *
 * `createOrbitEngine` builds the scene, starts the loop, and returns a handle
 * the React layer drives. Keeping it framework-free means the maths can be
 * reasoned about (and tested) without a renderer, and the component that hosts
 * it stays readable.
 *
 * `three` is imported through a namespace object supplied by the caller so the
 * whole library stays in a lazily-loaded chunk.
 */
import type * as THREE from "three";
import { BRAND_LIST, SUN, type BrandId, type BodyId } from "@/lib/brands";

export interface ScreenPoint {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  z: number;
}

/** Orbit ring drawn by the static layout, which has no canvas to render one. */
export interface OrbitRing {
  cx: number;
  cy: number;
  r: number;
}

export interface OrbitFrame {
  sun: ScreenPoint;
  planets: Map<BrandId, ScreenPoint>;
  /** Only the static layout supplies this; the WebGL scene draws its own. */
  ring?: OrbitRing;
}

export interface OrbitEngine {
  /** Play or pause the simulation (pulses still finish). */
  setPlaying(playing: boolean): void;
  /** Ease one planet to a near stop — used on hover and keyboard focus. */
  setPlanetPaused(key: BrandId, paused: boolean): void;
  /** Emit an expanding shockwave from a body. */
  pulse(key: BodyId): void;
  /** Slow the whole system while the pointer is over the stage. */
  setStageHover(hovering: boolean): void;
  /** Pointer position in normalised device coordinates. */
  setPointer(x: number, y: number): void;
  /** Which body is under the pointer right now, if any. */
  hitTest(): BodyId | null;
  destroy(): void;
}

export interface OrbitEngineOptions {
  THREE: typeof THREE;
  canvas: HTMLCanvasElement;
  /** Element the canvas fills; drives sizing and the intersection observer. */
  wrap: HTMLElement;
  reducedMotion: boolean;
  /** Called every frame with projected positions for the DOM overlay. */
  onFrame: (frame: OrbitFrame) => void;
  /** Called when the set of hovered bodies changes. */
  onHoverChange: (key: BrandId | null) => void;
}

/** Hit radius in overlay pixels — generous, so a moving orb is easy to click. */
const PLANET_HIT_RADIUS = 62;
const SUN_HIT_RADIUS = 92;

export function createOrbitEngine({
  THREE: T,
  canvas,
  wrap,
  reducedMotion,
  onFrame,
  onHoverChange,
}: OrbitEngineOptions): OrbitEngine | null {
  const disposables: { dispose(): void }[] = [];
  const track = <X extends { dispose(): void }>(d: X): X => {
    disposables.push(d);
    return d;
  };

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
  const overlay = { w: wrap.clientWidth || 1, h: wrap.clientHeight || 1 };

  // ---- materials ---------------------------------------------------------

  /** Fresnel rim-glow — an "energy orb" look with a breathing rim, no lights. */
  const fresnelMaterial = (base: number, rim: number, pulse: number) =>
    track(
      new T.ShaderMaterial({
        uniforms: {
          uBase: { value: new T.Color(base) },
          uRim: { value: new T.Color(rim) },
          uTime: { value: 0 },
          uPulse: { value: pulse },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vViewDir;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vViewDir = normalize(cameraPosition - worldPos.xyz);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uBase;
          uniform vec3 uRim;
          uniform float uTime;
          uniform float uPulse;
          varying vec3 vNormalW;
          varying vec3 vViewDir;
          void main() {
            float fres = pow(
              1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0),
              2.2
            );
            float breathe = 1.0 + uPulse * 0.18 * sin(uTime * 2.1);
            vec3 col = uBase + uRim * fres * 2.1 * breathe;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      })
    );

  /** Soft radial-gradient sprite texture, shared by glows and star points. */
  const makeGlow = (r: number, g: number, b: number) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.25, `rgba(${r},${g},${b},0.55)`);
    grad.addColorStop(0.6, `rgba(${r},${g},${b},0.16)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return track(tex);
  };

  // ---- sun ---------------------------------------------------------------

  const sunGroup = new T.Group();
  const sunMesh = new T.Mesh(
    track(new T.SphereGeometry(0.55, 48, 48)),
    fresnelMaterial(0xfdf6e0, 0xe4ce8f, 1.0)
  );
  sunGroup.add(sunMesh);

  const sunGlowMat = track(
    new T.SpriteMaterial({
      map: makeGlow(...SUN.rgb),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: T.AdditiveBlending,
    })
  );
  const sunGlow = new T.Sprite(sunGlowMat);
  sunGlow.scale.setScalar(4.4);
  sunGroup.add(sunGlow);

  const sunHaloMat = track(
    new T.SpriteMaterial({
      map: makeGlow(...SUN.rgb),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: T.AdditiveBlending,
    })
  );
  const sunHalo = new T.Sprite(sunHaloMat);
  sunHalo.scale.setScalar(9.5);
  sunGroup.add(sunHalo);
  scene.add(sunGroup);

  // ---- planets -----------------------------------------------------------

  interface Planet {
    key: BrandId;
    angle: number;
    radius: number;
    speed: number;
    mesh: THREE.Mesh;
    mat: THREE.ShaderMaterial;
    lineMat: THREE.LineBasicMaterial;
    spark: THREE.Sprite;
    /** Eased speed factor — approaches 0 when hovered or focused. */
    slow: number;
    hovered: boolean;
    paused: boolean;
    introT: number;
    introDelay: number;
  }

  const planets: Planet[] = [];
  const easeOutBack = (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const introRaw = (p: Planet) =>
    reducedMotion ? 1 : T.MathUtils.clamp((p.introT - p.introDelay) / 0.55, 0, 1);

  BRAND_LIST.forEach((brand, index) => {
    const { radius, period, startAngle } = brand.orbit;

    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push(new T.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const lineMat = track(
      new T.LineBasicMaterial({ color: brand.hex, transparent: true, opacity: 0.28 })
    );
    scene.add(new T.Line(track(new T.BufferGeometry().setFromPoints(pts)), lineMat));

    const mesh = new T.Mesh(
      track(new T.SphereGeometry(0.26, 32, 32)),
      fresnelMaterial(new T.Color(brand.hex).multiplyScalar(0.14).getHex(), brand.hex, 0.6)
    );
    const glow = new T.Sprite(
      track(
        new T.SpriteMaterial({
          map: makeGlow(...brand.rgb),
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: T.AdditiveBlending,
        })
      )
    );
    glow.scale.setScalar(1.7);
    mesh.add(glow);
    scene.add(mesh);

    // A brighter spark sweeps each orbit faster than its planet.
    const spark = new T.Sprite(
      track(
        new T.SpriteMaterial({
          map: makeGlow(...brand.rgb),
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: T.AdditiveBlending,
        })
      )
    );
    spark.scale.setScalar(0.18);
    scene.add(spark);

    planets.push({
      key: brand.id,
      angle: startAngle,
      radius,
      speed: (2 * Math.PI) / period,
      mesh,
      mat: mesh.material as THREE.ShaderMaterial,
      lineMat,
      spark,
      slow: 1,
      hovered: false,
      paused: false,
      introT: reducedMotion ? 1 : 0,
      introDelay: 0.15 + index * 0.22,
    });
  });

  // ---- starfield ---------------------------------------------------------

  const makeStars = (
    count: number,
    spread: number,
    size: number,
    opacity: number,
    color: number
  ) => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.4 + 0.6 * Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.6;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - spread * 0.25;
    }
    const geo = track(new T.BufferGeometry());
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    const mat = track(
      new T.PointsMaterial({
        size,
        map: makeGlow(255, 255, 255),
        transparent: true,
        opacity,
        depthWrite: false,
        blending: T.AdditiveBlending,
        sizeAttenuation: true,
        color,
      })
    );
    return new T.Points(geo, mat);
  };
  const starsFar = makeStars(700, 30, 0.09, 0.8, 0xdfe6f5);
  const starsNear = makeStars(220, 24, 0.18, 0.45, SUN.hex);
  scene.add(starsFar, starsNear);

  // ---- pulses ------------------------------------------------------------

  interface Pulse {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    t: number;
  }
  const pulses: Pulse[] = [];
  const spawnPulse = (worldPos: THREE.Vector3, color: number) => {
    if (reducedMotion) return;
    const mat = new T.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: T.DoubleSide,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
    const m = new T.Mesh(new T.RingGeometry(0.34, 0.4, 48), mat);
    m.position.copy(worldPos);
    m.quaternion.copy(camera.quaternion);
    scene.add(m);
    pulses.push({ mesh: m, mat, t: 0 });
  };

  // ---- camera + projection ----------------------------------------------

  let camDist = 9;
  const frame = () => {
    overlay.w = wrap.clientWidth || 1;
    overlay.h = wrap.clientHeight || 1;
    renderer.setSize(overlay.w, overlay.h, false);
    camera.aspect = overlay.w / overlay.h;
    const vFov = T.MathUtils.degToRad(camera.fov);
    const distH = 4.0 / Math.tan(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const distW = 4.35 / Math.tan(hFov / 2);
    camDist = Math.max(distH, distW);
    camera.updateProjectionMatrix();
  };

  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const updateCamera = () => {
    camera.position.set(smooth.x * 1.1, camDist * 0.44 + smooth.y * 0.7, camDist * 0.9);
    camera.lookAt(0, 0, 0);
  };

  const v3 = new T.Vector3();
  const projectToScreen = (obj: THREE.Object3D) => {
    obj.getWorldPosition(v3);
    const dist = camera.position.distanceTo(v3);
    v3.project(camera);
    return {
      x: (v3.x * 0.5 + 0.5) * overlay.w,
      y: (-v3.y * 0.5 + 0.5) * overlay.h,
      dist,
    };
  };

  /**
   * Hit-testing works on the *projected* pixel positions rather than a
   * raycast, so the clickable region matches the glowing orb the visitor sees
   * — including its bloom — and stays aligned at every camera angle.
   */
  const hitTest = (): BodyId | null => {
    const px = (pointer.x * 0.5 + 0.5) * overlay.w;
    const py = (pointer.y * 0.5 + 0.5) * overlay.h;
    let best: BodyId | null = null;
    let bestD = Infinity;
    const consider = (x: number, y: number, radius: number, key: BodyId) => {
      const d = Math.hypot(px - x, py - y);
      if (d < radius && d < bestD) {
        bestD = d;
        best = key;
      }
    };
    for (const p of planets) {
      const s = projectToScreen(p.mesh);
      consider(s.x, s.y, PLANET_HIT_RADIUS, p.key);
    }
    const sun = projectToScreen(sunGroup);
    consider(sun.x, sun.y, SUN_HIT_RADIUS, "sun");
    return best;
  };

  const emitFrame = () => {
    const s = projectToScreen(sunGroup);
    const sScale = T.MathUtils.clamp(
      T.MathUtils.mapLinear(s.dist, camDist * 0.65, camDist * 1.35, 1.12, 0.85),
      0.82,
      1.15
    );

    const entries = planets.map((p) => {
      const pr = projectToScreen(p.mesh);
      const scale = T.MathUtils.clamp(
        T.MathUtils.mapLinear(pr.dist, camDist * 0.65, camDist * 1.35, 1.18, 0.72),
        0.7,
        1.2
      );
      return { p, ...pr, scale };
    });

    const map = new Map<BrandId, ScreenPoint>();
    // Farther planets get a lower z so nearer ones overlap on top.
    [...entries]
      .sort((a, b) => b.dist - a.dist)
      .forEach((e, idx) => {
        const intro = introRaw(e.p);
        const opacity =
          T.MathUtils.clamp(
            T.MathUtils.mapLinear(e.dist, camDist * 0.65, camDist * 1.35, 1, 0.62),
            0.6,
            1
          ) * intro;
        map.set(e.p.key, { x: e.x, y: e.y, scale: e.scale, opacity, z: 2 + idx });
      });

    onFrame({
      sun: { x: s.x, y: s.y, scale: sScale, opacity: 1, z: 4 },
      planets: map,
    });
  };

  // ---- loop --------------------------------------------------------------

  let raf = 0;
  let lastT = 0;
  let playing = !reducedMotion;
  let inView = true;
  let stageHover = false;
  let lastHover: BrandId | null = null;

  const applyHover = () => {
    const hit = hitTest();
    const hovered = hit && hit !== "sun" ? (hit as BrandId) : null;
    for (const p of planets) p.hovered = p.key === hovered;
    if (hovered !== lastHover) {
      lastHover = hovered;
      onHoverChange(hovered);
    }
  };

  const tick = (t: number) => {
    raf = 0;
    if ((!playing && pulses.length === 0) || !inView || document.hidden) {
      lastT = 0;
      return;
    }
    if (!lastT) lastT = t;
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    for (const p of planets) {
      p.introT = Math.min(1, p.introT + dt / 0.7);
      const raw = introRaw(p);
      const introScale = raw >= 1 ? 1 : Math.max(easeOutBack(raw), 0.001);
      p.mesh.scale.setScalar(introScale);
      p.spark.scale.setScalar(0.18 * Math.max(raw, 0.001));
      p.lineMat.opacity = 0.28 * raw;

      // Time dilation: hovering or focusing a planet brings it to a full stop,
      // so it becomes a stationary target the moment someone reaches for it —
      // a planet still drifting at 5% is one a visitor with a tremor or
      // limited fine motor control cannot reliably hit. Otherwise the whole
      // system crawls while the pointer is over the stage, so nothing outruns
      // the cursor.
      const target = p.hovered || p.paused ? 0 : stageHover ? 0.1 : 1;
      p.slow += (target - p.slow) * (1 - Math.pow(0.002, dt));
      p.angle += dt * p.speed * p.slow;
      p.mesh.position.set(Math.cos(p.angle) * p.radius, 0, Math.sin(p.angle) * p.radius);

      const sparkAngle = p.angle * 2.4 + 1.1;
      p.spark.position.set(Math.cos(sparkAngle) * p.radius, 0, Math.sin(sparkAngle) * p.radius);
      p.mat.uniforms.uTime.value = t * 0.001;
    }

    (sunMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = t * 0.001;
    starsFar.rotation.y += dt * 0.008;
    starsNear.rotation.y -= dt * 0.006;
    sunGlowMat.opacity = 0.78 + 0.16 * Math.sin(t * 0.0016);
    sunHaloMat.opacity = 0.24 + 0.08 * Math.sin(t * 0.0016 + 1.3);

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pu = pulses[i]!;
      pu.t += dt;
      const k = pu.t / 0.7;
      if (k >= 1) {
        scene.remove(pu.mesh);
        pu.mesh.geometry.dispose();
        pu.mat.dispose();
        pulses.splice(i, 1);
      } else {
        pu.mesh.scale.setScalar(0.5 + k * 4.2);
        pu.mat.opacity = 0.9 * (1 - k);
      }
    }

    applyHover();
    smooth.x += (pointer.x - smooth.x) * 0.06;
    smooth.y += (pointer.y - smooth.y) * 0.06;
    updateCamera();
    renderer.render(scene, camera);
    emitFrame();

    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const start = () => {
    if (reducedMotion && pulses.length === 0) {
      // Still draw one frame so positions are correct.
      updateCamera();
      renderer.render(scene, camera);
      emitFrame();
      return;
    }
    if (!raf && (playing || pulses.length > 0) && inView && !document.hidden) {
      raf = requestAnimationFrame(tick);
    }
  };

  // ---- lifecycle ---------------------------------------------------------

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      if (inView) start();
      else stop();
    },
    { threshold: 0.02 }
  );
  io.observe(wrap);

  const ro = new ResizeObserver(() => {
    frame();
    updateCamera();
    renderer.render(scene, camera);
    emitFrame();
  });
  ro.observe(wrap);

  frame();
  updateCamera();
  renderer.render(scene, camera);
  emitFrame();
  start();

  return {
    setPlaying(p) {
      playing = p;
      if (p) start();
      else stop();
    },
    setPlanetPaused(key, paused) {
      const pl = planets.find((x) => x.key === key);
      if (pl) pl.paused = paused;
    },
    setStageHover(hovering) {
      stageHover = hovering;
    },
    setPointer(x, y) {
      pointer.x = x;
      pointer.y = y;
    },
    hitTest,
    pulse(key) {
      const v = new T.Vector3();
      if (key === "sun") {
        sunGroup.getWorldPosition(v);
        spawnPulse(v, SUN.hex);
      } else {
        const pl = planets.find((x) => x.key === key);
        const brand = BRAND_LIST.find((b) => b.id === key);
        if (pl && brand) {
          pl.mesh.getWorldPosition(v);
          spawnPulse(v, brand.hex);
        }
      }
      start();
    },
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      for (const pu of pulses) {
        scene.remove(pu.mesh);
        pu.mesh.geometry.dispose();
        pu.mat.dispose();
      }
      pulses.length = 0;
      for (const d of disposables) d.dispose();
      renderer.dispose();
    },
  };
}

/**
 * The scene without WebGL — now the primary experience on phones, not a
 * fallback nobody looked at.
 *
 * The previous version reused each brand's 3D `startAngle` on a flattened
 * ellipse, which at phone widths put two of the three chips on top of the sun.
 * This places them on a true circle at even 120° spacing, at a radius that
 * clears the sun's 50px disc and the chips' own 26px, so the arrangement reads
 * as deliberate at any size. One planet sits at top dead centre, which keeps
 * all three clear of the wordmark rendered directly beneath the sun.
 */
const STATIC_ANGLES = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

/** Sun radius 50 + chip radius 26 + breathing room. */
const MIN_STATIC_RADIUS = 96;

export function staticLayout(width: number, height: number): OrbitFrame {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(MIN_STATIC_RADIUS, Math.min(width * 0.34, height * 0.34, 150));

  const planets = new Map<BrandId, ScreenPoint>();
  BRAND_LIST.forEach((brand, i) => {
    const a = STATIC_ANGLES[i] ?? 0;
    planets.set(brand.id, {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a),
      scale: 1,
      opacity: 1,
      z: 3,
    });
  });

  return { sun: { x: cx, y: cy, scale: 1, opacity: 1, z: 4 }, planets, ring: { cx, cy, r } };
}

export function webglSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") ?? c.getContext("webgl")));
  } catch {
    return false;
  }
}

/**
 * True when this visitor should keep the static scene and never fetch three.js.
 *
 * The WebGL orbit is decoration. It costs ~177 KB gzipped plus a continuous
 * render loop, and the static layout is a complete, interactive equivalent —
 * so it is treated as a progressive enhancement, granted only where it earns
 * its keep. Four signals disqualify it:
 *
 * 1. Data Saver, which is an explicit request not to spend the visitor's money.
 * 2. A 2G-class connection.
 * 3. A low-memory device, where a WebGL context competes with the page itself.
 * 4. A viewport below the `lg` breakpoint. This is the design argument rather
 *    than a technical one: below it the hero stacks and the canvas renders at
 *    roughly 340px, where the orbital depth, the rim shader and the starfield
 *    are no longer legible. The visitor pays full price for detail they cannot
 *    see — and on this site's audience that price is mobile data.
 *
 * The check runs once, at mount. Someone who resizes a desktop window across
 * the breakpoint keeps whichever scene they started with, which is the right
 * trade against re-initialising a WebGL context on every drag.
 */
export function prefersLightweightScene(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  const conn = nav.connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return true;

  // `deviceMemory` is bucketed and capped at 8; 2 or less is genuinely low-end.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return true;

  // Matches Tailwind's `lg`, the breakpoint at which the hero becomes two
  // columns and the orbit gets room to be a showpiece.
  return window.matchMedia("(max-width: 1023px)").matches;
}
