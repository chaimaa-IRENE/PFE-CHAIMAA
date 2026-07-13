import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, User, Trophy, AlertTriangle, CheckCircle,
  Zap, Star, TrendingUp, Activity,
  BarChart3, Phone, Mail, MapPin, Award, Calendar
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import { DashboardData, COLORS, CHART_COLORS } from "./types";
import { fadeInUp, listItem, rowStagger, premiumCard } from "../../lib/animations";
import { EmptyState } from "../../lib/EmptyState";
import { AnimatedCard } from "../../lib/AnimatedCard";

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1E293B]/95 backdrop-blur border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <span className="font-bold text-gray-200">{p.value}</span></span>
        </div>
      ))}
    </div>
  );
};

interface Props { data: DashboardData }

const DriverPerformance: React.FC<Props> = ({ data }) => {
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const sortedDrivers = useMemo(() => {
    return [...data.drivers].sort((a, b) => b.score - a.score);
  }, [data.drivers]);

  const filtered = useMemo(() => {
    let list = sortedDrivers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.nom.toLowerCase().includes(q));
    }
    return list;
  }, [sortedDrivers, search]);

  const driver = selectedDriver ? data.drivers.find(d => d.nom === selectedDriver) : null;
  const driverDeclarations = selectedDriver
    ? data.declarations.filter(d => d.chauffeur === selectedDriver)
    : [];

  const monthlyData = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const d of driverDeclarations) {
      const month = d.date ? d.date.substring(0, 7) : "inconnu";
      groups[month] = (groups[month] || 0) + 1;
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, count]) => ({ mois, déclarations: count }));
  }, [driverDeclarations]);

  const gravityData = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const d of driverDeclarations) {
      const key = d.criticite || "INCONNU";
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [driverDeclarations]);

  const pdrTypePanne = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const d of driverDeclarations) {
      if (d.typePanne && d.cout) {
        groups[d.typePanne] = (groups[d.typePanne] || 0) + d.cout;
      }
    }
    return Object.entries(groups)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [driverDeclarations]);

  const anomaliesVehicule = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const d of driverDeclarations) {
      if (d.vehicule) {
        groups[d.vehicule] = (groups[d.vehicule] || 0) + 1;
      }
    }
    return Object.entries(groups)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [driverDeclarations]);

  const scoreColor = (s: number) => s >= 80 ? COLORS.emerald : s >= 50 ? COLORS.amber : COLORS.rose;

  const statutBadge = (s: number) => {
    if (s >= 80) return { label: "Excellent", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    if (s >= 50) return { label: "Moyen", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { label: "Critique", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
  };

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-4 gap-5"
      variants={rowStagger}
      initial="hidden"
      animate="visible"
    >
      {/* LEFT SIDEBAR - Chauffeurs list */}
      <motion.div variants={fadeInUp} className={`lg:col-span-1 bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Chauffeurs ({data.drivers.length})</span>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom du chauffeur..."
            className="w-full bg-[#0F172A] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/30 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)] transition-all duration-300" />
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
          {filtered.slice(0, 30).map((d, i) => {
            const isSelected = selectedDriver === d.nom;
            return (
              <motion.button
                key={i}
                onClick={() => setSelectedDriver(d.nom)}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(59,130,246,0.08)" }}
                whileTap={{ scale: 0.97 }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                  isSelected ? "bg-blue-600/15 border border-blue-500/20" : "hover:bg-white/5 border border-transparent"
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-blue-600/20" : "bg-white/5"
                  }`}>
                    <User className="w-3.5 h-3.5" style={{ color: scoreColor(d.score) }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200">{d.nom}</p>
                    <p className="text-[9px] text-gray-500">{d.anomalies} anomalies · {d.checkups} check-ups</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ backgroundColor: scoreColor(d.score) + "20", color: scoreColor(d.score) }}>
                  {d.score}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* RIGHT DETAIL PANEL */}
      <div className="lg:col-span-3 space-y-4">
        {!driver ? (
          <motion.div variants={fadeInUp}>
            <EmptyState icon="truck" title="Sélectionnez un chauffeur" message="Cliquez sur un nom pour voir sa fiche de performance" />
          </motion.div>
        ) : (
          <>
            {/* 1. CARTE CHAUFFEUR */}
            <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-5`}>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-lg font-bold text-white truncate">{driver.nom}</h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statutBadge(driver.score).cls}`}>
                      {statutBadge(driver.score).label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: Award, value: driver.matricule || "—" },
                      { icon: Mail, value: driver.email || "—" },
                      { icon: Phone, value: driver.phone || "—" },
                      { icon: MapPin, value: driver.branchCode || "—" },
                      { icon: Calendar, value: "Date embauche: —" },
                    ].map((info, i) => {
                      const Icon = info.icon;
                      return (
                        <motion.div key={i} className="bg-[#0F172A]/50 rounded-lg px-3 py-2 flex items-center gap-1.5"
                          whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                          <Icon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          <span className="text-[10px] text-gray-300">{info.value}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-3xl font-bold" style={{ color: scoreColor(driver.score) }}>{driver.score}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Score Global</p>
                </div>
              </div>
            </motion.div>

            {/* 2. KPI ROW */}
            <motion.div variants={fadeInUp} className="grid grid-cols-5 gap-3">
              {[
                { label: "Score", value: driver.score, icon: Star, color: scoreColor(driver.score) },
                { label: "Check-ups", value: `${driver.checkupsOK}/${driver.checkups}`, icon: CheckCircle, color: COLORS.emerald },
                { label: "Anomalies", value: driver.anomalies, icon: AlertTriangle, color: COLORS.rose },
                { label: "Conformité", value: `${driver.tauxConformite}%`, icon: Trophy, color: COLORS.blue },
                { label: "Résolution", value: `${driver.tauxResolution}%`, icon: TrendingUp, color: COLORS.violet },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-3 ${premiumCard}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} strokeWidth={1.5} />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">{kpi.label}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{kpi.value}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* 3. PROGRESS BARS */}
            <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Taux de conformité", value: driver.tauxConformite },
                  { label: "Taux de résolution", value: driver.tauxResolution },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600 dark:text-gray-400">{bar.label}</span>
                      <span className="font-bold" style={{ color: scoreColor(bar.value) }}>{bar.value}%</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(bar.value, 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{ backgroundColor: scoreColor(bar.value) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 4. CLASSEMENT CHAUFFEURS */}
            <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Classement des chauffeurs</span>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                      <th className="text-left py-2 px-2 font-medium w-8">#</th>
                      <th className="text-left py-2 px-2 font-medium">Nom</th>
                      <th className="text-center py-2 px-2 font-medium">Score</th>
                      <th className="text-center py-2 px-2 font-medium">Anomalies</th>
                      <th className="text-center py-2 px-2 font-medium">Check-ups</th>
                      <th className="text-center py-2 px-2 font-medium">Conformité</th>
                      <th className="text-center py-2 px-2 font-medium">Résolution</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={rowStagger} initial="hidden" animate="visible">
                    {sortedDrivers.map((d, i) => {
                      const isCurrent = d.nom === selectedDriver;
                      const rank = i + 1;
                      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                      return (
                        <motion.tr key={i} onClick={() => setSelectedDriver(d.nom)}
                          variants={listItem}
                          whileHover={{ backgroundColor: "rgba(59,130,246,0.06)" }}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${
                            isCurrent ? "bg-blue-600/15" : ""
                          }`}>
                          <td className="py-2 px-2">
                            {medal ? <span className="text-base">{medal}</span> : <span className="text-gray-500 font-mono">{rank}</span>}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`font-semibold ${isCurrent ? "text-blue-300" : "text-gray-200"}`}>{d.nom}</span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ backgroundColor: scoreColor(d.score) + "20", color: scoreColor(d.score) }}>
                              {d.score}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-gray-600 dark:text-gray-400">{d.anomalies}</td>
                          <td className="py-2 px-2 text-center text-gray-600 dark:text-gray-400">{d.checkupsOK}/{d.checkups}</td>
                          <td className="py-2 px-2 text-center text-gray-600 dark:text-gray-400">{d.tauxConformite}%</td>
                          <td className="py-2 px-2 text-center text-gray-600 dark:text-gray-400">{d.tauxResolution}%</td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
            </motion.div>

            {/* 5. HISTORIQUE / ÉVOLUTION */}
            {driverDeclarations.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Évolution mensuelle</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="mois" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="déclarations" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 3, fill: COLORS.blue }} animationDuration={1200} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
                <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Répartition par gravité</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={gravityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={3} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false} animationDuration={1200}>
                        {gravityData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            )}

            {/* 6. PDR CONSOMMÉ */}
            {driverDeclarations.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">PDR par type panne</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pdrTypePanne} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" fill={COLORS.violet} radius={[0, 4, 4, 0]} animationDuration={1200} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
                <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Anomalies par véhicule</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={anomaliesVehicule} margin={{ top: 5, right: 5, left: 5, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" fill={COLORS.emerald} radius={[4, 4, 0, 0]} animationDuration={1200} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default DriverPerformance;
