import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  baseAlpha: number;
  twinkle: number;
  hue: number;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

/**
 * Canvas-based starfield with parallax, twinkle and occasional shooting stars.
 * Sits fixed behind every section. Cheap (single 2D canvas, ~250 stars).
 */
export const StarfieldBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const STAR_COUNT = Math.min(280, Math.floor((width * height) / 6000));

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      baseAlpha: Math.random() * 0.5 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      hue: 200 + Math.random() * 80,
    }));

    let shooting: Shooting[] = [];
    let raf = 0;
    let lastShootingAt = performance.now();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", resize);

    const tick = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // Subtle nebula wash
      const grad = ctx.createRadialGradient(width * 0.7, height * 0.2, 0, width * 0.7, height * 0.2, width * 0.6);
      grad.addColorStop(0, "rgba(80, 40, 160, 0.10)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.2, height * 0.85, 0, width * 0.2, height * 0.85, width * 0.5);
      grad2.addColorStop(0, "rgba(30, 80, 180, 0.10)");
      grad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Stars
      for (const s of stars) {
        s.twinkle += 0.02 + s.z * 0.03;
        const alpha = s.baseAlpha * (0.7 + Math.sin(s.twinkle) * 0.3);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.6 + s.z * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 85%, ${alpha})`;
        ctx.shadowBlur = 6 * s.z;
        ctx.shadowColor = `hsla(${s.hue}, 90%, 80%, ${alpha})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Spawn a shooting star every 4–9 seconds
      if (t - lastShootingAt > 4000 + Math.random() * 5000) {
        lastShootingAt = t;
        const fromLeft = Math.random() > 0.5;
        shooting.push({
          x: fromLeft ? -50 : width + 50,
          y: Math.random() * height * 0.6,
          vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 4),
          vy: 2 + Math.random() * 3,
          life: 0,
          maxLife: 80,
        });
      }

      shooting = shooting.filter((sh) => {
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.life++;
        const a = 1 - sh.life / sh.maxLife;
        if (a <= 0) return false;
        const trailLen = 80;
        const gradS = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * (trailLen / 6), sh.y - sh.vy * (trailLen / 6));
        gradS.addColorStop(0, `rgba(255, 255, 255, ${a})`);
        gradS.addColorStop(0.4, `rgba(180, 220, 255, ${a * 0.5})`);
        gradS.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = gradS;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * (trailLen / 6), sh.y - sh.vy * (trailLen / 6));
        ctx.stroke();
        return true;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-cosmic" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};
