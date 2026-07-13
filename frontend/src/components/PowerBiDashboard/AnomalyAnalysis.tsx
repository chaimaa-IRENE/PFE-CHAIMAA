import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Activity, DollarSign, CheckCircle,
  Truck, FileText, Zap, Search, Wrench,
  Clock, Shield, TrendingUp
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, CartesianGrid, Legend, Line
} from "recharts";
import { DashboardData, COLORS, CHART_COLORS } from "./types";
import { fadeInUp, listItem, rowStagger, premiumCard } from "../../lib/animations";
import { EmptyState } from "../../lib/EmptyState";
import { AnimatedCard } from "../../lib/AnimatedCard";

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl text-xs"
    >
      <p className="font-semibold text-gray-200 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <span className="font-bold text-gray-100">{p.value}</span></span>
        </div>
      ))}
    </motion.div>
  );
};

const toChart = (record: Record<string, number> | undefined): { name: string; value: number }[] => {
  if (!record) return [];
  return Object.entries(record).map(([n, v]) => ({ name: n, value: v }));
};

interface Props { data: DashboardData }

const AnomalyAnalysis: React.FC<Props> = ({ data }) => {
  const { kpis, charts } = data;
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ouvertes" | "historique">("ouvertes");

  const tpmi = useMemo(() => {
    if (kpis.mttr > 0) {
      return Math.min(100, Math.round(100 - (kpis.mttr / 48) * 100));
    }
    return 0;
  }, [kpis.mttr]);

  const gaugeColor = tpmi >= 80 ? COLORS.emerald : tpmi >= 50 ? COLORS.amber : COLORS.rose;

  const categorieChart = useMemo(() => {
    const raw = charts.declarationsParCategorie || charts.declarationsParCriticite;
    return toChart(raw);
  }, [charts]);

  const criticiteChart = useMemo(() => toChart(charts.declarationsParCriticite), [charts]);
  const sourceChart = useMemo(() => toChart(charts.anomaliesParSource), [charts]);
  const statutChart = useMemo(() => toChart(charts.declarationsParStatut), [charts]);
  const elementChart = useMemo(() => toChart(charts.anomaliesParElement).sort((a, b) => b.value - a.value), [charts]);

  const pdrChart = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.declarations.forEach(d => {
      if (d.cout) {
        grouped[d.typePanne] = (grouped[d.typePanne] || 0) + d.cout;
      }
    });
    const entries = Object.entries(grouped);
    if (entries.length > 0) {
      return entries.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => ({ name: n, value: Math.round(v) }));
    }
    const byCount: Record<string, number> = {};
    data.declarations.forEach(d => {
      byCount[d.typePanne] = (byCount[d.typePanne] || 0) + 1;
    });
    return Object.entries(byCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => ({ name: n, value: v }));
  }, [data.declarations]);

  const chartAnimation = {
    animationBegin: 200, animationDuration: 1400, animationEasing: "ease-out" as const,
  };

  const filteredDeclarations = useMemo(() => {
    let items = data.declarations;
    if (tab === "ouvertes") {
      items = items.filter(d => d.statut !== "CLOTURE" && d.statut !== "RESOLU" && d.statut !== "ANNULE");
    }
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(d =>
      (d.numeroDemande && d.numeroDemande.toLowerCase().includes(q)) ||
      (d.vehicule && d.vehicule.toLowerCase().includes(q)) ||
      (d.chauffeur && d.chauffeur.toLowerCase().includes(q)) ||
      (d.typePanne && d.typePanne.toLowerCase().includes(q)) ||
      (d.element && d.element.toLowerCase().includes(q))
    );
  }, [data.declarations, search, tab]);

  const totalCategorie = categorieChart.reduce((s, x) => s + x.value, 0);
  const totalCriticite = criticiteChart.reduce((s, x) => s + x.value, 0);
  const totalSource = sourceChart.reduce((s, x) => s + x.value, 0);
  const totalStatut = statutChart.reduce((s, x) => s + x.value, 0);

  const renderDonut = (chartData: { name: string; value: number }[], total: number) => (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 20 }}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}
            animationBegin={0} animationDuration={1400} animationEasing="ease-out">
            {chartData.map((entry, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={20} fontWeight="bold">{total}</text>
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* KPI ROW */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Temps moyen réparation", value: kpis.mttr + "h", icon: Clock, color: COLORS.amber },
          { label: "Anomalies totales", value: kpis.anomaliesOuvertes, icon: AlertTriangle, color: COLORS.rose },
          { label: "Tickets ouverts", value: kpis.ticketsOuverts, icon: Wrench, color: COLORS.amber },
          { label: "Taux résolution", value: kpis.slaCompliance + "%", icon: CheckCircle, color: COLORS.emerald },
          { label: "Déclarations", value: kpis.totalDeclarations, icon: FileText, color: COLORS.blue },
          { label: "Taux conformité checkup", value: kpis.txCheckupConformite + "%", icon: Shield, color: COLORS.cyan },
          { label: "MTBF", value: kpis.mtbf + "j", icon: Activity, color: COLORS.violet },
          { label: "SLA", value: kpis.slaCompliance + "%", icon: TrendingUp, color: COLORS.indigo },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-3.5 flex items-center gap-3 ${premiumCard}`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "20" }}>
                <Icon className="w-5 h-5" style={{ color: kpi.color }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{kpi.value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{kpi.label}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ROW 2: TPMI Gauge + Catégorie + Gravité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnimatedCard title="Taux réparation première intervention" icon={<Wrench className="w-3.5 h-3.5 text-amber-400" />} delay={0.1} glow="amber">
          {kpis.mttr > 0 ? (
            <motion.div className="flex items-center justify-center py-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 22 }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="#ffffff10" strokeWidth="12" />
                <motion.circle cx="80" cy="80" r="68" fill="none" stroke={gaugeColor} strokeWidth="12"
                  strokeLinecap="round" transform="rotate(-90 80 80)"
                  initial={{ strokeDasharray: "0 427.26" }}
                  animate={{ strokeDasharray: `${(tpmi / 100) * 427.26} 427.26` }}
                  transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                <text x="80" y="75" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="bold">{tpmi}%</text>
                <text x="80" y="98" textAnchor="middle" fill="#94A3B8" fontSize="10">TPMI</text>
              </svg>
            </motion.div>
          ) : <EmptyState icon="anomaly" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard title="Par catégorie" icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} delay={0.15} glow="blue">
          {categorieChart.length > 0 ? renderDonut(categorieChart, totalCategorie) : <EmptyState icon="document" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard title="Par gravité" icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-400" />} delay={0.2} glow="rose">
          {criticiteChart.length > 0 ? renderDonut(criticiteChart, totalCriticite) : <EmptyState icon="anomaly" message="Aucune donnée" />}
        </AnimatedCard>
      </div>

      {/* ROW 3: Source + Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnimatedCard title="Par source" icon={<Zap className="w-3.5 h-3.5 text-amber-400" />} delay={0.25} glow="amber">
          {sourceChart.length > 0 ? renderDonut(sourceChart, totalSource) : <EmptyState icon="search" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard title="Évolution anomalies & réparations" icon={<Activity className="w-3.5 h-3.5 text-violet-400" />} delay={0.3} glow="blue" className="lg:col-span-2">
          {charts.evolutionMensuelle?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={charts.evolutionMensuelle}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" />
                <XAxis dataKey="mois" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94A3B8" }} />
                <Bar dataKey="anomalies" name="Anomalies" fill={COLORS.rose} radius={[6, 6, 0, 0]}
                  animationBegin={100} animationDuration={1200} animationEasing="ease-out" />
                <Line type="monotone" dataKey="resolues" name="Résolues" stroke={COLORS.emerald} strokeWidth={2.5} dot={{ r: 3 }}
                  animationBegin={300} animationDuration={1200} animationEasing="ease-out" />
                <Line type="monotone" dataKey="critiques" name="Critiques" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 2 }}
                  animationBegin={500} animationDuration={1200} animationEasing="ease-out" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="chart" message="Aucune donnée" />}
        </AnimatedCard>
      </div>

      {/* ROW 4: Element + PDR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedCard title="Répartition par élément" icon={<Truck className="w-3.5 h-3.5 text-cyan-400" />} delay={0.35} glow="blue">
          {elementChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.min(elementChart.length * 36 + 20, 300)}>
              <BarChart data={elementChart} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1200}>
                  {elementChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="anomaly" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard title="PDR consommés" icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />} delay={0.4} glow="emerald">
          {pdrChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.min(pdrChart.length * 36 + 20, 300)}>
              <BarChart data={pdrChart} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1200}>
                  {pdrChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="document" message="Aucune donnée" />}
        </AnimatedCard>
      </div>

      {/* Statut donut */}
      <AnimatedCard title="Répartition par statut" icon={<Activity className="w-3.5 h-3.5 text-violet-400" />} delay={0.45} glow="blue">
        {statutChart.length > 0 ? renderDonut(statutChart, totalStatut) : <EmptyState icon="anomaly" message="Aucune donnée" />}
      </AnimatedCard>

      {/* Search + tabs */}
      <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl p-3 flex items-center gap-3 flex-wrap`}>
        <div className="flex bg-[#0F172A] rounded-lg p-0.5">
          {(["ouvertes", "historique"] as const).map((t) => (
            <motion.button key={t} onClick={() => setTab(t)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? "bg-blue-600/20 text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>
              {t === "ouvertes" ? "Anomalies ouvertes" : "Historique"}
            </motion.button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..." className="w-full bg-[#0F172A] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/30 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)] transition-all duration-300" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeInUp} className={`bg-[#1E293B]/60 backdrop-blur-lg border border-white/5 rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(30,41,59,0.95)" }}>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="text-left py-3 px-3 font-medium">N° Demande</th>
                <th className="text-left py-3 px-3 font-medium">Véhicule</th>
                <th className="text-left py-3 px-3 font-medium">Chauffeur</th>
                <th className="text-left py-3 px-3 font-medium">Type Panne</th>
                <th className="text-left py-3 px-3 font-medium">Élément</th>
                <th className="text-center py-3 px-3 font-medium">Criticité</th>
                <th className="text-center py-3 px-3 font-medium">Statut</th>
                <th className="text-center py-3 px-3 font-medium">Date</th>
                <th className="text-right py-3 px-3 font-medium">Coût</th>
              </tr>
            </thead>
            <motion.tbody variants={rowStagger} initial="hidden" animate="visible">
              {filteredDeclarations.slice(0, 50).map((row, i) => (
                <motion.tr key={row.id || i} variants={listItem}
                  whileHover={{ backgroundColor: "rgba(59,130,246,0.06)" }}
                  className="border-b border-white/5 transition-colors">
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 font-mono">{row.numeroDemande || "—"}</td>
                  <td className="py-2.5 px-3"><span className="font-semibold text-gray-200 font-mono">{row.vehicule}</span></td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{row.chauffeur}</td>
                  <td className="py-2.5 px-3 text-gray-200 font-medium">{row.typePanne}</td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{row.element || "—"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      row.criticite === "CRITIQUE" || row.criticite === "BLOQUANT" ? "bg-rose-500/10 text-rose-400" :
                      row.criticite === "MAJEURE" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                    }`}>{row.criticite}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      row.statut === "CLOTURE" || row.statut === "RESOLU" ? "bg-emerald-500/10 text-emerald-400" :
                      row.statut === "ANNULE" ? "bg-slate-500/10 text-slate-600 dark:text-slate-400" : "bg-amber-500/10 text-amber-400"
                    }`}>{row.statut}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-400">{row.date?.split("T")[0] || "—"}</td>
                  <td className="py-2.5 px-3 text-right text-gray-200 font-bold">{row.cout ? `${Math.round(row.cout).toLocaleString()} DH` : "—"}</td>
                </motion.tr>
              ))}
              {filteredDeclarations.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center"><EmptyState icon="anomaly" message="Aucune anomalie trouvée" /></td></tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnomalyAnalysis;
