import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import { Cloud, Magnet, Radio, Zap } from "lucide-react";
import * as THREE from "three";

const ParticleNebula = ({
  position,
  color,
  count = 1800,
  radius = 4.5,
}: {
  position: [number, number, number];
  color: string;
  count?: number;
  radius?: number;
}) => {
  const groupRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const base = new THREE.Color(color);
    const accent = new THREE.Color(color).offsetHSL(0.08, 0.1, 0.1);
    const dim = new THREE.Color(color).offsetHSL(-0.05, -0.2, -0.3);

    for (let i = 0; i < count; i++) {
      // gaussian-ish distribution by stacking randoms
      const r = (Math.random() + Math.random() + Math.random()) / 3;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      const rr = r * radius;

      positions[i * 3] = rr * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = rr * Math.sin(theta) * Math.sin(phi) * 0.55;
      positions[i * 3 + 2] = rr * Math.cos(theta);

      const c = new THREE.Color().lerpColors(dim, accent, Math.pow(1 - r, 2)).lerp(base, 0.4 * Math.random());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count, color, radius]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={groupRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const BlackHole = ({ position }: { position: [number, number, number] }) => {
  const diskRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const diskMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        void main(){
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;

        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main(){
          float r = length(vPos.xz);
          float angle = atan(vPos.z, vPos.x);
          // Doppler-style brightening on one side
          float doppler = 0.5 + 0.5 * cos(angle);
          float swirl = noise(vec2(angle * 4.0 + uTime * 1.2, r * 3.0 - uTime * 0.6));
          float ring = smoothstep(0.7, 1.3, r) * (1.0 - smoothstep(2.6, 3.2, r));
          float intensity = ring * (0.4 + swirl * 1.4) * (0.4 + doppler * 1.2);
          vec3 hot = mix(vec3(1.0, 0.45, 0.05), vec3(1.0, 0.92, 0.5), smoothstep(0.7, 1.3, r));
          hot = mix(hot, vec3(0.6, 0.8, 1.0), smoothstep(2.0, 3.0, r));
          gl_FragColor = vec4(hot * intensity * 1.8, intensity);
        }
      `,
    });
  }, []);

  useFrame((state, delta) => {
    diskMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    if (diskRef.current) diskRef.current.rotation.y += delta * 0.25;
    if (haloRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
      haloRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={position} rotation={[Math.PI / 2.6, 0, 0.2]}>
      {/* Event horizon — pure black */}
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Lensing halo */}
      <mesh ref={haloRef}>
        <ringGeometry args={[0.75, 0.95, 64]} />
        <meshBasicMaterial color="#fff3b8" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Accretion disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]} material={diskMaterial}>
        <ringGeometry args={[0.95, 3.2, 256, 1]} />
      </mesh>
    </group>
  );
};

const Pulsar = ({ position }: { position: [number, number, number] }) => {
  const beamRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (beamRef.current) beamRef.current.rotation.z += delta * 3.5;
  });
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#a5f3fc" />
      </mesh>
      <group ref={beamRef}>
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[0.12, 3, 16, 1, true]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -1.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.12, 3, 16, 1, true]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
};

const DeepSpaceScene = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <Stars radius={400} depth={100} count={20000} factor={8} saturation={0.4} fade speed={0.6} />

      <ParticleNebula position={[-10, 4, -16]} color="#a855f7" count={2200} radius={5.5} />
      <ParticleNebula position={[12, -6, -22]} color="#3b82f6" count={2400} radius={6} />
      <ParticleNebula position={[2, 9, -30]} color="#ef4444" count={2000} radius={5} />
      <ParticleNebula position={[-4, -8, -10]} color="#22d3ee" count={1400} radius={4} />

      <BlackHole position={[4, -2, -10]} />
      <Pulsar position={[-8, 6, -8]} />

      <OrbitControls enableZoom enablePan autoRotate autoRotateSpeed={0.18} />

      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.25} luminanceSmoothing={0.5} mipmapBlur />
      </EffectComposer>
    </>
  );
};

const PHENOMENA = [
  {
    name: "Nebulosas",
    icon: Cloud,
    color: "from-violet-400 to-fuchsia-500",
    border: "border-fuchsia-400/30",
    description: "Vastas nuvens de gás e poeira interestelar onde nascem as estrelas.",
    facts: ["Podem ter anos-luz de extensão", "Compostas principalmente de hidrogênio", "Berçários estelares"],
  },
  {
    name: "Buracos Negros",
    icon: Magnet,
    color: "from-rose-400 to-amber-500",
    border: "border-rose-400/30",
    description: "Regiões do espaço-tempo onde a gravidade é tão forte que nada pode escapar.",
    facts: ["Horizonte de eventos", "Singularidade no centro", "Curvam o espaço-tempo"],
  },
  {
    name: "Pulsares",
    icon: Radio,
    color: "from-cyan-300 to-sky-500",
    border: "border-cyan-400/30",
    description: "Estrelas de nêutrons em rotação que emitem feixes de radiação como faróis.",
    facts: ["Rotação extremamente precisa", "Densidade incrível", "Faróis cósmicos"],
  },
  {
    name: "Quasares",
    icon: Zap,
    color: "from-emerald-300 to-teal-500",
    border: "border-emerald-400/30",
    description: "Núcleos galácticos ativos extremamente luminosos alimentados por buracos negros.",
    facts: ["Mais brilhantes que galáxias inteiras", "Distâncias cosmológicas", "Jatos relativísticos"],
  },
];

export const DeepSpace = () => {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 sm:px-6"
      >
        <div className="text-center mb-8">
          <span className="section-label">Capítulo II</span>
          <h2 className="font-display text-4xl md:text-6xl font-black text-gradient-cosmic glow-text">
            Espaço Profundo
          </h2>
          <p className="text-blue-100/70 mt-3 max-w-2xl mx-auto">
            Além do nosso quintal estelar — nebulosas, singularidades e faróis cósmicos.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/60 to-purple-950/40 shadow-[0_30px_80px_-20px_rgba(168,85,247,0.4)] h-[58vh] min-h-[460px] mb-10">
          <Canvas camera={{ position: [0, 0, 22], fov: 70 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }}>
            <DeepSpaceScene />
          </Canvas>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PHENOMENA.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className={`glass-card glass-card-glow p-6 ${p.border}`}
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} shadow-lg flex-shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white">{p.name}</h3>
                    <p className="text-sm text-white/70 mt-1 leading-relaxed">{p.description}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-4 pl-1">
                  {p.facts.map((f) => (
                    <li key={f} className="text-sm text-white/65 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${p.color}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};
