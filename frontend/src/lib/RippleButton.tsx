import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface Ripple { x: number; y: number; id: number; }

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glow?: boolean;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children, onClick, className = "", disabled, type = "button",
  variant = "primary", size = "md", loading, glow,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const idRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = idRef.current++;
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }
    onClick?.();
  };

  const variantStyles: Record<string, string> = {
    primary: "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white hover:from-blue-500 hover:via-blue-400 hover:to-indigo-400 shadow-lg shadow-blue-500/15",
    secondary: "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-200 hover:bg-white/5",
    danger: "bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 text-white hover:from-rose-500 hover:via-rose-400 hover:to-red-400 shadow-lg shadow-rose-500/15",
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <motion.button
      ref={btnRef}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.03, boxShadow: glow ? "0 0 30px rgba(59,130,246,0.3)" : undefined }}
      whileTap={{ scale: 0.96 }}
      className={`relative overflow-hidden rounded-xl font-semibold tracking-wide
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} 
        ${glow ? "shadow-[0_0_25px_rgba(59,130,246,0.2)]" : ""} 
        ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
          />
          <span>Chargement...</span>
        </span>
      ) : children}

      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5, x: ripple.x - 10, y: ripple.y - 10 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-5 h-5 bg-white/30 rounded-full pointer-events-none"
        />
      ))}
    </motion.button>
  );
};
