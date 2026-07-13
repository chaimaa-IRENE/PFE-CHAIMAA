import React, { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  className?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label, value, onChange, placeholder, icon, error, success, disabled, readOnly,
  required, rows = 3, maxLength, autoResize = true, className = "",
}) => {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const hasValue = value.length > 0;
  const isFloating = focused || hasValue;

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value, autoResize]);

  return (
    <motion.div
      className={`relative group ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`
          relative rounded-[14px] transition-all duration-300
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}
          ${error
            ? "bg-rose-500/[0.04] border border-rose-500/20"
            : success
              ? "bg-emerald-500/[0.04] border border-emerald-500/20"
              : focused
                ? "bg-[rgba(11,18,32,0.7)] border border-blue-500/30 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
                : "bg-[rgba(11,18,32,0.5)] border border-white/[0.06] hover:border-white/[0.12]"
          }
        `}
        onClick={() => textareaRef.current?.focus()}
      >
        {icon && (
          <span className={`absolute left-4 top-4 transition-colors duration-300 pointer-events-none ${focused ? "text-blue-400" : "text-slate-500"}`}>
            {icon}
          </span>
        )}

        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          maxLength={maxLength}
          placeholder={isFloating ? placeholder : " "}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full bg-transparent outline-none text-[15px] text-[#f1f5f9] font-normal resize-none
            placeholder:text-slate-600 transition-all duration-200
            disabled:cursor-not-allowed font-[Inter,sans-serif]
            ${icon ? "pl-11 pr-4" : "pl-4 pr-4"}
            ${isFloating ? "pt-5 pb-3" : "py-3"}
          `}
          style={{ minHeight: `${rows * 24 + 32}px` }}
          aria-label={label}
          aria-invalid={!!error}
        />

        <motion.label
          htmlFor={id}
          className={`absolute pointer-events-none font-medium top-3.5 ${icon ? "left-11" : "left-4"}`}
          animate={{
            y: isFloating ? -6 : 0,
            scale: isFloating ? 0.75 : 1,
            color: error ? "#f87171" : success ? "#34d399" : focused ? "#60a5fa" : "#64748b",
          }}
          style={{ originX: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </motion.label>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1">
        <AnimatePresence>
          {error && (
            <motion.p
              className="flex items-center gap-1.5 text-xs text-rose-400 font-medium"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {maxLength && (
          <span className={`text-[11px] ml-auto tabular-nums ${value.length > maxLength * 0.9 ? "text-amber-400" : "text-slate-600"}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </motion.div>
  );
};
