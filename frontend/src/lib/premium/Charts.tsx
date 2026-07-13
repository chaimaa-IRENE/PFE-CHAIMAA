import React from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";

interface PremiumTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}

export const PremiumTooltip: React.FC<PremiumTooltipProps> = ({
  active,
  payload,
  label,
  unit = "",
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong rounded-2xl shadow-premium px-4 py-3 pointer-events-none"
    >
      {label && (
        <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: entry.color || entry.fill }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name}:</span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString("fr-FR")
                : entry.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

interface PremiumChartWrapperProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const PremiumChartWrapper: React.FC<PremiumChartWrapperProps> = ({
  title,
  subtitle,
  icon,
  children,
  className = "",
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    className={`glass-strong rounded-3xl p-6 ${className}`}
  >
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
    <div className="relative" style={{ minHeight: 200 }}>
      {children}
    </div>
  </motion.div>
);

interface PremiumChartProps {
  data: any[];
  type: "bar" | "line" | "pie" | "area" | "composed";
  xKey: string;
  yKeys: { key: string; name: string; color: string }[];
  height?: number;
  delay?: number;
}

export const PremiumChart: React.FC<PremiumChartProps> = ({
  data,
  type,
  xKey,
  yKeys,
  height = 220,
  delay = 0,
}) => {
  const commonProps = {
    data,
    height,
    margin: { top: 10, right: 10, bottom: 10, left: -20 },
  };

  const axisProps = {
    tick: { fill: "#64748b", fontSize: 11 },
    axisLine: { stroke: "rgba(255,255,255,0.04)" },
    tickLine: false,
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PremiumTooltip />} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
              {yKeys.map((yk, i) => (
                <Bar
                  key={yk.key}
                  dataKey={yk.key}
                  name={yk.name}
                  fill={yk.color}
                  radius={[8, 8, 0, 0]}
                  animationBegin={delay + i * 100}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PremiumTooltip />} cursor={{ stroke: "rgba(59,130,246,0.2)", strokeWidth: 1 }} />
              {yKeys.map((yk, i) => (
                <Line
                  key={yk.key}
                  type="monotone"
                  dataKey={yk.key}
                  name={yk.name}
                  stroke={yk.color}
                  strokeWidth={2.5}
                  dot={{ fill: yk.color, r: 3 }}
                  activeDot={{ r: 5, fill: yk.color, stroke: "rgba(255,255,255,0.2)", strokeWidth: 2 }}
                  animationBegin={delay + i * 100}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              <defs>
                {yKeys.map((yk) => (
                  <linearGradient key={yk.key} id={`grad-${yk.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={yk.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={yk.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PremiumTooltip />} cursor={{ stroke: "rgba(59,130,246,0.2)", strokeWidth: 1 }} />
              {yKeys.map((yk, i) => (
                <Area
                  key={yk.key}
                  type="monotone"
                  dataKey={yk.key}
                  name={yk.name}
                  stroke={yk.color}
                  strokeWidth={2.5}
                  fill={`url(#grad-${yk.key})`}
                  animationBegin={delay + i * 100}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Tooltip content={<PremiumTooltip />} />
              <Pie
                data={data}
                dataKey={yKeys[0].key}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={height * 0.35}
                innerRadius={height * 0.22}
                paddingAngle={3}
                animationBegin={delay}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={yKeys[0].color || ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][i % 6]}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return renderChart();
};
