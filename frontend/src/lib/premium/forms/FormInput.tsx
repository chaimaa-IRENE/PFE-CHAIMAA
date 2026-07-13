import React, { useState, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "password" | "email" | "number" | "date" | "datetime-local" | "tel";
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  rightElement?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label, value, onChange, type = "text", placeholder, icon, error, success,
  disabled, readOnly, required, autoComplete, className = "", min, max, step,
  rightElement, onFocus, onBlur,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const hasValue = value !== "" && value !== undefined && value !== null;
  const isFloating = focused || hasValue;
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <motion.div
      className={`relative group ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`
          relative flex items-center rounded-[14px] transition-all duration-300
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}
          ${error
            ? "bg-rose-500/[0.04] border border-rose-500/20 shadow-[0_0_0_3px_rgba(239,68,68,0.06)]"
            : success
              ? "bg-emerald-500/[0.04] border border-emerald-500/20 shadow-[0_0_0_3px_rgba(16,185,129,0.06)]"
              : focused
                ? "bg-[rgba(11,18,32,0.7)] border border-blue-500/30 shadow-[0_0_0_3px_rgba(59,130,246,0.08),0_0_20px_rgba(59,130,246,0.04)]"
                : "bg-[rgba(11,18,32,0.5)] border border-white/[0.06] hover:border-white/[0.12]"
          }
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {icon && (
          <span className={`absolute left-4 transition-colors duration-300 pointer-events-none ${
            focused ? "text-blue-400" : error ? "text-rose-400" : success ? "text-emerald-400" : "text-slate-500"
          }`}>
            {icon}
          </span>
        )}

        <input
          ref={inputRef}
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          placeholder={isFloating ? placeholder : " "}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          className={`
            w-full h-[48px] bg-transparent outline-none text-[15px] text-[#f1f5f9] font-normal
            placeholder:text-slate-600 transition-all duration-200
            disabled:cursor-not-allowed font-[Inter,sans-serif]
            ${icon ? "pl-11 pr-4" : "pl-4 pr-4"}
            ${type === "password" || rightElement ? "pr-12" : ""}
            ${isFloating ? "pt-4 pb-1" : "py-3"}
          `}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        <motion.label
          htmlFor={id}
          className={`
            absolute pointer-events-none transition-all duration-200 font-medium
            ${icon ? "left-11" : "left-4"}
          `}
          animate={{
            y: isFloating ? -10 : 0,
            scale: isFloating ? 0.75 : 1,
            color: error ? "#f87171" : success ? "#34d399" : focused ? "#60a5fa" : "#64748b",
          }}
          style={{ originX: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </motion.label>

        {type === "password" && !rightElement && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-md"
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}

        {rightElement && <span className="absolute right-3">{rightElement}</span>}

        {success && !error && (
          <motion.span
            className="absolute right-3 text-emerald-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </motion.span>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs text-rose-400 font-medium"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
