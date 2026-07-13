import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { toastVariants } from "./animations";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useCallback((() => {
    let id = 0;
    return () => ++id;
  })(), []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = idRef();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [idRef]);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    warning: (msg: string) => addToast(msg, "warning"),
    info: (msg: string) => addToast(msg, "info"),
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const styles: Record<ToastType, { border: string; bg: string; glow: string }> = {
    success: { border: "border-emerald-500/20", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/5" },
    error: { border: "border-rose-500/20", bg: "bg-rose-500/10", glow: "shadow-rose-500/5" },
    warning: { border: "border-amber-500/20", bg: "bg-amber-500/10", glow: "shadow-amber-500/5" },
    info: { border: "border-blue-500/20", bg: "bg-blue-500/10", glow: "shadow-blue-500/5" },
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const s = styles[t.type];
            return (
              <motion.div
                key={t.id}
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
                  shadow-xl shadow-black/20 ${s.glow} min-w-[340px] ${s.bg} ${s.border} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
                <span className="relative">{icons[t.type]}</span>
                <p className="flex-1 text-sm font-medium text-gray-200 relative">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-gray-300 transition-colors relative">
                  <X className="w-4 h-4" />
                </button>
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full origin-left"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
