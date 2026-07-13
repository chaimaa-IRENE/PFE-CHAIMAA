import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "./AnimationProvider";
import "./PremiumBackground.css";

type Intensity = "high" | "medium" | "low";

interface PremiumBackgroundProps {
  children: React.ReactNode;
  intensity?: Intensity;
}

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  delay: number;
  color: string;
}

interface Bokeh {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  durationX: number;
  delay: number;
  color: string;
}

interface Ray {
  id: number;
  rotation: number;
  duration: number;
  delay: number;
  opacity: number;
}

const PARTICLE_COLORS = [
  "rgba(37, 99, 235, VAR)",
  "rgba(16, 185, 129, VAR)",
  "rgba(245, 158, 11, VAR)",
  "rgba(139, 92, 246, VAR)",
  "rgba(255, 255, 255, VAR)",
];

const BOKEH_COLORS = [
  "rgba(37, 99, 235, VAR)",
  "rgba(16, 185, 129, VAR)",
  "rgba(245, 158, 11, VAR)",
  "rgba(139, 92, 246, VAR)",
];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      size: rand(2, 6),
      x: rand(0, 100),
      y: rand(0, 100),
      opacity: rand(0.1, 0.4),
      delay: rand(0, 10),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)].replace(
        "VAR",
        String(clamp(rand(0.15, 0.5), 0, 1))
      ),
    });
  }
  return particles;
}

function generateBokeh(count: number): Bokeh[] {
  const bokeh: Bokeh[] = [];
  for (let i = 0; i < count; i++) {
    bokeh.push({
      id: i,
      size: rand(100, 300),
      x: rand(0, 100),
      y: rand(0, 100),
      opacity: rand(0.03, 0.12),
      durationX: rand(30, 60),
      delay: rand(0, 15),
      color: BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)].replace(
        "VAR",
        String(clamp(rand(0.3, 0.7), 0, 1))
      ),
    });
  }
  return bokeh;
}

function generateRays(count: number): Ray[] {
  const rays: Ray[] = [];
  for (let i = 0; i < count; i++) {
    rays.push({
      id: i,
      rotation: rand(-20, 40),
      duration: rand(15, 30),
      delay: rand(0, 8),
      opacity: rand(0.3, 0.7),
    });
  }
  return rays;
}

const intensityConfig: Record<Intensity, {
  particles: number;
  bokeh: number;
  rays: number;
  auroraBlur: string;
}> = {
  high: { particles: 80, bokeh: 8, rays: 6, auroraBlur: "blur(120px)" },
  medium: { particles: 40, bokeh: 4, rays: 3, auroraBlur: "blur(80px)" },
  low: { particles: 20, bokeh: 2, rays: 0, auroraBlur: "blur(40px)" },
};

const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ children, intensity = "medium" }) => {
  const reducedMotion = useReducedMotion();
  const config = useMemo(() => intensityConfig[intensity] || intensityConfig.medium, [intensity]);

  const particles = useMemo(() => generateParticles(config.particles), [config.particles]);
  const bokehCircles = useMemo(() => generateBokeh(config.bokeh), [config.bokeh]);
  const rays = useMemo(() => generateRays(config.rays), [config.rays]);

  const auroraVariants = useMemo(
    () => ({
      animate: reducedMotion
        ? {}
        : {
            backgroundPosition: ["0% 0%", "100% 100%", "0% 50%", "50% 0%", "0% 0%"],
            transition: { duration: 30, repeat: Infinity, ease: "linear" as const },
          },
    }),
    [reducedMotion]
  );

  const rayVariants = useCallback(
    (ray: Ray) => ({
      animate: reducedMotion
        ? {}
        : {
            rotate: [ray.rotation, ray.rotation + 15, ray.rotation - 5, ray.rotation],
            opacity: [ray.opacity, ray.opacity * 0.6, ray.opacity, ray.opacity * 1.2, ray.opacity],
            scale: [1, 1.05, 0.98, 1.02, 1],
            transition: {
              duration: ray.duration,
              repeat: Infinity,
              delay: ray.delay,
              ease: "easeInOut" as const,
            },
          },
    }),
    [reducedMotion]
  );

  const particleVariants = useCallback(
    (p: Particle) => ({
      animate: reducedMotion
        ? {}
        : {
            x: [0, rand(-80, 80), 0],
            y: [0, rand(-60, 60), 0],
            opacity: [p.opacity, p.opacity * 0.4, p.opacity],
            transition: {
              duration: rand(8, 16),
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut" as const,
            },
          },
    }),
    [reducedMotion]
  );

  const bokehVariants = useCallback(
    (b: Bokeh) => ({
      animate: reducedMotion
        ? {}
        : {
            x: [0, rand(-40, 40), 0],
            y: [0, rand(-30, 30), 0],
            scale: [1, rand(1.05, 1.15), 1],
            transition: {
              duration: b.durationX,
              repeat: Infinity,
              delay: b.delay,
              ease: "easeInOut" as const,
            },
          },
    }),
    [reducedMotion]
  );

  return (
    <div className="premium-bg">
      <motion.div
        className="premium-bg__aurora"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 20% 30%, rgba(37,99,235,0.25) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 60% at 80% 20%, rgba(16,185,129,0.2) 0%, transparent 50%), " +
            "radial-gradient(ellipse 70% 70% at 40% 80%, rgba(245,158,11,0.1) 0%, transparent 50%), " +
            "radial-gradient(ellipse 50% 50% at 60% 40%, rgba(139,92,246,0.12) 0%, transparent 50%), " +
            "linear-gradient(135deg, #0B1220 0%, #111827 40%, #1e293b 100%)",
          filter: config.auroraBlur,
        }}
        variants={auroraVariants}
        animate="animate"
      />

      {rays.map((ray) => (
        <motion.div
          key={ray.id}
          className="premium-bg__ray"
          style={{ transform: `rotate(${ray.rotation}deg)` }}
          custom={ray}
          variants={rayVariants(ray)}
          animate="animate"
        />
      ))}

      <div className="premium-bg__particles">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="premium-bg__particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
            }}
            custom={p}
            variants={particleVariants(p)}
            animate="animate"
          />
        ))}
      </div>

      <div className="premium-bg__bokeh">
        {bokehCircles.map((b) => (
          <motion.div
            key={b.id}
            className="premium-bg__bokeh-circle"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.x}%`,
              top: `${b.y}%`,
              backgroundColor: b.color,
              opacity: b.opacity,
            }}
            custom={b}
            variants={bokehVariants(b)}
            animate="animate"
          />
        ))}
      </div>

      <div className="premium-bg__content">{children}</div>
    </div>
  );
};

export default PremiumBackground;