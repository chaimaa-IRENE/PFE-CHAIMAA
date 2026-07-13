import React from "react";
import { motion } from "framer-motion";

interface FormSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
  label, checked, onChange, description, disabled, size = "md", className = "",
}) => {
  const w = size === "sm" ? "w-9" : "w-11";
  const h = size === "sm" ? "h-5" : "h-6";
  const dot = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
  const translate = size === "sm" ? 16 : 20;

  return (
    <motion.label
      className={`flex items-center gap-3 group ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative ${w} ${h} rounded-full transition-colors duration-300 flex-shrink-0
          ${checked
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            : "bg-white/[0.08] border border-white/[0.06]"
          }
        `}
      >
        <motion.span
          className={`absolute top-1/2 left-[3px] ${dot} rounded-full bg-white shadow-sm`}
          animate={{
            x: checked ? translate : 0,
            y: "-50%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#f1f5f9] font-medium">{label}</span>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </motion.label>
  );
};
