import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface GarageSceneProps {
  children: React.ReactNode;
  phase?: "arriving" | "parked" | "inspecting" | "departing" | "done";
  vehicleInfo?: { immatriculation?: string; marque?: string; chauffeur?: string };
  showTruck?: boolean;
  className?: string;
}

export const GarageScene: React.FC<GarageSceneProps> = ({
  children, phase = "parked", vehicleInfo, showTruck = true, className = "",
}) => {
  const particles = useMemo(() =>
    [...Array(25)].map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random() * 3, delay: Math.random() * 8, dur: 6 + Math.random() * 10,
      opacity: 0.05 + Math.random() * 0.15,
    })), []);

  const lightRays = useMemo(() =>
    [...Array(5)].map((_, i) => ({
      id: i, x: 15 + i * 18, rotation: -15 + i * 8, width: 60 + Math.random() * 80,
      opacity: 0.02 + Math.random() * 0.03, delay: i * 1.5,
    })), []);

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 20%, #0d1520 0%, #060a10 50%, #030508 100%)" }}
    >
      {/* Grid floor */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.015) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to top, black 0%, transparent 60%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 60%)",
        }}
      />

      {/* Aurora orbs */}
      <motion.div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ top: "-15%", left: "10%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)", filter: "blur(80px)" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" as const }}
      />
      <motion.div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ bottom: "10%", right: "5%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 60%)", filter: "blur(80px)" }}
        animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" as const }}
      />

      {/* Light rays */}
      {lightRays.map((ray) => (
        <motion.div key={ray.id} className="absolute top-0 pointer-events-none"
          style={{
            left: `${ray.x}%`, width: ray.width, height: "100%",
            background: `linear-gradient(180deg, rgba(255,255,255,${ray.opacity}) 0%, transparent 70%)`,
            transform: `rotate(${ray.rotation}deg)`, transformOrigin: "top center",
          }}
          animate={{ opacity: [ray.opacity, ray.opacity * 2, ray.opacity] }}
          transition={{ duration: 8, repeat: Infinity, delay: ray.delay, ease: "easeInOut" as const }}
        />
      ))}

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `rgba(147,197,253,${p.opacity})` }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" as const }}
        />
      ))}

      {/* Garage floor reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(59,130,246,0.02) 0%, transparent 100%)" }}
      />

      {/* Truck scene */}
      {showTruck && (
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 pointer-events-none z-[1]">
          <motion.div
            initial={{ x: phase === "arriving" ? -600 : 0, opacity: phase === "arriving" ? 0 : 0.12 }}
            animate={{
              x: phase === "departing" ? 600 : 0,
              opacity: phase === "departing" ? 0 : phase === "inspecting" ? 0.08 : 0.12,
              scale: phase === "inspecting" ? 0.9 : 1,
            }}
            transition={{ duration: phase === "arriving" ? 2 : 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <TruckSilhouette spinning={phase === "arriving" || phase === "departing"} headlights={phase !== "done"} />
          </motion.div>
        </div>
      )}

      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-[12%] overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        {[...Array(12)].map((_, i) => (
          <motion.div key={i}
            className="absolute top-[40%] h-[2px] rounded-full"
            style={{ left: `${i * 8.5}%`, width: "4%", background: "rgba(148,163,184,0.08)" }}
            animate={phase === "arriving" || phase === "departing" ? { x: [200, -200] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: "linear" as const }}
          />
        ))}
      </div>

      {/* Vehicle info overlay */}
      {vehicleInfo && phase !== "arriving" && phase !== "departing" && (
        <motion.div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[rgba(11,18,32,0.7)] backdrop-blur-xl border border-white/[0.06]">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            {vehicleInfo.immatriculation && <span className="text-sm font-bold text-white tracking-wide">{vehicleInfo.immatriculation}</span>}
            {vehicleInfo.marque && <span className="text-xs text-slate-600 dark:text-slate-400">{vehicleInfo.marque}</span>}
            {vehicleInfo.chauffeur && (
              <>
                <div className="w-px h-4 bg-white/[0.06]" />
                <span className="text-xs text-slate-500">{vehicleInfo.chauffeur}</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/* Detailed truck silhouette SVG */
const TruckSilhouette: React.FC<{ spinning?: boolean; headlights?: boolean }> = ({ spinning, headlights }) => (
  <svg width="380" height="190" viewBox="0 0 380 190" fill="none">
    <defs>
      <linearGradient id="gTrailer" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f2440"/>
      </linearGradient>
      <linearGradient id="gCab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a2d45"/><stop offset="100%" stopColor="#0c1929"/>
      </linearGradient>
      <radialGradient id="gHead"><stop offset="0%" stopColor="rgba(251,191,36,0.6)"/><stop offset="100%" stopColor="rgba(251,191,36,0)"/></radialGradient>
      <filter id="gShadow"><feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.5)"/></filter>
    </defs>
    <ellipse cx="190" cy="168" rx="170" ry="10" fill="rgba(59,130,246,0.04)"/>
    {/* Trailer */}
    <rect x="10" y="35" width="215" height="90" rx="6" fill="url(#gTrailer)" stroke="rgba(59,130,246,0.15)" strokeWidth="1" filter="url(#gShadow)"/>
    <rect x="18" y="48" width="199" height="2" rx="1" fill="rgba(255,255,255,0.03)"/>
    <rect x="18" y="60" width="199" height="2" rx="1" fill="rgba(255,255,255,0.02)"/>
    <rect x="18" y="72" width="199" height="2" rx="1" fill="rgba(255,255,255,0.03)"/>
    <rect x="18" y="84" width="199" height="2" rx="1" fill="rgba(255,255,255,0.02)"/>
    <text x="118" y="82" textAnchor="middle" fill="rgba(147,197,253,0.2)" fontSize="12" fontWeight="bold" fontFamily="Inter,sans-serif" letterSpacing="4">SMART FLEET</text>
    {/* Cabin */}
    <rect x="218" y="28" width="120" height="97" rx="8" fill="url(#gCab)" stroke="rgba(148,163,184,0.1)" strokeWidth="1.5" filter="url(#gShadow)"/>
    <rect x="228" y="36" width="45" height="38" rx="5" fill="rgba(6,14,26,0.9)" stroke="rgba(148,163,184,0.08)" strokeWidth="1"/>
    <rect x="280" y="36" width="42" height="38" rx="5" fill="rgba(6,14,26,0.9)" stroke="rgba(148,163,184,0.08)" strokeWidth="1"/>
    {headlights && <>
      <circle cx="340" cy="52" r="16" fill="url(#gHead)"/><rect x="334" y="44" width="8" height="14" rx="3" fill="#fbbf24" opacity="0.8"/>
      <circle cx="340" cy="70" r="16" fill="url(#gHead)"/><rect x="334" y="64" width="8" height="14" rx="3" fill="#fbbf24" opacity="0.8"/>
    </>}
    <rect x="332" y="88" width="10" height="24" rx="2" fill="#0c1929" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5"/>
    {/* Wheels */}
    {spinning ? (
      <>
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" as const }} style={{ transformOrigin: "85px 140px" }}>
          <circle cx="85" cy="140" r="20" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/><circle cx="85" cy="140" r="15" fill="#0f1d30"/><circle cx="85" cy="140" r="10" fill="#1e3a5f"/><circle cx="85" cy="140" r="5" fill="#2d4a6f"/>
          {[0,1,2,3,4,5].map(s=><line key={s} x1="85" y1="140" x2={85+12*Math.cos(s*60*Math.PI/180)} y2={140+12*Math.sin(s*60*Math.PI/180)} stroke="#3d6090" strokeWidth="1.5"/>)}
        </motion.g>
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" as const, delay: 0.02 }} style={{ transformOrigin: "285px 140px" }}>
          <circle cx="285" cy="140" r="20" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/><circle cx="285" cy="140" r="15" fill="#0f1d30"/><circle cx="285" cy="140" r="10" fill="#1e3a5f"/><circle cx="285" cy="140" r="5" fill="#2d4a6f"/>
          {[0,1,2,3,4,5].map(s=><line key={s} x1="285" y1="140" x2={285+12*Math.cos(s*60*Math.PI/180)} y2={140+12*Math.sin(s*60*Math.PI/180)} stroke="#3d6090" strokeWidth="1.5"/>)}
        </motion.g>
      </>
    ) : (
      <>
        <circle cx="85" cy="140" r="20" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/><circle cx="85" cy="140" r="15" fill="#0f1d30"/><circle cx="85" cy="140" r="10" fill="#1e3a5f"/>
        <circle cx="285" cy="140" r="20" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/><circle cx="285" cy="140" r="15" fill="#0f1d30"/><circle cx="285" cy="140" r="10" fill="#1e3a5f"/>
      </>
    )}
  </svg>
);

export default GarageScene;
