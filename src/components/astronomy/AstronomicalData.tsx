import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Clock, Zap, Gauge, Atom, Telescope } from "lucide-react";

const stellarData = [
  { name: "Anãs Vermelhas", value: 75, color: "#fb7185" },
  { name: "Tipo Solar", value: 10, color: "#fbbf24" },
  { name: "Gigantes", value: 8, color: "#fb923c" },
  { name: "Anãs Brancas", value: 6, color: "#7dd3fc" },
  { name: "Outras", value: 1, color: "#c084fc" },
];

const planetaryData = [
  { planet: "Mercúrio", mass: 0.055 },
  { planet: "Vênus", mass: 0.815 },
  { planet: "Terra", mass: 1.0 },
  { planet: "Marte", mass: 0.107 },
  { planet: "Júpiter", mass: 317.8 },
  { planet: "Saturno", mass: 95.2 },
  { planet: "Urano", mass: 14.5 },
  { planet: "Netuno", mass: 17.1 },
];

const cosmicScaleData = [
  { object: "Terra", logSize: 0, size: "1 R⊕", note: "Nosso planeta" },
  { object: "Sol", logSize: 2.04, size: "109 R⊕", note: "Estrela anã amarela" },
  { object: "Betelgeuse", logSize: 4.21, size: "~640 R☉", note: "Supergigante vermelha" },
  { object: "Sistema Solar", logSize: 9.4, size: "~287 ua", note: "Até a heliopausa" },
  { object: "Via Láctea", logSize: 21, size: "100.000 ly", note: "Nossa galáxia" },
  { object: "Universo Observável", logSize: 26.97, size: "93 bi ly", note: "Limite do horizonte" },
];

const exoplanetDiscoveries = [
  { year: 1995, total: 1 },
  { year: 2000, total: 50 },
  { year: 2005, total: 180 },
  { year: 2010, total: 490 },
  { year: 2015, total: 1500 },
  { year: 2020, total: 4300 },
  { year: 2023, total: 5500 },
];

const constants = [
  { title: "Idade do Universo", value: 13.8, suffix: " bi", unit: "anos", icon: Clock, color: "from-amber-300 to-rose-500" },
  { title: "Velocidade da Luz", value: 299792458, suffix: "", unit: "m/s", icon: Zap, color: "from-cyan-300 to-blue-500" },
  { title: "Temperatura do CMB", value: 2.725, suffix: "", unit: "Kelvin", icon: Atom, color: "from-violet-300 to-fuchsia-500" },
  { title: "Constante de Hubble", value: 70, suffix: "", unit: "km/s/Mpc", icon: Telescope, color: "from-emerald-300 to-teal-500" },
];

/** Counter that animates from 0 to value when scrolled into view. */
const Counter = ({ to, decimals = 0 }: { to: number; decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    v.toLocaleString("pt-BR", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }),
  );
  const [text, setText] = useState("0");
  useEffect(() => {
    const unsub = rounded.on("change", (v) => setText(v));
    return () => unsub();
  }, [rounded]);
  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 2.2, ease: [0.22, 1, 0.36, 1] });
      return () => controls.stop();
    }
  }, [inView, mv, to]);
  return <span ref={ref}>{text}</span>;
};

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(10, 10, 26, 0.92)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  fontFamily: "Space Grotesk, sans-serif",
} as const;

export const AstronomicalData = () => {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 sm:px-6"
      >
        <div className="text-center mb-10">
          <span className="section-label">Capítulo V</span>
          <h2 className="font-display text-4xl md:text-6xl font-black text-gradient-aurora glow-text">
            Dados Astronômicos
          </h2>
          <p className="text-blue-100/70 mt-3 max-w-2xl mx-auto">
            Números, escalas e descobertas que moldam nossa visão do cosmos.
          </p>
        </div>

        {/* Constants */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {constants.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              whileHover={{ y: -4 }}
              className="glass-card glass-card-glow p-5"
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-lg mb-3`}>
                <c.icon size={16} className="text-white" />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/55 mb-1">{c.title}</div>
              <div className="font-display text-2xl md:text-3xl font-bold text-white tabular-nums">
                <Counter to={c.value} decimals={c.value < 10 && c.value !== Math.floor(c.value) ? 3 : 0} />
                {c.suffix}
              </div>
              <div className="text-xs text-white/50 mt-1">{c.unit}</div>
            </motion.div>
          ))}
        </div>

        {/* Pie + Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card glass-card-glow p-6"
          >
            <h3 className="font-display text-lg font-bold text-white mb-1">Tipos Estelares</h3>
            <p className="text-xs text-white/55 mb-4">Distribuição percentual aproximada na vizinhança galáctica</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stellarData} cx="50%" cy="50%" innerRadius={45} outerRadius={95} dataKey="value" paddingAngle={2}>
                    {stellarData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} formatter={(v: number) => `${v}%`} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-white/75">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card glass-card-glow p-6"
          >
            <h3 className="font-display text-lg font-bold text-white mb-1">Descobertas de Exoplanetas</h3>
            <p className="text-xs text-white/55 mb-4">Total cumulativo confirmado, por ano</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exoplanetDiscoveries}>
                  <defs>
                    <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} cursor={{ stroke: "#a855f7", strokeOpacity: 0.3 }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="url(#line-grad)"
                    strokeWidth={3}
                    dot={{ fill: "#a855f7", r: 4 }}
                    activeDot={{ r: 6, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bar log */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card glass-card-glow p-6 mb-8"
        >
          <div className="flex items-end justify-between mb-1">
            <h3 className="font-display text-lg font-bold text-white">Massa Planetária — escala logarítmica</h3>
            <span className="text-xs text-white/50">Terra = 1</span>
          </div>
          <p className="text-xs text-white/55 mb-4">Júpiter pesa 317× a Terra; escala log evita que os rochosos sumam</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planetaryData}>
                <defs>
                  <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="planet" stroke="rgba(255,255,255,0.6)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
                <YAxis
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                  scale="log"
                  domain={[0.01, 1000]}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} cursor={{ fill: "rgba(168,85,247,0.08)" }} />
                <Bar dataKey="mass" fill="url(#bar-grad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cosmic scale visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card glass-card-glow p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={16} className="text-amber-300" />
            <h3 className="font-display text-lg font-bold text-white">Escala Cósmica</h3>
          </div>
          <p className="text-xs text-white/55 mb-6">Cada barra representa o tamanho em escala log — do nosso planeta ao universo observável</p>

          <div className="space-y-3">
            {cosmicScaleData.map((item, i) => {
              const max = cosmicScaleData[cosmicScaleData.length - 1].logSize;
              const pct = Math.max(2, (item.logSize / max) * 100);
              return (
                <motion.div
                  key={item.object}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.06 * i }}
                  className="grid grid-cols-[140px_1fr_auto] sm:grid-cols-[180px_1fr_auto] items-center gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{item.object}</div>
                    <div className="text-[10px] text-white/45 uppercase tracking-widest">{item.note}</div>
                  </div>
                  <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: 0.06 * i + 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 shadow-[0_0_18px_rgba(168,85,247,0.5)]"
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">{item.size}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-white/40 text-xs mt-8"
        >
          Dados compilados de NASA, ESA, IAU e observatórios astronômicos mundiais
        </motion.p>
      </motion.div>
    </section>
  );
};
