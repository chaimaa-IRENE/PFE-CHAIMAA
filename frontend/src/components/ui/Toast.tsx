import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toastVariants } from '../../lib/animations';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed top-4 right-4 z-50 backdrop-blur-xl border rounded-xl shadow-2xl shadow-black/20 flex items-center gap-3 px-4 py-3 min-w-[320px] ${typeStyles[type]}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent rounded-xl" />
          <span className="relative">{icons[type]}</span>
          <span className="font-medium text-sm flex-1 relative">{message}</span>
          <button onClick={() => { setIsVisible(false); onClose?.(); }} className="text-gray-500 hover:text-gray-300 transition-colors relative">
            <X className="w-4 h-4" />
          </button>
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            style={{ originX: 0 }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
