import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface AuroraBackgroundProps {
  variant?: "dark" | "light";
  intensity?: "subtle" | "medium" | "strong";
  showGrid?: boolean;
  showBokeh?: boolean;
  showParticles?: boolean;
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  variant = "dark",
  intensity = "medium",
  showGrid = true,
  showBokeh = true,
  showParticles = true,
  className = "",
}) => {
  const opacityMap = { subtle: 0.4, medium: 0.7, strong: 1 };

  const bokehOrbs = useMemo(
    () =>
      [...Array(6)].map(() => ({
        size: 80 + Math.random() * 200,
        x: Math.random() * 100,
        y: Math.random() * 100,
        dur: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        hue: Math.random() > 0.5 ? "rgba(37,99,235,0.06)" : "rgba(139,92,246,0.05)",
      })),
    [],
  );

  const particles = useMemo(
    () =>
      [...Array(30)].map(() => ({
        size: 1 + Math.random() * 2.5,
        x: Math.random() * 100,
        y: Math.random() * 100,
        dur: 8 + Math.random() * 12,
        delay: Math.random() * 5,
      })),
    [],
  );

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0, opacity: opacityMap[intensity] }}
    >
      {variant === "dark" ? (
        <div className="absolute inset-0 bg-mesh" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />
      )}

      <motion.div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 60%)" }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)" }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[30%] w-[55%] h-[55%] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 60%)" }}
        animate={{ x: [0, 20, -30, 0], y: [0, -10, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {showGrid && (
        <div
          className="absolute inset-0 bg-grid-masked"
          style={{ opacity: 0.5 }}
        />
      )}

      {showBokeh &&
        bokehOrbs.map((orb, i) => (
          <motion.div
            key={`bokeh-${i}`}
            className="absolute rounded-full blur-2xl"
            style={{
              width: orb.size,
              height: orb.size,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              background: orb.hue,
            }}
            animate={{
              x: [0, 20, -15, 0],
              y: [0, -25, 15, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: orb.dur,
              delay: orb.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {showParticles &&
        particles.map((p, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-white/20"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      <div
        className="absolute inset-0"
        style={{
          background:
            variant === "dark"
              ? "linear-gradient(180deg, transparent 0%, transparent 80%, rgba(5,8,17,0.5) 100%)"
              : "linear-gradient(180deg, transparent 0%, transparent 80%, rgba(248,250,252,0.3) 100%)",
        }}
      />
    </div>
  );
};
