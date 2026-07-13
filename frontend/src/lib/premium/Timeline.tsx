import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, XCircle, Circle } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  status: "done" | "in-progress" | "pending" | "error" | "cancelled";
  description?: string;
  icon?: React.ReactNode;
  metadata?: { label: string; value: string }[];
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusConfig = {
  done: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    line: "bg-emerald-500/20",
  },
  "in-progress": {
    icon: <Clock className="w-4 h-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    line: "bg-blue-500/20",
  },
  pending: {
    icon: <Circle className="w-4 h-4" />,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/15",
    line: "bg-slate-500/10",
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    line: "bg-rose-500/20",
  },
  cancelled: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-slate-500",
    bg: "bg-slate-500/5",
    border: "border-slate-500/10",
    line: "bg-slate-500/5",
  },
};

export const Timeline: React.FC<TimelineProps> = ({ items, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent" />

      {items.map((item, i) => {
        const cfg = statusConfig[item.status];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            <motion.div
              className={`relative z-10 w-9 h-9 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.color} shrink-0`}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {item.icon || cfg.icon}
              {item.status === "in-progress" && (
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 ${cfg.border}`}
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.div
                className={`glass-strong rounded-2xl p-4 ${cfg.border}`}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    {item.subtitle && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {item.date}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{item.description}</p>
                )}

                {item.metadata && item.metadata.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/[0.03]">
                    {item.metadata.map((m, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {m.label}
                        </span>
                        <span className="text-xs font-medium text-slate-300">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
