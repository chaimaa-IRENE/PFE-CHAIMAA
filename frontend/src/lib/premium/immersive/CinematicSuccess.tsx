import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { soundManager } from "../SoundManager";

interface CinematicSuccessProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  type?: "inspection" | "declaration" | "repair";
  onComplete?: () => void;
  autoCloseMs?: number;
}

export const CinematicSuccess: React.FC<CinematicSuccessProps> = ({
  show, title = "Inspection terminée", subtitle = "Le rapport a été envoyé",
  type = "inspection", onComplete, autoCloseMs = 4000,
}) => {
  const fireConfetti = useCallback(() => {
    const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#10b981", "#34d399"];
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.65 }, colors, disableForReducedMotion: true, scalar: 0.7, gravity: 0.9, ticks: 180 });
    setTimeout(() => {
      confetti({ particleCount: 30, spread: 90, origin: { y: 0.55, x: 0.3 }, colors, disableForReducedMotion: true, scalar: 0.5, ticks: 120 });
      confetti({ particleCount: 30, spread: 90, origin: { y: 0.55, x: 0.7 }, colors, disableForReducedMotion: true, scalar: 0.5, ticks: 120 });
    }, 300);
  }, []);

  useEffect(() => {
    if (show) {
      soundManager.success();
      const t1 = setTimeout(fireConfetti, 600);
      const t2 = autoCloseMs ? setTimeout(() => onComplete?.(), autoCloseMs) : null;
      return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
    }
  }, [show, fireConfetti, onComplete, autoCloseMs]);

  const icons = {
    inspection: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    declaration: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
    repair: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          style={{ background: "radial-gradient(ellipse at center, #0d1520, #030508)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Road animation */}
          <div className="absolute bottom-0 left-0 right-0 h-[15%] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />
            {[...Array(15)].map((_, i) => (
              <motion.div key={i}
                className="absolute top-[35%] h-[2px] rounded-full bg-slate-700/30"
                style={{ left: `${i * 7}%`, width: "4%" }}
                animate={{ x: [400, -400] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.04, ease: "linear" as const }}
              />
            ))}
          </div>

          {/* Truck departing */}
          <motion.div
            className="absolute bottom-[12%] pointer-events-none"
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: [0, 100, 800], opacity: [1, 1, 0], scale: [1, 1, 0.8] }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], times: [0, 0.3, 1] }}
          >
            <svg width="300" height="150" viewBox="0 0 340 170" fill="none" opacity="0.15">
              <rect x="8" y="28" width="195" height="82" rx="6" fill="#1e3a5f"/>
              <rect x="195" y="22" width="108" height="88" rx="8" fill="#1a2d45"/>
              <circle cx="75" cy="120" r="18" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/>
              <circle cx="255" cy="120" r="18" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/>
              <circle cx="340" cy="52" r="14" fill="rgba(251,191,36,0.4)"/>
              <circle cx="340" cy="68" r="14" fill="rgba(251,191,36,0.4)"/>
            </svg>
          </motion.div>

          {/* Success content */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Success icon */}
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ boxShadow: "0 0 40px rgba(16,185,129,0.3), 0 0 80px rgba(16,185,129,0.1)" }}
            >
              {icons[type]}
            </motion.div>

            <motion.h1
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              {title}
            </motion.h1>

            <motion.p
              className="text-slate-600 dark:text-slate-400 text-sm max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              {subtitle}
            </motion.p>

            {/* Animated check ring */}
            <motion.div
              className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.5], opacity: [0.5, 0] }}
              transition={{ delay: 1, duration: 1.5, repeat: 2 }}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </motion.div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(3,5,8,0.7) 100%)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicSuccess;
