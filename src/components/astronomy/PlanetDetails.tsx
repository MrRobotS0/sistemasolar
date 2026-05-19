import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  Thermometer,
  Ruler,
  Weight,
  Moon as MoonIcon,
  Calendar,
  Sparkles,
  Globe2,
} from "lucide-react";
import * as THREE from "three";
import { createPlanetMaterial, planetHex, PlanetKind } from "./shaders/planetMaterials";

interface PlanetInfo {
  name: string;
  kind: PlanetKind;
  size: number;
  tilt: number;
  rings?: boolean;
  distance: string;
  diameter: string;
  mass: string;
  temperature: string;
  moons: number;
  orbitalPeriod: string;
  composition: string;
  facts: string[];
}

const PLANETS: PlanetInfo[] = [
  {
    name: "Mercúrio",
    kind: "mercury",
    size: 0.9,
    tilt: 0.03,
    distance: "57.9 milhões km",
    diameter: "4.879 km",
    mass: "3.301 × 10²³ kg",
    temperature: "167°C (dia) / -183°C (noite)",
    moons: 0,
    orbitalPeriod: "88 dias terrestres",
    composition: "Núcleo de ferro, manto rochoso",
    facts: [
      "O planeta mais próximo do Sol",
      "Não possui atmosfera significativa",
      "Tem crateras similares à Lua",
      "Um dia em Mercúrio dura 176 dias terrestres",
    ],
  },
  {
    name: "Vênus",
    kind: "venus",
    size: 1.05,
    tilt: 3.09,
    distance: "108.2 milhões km",
    diameter: "12.104 km",
    mass: "4.867 × 10²⁴ kg",
    temperature: "462°C (superfície)",
    moons: 0,
    orbitalPeriod: "225 dias terrestres",
    composition: "Atmosfera densa de CO₂, superfície rochosa",
    facts: [
      "O planeta mais quente do Sistema Solar",
      "Atmosfera extremamente densa",
      "Rotação retrógrada",
      "Pressão atmosférica 90× maior que a Terra",
    ],
  },
  {
    name: "Terra",
    kind: "earth",
    size: 1.1,
    tilt: 0.41,
    distance: "149.6 milhões km",
    diameter: "12.756 km",
    mass: "5.972 × 10²⁴ kg",
    temperature: "15°C (média global)",
    moons: 1,
    orbitalPeriod: "365.25 dias",
    composition: "Oceanos de água, atmosfera de N₂ e O₂",
    facts: [
      "O único planeta conhecido com vida",
      "71% da superfície coberta por água",
      "Atmosfera protetora",
      "Campo magnético forte",
    ],
  },
  {
    name: "Marte",
    kind: "mars",
    size: 0.95,
    tilt: 0.44,
    distance: "227.9 milhões km",
    diameter: "6.792 km",
    mass: "6.39 × 10²³ kg",
    temperature: "-65°C (média)",
    moons: 2,
    orbitalPeriod: "687 dias terrestres",
    composition: "Atmosfera fina de CO₂, superfície rochosa",
    facts: [
      "Conhecido como 'Planeta Vermelho'",
      "Possui as maiores montanhas do Sistema Solar",
      "Evidências de água no passado",
      "Duas pequenas luas: Fobos e Deimos",
    ],
  },
  {
    name: "Júpiter",
    kind: "jupiter",
    size: 1.7,
    tilt: 0.05,
    distance: "778.5 milhões km",
    diameter: "142.984 km",
    mass: "1.898 × 10²⁷ kg",
    temperature: "-110°C (topo das nuvens)",
    moons: 95,
    orbitalPeriod: "11.9 anos terrestres",
    composition: "Principalmente hidrogênio e hélio",
    facts: [
      "O maior planeta do Sistema Solar",
      "Grande Mancha Vermelha — tempestade gigante",
      "Protege planetas internos de asteroides",
      "Sistema de anéis tênues",
    ],
  },
  {
    name: "Saturno",
    kind: "saturn",
    size: 1.55,
    tilt: 0.47,
    rings: true,
    distance: "1.432 bilhões km",
    diameter: "120.536 km",
    mass: "5.683 × 10²⁶ kg",
    temperature: "-140°C (topo das nuvens)",
    moons: 146,
    orbitalPeriod: "29.4 anos terrestres",
    composition: "Hidrogênio, hélio, gelo e rocha",
    facts: [
      "Famoso pelo sistema de anéis espetacular",
      "Densidade menor que a água",
      "Titã: lua com atmosfera densa",
      "Hexágono no polo norte",
    ],
  },
  {
    name: "Urano",
    kind: "uranus",
    size: 1.25,
    tilt: 1.71,
    distance: "2.871 bilhões km",
    diameter: "51.118 km",
    mass: "8.681 × 10²⁵ kg",
    temperature: "-197°C (topo das nuvens)",
    moons: 27,
    orbitalPeriod: "84 anos terrestres",
    composition: "Hidrogênio, hélio e metano (gigante de gelo)",
    facts: [
      "Gira praticamente 'deitado' (97° de inclinação)",
      "Cor azul-esverdeada por causa do metano",
      "Sistema de anéis verticais",
      "O planeta mais frio do Sistema Solar",
    ],
  },
  {
    name: "Netuno",
    kind: "neptune",
    size: 1.2,
    tilt: 0.49,
    distance: "4.495 bilhões km",
    diameter: "49.528 km",
    mass: "1.024 × 10²⁶ kg",
    temperature: "-201°C (topo das nuvens)",
    moons: 14,
    orbitalPeriod: "165 anos terrestres",
    composition: "Hidrogênio, hélio, metano e água",
    facts: [
      "Os ventos mais rápidos do Sistema Solar (~2.100 km/h)",
      "Cor azul intenso por absorção de luz vermelha",
      "Tritão: maior lua, com órbita retrógrada",
      "Foi descoberto por cálculos matemáticos antes de ser observado",
    ],
  },
];

