import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "../SoundManager";

interface InspectionPoint {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  x: number;      // % position around the truck
  y: number;
}

interface InspectionHubProps {
  points: InspectionPoint[];
  completedPoints: string[];
  activePoint: string | null;
  onSelectPoint: (id: string) => void;
  vehicleInfo?: { immatriculation?: string; marque?: string };
  className?: string;
}

export const InspectionHub: React.FC<InspectionHubProps> = ({
  points, completedPoints, activePoint, onSelectPoint, vehicleInfo, className = "",
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const progress = points.length > 0 ? (completedPoints.length / points.length) * 100 : 0;

  const getPointStatus = useCallback((id: string) => {
    if (completedPoints.includes(id)) return "completed";
    if (activePoint === id) return "active";
    return "pending";
  }, [completedPoints, activePoint]);

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Points d'inspection</p>
            <p className="text-xs text-slate-500">{completedPoints.length}/{points.length} vérifiés</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="text-xs font-bold text-blue-400 tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Inspection points around truck silhouette */}
      <div className="relative min-h-[280px] flex items-center justify-center">
        {/* Central truck mini */}
        <div className="relative opacity-10">
          <svg width="260" height="130" viewBox="0 0 340 170" fill="none">
            <rect x="8" y="28" width="195" height="82" rx="6" fill="#1e3a5f" stroke="#2d4a6f" strokeWidth="1"/>
            <rect x="195" y="22" width="108" height="88" rx="8" fill="#1a2d45" stroke="#2d4a6f" strokeWidth="1.5"/>
            <circle cx="75" cy="120" r="18" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/>
            <circle cx="255" cy="120" r="18" fill="#0a1220" stroke="#1e3a5f" strokeWidth="3"/>
          </svg>
        </div>

        {/* Points around the truck */}
        {points.map((point, i) => {
          const status = getPointStatus(point.id);
          const isHovered = hoveredPoint === point.id;
          const isActive = activePoint === point.id;

          return (
            <motion.button
              key={point.id}
              type="button"
              className="absolute flex flex-col items-center gap-1.5 group"
              style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => { onSelectPoint(point.id); soundManager.tap(); }}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow ring for active */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ margin: "-6px" }}
                  animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.3)", "0 0 35px rgba(59,130,246,0.15)", "0 0 20px rgba(59,130,246,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Point sphere */}
              <div className={`
                w-11 h-11 rounded-full flex items-center justify-center relative transition-all duration-300
                ${status === "completed"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : status === "active"
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : "bg-[rgba(11,18,32,0.6)] backdrop-blur-md border border-white/[0.08] hover:border-white/[0.15]"
                }
              `}>
                {status === "completed" ? (
                  <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  ><polyline points="20 6 9 17 4 12"/></motion.svg>
                ) : (
                  <span className={`transition-colors duration-300 ${status === "active" ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {point.icon}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[11px] font-medium whitespace-nowrap transition-colors duration-300 ${
                status === "completed" ? "text-emerald-400" : status === "active" ? "text-blue-400" : "text-slate-600 group-hover:text-slate-600 dark:text-slate-400"
              }`}>
                {point.label}
              </span>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {(isHovered || isActive) && !completedPoints.includes(point.id) && (
                  <motion.div
                    className="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg bg-[rgba(11,18,32,0.9)] backdrop-blur-xl border border-white/[0.08] shadow-xl whitespace-nowrap z-50"
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="text-xs text-white font-medium">{point.label}</span>
                    <span className="block text-[10px] text-slate-500">{point.category}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* Connection lines between completed points */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {completedPoints.map((id, i) => {
            if (i === 0) return null;
            const prev = points.find(p => p.id === completedPoints[i - 1]);
            const curr = points.find(p => p.id === id);
            if (!prev || !curr) return null;
            return (
              <motion.line
                key={`line-${i}`}
                x1={`${prev.x}%`} y1={`${prev.y}%`}
                x2={`${curr.x}%`} y2={`${curr.y}%`}
                stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default InspectionHub;
