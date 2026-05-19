import { useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Billboard, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import {
  Pause,
  Play,
  Maximize2,
  Minimize2,
  Gauge,
  Thermometer,
  Ruler,
  Calendar,
} from "lucide-react";
import * as THREE from "three";
import { createPlanetMaterial, PlanetKind } from "./shaders/planetMaterials";

interface PlanetDef {
  name: string;
  kind: PlanetKind;
  distance: number;
  size: number;
  orbitSpeed: number;
  rotationSpeed: number;
  tilt?: number;
  rings?: boolean;
  hasMoon?: boolean;
}

const PLANETS: PlanetDef[] = [
  { name: "Mercúrio", kind: "mercury", distance: 4, size: 0.22, orbitSpeed: 0.48, rotationSpeed: 0.04 },
  { name: "Vênus", kind: "venus", distance: 5.5, size: 0.36, orbitSpeed: 0.35, rotationSpeed: -0.02 },
  { name: "Terra", kind: "earth", distance: 7.2, size: 0.4, orbitSpeed: 0.29, rotationSpeed: 0.4, tilt: 0.41, hasMoon: true },
  { name: "Marte", kind: "mars", distance: 9, size: 0.3, orbitSpeed: 0.24, rotationSpeed: 0.38, tilt: 0.44 },
  { name: "Júpiter", kind: "jupiter", distance: 12.5, size: 1.1, orbitSpeed: 0.13, rotationSpeed: 0.9, tilt: 0.05 },
  { name: "Saturno", kind: "saturn", distance: 16, size: 0.95, orbitSpeed: 0.097, rotationSpeed: 0.85, tilt: 0.47, rings: true },
  { name: "Urano", kind: "uranus", distance: 19.5, size: 0.55, orbitSpeed: 0.068, rotationSpeed: 0.5, tilt: 1.7 },
  { name: "Netuno", kind: "neptune", distance: 22.5, size: 0.53, orbitSpeed: 0.054, rotationSpeed: 0.52, tilt: 0.49 },
];

const OrbitRing = ({ radius }: { radius: number }) => {
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      arr.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return arr;
  }, [radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#6b7cff",
        transparent: true,
        opacity: 0.18,
      }),
    [],
  );

  return <primitive object={new THREE.LineLoop(geometry, material)} />;
};

