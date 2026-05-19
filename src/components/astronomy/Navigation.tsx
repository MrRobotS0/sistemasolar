import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Orbit, Sparkles, Globe2, Atom, BarChart3, Menu, X } from "lucide-react";
import type { Section } from "@/pages/Index";

interface NavigationProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const NAV_ITEMS: { id: Section; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "solar-system", label: "Sistema Solar", icon: Orbit },
  { id: "deep-space", label: "Espaço Profundo", icon: Sparkles },
  { id: "planets", label: "Planetas", icon: Globe2 },
  { id: "galaxies", label: "Galáxias", icon: Atom },
  { id: "data", label: "Dados", icon: BarChart3 },
];

export const Navigation = ({ activeSection, setActiveSection }: NavigationProps) => {
  const [open, setOpen] = useState(false);

  const handlePick = (id: Section) => {
    setActiveSection(id);
    setOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="backdrop-blur-2xl bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <button
              onClick={() => handlePick("home")}
              className="flex items-center gap-2 group focus:outline-none"
              aria-label="Ir para o início"
            >
              <span className="relative inline-flex h-9 w-9 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-amber-400 opacity-80 blur-md group-hover:opacity-100 transition-opacity" />
                <span className="relative h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-amber-300 shadow-[inset_-2px_-3px_8px_rgba(0,0,0,0.4),inset_2px_3px_8px_rgba(255,255,255,0.3)]" />
              </span>
              <span className="font-display font-bold text-lg sm:text-xl tracking-wider text-gradient-cosmic">
                SUKO STELLAR
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePick(item.id)}
                    className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/80 via-fuchsia-500/70 to-pink-500/80 shadow-[0_0_20px_rgba(139,92,246,0.55)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative flex items-center gap-2 ${isActive ? "text-white" : "text-white/70 hover:text-white"}`}>
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile trigger */}
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white"
              aria-label="Abrir menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden backdrop-blur-2xl bg-black/70 border-b border-white/10"
          >
            <div className="container mx-auto px-4 py-4 grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePick(item.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/40 border-fuchsia-400/50 text-white"
                        : "bg-white/5 border-white/10 text-white/80 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
