import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { spring, fadeInUp } from "./animations";

interface AnimatedFormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const AnimatedFormField: React.FC<AnimatedFormFieldProps> = ({
  label, value, onChange, type = "text", placeholder = "",
  error, success = false, disabled = false, autoComplete, icon, hint,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const isActive = focused || value.length > 0;
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="relative mb-4"
    >
      <motion.div
        animate={{
          borderColor: error
            ? "rgba(239,68,68,0.5)"
            : success && touched
            ? "rgba(34,197,94,0.5)"
            : focused
            ? "rgba(59,130,246,0.5)"
            : "rgba(51,65,85,1)",
        }}
        transition={spring}
        className="relative bg-[#0f172a] border-2 rounded-xl overflow-hidden"
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
            {icon}
          </div>
        )}

        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full bg-transparent text-sm text-gray-200 outline-none transition-colors
            ${icon ? "pl-10" : "pl-4"} pr-10 pt-5 pb-2
            placeholder:text-gray-600 disabled:opacity-50`}
        />

        <motion.label
          animate={{
            y: isActive ? -8 : 0,
            scale: isActive ? 0.75 : 1,
            color: error
              ? "rgb(239,68,68)"
              : success && touched
              ? "rgb(34,197,94)"
              : focused
              ? "rgb(96,165,250)"
              : "rgb(100,116,139)",
          }}
          transition={spring}
          className={`absolute left-0 top-1/2 -translate-y-1/2 text-sm origin-left pointer-events-none
            ${icon ? "ml-10" : "ml-4"}`}
        >
          {label}
        </motion.label>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={spring}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
              </motion.div>
            )}
            {success && touched && !error && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={spring}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </motion.div>
            )}
          </AnimatePresence>

          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={spring}
            className="flex items-center gap-1 mt-1.5 text-xs text-rose-400"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-xs text-gray-600"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
