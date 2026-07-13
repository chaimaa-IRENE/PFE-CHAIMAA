import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  value?: File | File[] | null;
  preview?: string | string[] | null;
  onChange: (files: FileList | null) => void;
  onRemove?: (index?: number) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  error?: string;
  className?: string;
  capture?: "user" | "environment";
}

export const FormUpload: React.FC<FormUploadProps> = ({
  label, accept = "image/*", multiple, preview, onChange, onRemove,
  disabled, maxSizeMB = 10, error, className = "", capture,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = preview ? (Array.isArray(preview) ? preview : [preview]) : [];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled && e.dataTransfer.files.length > 0) onChange(e.dataTransfer.files);
  }, [disabled, onChange]);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{label}</p>

      <motion.div
        className={`
          relative rounded-[14px] border-2 border-dashed transition-all duration-300 overflow-hidden
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${error
            ? "border-rose-500/30 bg-rose-500/[0.03]"
            : dragOver
              ? "border-blue-500/40 bg-blue-500/[0.04] shadow-[0_0_20px_rgba(59,130,246,0.08)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]"
          }
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        whileHover={!disabled ? { scale: 1.005 } : {}}
        whileTap={!disabled ? { scale: 0.995 } : {}}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          capture={capture}
          onChange={(e) => onChange(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {previews.length > 0 ? (
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <motion.div
                  key={i}
                  className="relative group rounded-[10px] overflow-hidden w-20 h-20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {onRemove && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                        className="w-7 h-7 rounded-full bg-rose-500/80 flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              <div className="w-20 h-20 rounded-[10px] border border-dashed border-white/[0.08] flex items-center justify-center text-slate-600 hover:text-slate-600 dark:text-slate-400 hover:border-white/[0.15] transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <motion.div
              className="w-12 h-12 rounded-[14px] bg-blue-500/[0.06] border border-blue-500/[0.1] flex items-center justify-center mb-3"
              animate={dragOver ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? "#60a5fa" : "#64748b"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </motion.div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              {dragOver ? "Déposer ici" : "Glisser-déposer ou cliquer"}
            </p>
            <p className="text-[11px] text-slate-600">
              {accept.includes("image") ? "PNG, JPG, WEBP" : accept} - Max {maxSizeMB}MB
            </p>
          </div>
        )}
      </motion.div>

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
