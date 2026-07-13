import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: React.ReactNode;
  className?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  open, onClose, title, description, icon, children, size = "md", footer, className = "",
}) => {
  const widths: Record<string, string> = {
    sm: "max-w-[420px]",
    md: "max-w-[560px]",
    lg: "max-w-[720px]",
    xl: "max-w-[900px]",
    full: "max-w-[95vw]",
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", handler);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handler);
      };
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className={`
              relative w-full ${widths[size]} rounded-[20px]
              bg-[rgba(11,18,32,0.92)] backdrop-blur-xl
              border border-white/[0.06]
              shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]
              overflow-hidden ${className}
            `}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="flex items-start justify-between p-6 pb-0">
              <div className="flex items-start gap-3">
                {icon && (
                  <div className="w-10 h-10 rounded-[12px] bg-blue-500/[0.08] border border-blue-500/[0.1] flex items-center justify-center text-blue-400 flex-shrink-0">
                    {icon}
                  </div>
                )}
                <div>
                  <h2 className="text-[17px] font-semibold text-[#f1f5f9]">{title}</h2>
                  {description && <p className="text-[13px] text-slate-500 mt-1">{description}</p>}
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </motion.button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {footer && (
              <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
