import React from "react";
import { motion } from "framer-motion";
import { fadeInUp, premiumCardHover, glassmorphism } from "./animations";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: "blue" | "emerald" | "amber" | "rose" | "none";
  onClick?: () => void;
  style?: React.CSSProperties;
  title?: string;
  icon?: React.ReactNode;
}

const borderGradients: Record<string, string> = {
  blue: "hover:border-blue-500/20",
  emerald: "hover:border-emerald-500/20",
  amber: "hover:border-amber-500/20",
  rose: "hover:border-rose-500/20",
  none: "",
};

const innerGlows: Record<string, string> = {
  blue: "hover:shadow-[inset_0_1px_0_0_rgba(59,130,246,0.1)]",
  emerald: "hover:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1)]",
  amber: "hover:shadow-[inset_0_1px_0_0_rgba(245,158,11,0.1)]",
  rose: "hover:shadow-[inset_0_1px_0_0_rgba(239,68,68,0.1)]",
  none: "",
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children, className = "", delay = 0, hover = true,
  glow = "none", onClick, style, title, icon,
}) => {
  const glowStyles: Record<string, string> = {
    blue: "hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)]",
    emerald: "hover:shadow-[0_8px_32px_rgba(16,185,129,0.12)]",
    amber: "hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)]",
    rose: "hover:shadow-[0_8px_32px_rgba(239,68,68,0.12)]",
    none: "",
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay, type: "spring", stiffness: 200, damping: 22 }}
      whileHover={hover ? { y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } } : undefined}
      onClick={onClick}
      className={`bg-gradient-to-b from-[#1E293B]/90 to-[#1A2436]/90 backdrop-blur-xl rounded-2xl border border-white/[0.06] transition-all duration-300
        ${hover ? premiumCardHover : ""} 
        ${glowStyles[glow]} 
        ${borderGradients[glow]}
        ${innerGlows[glow]}
        ${onClick ? "cursor-pointer" : ""} 
        ${className}`}
      style={style}
    >
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-blue-400">{icon}</span>}
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      {children}
    </motion.div>
  );
};

export const CardHeader: React.FC<{ title: string; icon?: React.ReactNode; action?: React.ReactNode }> = ({ title, icon, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon && <span className="text-blue-400">{icon}</span>}
      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{title}</h3>
    </div>
    {action}
  </div>
);
