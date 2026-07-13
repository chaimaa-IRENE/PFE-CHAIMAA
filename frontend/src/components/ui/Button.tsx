import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

// ---------------------------------------------------------------------------
// Ripple helper
// ---------------------------------------------------------------------------

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

let rippleId = 0;

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`animate-spin ${className}`}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="2.5"
    />
    <path
      d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: [
    'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white',
    'shadow-[0_0_20px_rgba(37,99,235,0.25),0_1px_3px_rgba(0,0,0,0.3)]',
    'hover:shadow-[0_0_30px_rgba(37,99,235,0.35),0_4px_12px_rgba(0,0,0,0.3)]',
    'focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D]',
  ].join(' '),

  secondary: [
    'bg-[rgba(11,18,32,0.6)] backdrop-blur-[20px] text-[#e2e8f0]',
    'border border-white/[0.08]',
    'hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(37,99,235,0.1)]',
    'focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D]',
  ].join(' '),

  ghost: [
    'bg-transparent text-[#94a3b8]',
    'hover:bg-white/[0.04] hover:text-[#e2e8f0]',
    'focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D]',
  ].join(' '),

  danger: [
    'bg-gradient-to-r from-[#e11d48] to-[#ef4444] text-white',
    'shadow-[0_0_20px_rgba(239,68,68,0.2),0_1px_3px_rgba(0,0,0,0.3)]',
    'hover:shadow-[0_0_30px_rgba(239,68,68,0.3),0_4px_12px_rgba(0,0,0,0.3)]',
    'focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D]',
  ].join(' '),
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const isDisabled = disabled || loading;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;

      // Ripple
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        const size = Math.max(rect.width, rect.height) * 2;
        const id = ++rippleId;
        setRipples((prev) => [
          ...prev,
          { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
        ]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      }

      onClick?.(e);
    },
    [isDisabled, onClick],
  );

  return (
    <motion.button
      ref={btnRef}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      whileHover={!isDisabled ? { scale: 1.01, y: -1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={[
        // Base
        'relative inline-flex items-center justify-center',
        'rounded-[14px] font-semibold tracking-[-0.01em]',
        'outline-none transition-all duration-200',
        'overflow-hidden select-none',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant + Size
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Shimmer overlay (primary & danger) */}
      {(variant === 'primary' || variant === 'danger') && !isDisabled && (
        <span
          className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
            backgroundSize: '250% 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      )}

      {/* Inner top highlight */}
      {(variant === 'primary' || variant === 'danger') && (
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}

      {/* Ripple layer */}
      <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[14px]">
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0.35, scale: 0 }}
              animate={{ opacity: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute rounded-full bg-white/20"
              style={{
                width: r.size,
                height: r.size,
                left: r.x,
                top: r.y,
              }}
            />
          ))}
        </AnimatePresence>
      </span>

      {/* Content */}
      <span className="relative z-10 inline-flex items-center justify-center gap-inherit">
        {loading ? (
          <>
            <Spinner className="shrink-0" />
            <span className="opacity-70">...</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
            {children}
            {iconRight && <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4">{iconRight}</span>}
          </>
        )}
      </span>
    </motion.button>
  );
};

export default Button;
