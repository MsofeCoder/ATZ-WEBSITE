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
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";
import { BRANDS, BRAND_LIST, SUN, type BrandId, type BodyId } from "@/lib/brands";

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
  /** Frame the solar system nicely within the available viewport band. */
  applyHome(w?: number, h?: number): void;
  /**
   * How far the hero has scrolled out of view, 0–1. Drives a gentle,
   * fixed-path camera pull-back so the scene answers the page rather than
   * sitting still while the copy moves past it.
   */
  setScrollProgress(progress: number): void;
  destroy(): void;
}

export interface OrbitEngineOptions {
  THREE: typeof THREE;
  OrbitControls?: new (object: THREE.Camera, domElement?: HTMLElement) => OrbitControlsType;
  canvas: HTMLCanvasElement;
  /** Element the canvas fills; drives sizing and the intersection observer. */
  wrap: HTMLElement;
  reducedMotion: boolean;
  /** Called every frame with projected positions for the DOM overlay. */
  onFrame: (frame: OrbitFrame) => void;
  /** Called when the set of hovered bodies changes. */
  onHoverChange: (key: BodyId | null) => void;
}

/** Hit radius in overlay pixels — generous, so a moving orb is easy to click. */
const PLANET_HIT_RADIUS = 62;
const SUN_HIT_RADIUS = 92;

