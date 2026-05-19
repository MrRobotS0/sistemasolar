import * as THREE from "three";

/**
 * Procedural planet materials — no external texture files. Every planet gets a
 * unique GLSL noise-based shader so the visuals look hand-crafted instead of
 * the original "flat colored sphere" look.
 */

const noiseGLSL = /* glsl */ `
  // Classic 3D simplex noise — Ashima / Ian McEwan, public domain.
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p){
    float v = 0.0;
    float a = 0.5;
    for(int i = 0; i < 5; i++){
      v += a * snoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`;

export type PlanetKind =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "moon"
  | "sun";

interface PaletteEntry {
  base: THREE.Color;
  highlight: THREE.Color;
  shadow: THREE.Color;
  bands?: number;
  ocean?: boolean;
  ice?: boolean;
  emissive?: number;
}

const PALETTE: Record<PlanetKind, PaletteEntry> = {
  mercury: {
    base: new THREE.Color("#8c7853"),
    highlight: new THREE.Color("#d6c4a0"),
    shadow: new THREE.Color("#3d3525"),
    bands: 0,
  },
  venus: {
    base: new THREE.Color("#e6b569"),
    highlight: new THREE.Color("#fff0c2"),
    shadow: new THREE.Color("#8a5a18"),
    bands: 4,
  },
  earth: {
    base: new THREE.Color("#1e6091"),
    highlight: new THREE.Color("#9cd2a0"),
    shadow: new THREE.Color("#0a2540"),
    ocean: true,
  },
  mars: {
    base: new THREE.Color("#b04a2a"),
    highlight: new THREE.Color("#e8a07a"),
    shadow: new THREE.Color("#3d1505"),
    ice: true,
  },
  jupiter: {
    base: new THREE.Color("#c9a36b"),
    highlight: new THREE.Color("#f5e0b3"),
    shadow: new THREE.Color("#7a4d20"),
    bands: 9,
  },
  saturn: {
    base: new THREE.Color("#e2c084"),
    highlight: new THREE.Color("#fdebc4"),
    shadow: new THREE.Color("#9a6a2b"),
    bands: 7,
  },
  uranus: {
    base: new THREE.Color("#7fd8e4"),
    highlight: new THREE.Color("#d4f4f7"),
    shadow: new THREE.Color("#1c5b6b"),
    bands: 2,
  },
  neptune: {
    base: new THREE.Color("#3553c4"),
    highlight: new THREE.Color("#8ea7ff"),
    shadow: new THREE.Color("#0b1a5e"),
    bands: 3,
  },
  moon: {
    base: new THREE.Color("#aaaaaa"),
    highlight: new THREE.Color("#e8e8ee"),
    shadow: new THREE.Color("#3a3a44"),
  },
  sun: {
    base: new THREE.Color("#ffb33b"),
    highlight: new THREE.Color("#fff7c2"),
    shadow: new THREE.Color("#ff5e1a"),
    emissive: 1,
  },
};

/**
 * Returns a fresh ShaderMaterial for a given planet kind. The material is
 * lit via Three.js standard lights through a custom lighting model so the
 * sun's pointLight still works.
 */
export function createPlanetMaterial(kind: PlanetKind): THREE.ShaderMaterial {
  const palette = PALETTE[kind];

  const uniforms = {
    uTime: { value: 0 },
    uBase: { value: palette.base.clone() },
    uHighlight: { value: palette.highlight.clone() },
    uShadow: { value: palette.shadow.clone() },
    uBands: { value: palette.bands ?? 0 },
    uOcean: { value: palette.ocean ? 1 : 0 },
    uIce: { value: palette.ice ? 1 : 0 },
    uEmissive: { value: palette.emissive ?? 0 },
    uLightDir: { value: new THREE.Vector3(1, 0.3, 0.6).normalize() },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vWorldNormal;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vWorldNormal;

      uniform float uTime;
      uniform vec3 uBase;
      uniform vec3 uHighlight;
      uniform vec3 uShadow;
      uniform float uBands;
      uniform float uOcean;
      uniform float uIce;
      uniform float uEmissive;
      uniform vec3 uLightDir;

      ${noiseGLSL}

      void main(){
        vec3 p = normalize(vPos);

        // Base noise terrain
        float n = fbm(p * 2.5 + uTime * 0.02);
        float detail = fbm(p * 8.0 + uTime * 0.05) * 0.4;
        float terrain = n + detail;

        // Bands for gas giants (latitude based)
        float bandFactor = 0.0;
        if (uBands > 0.5) {
          float lat = p.y;
          float wobble = fbm(p * 1.5) * 0.15;
          bandFactor = sin((lat + wobble) * uBands * 3.14159);
        }

        // Earth-style: oceans below threshold, continents above
        vec3 color = uBase;
        if (uOcean > 0.5) {
          float h = terrain * 0.6;
          if (h < 0.0) {
            // ocean — deep blue with subtle variation
            color = mix(vec3(0.03, 0.12, 0.32), vec3(0.05, 0.25, 0.5), h + 0.5);
          } else {
            // land
            vec3 land = mix(vec3(0.55, 0.42, 0.2), vec3(0.15, 0.45, 0.18), smoothstep(0.0, 0.4, h));
            // mountains / snow at high altitude
            land = mix(land, vec3(0.95, 0.97, 1.0), smoothstep(0.45, 0.7, h));
            color = land;
          }
          // polar ice caps
          float polar = smoothstep(0.78, 0.92, abs(p.y));
          color = mix(color, vec3(0.97, 0.98, 1.0), polar);
          // cloud band — second noise layer
          float clouds = smoothstep(0.4, 0.8, fbm(p * 3.0 + uTime * 0.04));
          color = mix(color, vec3(1.0), clouds * 0.35);
        } else {
          color = mix(uShadow, uBase, smoothstep(-0.8, 0.4, terrain));
          color = mix(color, uHighlight, smoothstep(0.3, 0.9, terrain));
          color = mix(color, uHighlight, bandFactor * 0.4);
          if (uIce > 0.5) {
            float polar = smoothstep(0.8, 0.95, abs(p.y));
            color = mix(color, vec3(0.95, 0.95, 1.0), polar);
          }
        }

        // Lighting — wrap-around diffuse so the night side isn't pitch black
        vec3 N = normalize(vWorldNormal);
        float ndl = dot(N, normalize(uLightDir));
        float diff = max(ndl, 0.0);
        float wrap = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
        float light = mix(0.12, 1.0, wrap * 0.6 + diff * 0.6);

        vec3 lit = color * light;

        // Rim light — cool blue atmosphere on edges
        float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
        lit += vec3(0.3, 0.55, 1.0) * rim * 0.35 * (1.0 - uEmissive);

        // Sun-style emissive
        if (uEmissive > 0.5) {
          float glow = fbm(p * 4.0 + uTime * 0.3);
          vec3 hot = mix(uShadow, uHighlight, smoothstep(-0.5, 0.8, glow));
          hot = mix(hot, vec3(1.0, 1.0, 0.85), smoothstep(0.5, 0.9, glow));
          lit = hot;
        }

        gl_FragColor = vec4(lit, 1.0);
      }
    `,
  });
}

/** Helper that returns the simple hex color (used by 2D UI cards). */
export function planetHex(kind: PlanetKind): string {
  return `#${PALETTE[kind].base.getHexString()}`;
}
