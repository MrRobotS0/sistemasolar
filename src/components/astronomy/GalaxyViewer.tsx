import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import * as THREE from "three";

type GalaxyType = "spiral" | "elliptical" | "irregular";

interface GalaxyParams {
  type: GalaxyType;
  count?: number;
}

const buildGalaxy = ({ type, count = 9000 }: GalaxyParams) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const insideColor = new THREE.Color("#ffd27a"); // hot core
  const midColor = new THREE.Color("#c084fc"); // mid violet
  const outsideColor = new THREE.Color("#3b82f6"); // cold outer

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    if (type === "spiral") {
      const radius = Math.pow(Math.random(), 0.6) * 8;
      const branchCount = 4;
      const branchAngle = ((i % branchCount) / branchCount) * Math.PI * 2;
      const spin = radius * 0.45;
      // Barred core: between r=0 and r=1.2 align along the bar axis
      let barOffset = 0;
      if (radius < 1.2) {
        const barLen = 1.2;
        const barX = (Math.random() - 0.5) * barLen * 2;
        const barZ = (Math.random() - 0.5) * 0.4;
        const barY = (Math.random() - 0.5) * 0.2;
        positions[i3] = barX;
        positions[i3 + 1] = barY;
        positions[i3 + 2] = barZ;
        barOffset = 1; // marker that we already wrote
      }
      if (!barOffset) {
        const randomX = (Math.random() - 0.5) * 0.35 * (radius / 8 + 0.2);
        const randomY = (Math.random() - 0.5) * 0.25 * (radius / 8 + 0.2);
        const randomZ = (Math.random() - 0.5) * 0.35 * (radius / 8 + 0.2);
        positions[i3] = Math.cos(branchAngle + spin) * radius + randomX;
        positions[i3 + 1] = randomY * (1 - radius / 10);
        positions[i3 + 2] = Math.sin(branchAngle + spin) * radius + randomZ;
      }

      // Color: core hot -> mid violet -> outer blue
      const mixed = new THREE.Color();
      const t = radius / 8;
      if (t < 0.5) {
        mixed.copy(insideColor).lerp(midColor, t * 2);
      } else {
        mixed.copy(midColor).lerp(outsideColor, (t - 0.5) * 2);
      }
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
      sizes[i] = radius < 0.8 ? 0.18 : 0.06 + Math.random() * 0.05;
    } else if (type === "elliptical") {
      const phi = Math.random() * Math.PI * 2;
      const cosTheta = Math.random() * 2 - 1;
      const theta = Math.acos(cosTheta);
      const radius = Math.pow(Math.random(), 0.5) * 7;

      positions[i3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi) * 0.65;
      positions[i3 + 2] = radius * Math.cos(theta);

      const mixed = new THREE.Color();
      const t = radius / 7;
      mixed.copy(new THREE.Color("#ffeec2")).lerp(new THREE.Color("#fb923c"), t).lerp(new THREE.Color("#7c2d12"), t * 0.6);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
      sizes[i] = radius < 0.8 ? 0.15 : 0.05 + Math.random() * 0.04;
    } else {
      const r = Math.pow(Math.random(), 0.7) * 7;
      const phi = Math.random() * Math.PI * 2;
      const theta = (Math.random() - 0.5) * Math.PI;
      positions[i3] = r * Math.cos(phi) + (Math.random() - 0.5) * 2.5;
      positions[i3 + 1] = r * Math.sin(theta) * 0.5 + (Math.random() - 0.5) * 1.5;
      positions[i3 + 2] = r * Math.sin(phi) + (Math.random() - 0.5) * 2.5;

      const mixed = new THREE.Color();
      const palette = [
        new THREE.Color("#22d3ee"),
        new THREE.Color("#a855f7"),
        new THREE.Color("#f472b6"),
        new THREE.Color("#fef08a"),
      ];
      mixed.copy(palette[Math.floor(Math.random() * palette.length)]);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
      sizes[i] = 0.05 + Math.random() * 0.08;
    }
  }

  return { positions, colors, sizes };
};

const Galaxy = ({
  type,
  position,
  rotation,
  count,
}: {
  type: GalaxyType;
  position: [number, number, number];
  rotation?: [number, number, number];
  count?: number;
}) => {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => buildGalaxy({ type, count }), [type, count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * (type === "spiral" ? 0.1 : type === "elliptical" ? 0.05 : 0.07);
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Bright core glow */}
      {type !== "irregular" && (
        <mesh>
          <sphereGeometry args={[0.4, 24, 24]} />
          <meshBasicMaterial color="#fff6d2" transparent opacity={0.95} />
        </mesh>
      )}
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.08}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

