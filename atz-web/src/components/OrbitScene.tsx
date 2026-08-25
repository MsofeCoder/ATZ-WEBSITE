"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
} from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";

const GOLD = "#C9A84C";

export type CompanyId = "md" | "ai" | "mc";

const SATELLITES: Array<{
  id: CompanyId;
  color: string;
  radius: number;
  speed: number;
  angle: number;
  size: number;
  tilt: [number, number, number];
}> = [
  { id: "md", color: "#E91E8C", radius: 2.1, speed: 0.5,  angle: 0.3, size: 0.26, tilt: [1.15, 0.25, 0.12] },
  { id: "ai", color: "#00BCD4", radius: 3.1, speed: -0.34, angle: 2.2, size: 0.30, tilt: [1.05, -0.35, -0.18] },
  { id: "mc", color: "#69F0AE", radius: 4.1, speed: 0.24, angle: 4.3, size: 0.34, tilt: [1.25, 0.55, 0.22] },
];

/* ------------------------------------------------------------------ */
/* Global orbit-speed context — hover slows the whole system          */
/* ------------------------------------------------------------------ */
const speedState = { current: 1 }; // 1 = normal, ~0.15 = hovered (lerped)

function Satellite({
  sat,
  onSelect,
}: {
  sat: (typeof SATELLITES)[number];
  onSelect: (id: CompanyId) => void;
}) {
  const pivot = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const angleRef = useRef(sat.angle);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    // lerp global speed for buttery slow-down/speed-up
    speedState.current = THREE.MathUtils.lerp(
      speedState.current,
      hovered ? 0.15 : 1,
      1 - Math.pow(0.001, delta)
    );
    angleRef.current += delta * sat.speed * speedState.current;

    const g = pivot.current;
    if (!g) return;
    g.position.set(
      Math.cos(angleRef.current) * sat.radius,
      Math.sin(angleRef.current) * sat.radius,
      0
    );
  });

  // GSAP scale + glow on hover state change
  useEffect(() => {
    if (meshRef.current) {
      gsap.to(meshRef.current.scale, {
        x: hovered ? 1.5 : 1,
        y: hovered ? 1.5 : 1,
        z: hovered ? 1.5 : 1,
        duration: 0.45,
        ease: "elastic.out(1, 0.55)",
      });
    }
    if (haloMat.current) {
      gsap.to(haloMat.current, {
        opacity: hovered ? 0.45 : 0.15,
        duration: 0.35,
        ease: "power2.out",
      });
    }
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);

  return (
    <group rotation={sat.tilt}>
      <mesh>
        <torusGeometry args={[sat.radius, 0.008, 8, 160]} />
        <meshBasicMaterial color={sat.color} transparent opacity={0.35} />
      </mesh>
      <group ref={pivot}>
        <group>
          {/* Invisible enlarged hit box — bigger tap target for mobile */}
          <mesh
            visible={false}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              console.log(`[ATZ] satellite clicked: ${sat.id.toUpperCase()}`);
              onSelect(sat.id);
            }}
          >
            <sphereGeometry args={[sat.size * 2.2, 12, 12]} />
            <meshBasicMaterial />
          </mesh>
          <mesh ref={meshRef}>
            <sphereGeometry args={[sat.size, 24, 24]} />
            <meshStandardMaterial
              color={sat.color}
              emissive={sat.color}
              emissiveIntensity={hovered ? 1.6 : 0.7}
              roughness={0.3}
            />
          </mesh>
          <mesh ref={haloRef}>
            <sphereGeometry args={[sat.size * 1.6, 16, 16]} />
            <meshBasicMaterial ref={haloMat} color={sat.color} transparent opacity={0.15} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Core                                                                */
