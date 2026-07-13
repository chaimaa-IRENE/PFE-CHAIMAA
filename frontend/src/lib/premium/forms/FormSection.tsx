import React from "react";
import { motion } from "framer-motion";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  index?: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
  accentColor?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title, description, icon, children, className = "", index = 0,
  accentColor = "blue",
}) => {
  const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    blue: { bg: "from-blue-500/8 to-transparent", border: "border-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.06)]" },
    emerald: { bg: "from-emerald-500/8 to-transparent", border: "border-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.06)]" },
    violet: { bg: "from-violet-500/8 to-transparent", border: "border-violet-500/10", text: "text-violet-400", glow: "shadow-[0_0_20px_rgba(139,92,246,0.06)]" },
    amber: { bg: "from-amber-500/8 to-transparent", border: "border-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.06)]" },
    rose: { bg: "from-rose-500/8 to-transparent", border: "border-rose-500/10", text: "text-rose-400", glow: "shadow-[0_0_20px_rgba(239,68,68,0.06)]" },
  };
  const c = colors[accentColor] || colors.blue;

  return (
    <motion.section
      className={`relative rounded-[20px] bg-[rgba(11,18,32,0.5)] backdrop-blur-xl border border-white/[0.06] overflow-hidden ${c.glow} ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${c.bg} pointer-events-none`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />

      <div className="relative p-6">
        <div className="flex items-start gap-4 mb-5">
          {icon && (
            <motion.div
              className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center ${c.text} flex-shrink-0`}
              whileHover={{ scale: 1.05, rotate: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {icon}
            </motion.div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[#f1f5f9] leading-tight">{title}</h3>
            {description && (
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </motion.section>
  );
};