const GALAXIES = [
  {
    type: "spiral" as const,
    name: "Galáxia Espiral",
    badge: "from-amber-300 to-fuchsia-500",
    description: "Galáxias com braços espirais bem definidos, como nossa Via Láctea.",
    characteristics: [
      "Braços espirais contendo estrelas jovens",
      "Disco galáctico achatado",
      "Bulbo central com estrelas mais velhas",
      "Aproximadamente 60% das galáxias observadas",
    ],
    examples: ["Via Láctea", "Andrômeda", "Galáxia do Triângulo"],
    cameraPos: [0, 4, 9] as [number, number, number],
    rotation: [-0.3, 0, 0] as [number, number, number],
  },
  {
    type: "elliptical" as const,
    name: "Galáxia Elíptica",
    badge: "from-amber-200 to-orange-500",
    description: "Galáxias de forma oval com distribuição suave de estrelas.",
    characteristics: [
      "Forma elíptica ou esférica",
      "Pouco gás e poeira interestelar",
      "Estrelas principalmente velhas e vermelhas",
      "Podem ser gigantescas ou anãs",
    ],
    examples: ["M87", "IC 1101", "NGC 4889"],
    cameraPos: [0, 0, 12] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    type: "irregular" as const,
    name: "Galáxia Irregular",
    badge: "from-cyan-300 to-purple-500",
    description: "Galáxias sem forma definida, geralmente pequenas.",
    characteristics: [
      "Sem estrutura espiral ou elíptica clara",
      "Rica em gás e formação estelar",
      "Geralmente menores que espirais",
      "Podem resultar de interações gravitacionais",
    ],
    examples: ["Nuvens de Magalhães", "IC 10", "NGC 1427A"],
    cameraPos: [0, 0, 12] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
];

const GalaxyCanvas = ({ type, cameraPos, rotation }: { type: GalaxyType; cameraPos: [number, number, number]; rotation: [number, number, number] }) => (
  <Canvas camera={{ position: cameraPos, fov: 55 }} dpr={[1, 2]}>
    <ambientLight intensity={0.3} />
    <Stars radius={50} depth={30} count={800} factor={3} saturation={0.2} fade />
    <Galaxy type={type} position={[0, 0, 0]} rotation={rotation} count={9000} />
    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
    <EffectComposer>
      <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.5} mipmapBlur />
    </EffectComposer>
  </Canvas>
);

export const GalaxyViewer = () => {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 sm:px-6"
      >
        <div className="text-center mb-10">
          <span className="section-label">Capítulo IV</span>
          <h2 className="font-display text-4xl md:text-6xl font-black text-gradient-galaxy glow-text">
            Tipos de Galáxias
          </h2>
          <p className="text-blue-100/70 mt-3 max-w-2xl mx-auto">
            A taxonomia visual de Hubble — três formas, bilhões de estrelas em cada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {GALAXIES.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="glass-card glass-card-glow overflow-hidden"
            >
              <div className="h-72 relative">
                <GalaxyCanvas type={g.type} cameraPos={g.cameraPos} rotation={g.rotation} />
                <div className="absolute top-3 left-3">
                  <span className={`inline-block text-[10px] tracking-[0.3em] uppercase px-2.5 py-1 rounded-full bg-gradient-to-r ${g.badge} text-white font-semibold shadow-lg`}>
                    {g.type}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl font-bold text-white mb-2">{g.name}</h3>
                <p className="text-sm text-white/70 mb-4 leading-relaxed">{g.description}</p>

                <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Características</h4>
                <ul className="space-y-1.5 mb-5">
                  {g.characteristics.map((c) => (
                    <li key={c} className="text-xs text-white/70 flex items-start gap-2">
                      <span className={`mt-1.5 h-1 w-1 rounded-full bg-gradient-to-r ${g.badge}`} />
                      {c}
                    </li>
                  ))}
                </ul>

                <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Exemplos</h4>
                <div className="flex flex-wrap gap-1.5">
                  {g.examples.map((e) => (
                    <span key={e} className="text-xs bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-full">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10 glass-card glass-card-glow p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-display text-2xl md:text-3xl font-bold text-gradient-aurora">Nossa galáxia — Via Láctea</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/80 leading-relaxed mb-4">
                A Via Láctea é uma galáxia espiral barrada com aproximadamente 100–400 bilhões de estrelas.
                Nosso Sistema Solar está localizado em um dos braços espirais, a cerca de 26.000 anos-luz do centro galáctico.
              </p>
              <ul className="space-y-2">
                {[
                  { label: "Diâmetro", value: "~100.000 anos-luz", c: "from-cyan-300 to-sky-500" },
                  { label: "Espessura", value: "~1.000 anos-luz", c: "from-fuchsia-300 to-purple-500" },
                  { label: "Massa", value: "~1.5 trilhões de M☉", c: "from-amber-300 to-rose-500" },
                ].map((m) => (
                  <li key={m.label} className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${m.c}`} />
                      {m.label}
                    </div>
                    <span className="text-sm font-mono text-white">{m.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-3">Estrutura</h4>
              <ul className="space-y-2">
                {[
                  { c: "bg-amber-400", t: "Centro galáctico com buraco negro supermassivo (Sgr A*)" },
                  { c: "bg-sky-400", t: "Braços: Perseus, Scutum-Centaurus, Sagittarius, Norma" },
                  { c: "bg-emerald-400", t: "Halo galáctico permeado por matéria escura" },
                ].map((s) => (
                  <li key={s.t} className="text-sm text-white/75 flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${s.c}`} />
                    {s.t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
