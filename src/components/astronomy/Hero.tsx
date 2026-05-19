import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { ChevronDown, Rocket, Globe, Telescope } from "lucide-react";
import * as THREE from "three";
import { createPlanetMaterial, PlanetKind } from "./shaders/planetMaterials";

const FloatingPlanet = ({
  position,
  size,
  kind,
  rings,
}: {
  position: [number, number, number];
  size: number;
  kind: PlanetKind;
  rings?: boolean;
}) => {
  const material = useMemo(() => createPlanetMaterial(kind), [kind]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.6}>
      <group position={position} rotation={[0.2, 0, 0.1]}>
        <mesh ref={meshRef} material={material}>
          <sphereGeometry args={[size, 64, 64]} />
        </mesh>
        {rings && (
          <group rotation={[Math.PI / 2.4, 0, 0]}>
            <mesh>
              <ringGeometry args={[size * 1.4, size * 2.2, 96]} />
              <meshBasicMaterial color="#e6c994" transparent opacity={0.55} side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <ringGeometry args={[size * 2.25, size * 2.6, 96]} />
              <meshBasicMaterial color="#caa066" transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}
      </group>
    </Float>
  );
};

const HeroScene = () => {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[10, 8, 10]} intensity={1.6} color="#fff5d9" />
      <pointLight position={[-12, -6, -8]} intensity={0.6} color="#7c5cff" />

      <Stars radius={250} depth={80} count={9000} factor={5} saturation={0.4} fade speed={0.6} />

      <FloatingPlanet position={[-5.2, 1.6, -3]} size={0.95} kind="earth" />
      <FloatingPlanet position={[5.4, -0.8, -5]} size={0.7} kind="mars" />
      <FloatingPlanet position={[2.5, 3.2, -8]} size={1.4} kind="jupiter" />
      <FloatingPlanet position={[-3.2, -2.4, -6]} size={1.05} kind="saturn" rings />
      <FloatingPlanet position={[6, 2.6, -10]} size={0.6} kind="neptune" />

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.4} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.85} />
      </EffectComposer>
    </>
  );
};

export const Hero = () => {
  const stats = [
    { icon: Globe, label: "93 Bilhões", sub: "anos-luz observáveis", grad: "from-sky-400 to-blue-500" },
    { icon: Telescope, label: "2 Trilhões", sub: "galáxias estimadas", grad: "from-fuchsia-400 to-purple-500" },
    { icon: Rocket, label: "13.8 Bilhões", sub: "anos de cosmos", grad: "from-amber-300 to-rose-500" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 75 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <HeroScene />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cosmic-deep/90" />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-24 pb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="section-label glow-text"
        >
          ◆ Uma jornada pelo cosmos ◆
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="font-display text-5xl sm:text-7xl md:text-8xl font-black mb-6 text-gradient-cosmic glow-text leading-tight"
        >
          SUKO STELLAR
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="text-lg md:text-2xl text-blue-100/90 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
        >
          Explore os mistérios do universo através de visualizações 3D interativas,
          shaders procedurais e uma imersão completa pelo cosmos infinito.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {stats.map(({ icon: Icon, label, sub, grad }, i) => (
            <motion.div
              key={label}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-card glass-card-glow p-5 group cursor-default"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${grad} mb-3 shadow-lg`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="font-display text-2xl font-bold text-white mb-1">{label}</div>
              <div className="text-xs text-white/60 uppercase tracking-wider">{sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-xs tracking-[0.3em] uppercase">Role para explorar</span>
          <ChevronDown size={20} className="animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};
