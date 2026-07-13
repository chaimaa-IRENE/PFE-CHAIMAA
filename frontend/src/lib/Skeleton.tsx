import React from "react";
import { motion } from "framer-motion";

const shimmerEffect = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(59,130,246,0.05) 50%, rgba(255,255,255,0.02) 75%)",
  backgroundSize: "200% 100%",
};

const ShimmerBlock: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`rounded-xl bg-white/[0.03] animate-shimmer ${className}`}
    style={{
      ...shimmerEffect,
      animation: "shimmer 2s ease-in-out infinite",
    }}
  />
);

export const Skeleton: React.FC<{ className?: string; delay?: number }> = ({ className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
    className={`rounded-xl bg-white/[0.04] ${className}`}
    style={shimmerEffect}
  />
);

export const SkeletonCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 22 }}
    className="bg-[#1E293B]/50 rounded-2xl border border-white/[0.04] p-4 space-y-3 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent" />
    <div className="flex items-center gap-3 relative">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  </motion.div>
);

export const SkeletonChart: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#1E293B]/50 rounded-2xl border border-white/[0.04] p-4 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent" />
    <Skeleton className="h-3 w-32 mb-4" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </motion.div>
);

export const SkeletonTable: React.FC<{ rows?: number; delay?: number }> = ({ rows = 5, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#1E293B]/50 rounded-2xl border border-white/[0.04] p-4"
  >
    <Skeleton className="h-3 w-40 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" delay={delay + i * 0.05} />
      ))}
    </div>
  </motion.div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center gap-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-24 rounded-full" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonCard key={i} delay={i * 0.05} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <SkeletonChart key={i} delay={0.1 + i * 0.1} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <SkeletonChart key={i} delay={0.2 + i * 0.08} />
      ))}
    </div>
  </div>
);
