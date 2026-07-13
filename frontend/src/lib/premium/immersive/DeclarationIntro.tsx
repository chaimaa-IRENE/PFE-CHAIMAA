/**
 * DeclarationIntro - Scène cinématique "panne détectée" pour le chauffeur.
 * Le camion roule → ralentit → warning → fumée → s'arrête → formulaire s'ouvre.
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "../SoundManager";

interface DeclarationIntroProps {
  onComplete: () => void;
  vehicleInfo?: { immatriculation?: string; marque?: string };
  skip?: boolean;
  className?: string;
}

type Phase = "driving" | "slowing" | "warning" | "stopped" | "ready";

export const DeclarationIntro: React.FC<DeclarationIntroProps> = ({
  onComplete, vehicleInfo, skip = false, className = "",
}) => {
  const [phase, setPhase] = useState<Phase>(skip ? "ready" : "driving");

  const advancePhase = useCallback(() => {
    setPhase((p) => {
      switch (p) {
        case "driving": return "slowing";
        case "slowing": return "warning";
        case "warning": return "stopped";
        case "stopped": return "ready";
        default: return p;
      }
    });
  }, []);

  useEffect(() => {
    if (skip) { setPhase("ready"); return; }
    const timers = [
      setTimeout(() => advancePhase(), 1500),   // driving → slowing
      setTimeout(() => advancePhase(), 2800),   // slowing → warning
      setTimeout(() => { advancePhase(); soundManager.error(); }, 3800), // warning → stopped
      setTimeout(() => { advancePhase(); soundManager.notification(); }, 5000), // stopped → ready
    ];
    return () => timers.forEach(clearTimeout);
  }, [skip, advancePhase]);

  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const isMoving = phase === "driving" || phase === "slowing";
  const roadSpeed = phase === "driving" ? 1 : phase === "slowing" ? 0.3 : 0;

  return (
    <AnimatePresence>
      {phase !== "ready" && (
        <motion.div
          className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden ${className}`}
          style={{ background: "radial-gradient(ellipse at 50% 60%, #0d1520, #030508)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Aurora glow shifts to red on warning */}
          <div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none transition-all duration-1000"
            style={{
              top: "-10%", left: "20%", filter: "blur(100px)",
              background: phase === "warning" || phase === "stopped"
                ? "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 60%)"
                : "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)",
            }}
          />

          {/* Road */}
          <div className="absolute bottom-0 left-0 right-0 h-[20%] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {[...Array(15)].map((_, i) => (
              <motion.div key={i}
                className="absolute top-[35%] h-[2px] rounded-full bg-slate-700/15"
                style={{ left: `${i * 7}%`, width: "4%" }}
                animate={roadSpeed > 0 ? { x: [300, -300] } : {}}
                transition={roadSpeed > 0 ? { duration: 1 / roadSpeed, repeat: Infinity, delay: i * 0.05, ease: "linear" as const } : {}}
              />
            ))}
          </div>

          {/* Truck scene */}
          <motion.div
            className="absolute bottom-[18%] left-1/2"
            animate={{
              x: phase === "driving" ? ["-50%"] : phase === "slowing" ? ["-50%"] : "-50%",
            }}
          >
            {/* Truck SVG inline */}
            <svg width="320" height="160" viewBox="0 0 320 160" fill="none">
              {/* Trailer */}
              <rect x="8" y="25" width="185" height="78" rx="5" fill="#0f1d30" stroke={phase === "warning" || phase === "stopped" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.1)"} strokeWidth="1"/>
              <text x="100" y="68" textAnchor="middle" fill="rgba(148,163,184,0.15)" fontSize="11" fontWeight="bold" fontFamily="Inter" letterSpacing="3">SMART FLEET</text>

              {/* Cabin */}
              <rect x="186" y="20" width="100" height="83" rx="7" fill="#0c1625" stroke="rgba(148,163,184,0.06)" strokeWidth="1"/>
              <rect x="195" y="26" width="38" height="32" rx="4" fill="rgba(6,14,26,0.9)"/>
              <rect x="238" y="26" width="35" height="32" rx="4" fill="rgba(6,14,26,0.9)"/>

              {/* Headlights */}
              {(phase !== "stopped") && <>
                <circle cx="288" cy="40" r="12" fill="url(#diHL)"/>
                <rect x="283" y="34" width="6" height="11" rx="2" fill="#fbbf24" opacity="0.7"/>
              </>}
              <defs><radialGradient id="diHL"><stop offset="0%" stopColor="rgba(251,191,36,0.5)"/><stop offset="100%" stopColor="rgba(251,191,36,0)"/></radialGradient></defs>

              {/* Warning lights */}
              {(phase === "warning" || phase === "stopped") && (
                <motion.g animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
                  <rect x="283" y="56" width="6" height="11" rx="2" fill="#ef4444" opacity="0.9"/>
                  <circle cx="288" cy="62" r="10" fill="rgba(239,68,68,0.2)"/>
                </motion.g>
              )}

              {/* Wheels */}
              {isMoving ? (
                <>
                  <motion.g animate={{ rotate: 360 }} transition={{ duration: phase === "slowing" ? 1.5 : 0.4, repeat: Infinity, ease: "linear" as const }} style={{ transformOrigin: "70px 115px" }}>
                    <circle cx="70" cy="115" r="17" fill="#080e18" stroke="#1e3a5f" strokeWidth="2.5"/>
                    <circle cx="70" cy="115" r="12" fill="#0f1d30"/>
                    <circle cx="70" cy="115" r="6" fill="#1e3a5f"/>
                  </motion.g>
                  <motion.g animate={{ rotate: 360 }} transition={{ duration: phase === "slowing" ? 1.5 : 0.4, repeat: Infinity, ease: "linear" as const }} style={{ transformOrigin: "245px 115px" }}>
                    <circle cx="245" cy="115" r="17" fill="#080e18" stroke="#1e3a5f" strokeWidth="2.5"/>
                    <circle cx="245" cy="115" r="12" fill="#0f1d30"/>
                    <circle cx="245" cy="115" r="6" fill="#1e3a5f"/>
                  </motion.g>
                </>
              ) : (
                <>
                  <circle cx="70" cy="115" r="17" fill="#080e18" stroke="#1e3a5f" strokeWidth="2.5"/>
                  <circle cx="70" cy="115" r="12" fill="#0f1d30"/>
                  <circle cx="245" cy="115" r="17" fill="#080e18" stroke="#1e3a5f" strokeWidth="2.5"/>
                  <circle cx="245" cy="115" r="12" fill="#0f1d30"/>
                </>
              )}
            </svg>

            {/* Smoke */}
            {(phase === "warning" || phase === "stopped") && (
              <div className="absolute" style={{ top: "10%", left: "55%" }}>
                {[0, 1, 2, 3].map(i => (
                  <motion.div key={i}
                    className="absolute rounded-full bg-slate-400/10"
                    style={{ width: 5 + i * 2, height: 5 + i * 2, left: i * 8 }}
                    animate={{ y: [0, -30 - i * 15], opacity: [0.15, 0], x: [0, 8 + i * 4] }}
                    transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3, ease: "easeOut" as const }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Warning badge */}
          <AnimatePresence>
            {(phase === "warning" || phase === "stopped") && (
              <motion.div
                className="absolute top-[20%] left-1/2 -translate-x-1/2 z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl"
                  style={{ boxShadow: "0 0 30px rgba(239,68,68,0.15)" }}>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-rose-300">Panne détectée</p>
                    {vehicleInfo?.immatriculation && (
                      <p className="text-xs text-rose-400/60">{vehicleInfo.immatriculation}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase indicator dots */}
          <div className="absolute bottom-8 flex gap-2">
            {["driving", "slowing", "warning", "stopped"].map((p, i) => (
              <motion.div key={p}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: phase === p ? "#f87171" : i < ["driving", "slowing", "warning", "stopped"].indexOf(phase) ? "#475569" : "rgba(255,255,255,0.06)",
                }}
                animate={{
                  scale: phase === p ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: phase === p ? 1 : 0.3, repeat: phase === p ? Infinity : 0 }}
              />
            ))}
          </div>

          {/* Skip button */}
          <motion.button
            className="absolute top-6 right-6 text-xs text-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.03]"
            onClick={() => setPhase("ready")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Passer
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeclarationIntro;
