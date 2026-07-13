import React from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  glow?: boolean;
  className?: string;
  /** @deprecated Legacy prop. Use `value` directly (already 0-100). */
  max?: number;
}

// ---------------------------------------------------------------------------
// Colour map
// ---------------------------------------------------------------------------

interface BarTheme {
  gradient: string;
  shadow: string;
  text: string;
}

const THEMES: Record<NonNullable<ProgressBarProps['variant']>, BarTheme> = {
  default: {
    gradient: 'from-[#2563eb] to-[#3b82f6]',
    shadow: '0 0 14px rgba(37,99,235,0.35)',
    text: 'text-blue-400',
  },
  success: {
    gradient: 'from-[#059669] to-[#10b981]',
    shadow: '0 0 14px rgba(16,185,129,0.35)',
    text: 'text-emerald-400',
  },
  warning: {
    gradient: 'from-[#d97706] to-[#f59e0b]',
    shadow: '0 0 14px rgba(245,158,11,0.35)',
    text: 'text-amber-400',
  },
  danger: {
    gradient: 'from-[#dc2626] to-[#ef4444]',
    shadow: '0 0 14px rgba(239,68,68,0.35)',
    text: 'text-rose-400',
  },
};

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  animated = true,
  glow = false,
  className = '',
  max,
}) => {
  // Backward compat: if legacy `max` is provided, compute percentage
  const pct = max && max > 0 ? Math.min((value / max) * 100, 100) : Math.min(Math.max(value, 0), 100);
  const theme = THEMES[variant];

  const fillBar = (
    <motion.div
      className={[
        'h-full rounded-full bg-gradient-to-r',
        theme.gradient,
      ].join(' ')}
      initial={animated ? { width: 0 } : false}
      animate={{ width: `${pct}%` }}
      transition={
        animated
          ? { type: 'spring', stiffness: 60, damping: 18, mass: 1 }
          : { duration: 0 }
      }
      style={glow ? { boxShadow: theme.shadow } : undefined}
    />
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-xs font-medium text-[#94a3b8] tracking-wide">
              {label}
            </span>
          )}
          {showValue && (
            <span className={`text-xs font-bold tabular-nums ${theme.text}`}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={[
          'w-full bg-white/[0.04] rounded-full overflow-hidden',
          SIZE_CLASSES[size],
        ].join(' ')}
      >
        {fillBar}
      </div>
    </div>
  );
};

export default ProgressBar;
