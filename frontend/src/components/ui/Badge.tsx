import React from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SemanticVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium';

/**
 * Legacy domain-specific variants kept for backward compatibility.
 * They map internally to the semantic palette.
 */
type LegacyVariant =
  | 'en-cours'
  | 'cloture'
  | 'en-attente'
  | 'en-validation'
  | 'retourne'
  | 'refuse'
  | 'sla-depasse'
  | 'secondary';

type BadgeVariant = SemanticVariant | LegacyVariant;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  /** @deprecated Use default framer entrance. Kept for backward compat. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Colour map
// ---------------------------------------------------------------------------

interface BadgeTheme {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const THEMES: Record<SemanticVariant, BadgeTheme> = {
  default: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  danger: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
  },
  premium: {
    bg: 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    dot: 'bg-violet-400',
  },
};

const LEGACY_MAP: Record<LegacyVariant, SemanticVariant> = {
  'en-cours': 'info',
  'cloture': 'success',
  'en-attente': 'warning',
  'en-validation': 'premium',
  'retourne': 'warning',
  'refuse': 'danger',
  'sla-depasse': 'danger',
  'secondary': 'default',
};

function resolveTheme(v: BadgeVariant): BadgeTheme {
  if (v in THEMES) return THEMES[v as SemanticVariant];
  return THEMES[LEGACY_MAP[v as LegacyVariant]];
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  animated = true,
}) => {
  const theme = resolveTheme(variant);

  const inner = (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide border',
        'transition-colors duration-200',
        theme.bg,
        theme.text,
        theme.border,
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={`absolute inset-0 rounded-full ${theme.dot} opacity-60 animate-ping`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${theme.dot}`} />
        </span>
      )}
      {children}
    </span>
  );

  if (!animated) return inner;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className="inline-block"
    >
      {inner}
    </motion.span>
  );
};

export default Badge;