const Sun = () => {
  const material = useMemo(() => createPlanetMaterial("sun"), []);
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.06;
    if (haloRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
      haloRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <pointLight intensity={3} distance={120} decay={1.2} color="#fff1c2" />
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[1.6, 64, 64]} />
      </mesh>
      {/* Glow halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.85, 32, 32]} />
        <meshBasicMaterial color="#ffd96b" transparent opacity={0.18} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial color="#ff9d3a" transparent opacity={0.07} />
      </mesh>
    </group>
  );
};

const Moon = ({ parentSize }: { parentSize: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const material = useMemo(() => createPlanetMaterial("moon"), []);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.9;
  });
  return (
    <group ref={groupRef}>
      <mesh position={[parentSize + 0.35, 0, 0]} material={material}>
        <sphereGeometry args={[parentSize * 0.27, 24, 24]} />
      </mesh>
    </group>
  );
};

const SaturnRings = ({ size }: { size: number }) => {
  const ringRef = useRef<THREE.Group>(null);
  // Build a few rings of slightly different colors/opacities to feel layered
  const rings = useMemo(
    () => [
      { inner: 1.35, outer: 1.6, color: "#f3dba8", opacity: 0.65 },
      { inner: 1.62, outer: 1.95, color: "#e0b87a", opacity: 0.5 },
      { inner: 1.98, outer: 2.15, color: "#caa066", opacity: 0.35 },
      { inner: 2.18, outer: 2.45, color: "#b88a55", opacity: 0.25 },
    ],
    [],
  );
  return (
    <group ref={ringRef} rotation={[Math.PI / 2.3, 0, 0.15]}>
      {rings.map((r, i) => (
        <mesh key={i}>
          <ringGeometry args={[size * r.inner, size * r.outer, 128]} />
          <meshBasicMaterial color={r.color} transparent opacity={r.opacity} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

const Planet = ({
  def,
  speedMult,
  showLabels,
  onSelect,
  isSelected,
}: {
  def: PlanetDef;
  speedMult: number;
  showLabels: boolean;
  onSelect: (name: string) => void;
  isSelected: boolean;
}) => {
  const orbitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createPlanetMaterial(def.kind), [def.kind]);

  // Random starting angle so planets aren't lined up
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);
  const tRef = useRef(startAngle);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    tRef.current += delta * def.orbitSpeed * speedMult * 0.5;
    if (orbitRef.current) {
      orbitRef.current.position.x = Math.cos(tRef.current) * def.distance;
      orbitRef.current.position.z = Math.sin(tRef.current) * def.distance;
    }
    if (spinRef.current) {
      spinRef.current.rotation.y += delta * def.rotationSpeed * speedMult * 0.5;
    }
  });

  return (
    <group ref={orbitRef} rotation={[0, 0, def.tilt ?? 0]}>
      <mesh
        ref={spinRef}
        material={material}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(def.name);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[def.size, 48, 48]} />
      </mesh>

      {def.rings && <SaturnRings size={def.size} />}
      {def.hasMoon && <Moon parentSize={def.size} />}

      {/* Selection halo */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[def.size * 1.4, def.size * 1.5, 64]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabels && (
        <Billboard position={[0, def.size + 0.55, 0]}>
          <Html center distanceFactor={10} zIndexRange={[10, 0]}>
            <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-[10px] tracking-[0.18em] uppercase text-white/85 pointer-events-none whitespace-nowrap">
              {def.name}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
};

const AsteroidBelt = ({ count = 600, inner = 10, outer = 11.5 }: { count?: number; inner?: number; outer?: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = inner + Math.random() * (outer - inner);
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count, inner, outer]);

  useFrame((_, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#b6a481" size={0.06} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
};

const SolarSystemScene = ({
  speedMult,
  showLabels,
  showOrbits,
  selected,
  setSelected,
}: {
  speedMult: number;
  showLabels: boolean;
  showOrbits: boolean;
  selected: string | null;
  setSelected: (n: string | null) => void;
}) => {
  return (
    <>
      <ambientLight intensity={0.15} />
      <Stars radius={300} depth={80} count={6000} factor={6} saturation={0.3} fade speed={0.4} />

      <Sun />

      {showOrbits && PLANETS.map((p) => <OrbitRing key={`o-${p.name}`} radius={p.distance} />)}

      <AsteroidBelt />

      {PLANETS.map((p) => (
        <Planet
          key={p.name}
          def={p}
          speedMult={speedMult}
          showLabels={showLabels}
          isSelected={selected === p.name}
          onSelect={(n) => setSelected(n === selected ? null : n)}
        />
      ))}

      <OrbitControls
        enableZoom
        enablePan
        autoRotate
        autoRotateSpeed={0.12}
        minDistance={5}
        maxDistance={70}
      />

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.45} luminanceSmoothing={0.5} mipmapBlur />
      </EffectComposer>
    </>
  );
};

const QUICK_FACTS: Record<string, { temp: string; mass: string; orbital: string; type: string }> = {
  Sol: { temp: "5.778 K", mass: "1.989×10³⁰ kg", orbital: "—", type: "Estrela Anã Amarela" },
  Mercúrio: { temp: "440 K", mass: "3.30×10²³ kg", orbital: "88 dias", type: "Planeta Rochoso" },
  Vênus: { temp: "737 K", mass: "4.87×10²⁴ kg", orbital: "225 dias", type: "Planeta Rochoso" },
  Terra: { temp: "288 K", mass: "5.97×10²⁴ kg", orbital: "365.25 dias", type: "Planeta Rochoso" },
  Marte: { temp: "208 K", mass: "6.39×10²³ kg", orbital: "687 dias", type: "Planeta Rochoso" },
  Júpiter: { temp: "165 K", mass: "1.90×10²⁷ kg", orbital: "11.9 anos", type: "Gigante Gasoso" },
  Saturno: { temp: "134 K", mass: "5.68×10²⁶ kg", orbital: "29.4 anos", type: "Gigante Gasoso" },
  Urano: { temp: "76 K", mass: "8.68×10²⁵ kg", orbital: "84 anos", type: "Gigante de Gelo" },
  Netuno: { temp: "72 K", mass: "1.02×10²⁶ kg", orbital: "165 anos", type: "Gigante de Gelo" },
};

export const SolarSystem = () => {
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  const speedMult = paused ? 0 : speed;
  const facts = selected ? QUICK_FACTS[selected] : null;

  return (
    <section className="min-h-screen pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 sm:px-6"
      >
        <div className="text-center mb-8">
          <span className="section-label">Capítulo I</span>
          <h2 className="font-display text-4xl md:text-6xl font-black text-gradient-solar glow-text">
            Sistema Solar
          </h2>
          <p className="text-blue-100/70 mt-3 max-w-2xl mx-auto">
            Oito mundos orbitam uma estrela amarela. Clique em qualquer planeta para destacá-lo.
          </p>
        </div>

        <div
          ref={containerRef}
          className={`relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/60 to-indigo-950/40 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.4)] ${
            fullscreen ? "h-screen rounded-none" : "h-[60vh] min-h-[480px]"
          }`}
        >
          <Canvas
            camera={{ position: [0, 14, 28], fov: 55 }}
            dpr={[1, 2]}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <SolarSystemScene
              speedMult={speedMult}
              showLabels={showLabels}
              showOrbits={showOrbits}
              selected={selected}
              setSelected={setSelected}
            />
          </Canvas>

          {/* Top-right controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setPaused((p) => !p)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 transition"
              aria-label={paused ? "Retomar" : "Pausar"}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 transition"
              aria-label="Tela cheia"
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
              <Gauge size={14} className="text-white/70" />
              <span className="text-xs text-white/70">Velocidade</span>
              <input
                type="range"
                min={0.1}
                max={4}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="accent-fuchsia-400 w-28"
              />
              <span className="text-xs font-mono text-white/80 w-8 text-right">{speed.toFixed(1)}x</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowOrbits((v) => !v)}
                className={`text-xs px-3 py-2 rounded-xl border transition ${
                  showOrbits ? "bg-white/15 border-white/25 text-white" : "bg-black/40 border-white/10 text-white/60"
                }`}
              >
                Órbitas
              </button>
              <button
                onClick={() => setShowLabels((v) => !v)}
                className={`text-xs px-3 py-2 rounded-xl border transition ${
                  showLabels ? "bg-white/15 border-white/25 text-white" : "bg-black/40 border-white/10 text-white/60"
                }`}
              >
                Nomes
              </button>
            </div>
          </div>

          {/* Selected info card */}
          {facts && selected && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-3 left-3 w-64 glass-card p-4 pointer-events-none"
            >
              <div className="text-xs text-white/50 uppercase tracking-widest">Selecionado</div>
              <div className="font-display text-2xl font-bold text-gradient-solar mb-3">{selected}</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-white/60">Tipo</span><span className="text-white/90">{facts.type}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Temperatura</span><span className="text-white/90">{facts.temp}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Massa</span><span className="text-white/90">{facts.mass}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Órbita</span><span className="text-white/90">{facts.orbital}</span></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick facts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Ruler, label: "Diâmetro do Sistema", value: "~9 bi km", color: "from-amber-300 to-orange-500" },
            { icon: Thermometer, label: "Sol — Núcleo", value: "15.000.000 K", color: "from-rose-400 to-red-500" },
            { icon: Calendar, label: "Idade", value: "4.6 bi anos", color: "from-sky-400 to-indigo-500" },
            { icon: Gauge, label: "Vel. Júpiter", value: "13.07 km/s", color: "from-emerald-400 to-teal-500" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              className="glass-card glass-card-glow p-4"
            >
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} mb-2`}>
                <s.icon size={15} className="text-white" />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">{s.label}</div>
              <div className="font-display text-lg font-bold text-white">{s.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
