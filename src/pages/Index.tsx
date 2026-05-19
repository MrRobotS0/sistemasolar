import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "@/components/astronomy/Hero";
import { Navigation } from "@/components/astronomy/Navigation";
import { SolarSystem } from "@/components/astronomy/SolarSystem";
import { DeepSpace } from "@/components/astronomy/DeepSpace";
import { PlanetDetails } from "@/components/astronomy/PlanetDetails";
import { GalaxyViewer } from "@/components/astronomy/GalaxyViewer";
import { AstronomicalData } from "@/components/astronomy/AstronomicalData";
import { StarfieldBackground } from "@/components/astronomy/StarfieldBackground";

export type Section = "home" | "solar-system" | "deep-space" | "planets" | "galaxies" | "data";

const SECTIONS: Record<Section, () => JSX.Element> = {
  home: () => <Hero />,
  "solar-system": () => <SolarSystem />,
  "deep-space": () => <DeepSpace />,
  planets: () => <PlanetDetails />,
  galaxies: () => <GalaxyViewer />,
  data: () => <AstronomicalData />,
};

const Index = () => {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const Section = SECTIONS[activeSection];

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <StarfieldBackground />

      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />

      <AnimatePresence mode="wait">
        <motion.main
          key={activeSection}
          initial={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <Section />
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default Index;
