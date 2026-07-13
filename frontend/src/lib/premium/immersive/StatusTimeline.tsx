/**
 * StatusTimeline - Timeline animée du cycle de vie d'une déclaration.
 * Chaque étape a son icône, sa couleur et son animation liées au statut métier.
 */
import React from "react";
import { motion } from "framer-motion";

interface TimelineEvent {
  status: string;
  label: string;
  date?: string;
  actor?: string;
  detail?: string;
}

interface StatusTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
  className?: string;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; bg: string; glow: string }> = {
  EN_ATTENTE:      { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", glow: "rgba(245,158,11,0.2)" },
  EN_COURS:        { icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", glow: "rgba(59,130,246,0.2)" },
  PRISE_EN_CHARGE: { icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", glow: "rgba(59,130,246,0.2)" },
  EN_REPARATION:   { icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", glow: "rgba(245,158,11,0.2)" },
  REPARE:          { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#10b981", bg: "rgba(16,185,129,0.1)", glow: "rgba(16,185,129,0.2)" },
  TRAITE:          { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#10b981", bg: "rgba(16,185,129,0.1)", glow: "rgba(16,185,129,0.2)" },
  EN_VALIDATION:   { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", glow: "rgba(139,92,246,0.2)" },
  CLOTURE:         { icon: "M5 13l4 4L19 7", color: "#10b981", bg: "rgba(16,185,129,0.1)", glow: "rgba(16,185,129,0.2)" },
  VALIDE:          { icon: "M5 13l4 4L19 7", color: "#10b981", bg: "rgba(16,185,129,0.1)", glow: "rgba(16,185,129,0.2)" },
  RETOURNEE:       { icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", glow: "rgba(245,158,11,0.2)" },
  REFUSE:          { icon: "M18 6L6 18M6 6l12 12", color: "#ef4444", bg: "rgba(239,68,68,0.1)", glow: "rgba(239,68,68,0.2)" },
};

const getConfig = (status: string) =>
  STATUS_CONFIG[status] || { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "#64748b", bg: "rgba(100,116,139,0.1)", glow: "rgba(100,116,139,0.2)" };

const LIFECYCLE_ORDER = ["EN_ATTENTE", "EN_COURS", "EN_REPARATION", "REPARE", "EN_VALIDATION", "CLOTURE"];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  events, currentStatus, className = "", compact = false,
}) => {
  const currentIdx = LIFECYCLE_ORDER.indexOf(currentStatus);

  return (
    <div className={`${className}`}>
      <div className={compact ? "flex items-center gap-1" : "space-y-0"}>
        {events.map((evt, i) => {
          const cfg = getConfig(evt.status);
          const isActive = evt.status === currentStatus;
          const isPast = LIFECYCLE_ORDER.indexOf(evt.status) < currentIdx || (currentIdx === -1 && i < events.length - 1);
          const isFuture = !isActive && !isPast;

          if (compact) {
            return (
              <React.Fragment key={i}>
                <motion.div
                  className="relative flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  title={evt.label}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${isFuture ? "opacity-30" : ""}`}
                    style={{
                      background: isActive ? cfg.bg : isPast ? cfg.bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? cfg.color + "40" : isPast ? cfg.color + "20" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isActive ? `0 0 12px ${cfg.glow}` : "none",
                    }}
                  >
                    {isPast ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isActive ? cfg.color : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cfg.icon}/></svg>
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1.5px solid ${cfg.color}30` }}
                      animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                {i < events.length - 1 && (
                  <div className="w-4 h-[2px] rounded-full" style={{ background: isPast ? `${cfg.color}30` : "rgba(255,255,255,0.04)" }} />
                )}
              </React.Fragment>
            );
          }

          return (
            <motion.div
              key={i}
              className="relative flex gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              {/* Vertical line */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center z-10 ${isFuture ? "opacity-30" : ""}`}
                  style={{
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.color}30`,
                    boxShadow: isActive ? `0 0 16px ${cfg.glow}` : "none",
                  }}
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isPast ? (
                    <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    ><polyline points="20 6 9 17 4 12"/></motion.svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isActive ? cfg.color : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cfg.icon}/></svg>
                  )}

                  {isActive && (
                    <motion.div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${cfg.color}20` }}
                      animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                {i < events.length - 1 && (
                  <motion.div
                    className="w-[2px] flex-1 min-h-[32px] rounded-full"
                    style={{ background: isPast ? `${cfg.color}20` : "rgba(255,255,255,0.04)" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.1 + 0.15, duration: 0.3 }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 flex-1 ${isFuture ? "opacity-40" : ""}`}>
                <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-300"}`}>{evt.label}</p>
                {evt.date && <p className="text-[11px] text-slate-500 mt-0.5">{evt.date}</p>}
                {evt.actor && <p className="text-[11px] text-slate-600 mt-0.5">Par: {evt.actor}</p>}
                {evt.detail && isActive && (
                  <motion.p className="text-xs text-slate-500 mt-1 leading-relaxed"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  >{evt.detail}</motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
