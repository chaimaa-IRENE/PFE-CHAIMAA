import React, { useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./PremiumCard.css";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "glass" | "gradient" | "outlined" | "elevated";
  hover3D?: boolean;
  glow?: boolean;
  float?: boolean;
  loading?: boolean;
  onClick?: () => void;
  gradient?: string;
  intensity?: "low" | "medium" | "high";
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const intensityConfig = {
  low: { maxDeg: 4, hoverScale: 1.01, floatHeight: 4, glowSize: 600 },
  medium: { maxDeg: 8, hoverScale: 1.02, floatHeight: 8, glowSize: 800 },
  high: { maxDeg: 12, hoverScale: 1.03, floatHeight: 12, glowSize: 1000 },
};

const variantStyles: Record<string, string> = {
  glass:
    "bg-[#121B2D]/80 backdrop-blur-xl border border-white/[0.06] shadow-xl shadow-black/10",
  gradient:
    "bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-purple-600/15 border border-white/[0.08] shadow-xl shadow-black/10",
  outlined: "bg-transparent border-2 border-white/10 shadow-lg shadow-black/5",
  elevated: "bg-[#121B2D] shadow-2xl shadow-black/25",
};

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className = "",
  variant = "glass",
  hover3D = true,
  glow = true,
  float: enableFloat = false,
  loading = false,
  onClick,
  gradient,
  intensity = "medium",
}) => {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const config = intensityConfig[intensity];
  const disabled3D = reducedMotion || !hover3D;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (glow && !reducedMotion) {
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setGlowPosition({ x, y });
      }

      if (hover3D && !reducedMotion) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rotateY =
          ((e.clientX - centerX) / (rect.width / 2)) * config.maxDeg;
        const rotateX =
          -((e.clientY - centerY) / (rect.height / 2)) * config.maxDeg;
        setRotation({ x: rotateX, y: rotateY });
      }
    },
    [glow, hover3D, reducedMotion, config.maxDeg]
  );

  const handleMouseLeave = useCallback(() => {
    if (hover3D && !reducedMotion) {
      setRotation({ x: 0, y: 0 });
    }
  }, [hover3D, reducedMotion]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClick) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = idRef.current++;
        setRipples((prev) => [...prev, { x, y, id }]);
        setTimeout(
          () => setRipples((prev) => prev.filter((r) => r.id !== id)),
          600
        );
      }
      onClick();
    },
    [onClick]
  );

  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-white/[0.04] overflow-hidden ${className}`}
      >
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl premium-card-shimmer animate-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 rounded-lg premium-card-shimmer animate-shimmer" />
              <div className="h-3 w-1/2 rounded-lg premium-card-shimmer animate-shimmer" />
            </div>
          </div>
          <div className="h-24 w-full rounded-xl premium-card-shimmer animate-shimmer mt-4" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-lg premium-card-shimmer animate-shimmer" />
            <div className="h-8 w-20 rounded-lg premium-card-shimmer animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  const floatAnimation =
    enableFloat && !reducedMotion
      ? {
          y: [0, -config.floatHeight, 0],
          transition: {
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        }
      : undefined;

  const hasBorderOverlay = !reducedMotion && (variant === "glass" || variant === "gradient");
  const borderClass =
    variant === "gradient"
      ? "premium-card-border-gradient-reverse"
      : "premium-card-border-gradient";

  return (
    <div className="relative" style={{ perspective: "1000px" }}>
      <motion.div
        ref={cardRef}
        className={`group relative overflow-hidden rounded-2xl ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={{
          rotateX: disabled3D ? 0 : rotation.x,
          rotateY: disabled3D ? 0 : rotation.y,
        }}
        animate={floatAnimation}
        whileHover={
          !reducedMotion
            ? {
                scale: config.hoverScale,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }
            : undefined
        }
        whileTap={onClick && !reducedMotion ? { scale: 0.98 } : undefined}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className={`relative z-[1] ${variantStyles[variant]}`}>
          {glow && !reducedMotion && (
            <div
              className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(${config.glowSize}px circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(37, 99, 235, 0.08), transparent 40%)`,
              }}
              aria-hidden="true"
            />
          )}

          <div className="relative z-10">{children}</div>

          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{
                scale: 0,
                opacity: 0.4,
                x: ripple.x - 10,
                y: ripple.y - 10,
              }}
              animate={{ scale: 5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-5 h-5 bg-white/20 rounded-full pointer-events-none"
            />
          ))}
        </div>

        {hasBorderOverlay && (
          <div
            className={borderClass}
            style={
              gradient
                ? ({ background: gradient } as React.CSSProperties)
                : undefined
            }
            aria-hidden="true"
          />
        )}
      </motion.div>
    </div>
  );
};
