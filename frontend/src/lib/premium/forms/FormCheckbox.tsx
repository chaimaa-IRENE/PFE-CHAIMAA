import React from "react";
import { motion } from "framer-motion";

interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label, checked, onChange, description, disabled, className = "",
}) => (
  <motion.label
    className={`flex items-start gap-3 group ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    initial={{ opacity: 0, x: -4 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
    whileTap={!disabled ? { scale: 0.98 } : {}}
  >
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0 mt-0.5
        transition-all duration-300
        ${checked
          ? "bg-gradient-to-br from-blue-500 to-indigo-500 border-0 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
          : "bg-white/[0.04] border-[1.5px] border-white/[0.12] hover:border-white/[0.2]"
        }
      `}
    >
      <motion.svg
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        <polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </button>
    <div className="flex-1 min-w-0">
      <span className="text-sm text-[#f1f5f9] font-medium">{label}</span>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
  </motion.label>
);
