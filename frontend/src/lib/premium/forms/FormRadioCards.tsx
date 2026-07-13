import React from "react";
import { motion } from "framer-motion";

interface RadioOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface FormRadioCardsProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  columns?: 2 | 3 | 4;
  disabled?: boolean;
  className?: string;
  accentColor?: string;
}

export const FormRadioCards: React.FC<FormRadioCardsProps> = ({
  label, value, onChange, options, columns = 2, disabled, className = "",
  accentColor = "blue",
}) => {
  const gradients: Record<string, string> = {
    blue: "from-blue-500/10 to-indigo-500/5",
    emerald: "from-emerald-500/10 to-teal-500/5",
    violet: "from-violet-500/10 to-purple-500/5",
    amber: "from-amber-500/10 to-orange-500/5",
    rose: "from-rose-500/10 to-pink-500/5",
  };
  const borders: Record<string, string> = {
    blue: "border-blue-500/30",
    emerald: "border-emerald-500/30",
    violet: "border-violet-500/30",
    amber: "border-amber-500/30",
    rose: "border-rose-500/30",
  };
  const glows: Record<string, string> = {
    blue: "shadow-[0_0_20px_rgba(59,130,246,0.1)]",
    emerald: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    violet: "shadow-[0_0_20px_rgba(139,92,246,0.1)]",
    amber: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    rose: "shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  };
  const texts: Record<string, string> = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  const grad = gradients[accentColor] || gradients.blue;
  const brd = borders[accentColor] || borders.blue;
  const glw = glows[accentColor] || glows.blue;
  const txt = texts[accentColor] || texts.blue;

  const colsClass = columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">{label}</p>}
      <div className={`grid ${colsClass} gap-3`}>
        {options.map((opt, i) => {
          const isSelected = opt.value === value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.value)}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-[14px] text-center
                transition-all duration-300
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${isSelected
                  ? `bg-gradient-to-b ${grad} border ${brd} ${glw}`
                  : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]"
                }
              `}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              whileHover={!disabled ? { y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
            >
              {opt.icon && (
                <span className={`transition-colors duration-300 ${isSelected ? txt : "text-slate-500"}`}>
                  {opt.icon}
                </span>
              )}
              <span className={`text-sm font-medium ${isSelected ? "text-[#f1f5f9]" : "text-slate-600 dark:text-slate-400"}`}>
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-[11px] text-slate-600">{opt.description}</span>
              )}

              {isSelected && (
                <motion.div
                  className={`absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br ${grad.replace("/10", "/40").replace("/5", "/20")} flex items-center justify-center`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