const PlanetModel = ({ planet }: { planet: PlanetInfo }) => {
  const material = useMemo(() => createPlanetMaterial(planet.kind), [planet.kind]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <group rotation={[0, 0, planet.tilt]}>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[planet.size, 96, 96]} />
      </mesh>

      {planet.rings && (
        <group rotation={[Math.PI / 2.3, 0, 0]}>
          {[
            { i: 1.35, o: 1.6, c: "#f3dba8", op: 0.7 },
            { i: 1.62, o: 1.95, c: "#e0b87a", op: 0.55 },
            { i: 1.98, o: 2.2, c: "#caa066", op: 0.4 },
            { i: 2.22, o: 2.55, c: "#b88a55", op: 0.3 },
          ].map((r, idx) => (
            <mesh key={idx}>
              <ringGeometry args={[planet.size * r.i, planet.size * r.o, 128]} />
              <meshBasicMaterial color={r.c} transparent opacity={r.op} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export const PlanetDetails = () => {
  const [selected, setSelected] = useState(2); // Earth
  const planet = PLANETS[selected];

  return (
    <section className="min-h-screen pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 sm:px-6"
      >
        <div className="text-center mb-8">
          <span className="section-label">Capítulo III</span>
          <h2 className="font-display text-4xl md:text-6xl font-black text-gradient-aurora glow-text">
            Exploração Planetária
          </h2>
          <p className="text-blue-100/70 mt-3 max-w-2xl mx-auto">
            Oito mundos, oito histórias. Escolha um para conhecer de perto.
          </p>
        </div>

        {/* Thumbnails */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {PLANETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setSelected(i)}
              className={`group relative flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border transition-all ${
                selected === i
                  ? "bg-white/15 border-white/30 shadow-[0_0_24px_rgba(99,102,241,0.5)]"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span
                className="h-7 w-7 rounded-full shadow-inner shadow-black/60"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${planetHex(p.kind)}, #000 130%)`,
                }}
              />
              <span className={`text-sm font-medium ${selected === i ? "text-white" : "text-white/70"}`}>{p.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3D viewer */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/60 to-indigo-950/30 h-[58vh] min-h-[460px] shadow-[0_30px_80px_-20px_rgba(34,211,238,0.35)]">
            <Canvas camera={{ position: [0, 0.3, 5], fov: 50 }} dpr={[1, 2]}>
              <ambientLight intensity={0.35} />
              <pointLight position={[5, 4, 5]} intensity={1.6} color="#fff1c2" />
              <pointLight position={[-5, -3, -5]} intensity={0.4} color="#7c5cff" />
              <Stars radius={120} depth={40} count={3000} factor={3} saturation={0.3} fade speed={0.4} />
              <AnimatePresence mode="wait">
                <PlanetModel key={planet.kind} planet={planet} />
              </AnimatePresence>
              <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.8} />
              <EffectComposer>
                <Bloom intensity={0.5} luminanceThreshold={0.5} luminanceSmoothing={0.4} mipmapBlur />
              </EffectComposer>
            </Canvas>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Em foco</div>
                <div className="font-display text-3xl font-bold text-gradient-aurora">{planet.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Inclinação</div>
                <div className="font-mono text-sm text-white/80">{(planet.tilt * (180 / Math.PI)).toFixed(1)}°</div>
              </div>
            </div>
          </div>

          {/* Details panel */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={planet.name}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.4 }}
                className="glass-card p-6"
              >
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { icon: Ruler, label: "Distância do Sol", value: planet.distance },
                    { icon: Globe2, label: "Diâmetro", value: planet.diameter },
                    { icon: Weight, label: "Massa", value: planet.mass },
                    { icon: Thermometer, label: "Temperatura", value: planet.temperature },
                    { icon: MoonIcon, label: "Luas", value: String(planet.moons) },
                    { icon: Calendar, label: "Período Orbital", value: planet.orbitalPeriod },
                  ].map((f) => (
                    <div key={f.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50 mb-1">
                        <f.icon size={11} />
                        {f.label}
                      </div>
                      <div className="text-sm text-white font-medium">{f.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Composição</div>
                  <div className="text-sm text-white/85">{planet.composition}</div>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`facts-${planet.name}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-fuchsia-300" />
                  <h4 className="font-display text-lg font-bold text-white">Fatos curiosos</h4>
                </div>
                <ul className="space-y-2.5">
                  {planet.facts.map((f, i) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="text-sm text-white/80 flex items-start gap-3"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 flex-shrink-0" />
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
