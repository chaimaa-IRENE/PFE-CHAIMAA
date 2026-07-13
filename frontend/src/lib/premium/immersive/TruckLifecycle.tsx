/**
 * TruckLifecycle - Animation liée aux statuts métier de la déclaration.
 *
 * Statuts supportés (mappés depuis le backend) :
 *   "EN_ATTENTE"       → Scene: camion arrêté, warning, fumée
 *   "EN_COURS"         → Scene: camionnette maintenance arrive
 *   "PRISE_EN_CHARGE"  → Scene: technicien inspecte
 *   "EN_REPARATION"    → Scene: capot ouvert, outils, étincelles
 *   "REPARE" / "TRAITE"→ Scene: moteur redémarre, réparation réussie
 *   "EN_VALIDATION"    → Scene: badge contrôle qualité
 *   "CLOTURE"/"VALIDE" → Scene: camion repart, soleil, route
 *   "driving"          → Scene: camion roule normalement (dashboard)
 *   "breaking"         → Scene: intro panne détectée (formulaire chauffeur)
 *
 * Usage:
 *   <TruckLifecycle status="EN_ATTENTE" />
 *   <TruckLifecycle status="EN_REPARATION" compact />
 *   <TruckLifecycle status={declaration.statut} />
 */
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LifecycleStatus =
  | "driving" | "breaking" | "EN_ATTENTE" | "EN_COURS"
  | "PRISE_EN_CHARGE" | "EN_REPARATION" | "REPARE" | "TRAITE"
  | "EN_VALIDATION" | "CLOTURE" | "VALIDE" | "DISPONIBLE"
  | "RETOURNEE" | "REFUSE" | "RESOLU" | "ANNULE" | string;

interface TruckLifecycleProps {
  status: LifecycleStatus;
  compact?: boolean;     // Small inline version (for dashboard cards)
  className?: string;
  showLabel?: boolean;
  vehicleInfo?: { immatriculation?: string };
}

/* Map any status to a visual scene */
function getScene(s: string): {
  scene: string; label: string; sublabel: string;
  truckX: number; wheelsSpinning: boolean; headlights: boolean;
  showWarning: boolean; showSmoke: boolean; showTools: boolean;
  showHood: boolean; showSun: boolean; showTechnician: boolean;
  showBadge: boolean; showSparks: boolean; roadSpeed: number;
  bgTint: string; accentColor: string;
} {
  const base = {
    truckX: 0, wheelsSpinning: false, headlights: false,
    showWarning: false, showSmoke: false, showTools: false,
    showHood: false, showSun: false, showTechnician: false,
    showBadge: false, showSparks: false, roadSpeed: 0,
    bgTint: "rgba(5,7,13,1)", accentColor: "#3b82f6",
  };

  switch (s) {
    case "driving": case "DISPONIBLE":
      return { ...base, scene: "driving", label: "En service", sublabel: "Le camion roule normalement",
        wheelsSpinning: true, headlights: true, roadSpeed: 1.2, showSun: true, bgTint: "rgba(8,14,26,1)", accentColor: "#10b981" };

    case "breaking":
      return { ...base, scene: "breaking", label: "Panne détectée", sublabel: "Le camion s'immobilise",
        showWarning: true, showSmoke: true, headlights: true, bgTint: "rgba(15,5,5,1)", accentColor: "#ef4444" };

    case "EN_ATTENTE":
      return { ...base, scene: "waiting", label: "En attente", sublabel: "Déclaration envoyée — en attente d'assignation",
        showWarning: true, showSmoke: true, bgTint: "rgba(15,10,5,1)", accentColor: "#f59e0b" };

    case "EN_COURS": case "PRISE_EN_CHARGE":
      return { ...base, scene: "assigned", label: "Prise en charge", sublabel: "Un technicien est assigné",
        showTechnician: true, headlights: true, bgTint: "rgba(5,10,20,1)", accentColor: "#3b82f6" };

    case "EN_REPARATION":
      return { ...base, scene: "repairing", label: "Réparation en cours", sublabel: "Le véhicule est en maintenance",
        showHood: true, showTools: true, showSparks: true, showTechnician: true,
        bgTint: "rgba(10,8,5,1)", accentColor: "#f59e0b" };

    case "REPARE": case "TRAITE": case "RESOLU":
      return { ...base, scene: "repaired", label: "Réparation terminée", sublabel: "Le moteur redémarre",
        headlights: true, wheelsSpinning: false, bgTint: "rgba(5,12,8,1)", accentColor: "#10b981" };

    case "EN_VALIDATION":
      return { ...base, scene: "validating", label: "En validation", sublabel: "Contrôle qualité en cours",
        showBadge: true, headlights: true, bgTint: "rgba(8,5,15,1)", accentColor: "#8b5cf6" };

    case "CLOTURE": case "VALIDE":
      return { ...base, scene: "departing", label: "Retour en service", sublabel: "Mission reprise — camion disponible",
        wheelsSpinning: true, headlights: true, showSun: true, roadSpeed: 1.5,
        truckX: 0, bgTint: "rgba(5,10,8,1)", accentColor: "#10b981" };

    case "RETOURNEE":
      return { ...base, scene: "returned", label: "Retournée", sublabel: "La déclaration nécessite des corrections",
        showWarning: true, bgTint: "rgba(15,10,5,1)", accentColor: "#f59e0b" };

    case "REFUSE": case "ANNULE":
      return { ...base, scene: "refused", label: "Refusée", sublabel: "La déclaration a été annulée",
        bgTint: "rgba(10,5,5,1)", accentColor: "#64748b" };

    default:
      return { ...base, scene: "idle", label: s || "Inconnu", sublabel: "", accentColor: "#64748b" };
  }
}

