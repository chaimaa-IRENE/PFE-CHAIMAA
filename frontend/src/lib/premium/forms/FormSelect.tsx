import React, { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label, value, onChange, options, icon, error, disabled, required,
  placeholder = "Sélectionner...", searchable = true, className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const selected = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const isFloating = open || !!selected;

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(!open); setFocused(true); } }}
        onBlur={() => setFocused(false)}
        className={`
          relative w-full h-[48px] flex items-center rounded-[14px] text-left transition-all duration-300
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${error
            ? "bg-rose-500/[0.04] border border-rose-500/20"
            : open
              ? "bg-[rgba(11,18,32,0.7)] border border-blue-500/30 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
              : "bg-[rgba(11,18,32,0.5)] border border-white/[0.06] hover:border-white/[0.12]"
          }
        `}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
      >
        {icon && (
          <span className={`absolute left-4 transition-colors duration-300 ${open ? "text-blue-400" : "text-slate-500"}`}>
            {icon}
          </span>
        )}

        <span className={`flex-1 text-[15px] truncate ${icon ? "pl-11" : "pl-4"} pr-10`}>
          {selected ? (
            <span className="text-[#f1f5f9]">{selected.label}</span>
          ) : (
            <span className="text-slate-600">{placeholder}</span>
          )}
        </span>

        <motion.span
          className="absolute right-4 text-slate-500"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.span>

        <motion.label
          className={`absolute pointer-events-none font-medium ${icon ? "left-11" : "left-4"}`}
          animate={{
            y: isFloating ? -10 : 0,
            scale: isFloating ? 0.75 : 1,
            color: error ? "#f87171" : open ? "#60a5fa" : "#64748b",
            opacity: isFloating || !selected ? 1 : 0,
          }}
          style={{ originX: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </motion.label>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute z-50 w-full mt-2 rounded-[14px] bg-[rgba(11,18,32,0.95)] backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
          >
            {searchable && options.length > 5 && (
              <div className="p-2 border-b border-white/[0.04]">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.06] rounded-[10px] text-sm text-[#f1f5f9] placeholder:text-slate-600 outline-none focus:border-blue-500/30"
                  />
                </div>
              </div>
            )}

            <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">Aucun résultat</div>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = opt.value === value;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.15 }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left text-sm transition-all
                        ${isSelected
                          ? "bg-blue-500/10 text-blue-300"
                          : "text-slate-300 hover:bg-white/[0.04] hover:text-[#f1f5f9]"
                        }
                      `}
                    >
                      {opt.icon && <span className="w-5 h-5 flex-shrink-0">{opt.icon}</span>}
                      <span className="flex-1 truncate">{opt.label}</span>
                      {isSelected && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-blue-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs text-rose-400 font-medium"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
