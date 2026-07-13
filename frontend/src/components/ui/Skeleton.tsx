import React from 'react';

// ---------------------------------------------------------------------------
// Base Skeleton
// ---------------------------------------------------------------------------

interface SkeletonProps {
  className?: string;
  rounded?: string;
  style?: React.CSSProperties;
  /** @deprecated Legacy prop kept for compat. Use className instead. */
  variant?: 'text' | 'rectangular' | 'circular';
  /** @deprecated Use className width. */
  width?: string | number;
  /** @deprecated Use className height. */
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  rounded,
  style: styleProp,
  width,
  height,
}) => {
  const style: React.CSSProperties = { ...styleProp };
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={[
        'bg-[#111827]',
        'bg-gradient-to-r from-transparent via-white/[0.03] to-transparent',
        'bg-[length:200%_100%] animate-shimmer',
        rounded ?? 'rounded-lg',
        className,
      ].join(' ')}
      style={style}
    />
  );
};

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => (
  <div
    className={[
      'rounded-[28px] overflow-hidden',
      'bg-[rgba(11,18,32,0.6)] backdrop-blur-[30px]',
      'border border-white/[0.08]',
      'p-6 space-y-4',
    ].join(' ')}
  >
    {/* Header row: circle + title block */}
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 shrink-0" rounded="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
        <Skeleton className="h-2.5 w-1/3" rounded="rounded-md" />
      </div>
    </div>

    {/* Body lines */}
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-2.5"
        rounded="rounded-md"
        style={{
          width: `${85 - i * 12}%`,
        } as any}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// SkeletonTable
// ---------------------------------------------------------------------------

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  cols = 4,
}) => (
  <div
    className={[
      'rounded-[28px] overflow-hidden',
      'bg-[rgba(11,18,32,0.6)] backdrop-blur-[30px]',
      'border border-white/[0.08]',
      'p-6',
    ].join(' ')}
  >
    {/* Header */}
    <div className="flex gap-4 mb-4 pb-4 border-b border-white/[0.06]">
      {Array.from({ length: cols }).map((_, c) => (
        <Skeleton
          key={`h-${c}`}
          className="h-3 flex-1"
          rounded="rounded-md"
        />
      ))}
    </div>

    {/* Rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={`r-${r}-c-${c}`}
              className="h-2.5 flex-1"
              rounded="rounded-md"
              style={{ width: c === 0 ? '60%' : c % 2 === 0 ? '80%' : '45%' } as any}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// SkeletonKPI
// ---------------------------------------------------------------------------

export const SkeletonKPI: React.FC = () => (
  <div
    className={[
      'rounded-[28px] overflow-hidden',
      'bg-[rgba(11,18,32,0.6)] backdrop-blur-[30px]',
      'border border-white/[0.08]',
      'p-6 flex items-start gap-4',
    ].join(' ')}
  >
    {/* Icon circle */}
    <Skeleton className="w-12 h-12 shrink-0" rounded="rounded-2xl" />

    <div className="flex-1 space-y-3">
      {/* Number */}
      <Skeleton className="h-6 w-24" rounded="rounded-lg" />
      {/* Label */}
      <Skeleton className="h-2.5 w-20" rounded="rounded-md" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Default export (backward compat)
// ---------------------------------------------------------------------------

export default Skeleton;