/* ------------------------------------------------------------------ */
function AtzCore() {
  const label = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "#E4CE8F";
    ctx.font = "900 92px Montserrat, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ATZ", 128, 132);
    return new THREE.CanvasTexture(c);
  }, []);

  const core = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (core.current) core.current.rotation.y += delta * 0.15;
    const t = state.clock.getElapsedTime();
    core.current?.scale.setScalar(1 + 0.02 * Math.sin(t * 1.4));
  });

  return (
    <group ref={core}>
      <mesh>
        <sphereGeometry args={[1.25, 48, 48]} />
        <meshStandardMaterial color="#1A2947" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0, 1.201]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={label} transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.42, 32, 32]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      {/* equator band — emissive so bloom catches it */}
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.55, 0.02, 8, 120]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Mouse parallax — lerped whole-system rotation                       */
/* ------------------------------------------------------------------ */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientY / window.innerHeight - 0.5) * 0.2;  // ±0.1 rad
      target.current.y = (e.clientX / window.innerWidth - 0.5) * 0.2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, target.current.x, 1 - Math.pow(0.002, delta));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target.current.y, 1 - Math.pow(0.002, delta));
  });

  return <group ref={group}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* Scroll-driven camera drift                                          */
/* ------------------------------------------------------------------ */
function ScrollCamera() {
  const { camera } = useThree();
  const persp = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    const base = { z: 11, y: 0.4, fov: 45 };
    const onScroll = () => {
      const hero = document.querySelector("section");
      if (!hero) return;
      const progress = THREE.MathUtils.clamp(
        window.scrollY / (hero.getBoundingClientRect().height || 1),
        0,
        1
      );
      camera.position.z = base.z + progress * 4;   // zoom out
      camera.position.y = base.y + progress * 2;   // drift up
      persp.fov = base.fov + progress * 6;         // widen slightly
      persp.updateProjectionMatrix();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [camera]);

  return null;
}

/* Smooth scroll-linked variant using GSAP ScrollTrigger when available */
let stRegistered = false;
async function ensureScrollTrigger() {
  if (stRegistered) return true;
  try {
    const [{ default: GSAP }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    GSAP.registerPlugin(ScrollTrigger);
    stRegistered = true;
    return true;
  } catch {
    return false;
  }
}

function ScrollTriggerCamera() {
  const { camera } = useThree();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureScrollTrigger().then(setReady);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let trigger: { kill: () => void } | null = null;
    let killed = false;

    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (killed) return;
      const hero = document.querySelector("section");
      const dist = hero ? hero.getBoundingClientRect().height : window.innerHeight;
      const tween = gsap.to(camera.position, {
        z: 16,
        y: 3,
        ease: "none",
        scrollTrigger: {
          trigger: "section",
          start: "top top",
          end: () => `+=${dist}`,
          scrub: 1.2,           // smooth catch-up
        },
      });
      tween.scrollTrigger && (trigger = tween.scrollTrigger as unknown as { kill: () => void });
    });

    return () => {
      killed = true;
      trigger?.kill();
    };
  }, [ready, camera]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Starfield                                                           */
/* ------------------------------------------------------------------ */
function Starfield({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 2] = -6 - Math.random() * 10;
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#8992A3" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Scene root                                                          */
/* ------------------------------------------------------------------ */
export default function OrbitScene({ onSelect }: { onSelect?: (id: CompanyId) => void }) {
  const handleSelect = (id: CompanyId) => {
    console.log(`[ATZ] route intent → /#${id === "md" ? "ecosystem" : id}`);
    onSelect?.(id);
  };

  return (
    <Canvas
      camera={{ position: [0, 0.4, 11], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.65} />
      <pointLight position={[6, 6, 6]} intensity={60} />
      <pointLight position={[-6, -4, 4]} intensity={25} color={GOLD} />

      <ParallaxRig>
        <AtzCore />
        {SATELLITES.map((s) => (
          <Satellite key={s.id} sat={s} onSelect={handleSelect} />
        ))}
      </ParallaxRig>

      <Starfield />

      {/* Selective moody bloom — high threshold keeps navy core from graying out */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.25}
          mipmapBlur
        />
      </EffectComposer>

      <ScrollTriggerCamera />
    </Canvas>
  );
}
