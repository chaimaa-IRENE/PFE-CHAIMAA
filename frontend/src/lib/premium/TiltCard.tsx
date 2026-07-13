import React, { useRef, useCallback, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: string;
  scale?: number;
  onClick?: () => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
  maxTilt = 8,
  glowColor = "rgba(37,99,235,0.15)",
  scale = 1.02,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const srx = useSpring(rx, { stiffness: 300, damping: 25 });
  const sry = useSpring(ry, { stiffness: 300, damping: 25 });
  const sgx = useSpring(gx, { stiffness: 200, damping: 20 });
  const sgy = useSpring(gy, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(srx, [-maxTilt, maxTilt], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sry, [-maxTilt, maxTilt], [-maxTilt, maxTilt]);

  const glowBg = useTransform(
    [sgx, sgy],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, ${glowColor}, transparent 60%)`,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      rx.set((py - 0.5) * maxTilt * 2);
      ry.set((px - 0.5) * maxTilt * 2);
      gx.set(px * 100);
      gy.set(py * 100);
    },
    [maxTilt, rx, ry, gx, gy],
  );

  const handleMouseLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(50);
  }, [rx, ry, gx, gy]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale }}
      className={`relative rounded-3xl glass-strong overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
        style={{ background: glowBg }}
        whileHover={{ opacity: 1 }}
      />
      <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
};
