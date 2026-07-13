import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'gradient' | 'outlined';
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  index?: number;
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  glass:
    'bg-[rgba(11,18,32,0.6)] backdrop-blur-[30px] border border-white/[0.08]',
  solid:
    'bg-[#0B1220] border border-white/[0.06]',
  gradient:
    'bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] border border-white/[0.08]',
  outlined:
    'bg-transparent border border-white/[0.12]',
};

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  hover = false,
  glow = false,
  padding = 'none',
  onClick,
  disabled = false,
  id,
  ariaLabel,
  index = 0,
  style,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  // --- 3D hover values ---
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springCfg = { stiffness: 250, damping: 25, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), springCfg);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), springCfg);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (hover) {
        mx.set(px);
        my.set(py);
      }
      if (glow) {
        setGlowPos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    },
    [hover, glow, mx, my],
  );

  const handleMouseLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      ref={cardRef}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        type: 'spring',
        stiffness: 160,
        damping: 22,
      }}
      whileHover={
        hover && !disabled
          ? {
              y: -4,
              scale: 1.01,
              boxShadow:
                '0 20px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
            }
          : undefined
      }
      whileTap={onClick && !disabled ? { scale: 0.985 } : undefined}
      style={{
        perspective: 800,
        rotateX: hover ? rotateX : 0,
        rotateY: hover ? rotateY : 0,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      className={[
        'rounded-[28px] overflow-hidden relative',
        'shadow-premium transition-colors duration-300',
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        onClick && !disabled ? 'cursor-pointer select-none' : '',
        disabled ? 'opacity-50 pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={disabled ? undefined : onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {/* Inner top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />

      {/* Cursor-follow glow */}
      {glow && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(37,99,235,0.08), transparent 60%)`,
            opacity: 1,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default Card;