export function createOrbitEngine({
  THREE: T,
  OrbitControls: OrbitControlsClass,
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

  // ---- Adaptive quality detection ----------------------------------------
  // Mirrors detectQuality() from the standalone repo's scene.ts.
  // Conservative defaults: an elegant scene beats a heavy one on slow devices.
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 700;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const lowPower = cores <= 4 || memory <= 4 || (coarse && narrow);
  const dprCap = lowPower ? 1.5 : 2;
  const starCount = lowPower ? 1400 : 3200;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      antialias: !lowPower,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  // Clear to the hero's own navy so the masked canvas edge dissolves into the
  // section instead of reading as a dark disc; the sky dome deepens it inward.
  renderer.setClearColor(0x0e1730, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = T.SRGBColorSpace;

  const scene = new T.Scene();
  // Exponential fog gives depth to the distant star field.
  scene.fog = new T.FogExp2(0x0e1730, 0.0065);
  const camera = new T.PerspectiveCamera(45, 1, 0.1, 400);
  const overlay = { w: wrap.clientWidth || 1, h: wrap.clientHeight || 1 };

  // OrbitControls with the real PerspectiveCamera
  let controls: OrbitControlsType | null = null;
  if (OrbitControlsClass) {
    controls = new OrbitControlsClass(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    // The wheel belongs to the page. Zooming the scene on scroll trapped the
    // visitor inside the hero whenever the pointer crossed the canvas.
    controls.enableZoom = false;
    controls.minDistance = 7;
    controls.maxDistance = 58;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.86;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.28;
  }

  // ---- Sky dome ----------------------------------------------------------
  // Inside-out sphere with a 3-stop GLSL gradient: deep navy at top,
  // gunmetal in the middle, near-black at the bottom. Ported from the
  // standalone repo's scene.ts `buildBackground()` method.
  const domeGeo = track(new T.SphereGeometry(300, 32, 24));
  const domeMat = track(
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      fog: false,
      // The colours below are chosen in sRGB to sit against the hero's
      // `--navy-deep`; tone mapping would shift them, so it is off here.
      toneMapped: false,
      uniforms: {
        topColor: { value: new T.Color(0x18254e) },
        midColor: { value: new T.Color(0x0e1730) },
        bottomColor: { value: new T.Color(0x0a1128) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp((normalize(vWorldPos).y + 1.0) * 0.5, 0.0, 1.0);
          vec3 col = h > 0.5
            ? mix(midColor, topColor, (h - 0.5) * 2.0)
            : mix(bottomColor, midColor, h * 2.0);
          gl_FragColor = vec4(col, 1.0);
          // Custom shaders skip the renderer's output conversion, so without
          // this the linear-light colours above are written raw and the dome
          // renders as near-black against the navy section.
          #include <colorspace_fragment>
        }
      `,
    })
  );
  scene.add(new T.Mesh(domeGeo, domeMat));

  // ---- material helpers --------------------------------------------------

  /** Soft radial-gradient sprite texture, used for glows and star points. */
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

  /**
   * Knocks out a white background in place, if the canvas has one (all four
   * corners white). Soft ramp between 205 and 235 keeps anti-aliased edges.
   */
  const keyOutWhite = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const corners: [number, number][] = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
    ];
    const hasWhite = corners.every(([x, y]) => {
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      return a > 200 && r > 225 && g > 225 && b > 225;
    });
    if (!hasWhite) return;
    const idata = ctx.getImageData(0, 0, w, h);
    const d = idata.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const min = Math.min(d[i], d[i + 1], d[i + 2]);
      if (min > 235) d[i + 3] = 0;
      else if (min > 205) {
        d[i + 3] = Math.round(d[i + 3] * Math.max(0, Math.min(1, (235 - min) / 30)));
      }
    }
    ctx.putImageData(idata, 0, 0);
  };

  /**
   * Loads an image and returns a Three.js texture with the white background
   * keyed out. With `plate`, the mark is set on a soft cream disc with a
   * navy ring first: the ATZ logo is navy and gold, and painted straight
   * onto the gold star its gold half simply vanished.
   */
  const makeLogoTexture = (logoUrl: string, plate = false): Promise<THREE.Texture> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext("2d")!;
        // The logo is keyed on a scratch canvas so the plate underneath is
        // never mistaken for background and knocked out.
        const logo = document.createElement("canvas");
        logo.width = logo.height = 512;
        const lctx = logo.getContext("2d")!;
        const box = plate ? 512 * 0.6 : 512;
        const scale = Math.min(box / img.width, box / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        lctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
        keyOutWhite(lctx, 512, 512);
        if (plate) {
          const R = 256;
          // Soft shadow under the plate so it lifts off the surface.
          ctx.save();
          ctx.shadowColor = "rgba(20, 14, 0, 0.45)";
          ctx.shadowBlur = 28;
          ctx.shadowOffsetY = 6;
          ctx.fillStyle = "#f6efd9";
          ctx.beginPath();
          ctx.arc(R, R, R * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          const g = ctx.createRadialGradient(R * 0.86, R * 0.78, R * 0.1, R, R, R * 0.8);
          g.addColorStop(0, "#ffffff");
          g.addColorStop(0.7, "#f7f1de");
          g.addColorStop(1, "#e6d8ad");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(R, R, R * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(27, 42, 74, 0.9)";
          ctx.lineWidth = 9;
          ctx.beginPath();
          ctx.arc(R, R, R * 0.76, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(255, 244, 200, 0.9)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(R, R, R * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (plate) {
          // Same round mask as the planet badges, inside the navy ring.
          ctx.save();
          ctx.beginPath();
          ctx.arc(256, 256, 256 * 0.74, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logo, 0, 0);
          ctx.restore();
        } else {
          ctx.drawImage(logo, 0, 0);
        }
        const tex = track(new T.CanvasTexture(c));
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        resolve(tex);
      };
      img.onerror = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 64;
        resolve(track(new T.CanvasTexture(c)));
      };
      img.src = logoUrl;
    });

  /**
   * Builds a badge texture: circular light plate with accent ring + logo.
   * Matches the reference repo's textures.ts `makeBadgeTexture`.
   */
  const makeBadgeTexture = (logoUrl: string, accentHex: number): Promise<THREE.Texture> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const build = () => {
        const SIZE = 256,
          R = SIZE / 2;
        const c = document.createElement("canvas");
        c.width = c.height = SIZE;
        const ctx = c.getContext("2d")!;
        // Drop shadow first, so the plate reads as a chip floating over the
        // planet rather than a flat decal on the star field.
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(R, R, R - 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Light circular plate
        const plate = ctx.createRadialGradient(R, R * 0.82, R * 0.1, R, R, R);
        plate.addColorStop(0, "#ffffff");
        plate.addColorStop(0.72, "#f4f7fc");
        plate.addColorStop(1, "#dfe6f2");
        ctx.fillStyle = plate;
        ctx.beginPath();
        ctx.arc(R, R, R - 14, 0, Math.PI * 2);
        ctx.fill();
        // Accent ring — full strength, wider than before, so the chip carries
        // its brand colour at a glance.
        const ac = new T.Color(accentHex).convertLinearToSRGB();
        ctx.strokeStyle = `rgb(${Math.round(ac.r * 255)},${Math.round(ac.g * 255)},${Math.round(ac.b * 255)})`;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(R, R, R - 19, 0, Math.PI * 2);
        ctx.stroke();
        // Dark outer hairline separates the chip from bright planet rims.
        ctx.strokeStyle = "rgba(6,10,22,0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(R, R, R - 13, 0, Math.PI * 2);
        ctx.stroke();
        // Logo — keyed-out white bg
        if (img.width > 0) {
          const probe = document.createElement("canvas");
          probe.width = img.width;
          probe.height = img.height;
          const pctx = probe.getContext("2d")!;
          pctx.drawImage(img, 0, 0);
          const corners2: [number, number][] = [
            [0, 0],
            [img.width - 1, 0],
            [0, img.height - 1],
            [img.width - 1, img.height - 1],
          ];
          const hasWhiteBg = corners2.every(([x, y]) => {
            const [r2, g2, b2, a2] = pctx.getImageData(x, y, 1, 1).data;
            return a2 > 200 && r2 > 225 && g2 > 225 && b2 > 225;
          });
          if (hasWhiteBg) {
            const idata = pctx.getImageData(0, 0, img.width, img.height);
            const d = idata.data;
            for (let i = 0; i < d.length; i += 4) {
              if (d[i + 3] === 0) continue;
              const min = Math.min(d[i], d[i + 1], d[i + 2]);
              if (min > 235) d[i + 3] = 0;
              else if (min > 205) d[i + 3] = Math.round(d[i + 3] * ((235 - min) / 30));
            }
            pctx.putImageData(idata, 0, 0);
          }
          const boxSize = SIZE * 0.66;
          const s = Math.min(boxSize / img.width, boxSize / img.height);
          const lw = img.width * s,
            lh = img.height * s;
          // Clip to the inside of the accent ring: whatever the source image
          // is — square, wordmark, stray background — every badge is the same
          // round chip, so the three companies read as one set.
          ctx.save();
          ctx.beginPath();
          ctx.arc(R, R, R - 25, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(probe, (SIZE - lw) / 2, (SIZE - lh) / 2, lw, lh);
          ctx.restore();
        }
        const tex = track(new T.CanvasTexture(c));
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 4;
        resolve(tex);
      };
      img.onload = build;
      img.onerror = build;
      img.src = logoUrl;
    });

  /** Fresnel corona ShaderMaterial: brightest at silhouette with breathing pulse. */
  const makeCoronaMaterial = (color: number, intensity: number) =>
    track(
      new T.ShaderMaterial({
        transparent: true,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        fog: false,
        uniforms: {
          uColor: { value: new T.Color(color) },
          uIntensity: { value: intensity },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uIntensity;
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fres = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.6);
            float pulse = 0.94 + 0.06 * sin(uTime * 0.7);
            gl_FragColor = vec4(uColor, fres * uIntensity * pulse);
          }
        `,
      })
    );

  // ---- sun ---------------------------------------------------------------
  // Matches sun.ts from the reference repo exactly:
  // SUN_RADIUS = 3.2, MeshStandard + onBeforeCompile granulation,
  // two Fresnel coronas, billboard glow, and a camera-facing medallion.

  const SUN_RADIUS = 3.2;
  const sunGroup = new T.Group();
  sunGroup.name = "atz-sun";
  sunGroup.userData.isSun = true;

  const SEG = lowPower ? 48 : 80;

  // Warm gold star core with procedural surface granulation
  const sunCoreMat = track(
    new T.MeshStandardMaterial({
      color: new T.Color(0xc9a63f),
      emissive: new T.Color(0xf0c95a),
      emissiveIntensity: 1.5,
      roughness: 0.42,
      metalness: 0.05,
    })
  );

  sunCoreMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSunPos;")
      .replace("#include <fog_vertex>", "#include <fog_vertex>\nvSunPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vSunPos;
         uniform float uTime;
         float hash(vec3 p) {
           return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
         }
         float noise(vec3 p) {
           vec3 i = floor(p); vec3 f = fract(p);
           f = f * f * (3.0 - 2.0 * f);
           return mix(
             mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
             f.z);
         }`
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
         float n = noise(vSunPos * 2.6 + vec3(0.0, uTime * 0.10, uTime * 0.06));
         gl_FragColor.rgb += vec3(0.55, 0.32, 0.05) * (n - 0.5) * 0.9;`
      );
    // Store a reference so the tick loop can animate uTime safely
    sunCoreMat.userData.shader = shader;
  };
  sunCoreMat.customProgramCacheKey = () => "atz-sun-core";

  const sunMesh = new T.Mesh(
    track(new T.SphereGeometry(SUN_RADIUS, SEG, Math.round(SEG / 2))),
    sunCoreMat
  );
  sunMesh.name = "atz-sun-core";
  sunMesh.userData.isSun = true;
  sunGroup.add(sunMesh);

  // Layered Fresnel coronas (matching reference)
  const coronaInnerMat = makeCoronaMaterial(0xf0c95a, 0.9);
  const coronaInner = new T.Mesh(
    track(new T.SphereGeometry(SUN_RADIUS * 1.14, Math.round(SEG * 0.5), Math.round(SEG * 0.25))),
    coronaInnerMat
  );
  const coronaOuterMat = makeCoronaMaterial(0xc9a63f, 0.3);
  const coronaOuter = new T.Mesh(
    track(new T.SphereGeometry(SUN_RADIUS * 1.42, Math.round(SEG * 0.4), Math.round(SEG * 0.2))),
    coronaOuterMat
  );
  sunGroup.add(coronaInner, coronaOuter);

  // Camera-facing ATZ medallion — placed on sphere surface each frame
  const medallionMat = track(
    new T.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    })
  );
  const medallion = new T.Mesh(track(new T.CircleGeometry(SUN_RADIUS * 0.94, 48)), medallionMat);
  medallion.name = "atz-sun-medallion";
  medallion.raycast = () => {};
  sunGroup.add(medallion);

  makeLogoTexture(SUN.logo, true).then((tex) => {
    medallionMat.map = tex;
    medallionMat.needsUpdate = true;
  });

  // Billboard glow sprite (modest size — avoids flooding hero copy)
  const sunGlowSprite = new T.Sprite(
    track(
      new T.SpriteMaterial({
        map: makeGlow(...SUN.rgb),
        transparent: true,
        opacity: 0.62,
        blending: T.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    )
  );
  sunGlowSprite.scale.setScalar(SUN_RADIUS * 4.6);
  sunGroup.add(sunGlowSprite);

  scene.add(sunGroup);

  // ---- Lighting rig ------------------------------------------------------
  // Matches the reference repo: strong PointLight from the star,
  // a cool DirectionalLight fill, and a dim AmbientLight floor.
  const sunLight = track(new T.PointLight(0xffd98a, 900, 160, 2));
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const fillLight = track(new T.DirectionalLight(0x6f8fd6, 0.55));
  fillLight.position.set(-20, 14, 18);
  scene.add(fillLight);

  const ambientLight = track(new T.AmbientLight(0x2b3a63, 0.5));
  scene.add(ambientLight);

  // ---- planets -----------------------------------------------------------
  // Matches planets.ts from the reference repo:
  //   • MeshStandardMaterial + onBeforeCompile (graticule, banding, rim)
  //   • Pivot-based orbit with tilt from brands.ts
  //   • Atmosphere halo (BackSide Fresnel ShaderMaterial)
  //   • Billboard badge sprite with division logo

  interface PlanetUniforms {
    uTime: { value: number };
    uHighlight: { value: number };
  }
  type UniformedMat = THREE.MeshStandardMaterial & { atzUniforms: PlanetUniforms };

  interface Planet {
    key: BrandId;
    pivot: THREE.Group;
    mesh: THREE.Mesh;
    badge: THREE.Sprite;
    highlight: number;
    worldPos: THREE.Vector3;
    mat: UniformedMat;
    haloMat: THREE.ShaderMaterial;
    /** Eased speed factor — approaches 0 when hovered or paused. */
    slow: number;
    hovered: boolean;
    paused: boolean;
    introT: number;
    introDelay: number;
    speed: number;
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
    const { radius, period, startAngle, tilt } = brand.orbit;

    // Orbit ring: simple LineLoop with accent tint, matching the ref's orbits.ts
    const ringPts: THREE.Vector3[] = [];
    const RING_SEGS = 128;
    for (let i = 0; i <= RING_SEGS; i++) {
      const a = (i / RING_SEGS) * Math.PI * 2;
      ringPts.push(new T.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const ringMat = track(
      new T.LineBasicMaterial({
        color: brand.accentHex,
        transparent: true,
        opacity: 0.16,
        blending: T.AdditiveBlending,
        depthWrite: false,
      })
    );
    const ringGeo = track(new T.BufferGeometry().setFromPoints(ringPts));
    const orbitRing = new T.LineLoop(ringGeo, ringMat);
    orbitRing.rotation.x = tilt;
    scene.add(orbitRing);

    // Orbit pivot — tilting its plane + rotating its Y advances the planet
    const pivot = new T.Group();
    pivot.name = `orbit-pivot-${brand.id}`;
    pivot.rotation.x = tilt;
    pivot.rotation.y = startAngle;

    // Carrier: offset from origin to the orbit radius
    const carrier = new T.Group();
    carrier.position.x = radius;
    pivot.add(carrier);
    scene.add(pivot);

    // Planet MeshStandardMaterial with onBeforeCompile graticule/banding/rim
    const planetUniforms: PlanetUniforms = {
      uTime: { value: 0 },
      uHighlight: { value: 0 },
    };
    const mat = track(
      new T.MeshStandardMaterial({
        color: new T.Color(brand.baseHex),
        roughness: 0.68,
        metalness: 0.2,
        emissive: new T.Color(brand.accentHex),
        emissiveIntensity: 0.06,
      })
    ) as UniformedMat;
    mat.atzUniforms = planetUniforms;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = planetUniforms.uTime;
      shader.uniforms.uHighlight = planetUniforms.uHighlight;
      shader.uniforms.uAccent = { value: new T.Color(brand.accentHex) };
      shader.uniforms.uAccent2 = { value: new T.Color(brand.accentSecondaryHex) };
      shader.uniforms.uBands = { value: lowPower ? 3.0 : 5.0 };

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           varying vec2 vDivUv;
           varying vec3 vDivNormal;
           varying vec3 vDivView;`
        )
        .replace(
          "#include <fog_vertex>",
          `#include <fog_vertex>
           vDivUv = uv;
           vDivNormal = normalize(normalMatrix * normal);
           vDivView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           varying vec2 vDivUv;
           varying vec3 vDivNormal;
           varying vec3 vDivView;
           uniform float uTime;
           uniform float uHighlight;
           uniform float uBands;
           uniform vec3 uAccent;
           uniform vec3 uAccent2;`
        )
        .replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
           vec2 grid = abs(fract(vDivUv * vec2(24.0, 12.0)) - 0.5);
           float line = 1.0 - smoothstep(0.0, 0.045, min(grid.x, grid.y));
           float band = sin(vDivUv.y * uBands * 3.14159 + uTime * 0.25) * 0.5 + 0.5;
           vec3 bandTint = mix(uAccent, uAccent2, band);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, bandTint, band * 0.16);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, bandTint, line * 0.30);
           float rim = pow(1.0 - abs(dot(normalize(vDivNormal), normalize(vDivView))), 2.2);
           float rimStrength = 0.25 + uHighlight * 0.85;
           gl_FragColor.rgb += bandTint * rim * rimStrength;
           gl_FragColor.rgb *= (1.0 + uHighlight * 0.22);`
        );
    };
    mat.customProgramCacheKey = () => `atz-planet-${brand.id}`;

    const pSeg = Math.round(lowPower ? 40 : 64);
    const planetMesh = new T.Mesh(
      track(new T.SphereGeometry(brand.bodyRadius, pSeg, Math.round(pSeg / 2))),
      mat
    );
    planetMesh.name = `planet-${brand.id}`;
    planetMesh.userData.isPlanet = true;
    carrier.add(planetMesh);

    // Atmosphere halo (BackSide Fresnel — same pattern as the reference)
    const haloMat = track(
      new T.ShaderMaterial({
        transparent: true,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        fog: false,
        uniforms: {
          uColor: { value: new T.Color(brand.accentHex) },
          uHighlight: planetUniforms.uHighlight,
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uHighlight;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fres = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
            gl_FragColor = vec4(uColor, fres * (0.35 + uHighlight * 0.5));
          }
        `,
      })
    );
    const haloMesh = new T.Mesh(
      track(
        new T.SphereGeometry(
          brand.bodyRadius * 1.35,
          Math.round(pSeg * 0.4),
          Math.round(pSeg * 0.2)
        )
      ),
      haloMat
    );
    carrier.add(haloMesh);

    // Badge sprite: circular plate + accent ring + logo
    // Placed above the planet so it never intersects the surface.
    const badgeMat = track(
      new T.SpriteMaterial({
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        fog: false,
      })
    );
    const badge = new T.Sprite(badgeMat);
    badge.name = `badge-${brand.id}`;
    badge.raycast = () => {};
    badge.position.set(0, brand.bodyRadius * 1.62, 0);
    badge.scale.setScalar(brand.bodyRadius * 1.7);
    carrier.add(badge);

    // Build badge texture asynchronously
    makeBadgeTexture(brand.logo, brand.accentHex).then((tex) => {
      badgeMat.map = tex;
      badgeMat.needsUpdate = true;
    });

    planets.push({
      key: brand.id,
      pivot,
      mesh: planetMesh,
      badge,
      highlight: 0,
      worldPos: new T.Vector3(),
      mat,
      haloMat,
      slow: 1,
      hovered: false,
      paused: false,
      introT: reducedMotion ? 1 : 0,
      introDelay: 0.15 + index * 0.22,
      speed: (Math.PI * 2) / period,
    });
  });

  // ---- galaxy & deep cosmos ---------------------------------------------
  // Richer starfield ported from the standalone repo's scene.ts.
  // Uses a seeded deterministic RNG so the sky is stable between reloads,
  // per-star colour tints, per-star size attributes, and a custom shader
  // with proper size attenuation. Also adds two faint nebula sprites in
  // ATZ navy and gold for palette cohesion.

  /** Soft radial glow texture used for star points and nebula sprites. */
  const makeGlowTex = (inner: string, outer: string, size = 128): THREE.Texture => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.35, inner);
    grad.addColorStop(1, outer);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return track(tex);
  };

  // Deterministic PRNG so the sky is stable across page loads.
  let seed = 20260914;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const positions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  // Colour tints: mostly cool white, a few navy-blue and warm gold points.
  const tints = [
    new T.Color(0xffffff),
    new T.Color(0xdce8ff),
    new T.Color(0x9fc0ff),
    new T.Color(0xf0d79a),
  ];

  for (let i = 0; i < starCount; i++) {
    // Distribute on a shell so no star sits inside the solar system.
    const r = 90 + rand() * 120;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.55; // slight vertical flattening
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = tints[Math.floor(rand() * tints.length)]!;
    starColors[i * 3] = tint.r;
    starColors[i * 3 + 1] = tint.g;
    starColors[i * 3 + 2] = tint.b;
    starSizes[i] = 0.35 + rand() * 0.9;
  }

  const starGeo = track(new T.BufferGeometry());
  starGeo.setAttribute("position", new T.BufferAttribute(positions, 3));
  starGeo.setAttribute("color", new T.BufferAttribute(starColors, 3));
  starGeo.setAttribute("size", new T.BufferAttribute(starSizes, 1));

  const starMat = track(
    new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      fog: false,
      uniforms: {
        uTexture: { value: makeGlowTex("rgba(255,255,255,1)", "rgba(255,255,255,0)", 64) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, dprCap) },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (180.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, tex.a * 0.9);
        }
      `,
    })
  );
  starMat.vertexColors = true;

  const starsFar = new T.Points(starGeo, starMat);
  starsFar.name = "starfield";

  // Nebula sprites: two large faint additive sprites tinted ATZ navy and gold.
  const nebulaTex = makeGlowTex("rgba(255,255,255,0.5)", "rgba(255,255,255,0)", 256);
  const nebulaData: [number, number][] = [
    [0x1b2a5b, 0.14], // ATZ navy
    [0xc9a84c, 0.06], // ATZ gold — barely perceptible
  ];
  const nebulaSprites = nebulaData.map(([hex, opacity], i) => {
    const mat = track(
      new T.SpriteMaterial({
        map: nebulaTex,
        color: hex,
        transparent: true,
        opacity,
        blending: T.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    const sprite = new T.Sprite(mat);
    sprite.scale.set(240, 240, 1);
    sprite.position.set(i === 0 ? -70 : 80, i === 0 ? 40 : -50, -120);
    return sprite;
  });

  scene.add(starsFar, ...nebulaSprites);

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

  // ---- constellation links -----------------------------------------------
  // One faint additive line from the star to each planet, with a stream of
  // glow particles drifting along it — the "network" reading the brand is
  // after. Intensity is per link and eased every frame: faint at rest,
  // brighter while the pointer is over the stage, brighter still as the
  // pointer nears that planet, and fully lit when it is hovered or focused.
  const LINK_PARTICLES = lowPower ? 10 : 18;
  interface Link {
    planet: Planet;
    line: THREE.Line;
    lineMat: THREE.LineBasicMaterial;
    linePos: Float32Array;
    points: THREE.Points;
    pointMat: THREE.PointsMaterial;
    pointPos: Float32Array;
    /** Per-particle phase along the link (0 at the star, 1 at the planet). */
    phase: Float32Array;
    /** Eased 0–1 intensity. */
    glow: number;
  }
  const links: Link[] = [];
  const linkGlowTex = makeGlow(255, 255, 255);
  for (const pl of planets) {
    const brand = BRAND_LIST.find((b) => b.id === pl.key)!;
    const linePos = new Float32Array(6);
    const lineGeo = track(new T.BufferGeometry());
    lineGeo.setAttribute("position", new T.BufferAttribute(linePos, 3));
    const lineMat = track(
      new T.LineBasicMaterial({
        color: brand.accentSecondaryHex,
        transparent: true,
        opacity: 0,
        blending: T.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    const line = new T.Line(lineGeo, lineMat);
    line.raycast = () => {};
    line.frustumCulled = false;

    const pointPos = new Float32Array(LINK_PARTICLES * 3);
    const phase = new Float32Array(LINK_PARTICLES);
    for (let i = 0; i < LINK_PARTICLES; i++) phase[i] = (i + Math.random() * 0.6) / LINK_PARTICLES;
    const pointGeo = track(new T.BufferGeometry());
    pointGeo.setAttribute("position", new T.BufferAttribute(pointPos, 3));
    const pointMat = track(
      new T.PointsMaterial({
        color: brand.accentSecondaryHex,
        map: linkGlowTex,
        size: 0.55,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        blending: T.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    const points = new T.Points(pointGeo, pointMat);
    points.raycast = () => {};
    points.frustumCulled = false;

    // Children of the star group, whose local frame is the system's own —
    // so a planet's world position mapped through `worldToLocal` lands
    // exactly on the rendered body whatever the scene's scroll offset.
    sunGroup.add(line, points);
    links.push({ planet: pl, line, lineMat, linePos, points, pointMat, pointPos, phase, glow: 0 });
  }

  const linkV = new T.Vector3();
  const linkNdc = new T.Vector3();
  const updateLinks = (dt: number, elapsed: number) => {
    for (const l of links) {
      const p = l.planet;
      // Target intensity: rest → stage hover → pointer proximity → hovered.
      linkNdc.copy(p.worldPos).project(camera);
      const dx = pointer.x - linkNdc.x;
      const dy = pointer.y + linkNdc.y; // pointer y is screen-down, NDC is up
      const prox = stageHover ? Math.max(0, 1 - Math.hypot(dx, dy) / 0.7) : 0;
      const intro = introRaw(p);
      const target =
        Math.min(1, (stageHover ? 0.45 : 0.15) + prox * 0.5 + (p.hovered || p.paused ? 1 : 0)) *
        Math.min(1, Math.max(0, intro));
      l.glow += (target - l.glow) * (1 - Math.pow(0.004, dt));

      // Endpoints: just outside the star's surface to just short of the body.
      linkV.copy(p.worldPos);
      sunGroup.worldToLocal(linkV);
      const len = linkV.length() || 1;
      const ux = linkV.x / len;
      const uy = linkV.y / len;
      const uz = linkV.z / len;
      const start = SUN_RADIUS * 1.25;
      const end = len - BRANDS[p.key].bodyRadius * 1.3;
      l.linePos[0] = ux * start;
      l.linePos[1] = uy * start;
      l.linePos[2] = uz * start;
      l.linePos[3] = ux * end;
      l.linePos[4] = uy * end;
      l.linePos[5] = uz * end;
      (l.line.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

      // Particles drift star → planet; faster when lit. Reduced motion holds
      // them still.
      const speed = reducedMotion ? 0 : 0.06 + l.glow * 0.16;
      for (let i = 0; i < LINK_PARTICLES; i++) {
        let t = (l.phase[i]! + elapsed * speed) % 1;
        if (t < 0) t += 1;
        const d = start + (end - start) * t;
        // A slight sinusoidal wobble off the axis so the stream reads as
        // particles rather than beads on a wire.
        const wob = Math.sin(t * Math.PI * 3 + i) * 0.18 * (1 - t);
        l.pointPos[i * 3] = ux * d + wob * uy;
        l.pointPos[i * 3 + 1] = uy * d - wob * ux;
        l.pointPos[i * 3 + 2] = uz * d;
      }
      (l.points.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

      l.lineMat.opacity = 0.08 + l.glow * 0.6;
      l.pointMat.opacity = 0.35 + l.glow * 0.65;
      l.pointMat.size = 0.55 + l.glow * 0.4;
    }
  };

  // ---- camera + projection ----------------------------------------------

  let camDist = 22;
  const frame = () => {
    overlay.w = wrap.clientWidth || 1;
    overlay.h = wrap.clientHeight || 1;
    renderer.setSize(overlay.w, overlay.h, false);
    camera.aspect = overlay.w / overlay.h;
    camera.updateProjectionMatrix();
  };

  const applyHome = (w?: number, h?: number) => {
    const width = w || overlay.w || wrap.clientWidth || window.innerWidth;
    const height = h || overlay.h || wrap.clientHeight || window.innerHeight;
    const HALF_FOV_TAN = Math.tan((camera.fov / 2) * (Math.PI / 180));
    // Outermost orbit is 14.4 + 1.6 = 16 world units; a little headroom.
    // Tighter than before (18) so the system fills its band rather than
    // floating as a small cluster in the middle of it.
    const SYSTEM_RADIUS = 16.8;

    let dist: number;
    if (width >= 1024) {
      // Wide: copy sits on the left — size system to fit the right band.
      const bandLeft = width * 0.47;
      const bandHalf = Math.max(((width - bandLeft) / 2) * 0.9, width * 0.1);
      const heightHalf = (height / 2) * 0.84;
      const radiusPx = Math.min(bandHalf, heightHalf);
      dist = (SYSTEM_RADIUS * height) / (2 * HALF_FOV_TAN * radiusPx);
    } else {
      dist = (SYSTEM_RADIUS * height) / (HALF_FOV_TAN * Math.min(width, height) * 0.85);
    }

    dist = Math.max(16, Math.min(dist, 80));
    camDist = dist;
    const home = new T.Vector3(-0.06, 0.36, 0.93).normalize().multiplyScalar(dist);
    camera.position.copy(home);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.minDistance = Math.max(10, dist * 0.25);
      controls.maxDistance = dist * 1.8;
      controls.update();
    } else {
      camera.lookAt(0, 0, 0);
    }
  };

  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  let scrollP = 0;
  let scrollSmooth = 0;
  const applyScroll = () => {
    scrollSmooth += (scrollP - scrollSmooth) * 0.12;
    // Pull back ~18% and drift the system down as the hero leaves; a fixed
    // path rather than free camera motion, so scroll always means one thing.
    const zoom = 1 - scrollSmooth * 0.18;
    if (Math.abs(camera.zoom - zoom) > 0.0005) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
    scene.position.y = -scrollSmooth * 2.2;
  };
  const updateCamera = () => {
    applyScroll();
    if (controls) {
      controls.update();
    } else {
      camera.position.set(smooth.x * 1.2, camDist * 0.54 + smooth.y * 0.65, camDist * 0.84);
      camera.lookAt(0, 0, 0);
    }
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
      // Use the cached world position for hit-testing
      p.mesh.getWorldPosition(p.worldPos);
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
      T.MathUtils.mapLinear(s.dist, camDist * 0.7, camDist * 1.3, 1.15, 0.88),
      0.85,
      1.18
    );

    interface BodySortItem {
      type: "sun" | "planet";
      key?: BrandId;
      planet?: Planet;
      x: number;
      y: number;
      dist: number;
      scale: number;
    }

    const allBodies: BodySortItem[] = [
      { type: "sun", x: s.x, y: s.y, dist: s.dist, scale: sScale },
      ...planets.map((p) => {
        // World position was refreshed by the tick loop — use it directly
        const pr = projectToScreen(p.mesh);
        const scale = T.MathUtils.clamp(
          T.MathUtils.mapLinear(pr.dist, camDist * 0.65, camDist * 1.35, 1.25, 0.72),
          0.72,
          1.28
        );
        return { type: "planet" as const, key: p.key, planet: p, ...pr, scale };
      }),
    ];

    // Farthest first, nearest last (highest z-index)
    allBodies.sort((a, b) => b.dist - a.dist);

    const map = new Map<BrandId, ScreenPoint>();
    let sunPoint: ScreenPoint = { x: s.x, y: s.y, scale: sScale, opacity: 1, z: 4 };

    allBodies.forEach((item, idx) => {
      const zIndex = (idx + 1) * 2;
      if (item.type === "sun") {
        sunPoint = { x: item.x, y: item.y, scale: item.scale, opacity: 1, z: zIndex };
      } else if (item.key && item.planet) {
        const intro = introRaw(item.planet);
        const opacity =
          T.MathUtils.clamp(
            T.MathUtils.mapLinear(item.dist, camDist * 0.65, camDist * 1.35, 1, 0.68),
            0.65,
            1
          ) * intro;
        map.set(item.key, {
          x: item.x,
          y: item.y,
          scale: item.scale,
          opacity,
          z: zIndex,
        });
      }
    });

    onFrame({
      sun: sunPoint,
      planets: map,
    });
  };

  // ---- loop --------------------------------------------------------------

  let raf = 0;
  let lastT = 0;
  // Frame-time governor. Device signals pick a starting tier; this watches
  // what actually happens and steps the pixel ratio down (never up — that
  // oscillates) when the average frame runs long. Resolution is the one lever
  // that cuts GPU cost without touching the scene.
  let dpr = renderer.getPixelRatio();
  let frameAcc = 0;
  let frameN = 0;
  const governFrameRate = (dt: number) => {
    frameAcc += dt;
    frameN += 1;
    if (frameN < 90) return;
    const avg = frameAcc / frameN;
    frameAcc = 0;
    frameN = 0;
    if (avg > 1 / 34 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      frame();
    }
  };
  let playing = !reducedMotion;
  let inView = true;
  let stageHover = false;
  let lastHover: BodyId | null = null;

  const applyHover = () => {
    // Only while the pointer is over the stage. The pointer starts at NDC
    // (0, 0) — the centre, i.e. the star — so without this gate the sun read
    // as hovered, tooltip and all, before the visitor had touched anything.
    const hit = stageHover ? hitTest() : null;
    for (const p of planets) p.hovered = p.key === hit;
    if (hit !== lastHover) {
      lastHover = hit;
      onHoverChange(hit);
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
    governFrameRate(dt);

    const elapsed = t * 0.001;

    for (const p of planets) {
      p.introT = Math.min(1, p.introT + dt / 0.7);
      const raw = introRaw(p);
      const introScale = raw >= 1 ? 1 : Math.max(easeOutBack(raw), 0.001);

      // Time dilation: hovering or focusing a planet brings it to a full stop
      const target = p.hovered || p.paused ? 0 : stageHover ? 0.1 : 1;
      p.slow += (target - p.slow) * (1 - Math.pow(0.002, dt));

      // Pivot-based orbit rotation (matches planets.ts from the reference repo)
      p.pivot.rotation.y += p.speed * dt * p.slow * (reducedMotion ? 0.15 : 1);

      // Axial rotation of the planet sphere itself
      p.mesh.rotation.y = elapsed * 0.18 * (reducedMotion ? 0.2 : 1);

      // Feed shader uniforms
      p.mat.atzUniforms.uTime.value = reducedMotion ? 0 : elapsed;

      // Ease highlight toward hovered state
      const targetHighlight = p.hovered ? 1 : 0;
      p.highlight += (targetHighlight - p.highlight) * (1 - Math.pow(0.001, dt));
      p.mat.atzUniforms.uHighlight.value = p.highlight;

      // Hover scale-up applied to the mesh itself
      const targetScale = introScale * (1 + p.highlight * 0.14);
      const cs = p.mesh.scale.x;
      const ns = cs + (targetScale - cs) * 0.18;
      p.mesh.scale.setScalar(ns);

      // Badge scale eases in sync
      const bBodyR = BRAND_LIST.find((b) => b.id === p.key)?.bodyRadius ?? 1;
      const badgeTarget = bBodyR * 1.7 * (1 + p.highlight * 0.14);
      const bs = p.badge.scale.x;
      const bns = bs + (badgeTarget - bs) * 0.18;
      p.badge.scale.setScalar(bns);

      // Refresh world position for emitFrame projection
      p.mesh.getWorldPosition(p.worldPos);
    }

    updateLinks(dt, elapsed);

    // Sun: slow axial spin + granulation time + medallion facing camera
    sunMesh.rotation.y = elapsed * (reducedMotion ? 0.012 : 0.03);
    const sunShader = sunCoreMat.userData.shader as
      { uniforms: Record<string, { value: number }> } | undefined;
    if (sunShader) sunShader.uniforms.uTime.value = reducedMotion ? 0 : elapsed;

    // Park the medallion on the sphere's camera-facing point each frame
    const cameraDir = new T.Vector3();
    cameraDir.subVectors(camera.position, sunGroup.position).normalize();
    medallion.position.copy(cameraDir).multiplyScalar(SUN_RADIUS * 1.005);
    medallion.quaternion.copy(camera.quaternion);

    // Update corona pulse uniforms
    coronaInnerMat.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
    coronaOuterMat.uniforms.uTime.value = reducedMotion ? 0 : elapsed;

    starsFar.rotation.y += dt * 0.005;

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
    applyHome();
    renderer.render(scene, camera);
    emitFrame();
  });
  ro.observe(wrap);

  frame();
  applyHome();
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
    /** Frame the solar system nicely within the available viewport band. */
    applyHome,
    setScrollProgress(progress) {
      scrollP = Math.max(0, Math.min(1, progress));
      // Paused or reduced-motion scenes have no loop running; settle the
      // camera in one step and draw the frame by hand.
      if (!raf) {
        scrollSmooth = scrollP;
        updateCamera();
        renderer.render(scene, camera);
        emitFrame();
      }
    },
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      controls?.dispose();
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

/** Sun radius 56 + chip radius 32 + breathing room. */
const MIN_STATIC_RADIUS = 130;

export function staticLayout(width: number, height: number): OrbitFrame {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(MIN_STATIC_RADIUS, Math.min(width * 0.38, height * 0.38, 210));

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
