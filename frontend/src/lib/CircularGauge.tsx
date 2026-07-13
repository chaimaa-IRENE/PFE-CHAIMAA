import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COLORS } from "../components/PowerBiDashboard/types";

interface CircularGaugeProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  delay?: number;
  subtitle?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value, label, size = 160, strokeWidth = 12, color, delay = 0, subtitle,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 40) / 2;
  const normalized = Math.min(Math.max(animatedValue, 0), 100);
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - normalized / 100);
  const gaugeColor = color || (normalized >= 80 ? COLORS.emerald : normalized >= 50 ? COLORS.amber : COLORS.rose);

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const dur = 1200;
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setAnimatedValue(value * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const displayValue = value >= 100 ? Math.round(value) : value.toFixed(1);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 22 }}
    >
      <svg width={size} height={size}>
        <defs>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff08" strokeWidth={strokeWidth} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" stroke={gaugeColor} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          filter="url(#gaugeGlow)"
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fill={gaugeColor} fontSize="26" fontWeight="bold"
          fontFamily="system-ui">
          {parseFloat(displayValue as string).toFixed(0)}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="system-ui">
          {label}
        </text>
      </svg>
      {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
};
