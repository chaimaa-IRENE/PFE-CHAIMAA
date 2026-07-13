import React from "react";
import { motion } from "framer-motion";
import { Truck, Wrench, Search, FileText, Bell } from "lucide-react";

interface PremiumEmptyStateProps {
  type?: "truck" | "maintenance" | "search" | "documents" | "notifications" | "custom";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const illustrations: Record<string, { icon: React.ReactNode; gradient: string }> = {
  truck: {
    icon: <Truck className="w-12 h-12" />,
    gradient: "from-blue-500/10 to-indigo-500/5",
  },
  maintenance: {
    icon: <Wrench className="w-12 h-12" />,
    gradient: "from-amber-500/10 to-orange-500/5",
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    gradient: "from-violet-500/10 to-purple-500/5",
  },
  documents: {
    icon: <FileText className="w-12 h-12" />,
    gradient: "from-emerald-500/10 to-teal-500/5",
  },
  notifications: {
    icon: <Bell className="w-12 h-12" />,
    gradient: "from-rose-500/10 to-pink-500/5",
  },
  custom: {
    icon: <Truck className="w-12 h-12" />,
    gradient: "from-blue-500/10 to-indigo-500/5",
  },
};

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  type = "truck",
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}) => {
  const illust = illustrations[type] || illustrations.custom;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <motion.div
        className={`relative mb-6 w-24 h-24 rounded-3xl bg-gradient-to-br ${illust.gradient} flex items-center justify-center text-blue-400`}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-3xl blur-xl bg-blue-500/5 animate-pulse-glow" />
        <div className="relative z-10">{icon || illust.icon}</div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-semibold text-white mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6"
      >
        {description}
      </motion.p>

      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onAction}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-blue-500/80 to-blue-600/80 text-white text-sm font-medium shadow-glow-blue hover:shadow-glow-blue-strong transition-shadow"
        >
          {actionLabel}
        </motion.button>
      )}

      <svg
        className="absolute bottom-0 left-0 right-0 w-full opacity-5 pointer-events-none"
        height="40"
        viewBox="0 0 800 40"
        fill="none"
      >
        <path
          d="M0 35 Q200 10 400 35 T800 35"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M0 35 Q200 15 400 35 T800 35"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </motion.div>
  );
};
