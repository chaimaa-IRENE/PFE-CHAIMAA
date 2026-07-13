import React from "react";
import { motion } from "framer-motion";

interface PremiumSkeletonProps {
  className?: string;
  rounded?: string;
}

export const SkeletonShimmer: React.FC<PremiumSkeletonProps> = ({
  className = "",
  rounded = "rounded-xl",
}) => (
  <div
    className={`relative overflow-hidden bg-white/[0.03] ${rounded} ${className}`}
  >
    <div
      className="absolute inset-0 animate-shimmer"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        backgroundSize: "200% 100%",
      }}
    />
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="glass-strong rounded-3xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <SkeletonShimmer className="h-10 w-10" rounded="rounded-2xl" />
      <SkeletonShimmer className="h-4 w-20" />
    </div>
    <SkeletonShimmer className="h-8 w-32" />
    <SkeletonShimmer className="h-3 w-full" />
    <SkeletonShimmer className="h-3 w-2/3" />
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="glass-strong rounded-3xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <SkeletonShimmer className="h-5 w-40" />
      <SkeletonShimmer className="h-8 w-8" rounded="rounded-lg" />
    </div>
    <div className="flex items-end gap-2 h-48">
      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 45].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 bg-white/[0.04] rounded-t-lg"
        />
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="glass-strong rounded-3xl overflow-hidden">
    <div className="p-4 border-b border-white/5">
      <SkeletonShimmer className="h-5 w-48" />
    </div>
    <div className="divide-y divide-white/5">
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="p-4 flex gap-4">
          {[...Array(cols)].map((_, c) => (
            <SkeletonShimmer
              key={c}
              className="h-4 flex-1"
              rounded="rounded-md"
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
    <SkeletonTable />
  </div>
);
