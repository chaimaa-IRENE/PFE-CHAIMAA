import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AnimationState = "loading" | "success" | "error";

interface TruckAnimationProps {
  state: AnimationState;
  onComplete?: () => void;
  errorMessage?: string;
}

export const TruckAnimation: React.FC<TruckAnimationProps> = ({
  state, onComplete, errorMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "doorOpen" | "lightExpand" | "reveal">("idle");
  const [doorProgress, setDoorProgress] = useState(0);

  // Stable random values for light rays (avoid re-render flicker)
  const rayParams = useMemo(() =>
    [...Array(12)].map(() => ({
      height: 40 + Math.random() * 60,
      dur: 2 + Math.random() * 1.5,
      delay: Math.random() * 0.5,
    })),
  []);

  useEffect(() => {
    if (state === "loading") {
      setPhase("idle");
      setDoorProgress(0);
    }
  }, [state]);

  useEffect(() => {
    if (state !== "success") return;
    setPhase("doorOpen");
    const t1 = setTimeout(() => setDoorProgress(1), 100);
    const t2 = setTimeout(() => setPhase("lightExpand"), 2800);
    const t3 = setTimeout(() => setPhase("reveal"), 3500);
    const t4 = setTimeout(() => onComplete?.(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [state, onComplete]);

  const expansionPhase = phase === "lightExpand" || phase === "reveal";
  const revealPhase = phase === "reveal";

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050a18] overflow-hidden select-none">
      {/* Deep space bg with radial glows */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: state === "loading" ? [1, 1.08, 1] : 1,
          backgroundColor: expansionPhase ? "#0a1628" : "#050a18",
        }}
        transition={{ duration: 4, ease: "easeInOut", repeat: state === "loading" ? Infinity : 0 }}
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${
            state === "error" ? "rgba(239,68,68,0.06)" : "rgba(37,99,235,0.07)"
          } 0%, transparent 60%)`,
        }}
      />

      {/* Light expansion overlay */}
      <AnimatePresence>
        {expansionPhase && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.6, 0.8, 1], scale: [0.3, 0.6, 1.2, 2.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 45%, 
                rgba(59,130,246,0.3) 0%, 
                rgba(99,102,241,0.15) 30%, 
                rgba(37,99,235,0.08) 50%, 
                transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Light rays from door */}
      <AnimatePresence>
        {phase === "doorOpen" && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {rayParams.map((p, i) => (
              <motion.div
                key={i}
                className="absolute bottom-[20%] left-1/2 origin-bottom"
                style={{
                  width: "2px",
                  height: `${p.height}%`,
                  background: `linear-gradient(to top, rgba(251,191,36,0.4), rgba(251,191,36,0), rgba(59,130,246,0))`,
                  transform: `translateX(-50%) rotate(${(i - 6) * 8}deg)`,
                  borderRadius: "50%",
                  filter: "blur(3px)",
                }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard preview cards inside light */}
      <AnimatePresence>
        {revealPhase && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="grid grid-cols-3 gap-3 max-w-lg"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            >
              {[0, 1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="h-16 rounded-xl bg-white/[0.08] backdrop-blur border border-white/10"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow ring behind truck during loading */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
        animate={{
          scale: state === "loading" ? [1, 1.2, 1] : expansionPhase ? [1, 3] : 1,
          opacity: state === "loading" ? [0.06, 0.12, 0.06] : expansionPhase ? [0.15, 0] : 0,
        }}
        transition={state === "loading"
          ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
        }
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 60%)" }}
      />

      {/* Truck container */}
      <motion.div
        className="relative"
        animate={{
          x: phase === "doorOpen" ? 0 : state === "success" && phase === "idle" ? 1500 : 0,
          scale: revealPhase ? 0.6 : 1,
          opacity: revealPhase ? 0 : 1,
        }}
        transition={phase === "doorOpen"
          ? { type: "spring", stiffness: 60, damping: 20 }
          : state === "loading"
          ? { type: "spring", stiffness: 60, damping: 15 }
          : { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
        }
      >
        <motion.div
          animate={state === "loading"
            ? { x: [0, 1.8, -1.2, 1.5, -0.8, 0.6, 0], y: [0, -0.6, 0.4, -0.5, 0.3, -0.2, 0] }
            : state === "error"
            ? { x: [0, -4, 4, -3, 3, -2, 2, 0], y: [0, 1.5, -1, 1, -0.5, 0.5, 0] }
            : {}
          }
          transition={state === "loading"
            ? { duration: 0.1, repeat: Infinity, ease: "linear" }
            : state === "error"
            ? { duration: 0.3, repeat: 3, ease: "easeInOut" }
            : {}
          }
        >
          <svg width="340" height="150" viewBox="0 0 340 150" fill="none" className="drop-shadow-2xl relative z-10">
            <defs>
              <linearGradient id="trailerBlueNew" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="trailerGlowNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(37,99,235,0.08)" />
                <stop offset="50%" stopColor="rgba(37,99,235,0.02)" />
                <stop offset="100%" stopColor="rgba(37,99,235,0.06)" />
              </linearGradient>
              <linearGradient id="interiorGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(251,191,36,0.5)" />
                <stop offset="50%" stopColor="rgba(251,191,36,0.2)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.3)" />
              </linearGradient>
              <filter id="shadowNew">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.4)" />
              </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse cx="170" cy="130" rx="150" ry="10" fill="rgba(0,0,0,0.4)" filter="url(#shadowNew)" />

            {/* Trailer body */}
            <rect x="10" y="30" width="190" height="76" rx="6" fill="url(#trailerBlueNew)" stroke="#3b82f6" strokeWidth="1.5" filter="url(#shadowNew)" />

            {/* Trailer interior glow (visible when door opens) */}
            <motion.rect
              x="12" y="32" width="186" height="72" rx="4"
              fill="url(#interiorGlow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: doorProgress }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Trailer door panel that slides up */}
            <motion.rect
              x="10" y="30" width="190" height="76" rx="6"
              fill="url(#trailerBlueNew)" stroke="#3b82f6" strokeWidth="1.5"
              initial={false}
              animate={{ height: 76 - doorProgress * 76, y: 30 + doorProgress * 30 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Trailer panel lines on door */}
            <motion.rect x="16" y="42" width="178" height="3" rx="1.5" fill="rgba(255,255,255,0.04)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />
            <motion.rect x="16" y="52" width="178" height="3" rx="1.5" fill="rgba(255,255,255,0.02)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />
            <motion.rect x="16" y="62" width="178" height="3" rx="1.5" fill="rgba(255,255,255,0.04)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />
            <motion.rect x="16" y="72" width="178" height="3" rx="1.5" fill="rgba(255,255,255,0.02)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />
            <motion.rect x="16" y="82" width="178" height="3" rx="1.5" fill="rgba(255,255,255,0.04)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />

            {/* Smart Fleet logo */}
            <motion.text x="105" y="80" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="15" fontWeight="bold" fontFamily="system-ui" letterSpacing="3"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            >SMART FLEET</motion.text>

            {/* Reflectors */}
            <motion.rect x="190" y="44" width="8" height="4" rx="1" fill="rgba(239,68,68,0.6)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />
            <motion.rect x="190" y="88" width="8" height="4" rx="1" fill="rgba(239,68,68,0.6)"
              initial={false}
              animate={{ opacity: 1 - doorProgress }}
            />

            {/* Cab */}
            <rect x="197" y="24" width="105" height="82" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" filter="url(#shadowNew)" />

            {/* Windshield */}
            <rect x="207" y="30" width="40" height="36" rx="5" fill="#060e1a" stroke="#334155" strokeWidth="1" />
            <motion.rect x="211" y="32" width="14" height="30" rx="3" fill="rgba(59,130,246,0.06)"
              animate={state === "loading" ? { opacity: [0, 0.12, 0] } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Side window */}
            <rect x="253" y="30" width="38" height="36" rx="5" fill="#060e1a" stroke="#334155" strokeWidth="1" />

            {/* Roof lights */}
            <motion.rect x="230" y="20" width="4" height="5" rx="1.5" fill={state === "error" ? "#ef4444" : "#fbbf24"}
              animate={state === "loading" ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }} />
            <motion.rect x="240" y="20" width="4" height="5" rx="1.5" fill={state === "error" ? "#ef4444" : "#fbbf24"}
              animate={state === "loading" ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }} />
            <motion.rect x="250" y="20" width="4" height="5" rx="1.5" fill={state === "error" ? "#ef4444" : "#fbbf24"}
              animate={state === "loading" ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }} />

            {/* Headlights */}
            <motion.rect x="298" y="36" width="8" height="16" rx="3" fill={state === "error" ? "#ef4444" : "#fbbf24"}
              animate={state === "error" ? { opacity: [1, 0.15, 1, 0.15, 1] } : state === "loading" ? { opacity: [1, 0.7, 1] } : {}}
              transition={state === "error" ? { duration: 0.25, repeat: 4 } : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.rect x="298" y="56" width="8" height="16" rx="3" fill={state === "error" ? "#ef4444" : "#fbbf24"}
              animate={state === "error" ? { opacity: [1, 0.15, 1, 0.15, 1] } : state === "loading" ? { opacity: [1, 0.7, 1] } : {}}
              transition={state === "error" ? { duration: 0.25, repeat: 4, delay: 0.08 } : { duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />

            {/* Grill */}
            <rect x="296" y="78" width="10" height="24" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />

            {/* Bumper */}
            <rect x="300" y="104" width="12" height="8" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />

            {/* Wheels */}
            <g>
              <motion.g
                animate={state === "loading" ? { rotate: 360 } : {}}
                transition={state === "loading" ? { duration: 0.5, repeat: Infinity, ease: "linear" } : {}}
                style={{ transformOrigin: "75px 112px" }}
              >
                <circle cx="75" cy="112" r="18" fill="#0a0f18" stroke="#1e293b" strokeWidth="3" />
                <circle cx="75" cy="112" r="15" fill="#0f172a" />
                <circle cx="75" cy="112" r="10" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                <circle cx="75" cy="112" r="5" fill="#334155" />
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <line key={s} x1="75" y1="112" x2={75 + 12 * Math.cos(s * 60 * Math.PI / 180)} y2={112 + 12 * Math.sin(s * 60 * Math.PI / 180)} stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                ))}
                <circle cx="75" cy="112" r="16" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 6" />
              </motion.g>
              <motion.g
                animate={state === "loading" ? { rotate: 360 } : {}}
                transition={state === "loading" ? { duration: 0.5, repeat: Infinity, ease: "linear", delay: 0.03 } : {}}
                style={{ transformOrigin: "255px 112px" }}
              >
                <circle cx="255" cy="112" r="18" fill="#0a0f18" stroke="#1e293b" strokeWidth="3" />
                <circle cx="255" cy="112" r="15" fill="#0f172a" />
                <circle cx="255" cy="112" r="10" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                <circle cx="255" cy="112" r="5" fill="#334155" />
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <line key={s} x1="255" y1="112" x2={255 + 12 * Math.cos(s * 60 * Math.PI / 180)} y2={112 + 12 * Math.sin(s * 60 * Math.PI / 180)} stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                ))}
                <circle cx="255" cy="112" r="16" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 6" />
              </motion.g>
            </g>

            {/* License plate */}
            <rect x="197" y="106" width="24" height="8" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />
            <text x="209" y="113" textAnchor="middle" fill="#475569" fontSize="5" fontFamily="monospace">SF-2024</text>
          </svg>
        </motion.div>
      </motion.div>

      {/* Status section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: state === "loading" ? 1 : 0, y: state === "loading" ? 0 : -20 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative mb-12 text-center"
      >
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: i === 1 ? "#3b82f6" : i === 0 ? "#60a5fa" : "#2563eb" }}
                  animate={{ y: [0, -6, 0], opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </div>
            <motion.p
              className="text-sm font-medium text-blue-400/70 tracking-wider uppercase"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Connexion en cours
            </motion.p>
          </div>
        )}
      </motion.div>

      {/* Door status - "Porte s'ouvre..." */}
      <AnimatePresence>
        {phase === "doorOpen" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-[18%] text-center"
          >
            <motion.p
              className="text-sm font-medium text-amber-300/80 tracking-wider"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✦ Porte du camion ouverte ✦
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: `linear-gradient(0deg, rgba(5,10,24,1) 0%, rgba(5,10,24,0.8) 40%, transparent 100%)`,
        }}
      />
    </div>
  );
};
