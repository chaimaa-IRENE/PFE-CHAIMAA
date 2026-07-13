import React, { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { soundManager } from "./SoundManager";

type TrendDir = "up" | "down" | "neutral";
type GlowColor = "blue" | "emerald" | "amber" | "rose" | "violet";

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  trend?: { value: number; dir: TrendDir };
  glow?: GlowColor;
  format?: (n: number) => string;
  delay?: number;
  onClick?: () => void;
}

const glowMap: Record<GlowColor, { color: string; bg: string; text: string }> = {
  blue: { color: "rgba(37,99,235,0.2)", bg: "from-blue-500/10", text: "text-blue-400" },
  emerald: { color: "rgba(16,185,129,0.2)", bg: "from-emerald-500/10", text: "text-emerald-400" },
  amber: { color: "rgba(245,158,11,0.2)", bg: "from-amber-500/10", text: "text-amber-400" },
  rose: { color: "rgba(239,68,68,0.2)", bg: "from-rose-500/10", text: "text-rose-400" },
  violet: { color: "rgba(139,92,246,0.2)", bg: "from-violet-500/10", text: "text-violet-400" },
};

const trendColor: Record<TrendDir, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  neutral: "text-slate-600 dark:text-slate-400",
};

const trendIcon: Record<TrendDir, string> = {
  up: "▲",
  down: "▼",
  neutral: "—",
};

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  suffix = "",
  prefix = "",
  icon,
  trend,
  glow = "blue",
  format,
  delay = 0,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);

  const srx = useSpring(rx, { stiffness: 300, damping: 25 });
  const sry = useSpring(ry, { stiffness: 300, damping: 25 });
  const smx = useSpring(mx, { stiffness: 150, damping: 20 });
  const smy = useSpring(my, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(srx, [-8, 8], [8, -8]);
  const rotateY = useTransform(sry, [-8, 8], [-8, 8]);

  const g = glowMap[glow];
  const glowBg = useTransform(
    [smx, smy],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, ${g.color}, transparent 60%)`,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      rx.set((py - 0.5) * 16);
      ry.set((px - 0.5) * 16);
      mx.set(px * 100);
      my.set(py * 100);
    },
    [rx, ry, mx, my],
  );

  const handleMouseLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
    mx.set(50);
    my.set(50);
  }, [rx, ry, mx, my]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (onClick) {
          soundManager.click();
          onClick();
        }
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.03 }}
      className={`relative rounded-3xl glass-strong p-5 overflow-hidden cursor-pointer group`}
    >
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: glowBg }}
      />

      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b opacity-30 pointer-events-none" />

      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${g.bg} to-transparent flex items-center justify-center ${g.text}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor[trend.dir]}`}>
              <span>{trendIcon[trend.dir]}</span>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            format={format}
            className={`text-3xl font-bold tracking-tight text-white`}
          />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</p>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${g.color}, transparent)`,
        }}
      />
    </motion.div>
  );
};
