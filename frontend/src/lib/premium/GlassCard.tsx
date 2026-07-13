import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hover = true,
  glow = false,
  onClick,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : undefined}
      onClick={onClick}
      className={`
        relative rounded-3xl glass-strong p-6
        ${glow ? "shadow-glow" : "shadow-premium"}
        ${hover ? "cursor-pointer transition-shadow duration-300 hover:shadow-glow" : ""}
        ${className}
      `}
    >
      <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-br from-white/[0.03] to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
