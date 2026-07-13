import React, { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
  glowColor?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "glass";
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  className = "",
  strength = 0.3,
  glowColor = "rgba(37,99,235,0.3)",
  disabled = false,
  type = "button",
  variant = "primary",
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });
  const glowX = useTransform(sx, [-30, 30], ["0%", "100%"]);
  const glowY = useTransform(sy, [-30, 30], ["0%", "100%"]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      x.set(mx * strength);
      y.set(my * strength);
    },
    [disabled, strength, x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const baseClass =
    variant === "primary"
      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
      : variant === "ghost"
      ? "bg-transparent text-slate-300 border border-white/10"
      : "glass text-white";

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden rounded-2xl font-medium transition-all duration-300 ${baseClass} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <motion.div
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) =>
              `radial-gradient(circle at ${gx} ${gy}, ${glowColor}, transparent 50%)`,
          ),
        }}
        whileHover={{ opacity: 1 }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