export const TruckLifecycle: React.FC<TruckLifecycleProps> = ({
  status, compact = false, className = "", showLabel = true,
}) => {
  const scene = useMemo(() => getScene(status), [status]);
  const h = compact ? "h-[120px]" : "h-[220px]";
  const truckSize = compact ? 160 : 280;

  const roadLines = useMemo(() => [...Array(compact ? 8 : 14)].map((_, i) => i), [compact]);
  const sparks = useMemo(() => [...Array(6)].map((_, i) => ({
    x: 40 + Math.random() * 20, y: 20 + Math.random() * 30,
    delay: Math.random() * 2, dur: 0.3 + Math.random() * 0.5,
  })), []);

  return (
    <motion.div
      className={`relative ${h} rounded-[20px] overflow-hidden ${className}`}
      style={{ background: scene.bgTint }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${scene.accentColor}08 0%, transparent 60%)`,
      }} />

      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${scene.accentColor}20, transparent)` }} />
        {roadLines.map((i) => (
          <motion.div key={i}
            className="absolute top-[40%] h-[2px] rounded-full"
            style={{ left: `${i * (100 / roadLines.length)}%`, width: "5%", background: "rgba(148,163,184,0.06)" }}
            animate={scene.roadSpeed > 0 ? { x: [200, -200] } : {}}
            transition={scene.roadSpeed > 0 ? { duration: 1.5 / scene.roadSpeed, repeat: Infinity, delay: i * 0.1, ease: "linear" as const } : {}}
          />
        ))}
      </div>

      {/* Sun for departing/driving */}
      {scene.showSun && (
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ top: compact ? "5%" : "8%", right: "15%", width: compact ? 40 : 70, height: compact ? 40 : 70,
            background: "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)", filter: "blur(15px)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
        />
      )}

      {/* Truck */}
      <motion.div
        className="absolute left-1/2 pointer-events-none"
        style={{ bottom: compact ? "22%" : "18%" }}
        animate={{ x: scene.scene === "departing" ? ["-50%", "150%"] : "-50%" }}
        transition={scene.scene === "departing" ? { duration: 3, ease: [0.16, 1, 0.3, 1] } : { duration: 0.6 }}
      >
        <MiniTruck
          size={truckSize}
          wheelsSpinning={scene.wheelsSpinning}
          headlights={scene.headlights}
          showHood={scene.showHood}
          accentColor={scene.accentColor}
        />
      </motion.div>

      {/* Warning triangle */}
      <AnimatePresence>
        {scene.showWarning && (
          <motion.div
            className="absolute pointer-events-none"
            style={{ top: compact ? "8%" : "12%", left: "50%", transform: "translateX(-50%)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }}
          >
            <div className="w-8 h-8 flex items-center justify-center" style={{ filter: `drop-shadow(0 0 8px ${scene.accentColor}60)` }}>
              <svg width={compact ? 20 : 28} height={compact ? 20 : 28} viewBox="0 0 24 24" fill="none" stroke={scene.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smoke */}
      {scene.showSmoke && (
        <div className="absolute pointer-events-none" style={{ bottom: compact ? "40%" : "35%", left: "42%" }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{ width: 4 + i * 2, height: 4 + i * 2, background: "rgba(148,163,184,0.1)", left: i * 6 }}
              animate={{ y: [0, -20 - i * 10], opacity: [0.2, 0], x: [0, 5 + i * 3] }}
              transition={{ duration: 1.5 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" as const }}
            />
          ))}
        </div>
      )}

      {/* Technician icon */}
      {scene.showTechnician && !compact && (
        <motion.div
          className="absolute pointer-events-none"
          style={{ bottom: "20%", right: "30%" }}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </motion.div>
      )}

      {/* Tools */}
      {scene.showTools && !compact && (
        <motion.div
          className="absolute pointer-events-none"
          style={{ bottom: "45%", left: "55%" }}
          initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ delay: 0.5, duration: 2, repeat: Infinity }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
        </motion.div>
      )}

      {/* Sparks during repair */}
      {scene.showSparks && sparks.map((sp, i) => (
        <motion.div key={i} className="absolute pointer-events-none"
          style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: 2, height: 2, borderRadius: "50%", background: "#fbbf24" }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, 10 + Math.random() * 15] }}
          transition={{ duration: sp.dur, repeat: Infinity, delay: sp.delay, ease: "easeOut" as const }}
        />
      ))}

      {/* Validation badge */}
      {scene.showBadge && (
        <motion.div
          className="absolute pointer-events-none"
          style={{ top: compact ? "10%" : "15%", right: compact ? "15%" : "25%" }}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
        >
          <div className="px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center gap-1.5"
            style={{ boxShadow: "0 0 15px rgba(139,92,246,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="text-[11px] font-semibold text-violet-300">Contrôle</span>
          </div>
        </motion.div>
      )}

      {/* Status label */}
      {showLabel && (
        <motion.div
          className="absolute z-10"
          style={compact
            ? { bottom: 8, left: 12 }
            : { bottom: 16, left: "50%", transform: "translateX(-50%)" }
          }
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`flex items-center gap-2 ${compact ? "" : "px-4 py-2 rounded-xl bg-[rgba(11,18,32,0.7)] backdrop-blur-md border border-white/[0.06]"}`}>
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ background: scene.accentColor }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className={`font-semibold text-white ${compact ? "text-[10px]" : "text-xs"}`}>{scene.label}</span>
            {!compact && scene.sublabel && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">— {scene.sublabel}</span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

/* Inline mini truck SVG */
const MiniTruck: React.FC<{
  size: number; wheelsSpinning: boolean; headlights: boolean;
  showHood?: boolean; accentColor: string;
}> = ({ size, wheelsSpinning, headlights, showHood, accentColor }) => {
  const s = size / 280;
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 280 140" fill="none">
      {/* Trailer */}
      <rect x={6*s} y={22*s} width={160*s} height={68*s} rx={5*s} fill="#0f1d30" stroke={`${accentColor}20`} strokeWidth={1}/>
      <text x={86*s} y={62*s} textAnchor="middle" fill={`${accentColor}30`} fontSize={10*s} fontWeight="bold" fontFamily="Inter" letterSpacing={3}>SF</text>

      {/* Cabin */}
      <rect x={160*s} y={18*s} width={88*s} height={72*s} rx={6*s} fill="#0c1625" stroke="rgba(148,163,184,0.08)" strokeWidth={1}/>
      {/* Hood open indicator */}
      {showHood && (
        <motion.rect x={160*s} y={12*s} width={88*s} height={6*s} rx={3*s} fill={`${accentColor}25`} stroke={`${accentColor}30`} strokeWidth={0.5}
          animate={{ y: [12*s, 8*s, 12*s] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
        />
      )}

      {/* Windshield */}
      <rect x={168*s} y={24*s} width={34*s} height={28*s} rx={4*s} fill="rgba(6,14,26,0.9)" stroke="rgba(148,163,184,0.06)" strokeWidth={0.5}/>
      <rect x={208*s} y={24*s} width={30*s} height={28*s} rx={4*s} fill="rgba(6,14,26,0.9)" stroke="rgba(148,163,184,0.06)" strokeWidth={0.5}/>

      {/* Headlights */}
      {headlights && (
        <>
          <circle cx={250*s} cy={36*s} r={10*s} fill={`url(#hlg-${size})`}/>
          <rect x={246*s} y={30*s} width={6*s} height={10*s} rx={2*s} fill="#fbbf24" opacity={0.7}/>
          <defs><radialGradient id={`hlg-${size}`}><stop offset="0%" stopColor="rgba(251,191,36,0.5)"/><stop offset="100%" stopColor="rgba(251,191,36,0)"/></radialGradient></defs>
        </>
      )}

      {/* Wheels */}
      {wheelsSpinning ? (
        <>
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: "linear" as const }} style={{ transformOrigin: `${62*s}px ${100*s}px` }}>
            <circle cx={62*s} cy={100*s} r={15*s} fill="#080e18" stroke="#1e3a5f" strokeWidth={2.5}/>
            <circle cx={62*s} cy={100*s} r={10*s} fill="#0f1d30"/>
            <circle cx={62*s} cy={100*s} r={5*s} fill="#1e3a5f"/>
          </motion.g>
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: "linear" as const }} style={{ transformOrigin: `${210*s}px ${100*s}px` }}>
            <circle cx={210*s} cy={100*s} r={15*s} fill="#080e18" stroke="#1e3a5f" strokeWidth={2.5}/>
            <circle cx={210*s} cy={100*s} r={10*s} fill="#0f1d30"/>
            <circle cx={210*s} cy={100*s} r={5*s} fill="#1e3a5f"/>
          </motion.g>
        </>
      ) : (
        <>
          <circle cx={62*s} cy={100*s} r={15*s} fill="#080e18" stroke="#1e3a5f" strokeWidth={2.5}/>
          <circle cx={62*s} cy={100*s} r={10*s} fill="#0f1d30"/>
          <circle cx={210*s} cy={100*s} r={15*s} fill="#080e18" stroke="#1e3a5f" strokeWidth={2.5}/>
          <circle cx={210*s} cy={100*s} r={10*s} fill="#0f1d30"/>
        </>
      )}
    </svg>
  );
};

export default TruckLifecycle;
