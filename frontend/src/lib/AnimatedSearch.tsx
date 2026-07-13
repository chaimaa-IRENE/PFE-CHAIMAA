import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { spring, fadeInUp, fastStagger, scaleInSmall } from "./animations";

interface AnimatedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  results?: { key: string; label: string; highlight?: string }[];
  onSelect?: (key: string) => void;
  className?: string;
}

export const AnimatedSearch: React.FC<AnimatedSearchProps> = ({
  value, onChange, placeholder = "Rechercher...",
  results = [], onSelect, className = "",
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-blue-500/30 text-blue-200 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const showResults = focused && value.trim().length > 0;
  const filtered = results.filter(r =>
    r.label.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={focused ? { scale: 1.02 } : { scale: 1 }}
        transition={spring}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-[#1E293B] border border-white/10 rounded-xl text-sm text-gray-200
            placeholder:text-gray-600 outline-none transition-colors focus:border-blue-500/40 focus:bg-[#1E293B]"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={spring}
              onClick={() => { onChange(""); inputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showResults && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={spring}
            className="absolute top-full mt-1 left-0 right-0 bg-[#1E293B] border border-white/10 rounded-xl
              shadow-2xl shadow-black/30 overflow-hidden z-50"
          >
            <motion.div variants={fastStagger} initial="hidden" animate="visible">
              {filtered.map(r => (
                <motion.button
                  key={r.key}
                  variants={scaleInSmall}
                  onMouseDown={() => { onSelect?.(r.key); onChange(r.label); setFocused(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5
                    transition-colors flex items-center gap-2"
                >
                  <Search className="w-3 h-3 text-gray-600 shrink-0" />
                  <span>{highlightMatch(r.label, value)}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
