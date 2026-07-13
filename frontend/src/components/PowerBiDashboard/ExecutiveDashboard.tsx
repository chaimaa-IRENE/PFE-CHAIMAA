import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, ComposedChart, CartesianGrid, Legend
} from "recharts";
import {
  Truck, CheckCircle, Wrench, AlertTriangle, FileText,
  Activity, Gauge, Fuel, Zap, Trophy, Shield,
  TrendingUp, TrendingDown, Users, Bell, XCircle, BarChart3,
  Sparkles, Bot, X, Building2, Wallet, BrainCircuit,
  BadgeCheck, Timer
} from "lucide-react";
import { DashboardData, COLORS, CHART_COLORS } from "./types";
import { AnimatedCard, CardHeader } from "../../lib/AnimatedCard";
import { AnimatedTable } from "../../lib/AnimatedTable";
import { AnimatedCounter } from "../../lib/AnimatedCounter";
import { CircularGauge } from "../../lib/CircularGauge";
import { EmptyState } from "../../lib/EmptyState";
import { fadeInUp, cardStagger } from "../../lib/animations";
import axios from "axios";

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

interface Props { data: DashboardData }

const ExecutiveDashboard: React.FC<Props> = ({ data }) => {
  const { kpis, charts } = data;

  const toChart = (map: Record<string, any>) =>
    Object.entries(map || {}).map(([name, value]) => ({ name, value: Number(value) }));

  const sourceChart = toChart(charts.anomaliesParSource);
  const marqueChart = toChart(charts.vehiculesParMarque);
  const typePanneChart = toChart(charts.declarationsParTypePanne);
  const qualifChart = toChart(charts.declarationsParQualification);
  const prestataireChart = toChart(charts.interventionsParPrestataire || {});
  const budgetChart = data.budgetAnalysis ? data.budgetAnalysis.map(b => ({ mois: b.mois, budget: Math.round(b.budget), cout: Math.round(b.cout) })) : [];
  const documentTypeChart = toChart(charts.documentsParType || {});

  const statutChart = [
    { name: "En Service", value: kpis.enService, color: COLORS.emerald },
    { name: "À l'Arrêt", value: kpis.aArret, color: COLORS.rose },
    { name: "Maintenance", value: kpis.enMaintenance, color: COLORS.amber },
    { name: "Bloqués", value: kpis.bloques, color: COLORS.slate },
  ];

  const avgIVMS = data.vehicles.length > 0
    ? Math.round(data.vehicles.reduce((s, v) => s + v.scoreIVMS, 0) / data.vehicles.length)
    : 0;
  const scoreGlobal = avgIVMS;

  const kpiList = useMemo(() => [
    { label: "Total Véhicules", value: kpis.totalVehicules, icon: Truck, color: COLORS.blue, sub: "Parc total" },
    { label: "En Service", value: kpis.enService, icon: CheckCircle, color: COLORS.emerald, sub: `${kpis.tauxUtilisation}% utilisation` },
    { label: "À l'Arrêt", value: kpis.aArret, icon: XCircle, color: COLORS.rose, sub: "Véhicules bloqués" },
    { label: "En Maintenance", value: kpis.enMaintenance, icon: Wrench, color: COLORS.amber, sub: "En atelier" },
    { label: "Anomalies Ouvertes", value: kpis.anomaliesOuvertes, icon: AlertTriangle, color: COLORS.rose, sub: "Non résolues" },
    { label: "Check-ups (30j)", value: kpis.totalCheckups30j, icon: Shield, color: COLORS.cyan, sub: "Réalisés" },
    { label: "Kilométrage Total", value: Math.round(kpis.totalKm / 1000), icon: Gauge, color: COLORS.indigo, sub: "Milliers km", suffix: "k" },
    { label: "IVMS", value: avgIVMS, icon: Activity, color: COLORS.violet, sub: "Score fonctionnel", suffix: "%" },
    { label: "Taux Utilisation", value: kpis.tauxUtilisation, icon: TrendingUp, color: COLORS.emerald, sub: "Parc actif", suffix: "%" },
    { label: "Conso Moyenne", value: kpis.consoMoyenne, icon: Fuel, color: COLORS.amber, sub: "L/100km", decimals: 1 },
    { label: "Vitesse Moyenne", value: kpis.vitesseMoyenne, icon: Zap, color: COLORS.blue, sub: "km/h", decimals: 1 },
    { label: "SLA", value: kpis.slaCompliance, icon: Shield, color: COLORS.violet, sub: "Conformité", suffix: "%" },
    { label: "Score Global Flotte", value: scoreGlobal, icon: Trophy, color: COLORS.emerald, sub: "Performance", suffix: "%" },
    ...(kpis.totalPrestataires !== undefined ? [{ label: "Prestataires", value: kpis.totalPrestataires, icon: Building2, color: COLORS.blue, sub: "Prestataires actifs" }] : []),
    ...(kpis.totalInterventions !== undefined ? [{ label: "Interventions", value: kpis.totalInterventions, icon: Wrench, color: COLORS.cyan, sub: "Total" }] : []),
    ...(kpis.interventionsEnCours !== undefined ? [{ label: "En Cours", value: kpis.interventionsEnCours, icon: Timer, color: COLORS.amber, sub: "Interventions" }] : []),
    ...(kpis.interventionsTerminees !== undefined ? [{ label: "Terminées", value: kpis.interventionsTerminees, icon: BadgeCheck, color: COLORS.emerald, sub: "Interventions" }] : []),
    ...(kpis.interventionsEnRetard !== undefined ? [{ label: "En Retard", value: kpis.interventionsEnRetard, icon: AlertTriangle, color: COLORS.rose, sub: "Interventions" }] : []),
    ...(kpis.budgetConsomme !== undefined ? [{ label: "Budget Utilisé", value: Math.round(kpis.budgetConsomme), icon: Wallet, color: COLORS.amber, sub: "DH", suffix: " DH" }] : []),
    ...(kpis.budgetRestant !== undefined ? [{ label: "Budget Restant", value: Math.round(kpis.budgetRestant), icon: Wallet, color: COLORS.emerald, sub: "DH", suffix: " DH" }] : []),
    ...(kpis.coutTotalMaintenance !== undefined ? [{ label: "Coût Maintenance", value: Math.round(kpis.coutTotalMaintenance), icon: Wallet, color: COLORS.rose, sub: "DH", suffix: " DH" }] : []),
    ...(kpis.documentsExpires !== undefined ? [{ label: "Docs Expirés", value: kpis.documentsExpires, icon: FileText, color: COLORS.rose, sub: "Documents" }] : []),
    ...(kpis.documentsBientotExpire !== undefined ? [{ label: "Docs < 30j", value: kpis.documentsBientotExpire, icon: FileText, color: COLORS.amber, sub: "Expiration" }] : []),
    ...(kpis.tauxDisponibilite !== undefined ? [{ label: "Disponibilité", value: kpis.tauxDisponibilite, icon: Activity, color: COLORS.emerald, sub: "Flotte", suffix: "%" }] : []),
    ...(kpis.declarationsAujourdhui !== undefined ? [{ label: "Déclarations Ajd", value: kpis.declarationsAujourdhui, icon: AlertTriangle, color: COLORS.blue, sub: "Aujourd'hui" }] : []),
    ...(kpis.declarationsCeMois !== undefined ? [{ label: "Déclarations/Mois", value: kpis.declarationsCeMois, icon: AlertTriangle, color: COLORS.violet, sub: "Ce mois" }] : []),
  ], [kpis, avgIVMS, scoreGlobal]);

  const totalAnomaliesSource = sourceChart.reduce((s, x) => s + x.value, 0);
  const totalStatut = statutChart.reduce((s, x) => s + x.value, 0);

  const monthlyComp = useMemo(() => {
    const ev = charts.evolutionMensuelle || [];
    if (ev.length < 2) return null;
    const cur = ev[ev.length - 1];
    const prev = ev[ev.length - 2];
    return {
      anomalies: { cur: cur.anomalies, prev: prev.anomalies, delta: cur.anomalies - prev.anomalies },
      resolues: { cur: cur.resolues, prev: prev.resolues, delta: cur.resolues - prev.resolues },
      checkups: { cur: cur.checkups, prev: prev.checkups, delta: cur.checkups - prev.checkups },
      tickets: { cur: cur.tickets, prev: prev.tickets, delta: cur.tickets - prev.tickets },
      curMonth: cur.mois,
      prevMonth: prev.mois,
    };
  }, [charts.evolutionMensuelle]);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setAiGenerating(true);
    setAiReport(null);
    try {
      const res = await axios.get("/api/powerbi/v2/ai-insights");
      const rd = res.data as any;
      let report = "";
      if (rd.declarations?.insight) report += "### DÃ©clarations\n" + rd.declarations.insight + "\n\n";
      if (rd.checkups?.insight) report += "### Check-ups\n" + rd.checkups.insight + "\n\n";
      report += `**SynthÃ¨se Flotte:** ${kpis.totalVehicules} vÃ©hicules, ${kpis.totalDeclarations || 0} dÃ©clarations, taux de rÃ©solution ${kpis.tauxResolution || 0}%, ${kpis.tauxUtilisation}% utilisation.`;
      setAiReport(report);
    } catch {
      setAiReport("\u26a0\ufe0f Erreur de connexion au service IA. Vérifiez que le backend est accessible.");
    }
    setAiGenerating(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* AI Report Button */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="flex items-center justify-end">
        <motion.button onClick={() => { setAiModalOpen(true); handleGenerateReport(); }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold flex items-center gap-2 hover:from-violet-500/20 hover:to-blue-500/20 transition-all">
          <Sparkles className="w-3.5 h-3.5" />
          Générer Rapport IA
        </motion.button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={cardStagger} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {kpiList.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={i} variants={fadeInUp}
              whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.2)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="group bg-gradient-to-b from-[#1E293B] to-[#1A2436] rounded-xl border border-white/[0.06] p-3 hover:border-blue-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center gap-2.5 relative">
                <motion.div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "20" }}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }} transition={{ duration: 0.3 }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} strokeWidth={1.5} />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">
                    <AnimatedCounter value={kpi.value} suffix={kpi.suffix || ""} decimals={kpi.decimals || 0} />
                  </p>
                  <p className="text-[9px] text-gray-500 font-medium truncate">{kpi.sub}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Donuts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedCard delay={0.1} className="p-4" glow="rose">
          <CardHeader title="Répartition anomalies par source" icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-400" />} />
          {sourceChart.length > 0 ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 150, damping: 20 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sourceChart} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" paddingAngle={3}
                    animationBegin={0} animationDuration={1400} animationEasing="ease-out">
                    {sourceChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <text x="50%" y="48%" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">{totalAnomaliesSource}</text>
                  <text x="50%" y="58%" textAnchor="middle" fill="#94A3B8" fontSize="10">Total</text>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          ) : <EmptyState icon="anomaly" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-4" glow="blue">
          <CardHeader title="Répartition véhicules par statut" icon={<Truck className="w-3.5 h-3.5 text-blue-400" />} />
          {totalStatut > 0 ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 150, damping: 20 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statutChart} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" paddingAngle={3}
                    animationBegin={100} animationDuration={1400} animationEasing="ease-out">
                    {statutChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <text x="50%" y="48%" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">{kpis.totalVehicules}</text>
                  <text x="50%" y="58%" textAnchor="middle" fill="#94A3B8" fontSize="10">Véhicules</text>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          ) : <EmptyState icon="truck" message="Aucune donnée" />}
        </AnimatedCard>
      </div>

      {/* Gauge + Histogram + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnimatedCard delay={0.1} className="p-4" glow="emerald">
          <CardHeader title="Taux d'utilisation" icon={<Activity className="w-3.5 h-3.5 text-emerald-400" />} />
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 22 }} className="flex justify-center py-2">
            <CircularGauge value={kpis.tauxUtilisation} label="Taux d'utilisation" size={180} delay={0.3} />
          </motion.div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-center text-[10px]">
            <div className="bg-[#0F172A]/50 rounded-lg p-2 border border-white/5">
              <p className="text-gray-600 dark:text-gray-400">En service</p>
              <p className="text-sm font-bold text-emerald-400">{kpis.enService}</p>
            </div>
            <div className="bg-[#0F172A]/50 rounded-lg p-2 border border-white/5">
              <p className="text-gray-600 dark:text-gray-400">À l'arrêt</p>
              <p className="text-sm font-bold text-rose-400">{kpis.aArret}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-4" glow="rose">
          <CardHeader title="Histogramme anomalies ouvertes" icon={<BarChart3 className="w-3.5 h-3.5 text-rose-400" />} />
          {(charts.evolutionMensuelle || []).length > 0 ? (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" />
                  <XAxis dataKey="mois" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="anomalies" name="Anomalies" fill={COLORS.rose} radius={[6, 6, 0, 0]}
                    animationBegin={200} animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          ) : <EmptyState icon="anomaly" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="p-4" glow="blue">
          <CardHeader title="Comparaison mensuelle" icon={<TrendingUp className="w-3.5 h-3.5 text-violet-400" />} />
          {monthlyComp ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-2.5">
              {[
                { label: "Anomalies", cur: monthlyComp.anomalies.cur, prev: monthlyComp.anomalies.prev, delta: monthlyComp.anomalies.delta },
                { label: "Résolues", cur: monthlyComp.resolues.cur, prev: monthlyComp.resolues.prev, delta: monthlyComp.resolues.delta },
                { label: "Check-ups", cur: monthlyComp.checkups.cur, prev: monthlyComp.checkups.prev, delta: monthlyComp.checkups.delta },
                { label: "Tickets", cur: monthlyComp.tickets.cur, prev: monthlyComp.tickets.prev, delta: monthlyComp.tickets.delta },
              ].map((item, i) => {
                const pctChange = item.prev > 0 ? Math.round((item.delta / item.prev) * 100) : 0;
                const isUp = item.delta > 0;
                const isDown = item.delta < 0;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-center justify-between px-3 py-2 bg-[#0F172A]/50 rounded-lg border border-white/5 text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium w-20">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-[10px]">{monthlyComp.prevMonth}: <span className="text-gray-300 font-bold">{item.prev}</span></span>
                      <span className="text-gray-300 font-bold">{item.cur}</span>
                      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isUp ? "text-rose-400" : isDown ? "text-emerald-400" : "text-gray-500"}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
                        {item.delta === 0 ? "—" : `${isUp ? "+" : ""}${pctChange}%`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : <EmptyState icon="truck" message="Pas de comparaison" />}
        </AnimatedCard>
      </div>

      {/* Budget Analysis */}
      {budgetChart.length > 0 && (
        <AnimatedCard delay={0.15} className="p-4" glow="amber">
          <CardHeader title="Budget vs Réel" icon={<Wallet className="w-3.5 h-3.5 text-amber-400" />} />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetChart}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" />
                <XAxis dataKey="mois" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94A3B8" }} />
                <Bar dataKey="budget" name="Budget" fill={COLORS.emerald} radius={[4, 4, 0, 0]} animationBegin={100} animationDuration={1200} />
                <Bar dataKey="cout" name="Coût réel" fill={COLORS.rose} radius={[4, 4, 0, 0]} animationBegin={300} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatedCard>
      )}

      {/* Evolution mensuelle */}
      <AnimatedCard delay={0.1} className="p-4" glow="blue">
        <CardHeader title="Évolution mensuelle" icon={<Activity className="w-3.5 h-3.5 text-violet-400" />} />
        {charts.evolutionMensuelle?.length > 0 ? (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={charts.evolutionMensuelle}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" />
                <XAxis dataKey="mois" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94A3B8" }} />
                <Bar dataKey="anomalies" name="Anomalies" fill={COLORS.rose} radius={[6, 6, 0, 0]}
                  animationBegin={100} animationDuration={1200} animationEasing="ease-out" />
                <Line type="monotone" dataKey="resolues" name="Résolues" stroke={COLORS.emerald} strokeWidth={2.5}
                  dot={{ r: 3, fill: COLORS.emerald }} animationBegin={300} animationDuration={1200} />
                <Line type="monotone" dataKey="checkups" name="Check-ups" stroke={COLORS.blue} strokeWidth={2}
                  dot={{ r: 2, fill: COLORS.blue }} animationBegin={500} animationDuration={1200} />
                <Line type="monotone" dataKey="tickets" name="Tickets" stroke={COLORS.amber} strokeWidth={2}
                  dot={{ r: 2, fill: COLORS.amber }} animationBegin={700} animationDuration={1200} />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        ) : <EmptyState icon="truck" message="Aucune donnée" />}
      </AnimatedCard>

      {/* Small charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedCard delay={0.1} className="p-4" glow="blue">
          <CardHeader title="Répartition par marque" icon={<Truck className="w-3.5 h-3.5 text-indigo-400" />} />
          {marqueChart.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
              {marqueChart.sort((a, b) => b.value - a.value).map((item, i) => {
                const total = marqueChart.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? item.value / total * 100 : 0;
                return (
                  <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                      <span className="font-bold text-gray-200">{item.value} <span className="text-gray-500 font-normal">({Math.round(pct)}%)</span></span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : <EmptyState icon="truck" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-4" glow="amber">
          <CardHeader title="Types d'incident" icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />} />
          {typePanneChart.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
              {typePanneChart.sort((a, b) => b.value - a.value).map((item, i) => {
                const total = typePanneChart.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? item.value / total * 100 : 0;
                return (
                  <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                      <span className="font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{item.value} <span className="text-gray-500 font-normal">({Math.round(pct)}%)</span></span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : <EmptyState icon="anomaly" message="Aucune donnée" />}
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="p-4" glow="blue">
          <CardHeader title="Qualification" icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />} />
          {qualifChart.length > 0 ? (
            <div className="space-y-3">
              {qualifChart.sort((a, b) => b.value - a.value).map((item, i) => {
                const total = qualifChart.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? item.value / total * 100 : 0;
                const c = item.name === "PREVENTIVE" ? COLORS.blue : item.name === "CURATIVE" ? COLORS.amber : COLORS.slate;
                return (
                  <motion.div key={item.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="bg-[#0F172A]/50 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        <span className="text-sm font-bold text-gray-200">{item.name}</span>
                      </span>
                      <span className="text-lg font-bold" style={{ color: c }}>{item.value}</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: c }} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{Math.round(pct)}% du total</p>
                  </motion.div>
                );
              })}
            </div>
          ) : <EmptyState icon="document" message="Aucune donnée" />}
        </AnimatedCard>
      </div>

      {/* Documents par type */}
      {documentTypeChart.length > 0 && (
        <AnimatedCard delay={0.1} className="p-4" glow="blue">
          <CardHeader title="Documents par type" icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} />
          <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
            {documentTypeChart.sort((a, b) => b.value - a.value).map((item, i) => {
              const total = documentTypeChart.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? item.value / total * 100 : 0;
              return (
                <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                    <span className="font-bold text-gray-200">{item.value} <span className="text-gray-500 font-normal">({Math.round(pct)}%)</span></span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
          {data.documentStats && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[10px]">
              <div className="bg-[#0F172A]/50 rounded-lg p-2 border border-white/5">
                <p className="text-gray-500">Valides</p>
                <p className="text-sm font-bold text-emerald-400">{data.documentStats.valides}</p>
              </div>
              <div className="bg-[#0F172A]/50 rounded-lg p-2 border border-white/5">
                <p className="text-gray-500">Expirés</p>
                <p className="text-sm font-bold text-rose-400">{data.documentStats.expires}</p>
              </div>
              <div className="bg-[#0F172A]/50 rounded-lg p-2 border border-white/5">
                <p className="text-gray-500">&#60; 30j</p>
                <p className="text-sm font-bold text-amber-400">{data.documentStats.bientotExpires}</p>
              </div>
            </div>
          )}
        </AnimatedCard>
      )}

      {/* AI Insights */}
      {data.aiInsights && data.aiInsights.length > 0 && (
        <AnimatedCard delay={0.15} className="p-4" glow="blue">
          <CardHeader title="Analyses IA" icon={<BrainCircuit className="w-3.5 h-3.5 text-violet-400" />} />
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {data.aiInsights.map((insight, i) => {
              const impactColor = insight.impact === "HAUT" ? COLORS.rose : insight.impact === "MOYEN" ? COLORS.amber : COLORS.emerald;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 px-3 py-2.5 bg-[#0F172A]/50 rounded-lg border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: impactColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-relaxed">{insight.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {insight.tendance && (
                        <span className="text-[9px] font-medium" style={{
                          color: insight.tendance === "hausse" ? COLORS.rose : insight.tendance === "baisse" ? COLORS.emerald : COLORS.slate
                        }}>
                          {insight.tendance === "hausse" ? "\u2191 Hausse" : insight.tendance === "baisse" ? "\u2193 Baisse" : "\u2192 Stable"}
                        </span>
                      )}
                      {insight.recommandation && (
                        <span className="text-[9px] text-violet-400">{insight.recommandation}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatedCard>
      )}

      {/* Prestataires chart */}
      {prestataireChart.length > 0 && (
        <AnimatedCard delay={0.2} className="p-4" glow="amber">
          <CardHeader title="Interventions par prestataire" icon={<Building2 className="w-3.5 h-3.5 text-amber-400" />} />
          <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
            {prestataireChart.sort((a, b) => b.value - a.value).map((item, i) => {
              const total = prestataireChart.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? item.value / total * 100 : 0;
              return (
                <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                    <span className="font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{item.value} <span className="text-gray-500 font-normal">({Math.round(pct)}%)</span></span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatedCard>
      )}

      {/* Tableau aperçu véhicules */}
      <AnimatedCard delay={0.1} className="p-4" glow="blue">
        <CardHeader title="Aperçu véhicules" icon={<Truck className="w-3.5 h-3.5 text-blue-400" />} />
        <AnimatedTable
          headers={[
            { key: "immatriculation", label: "Immatriculation" },
            { key: "marque", label: "Marque" },
            { key: "statut", label: "Statut", align: "center" },
            { key: "kilometrage", label: "Km", align: "right" },
            { key: "chauffeurNom", label: "Chauffeur" },
            { key: "scoreIVMS", label: "IVMS", align: "right" },
          ]}
          rows={data.vehicles.slice(0, 20).map(v => ({
            key: v.id,
            cells: [
              <span className="font-mono font-semibold text-gray-200">{v.immatriculation}</span>,
              <span className="text-gray-600 dark:text-gray-400">{v.marque}</span>,
              <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  v.statut === "ACTIF" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  v.statut === "MAINTENANCE" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>{v.statut}</motion.span>,
              <span className="text-gray-600 dark:text-gray-400">{v.kilometrage ? v.kilometrage.toLocaleString() : "—"}</span>,
              <span className="text-gray-600 dark:text-gray-400">{v.chauffeurNom || "—"}</span>,
              (() => { const sc = v.scoreIVMS >= 80 ? COLORS.emerald : v.scoreIVMS >= 50 ? COLORS.amber : COLORS.rose;
                return <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }} className="font-bold" style={{ color: sc }}>{v.scoreIVMS}%</motion.span>; })(),
            ],
          }))}
          maxHeight="max-h-52"
        />
      </AnimatedCard>

      {/* TOP 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedCard delay={0.1} className="p-4" glow="emerald">
          <CardHeader title="TOP 10 Véhicules — Score IVMS" icon={<Trophy className="w-3.5 h-3.5 text-emerald-400" />} />
          <AnimatedTable
            headers={[
              { key: "rank", label: "#" },
              { key: "immatriculation", label: "Véhicule" },
              { key: "marque", label: "Marque" },
              { key: "statut", label: "Statut", align: "center" },
              { key: "scoreIVMS", label: "Score", align: "right" },
            ]}
            rows={data.vehicles.filter(v => v.scoreIVMS > 0).sort((a, b) => b.scoreIVMS - a.scoreIVMS).slice(0, 10).map((v, i) => {
              const sc = v.scoreIVMS >= 80 ? COLORS.emerald : v.scoreIVMS >= 50 ? COLORS.amber : COLORS.rose;
              return {
                key: v.id,
                cells: [
                  <span className="text-gray-500 font-mono">{String(i + 1).padStart(2, "0")}</span>,
                  <span className="font-mono font-semibold text-gray-200">{v.immatriculation}</span>,
                  <span className="text-gray-600 dark:text-gray-400">{v.marque}</span>,
                  <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      v.statut === "ACTIF" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      v.statut === "MAINTENANCE" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>{v.statut}</motion.span>,
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className="font-bold" style={{ color: sc }}>{v.scoreIVMS}%</motion.span>,
                ],
              };
            })}
          />
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-4" glow="blue">
          <CardHeader title="TOP 10 Chauffeurs" icon={<Users className="w-3.5 h-3.5 text-blue-400" />} />
          <AnimatedTable
            headers={[
              { key: "rank", label: "#" },
              { key: "nom", label: "Nom" },
              { key: "tauxConformite", label: "Conformité", align: "center" },
              { key: "anomalies", label: "Anomalies", align: "center" },
              { key: "score", label: "Score", align: "right" },
            ]}
            rows={data.drivers.slice(0, 10).map((d, i) => {
              const sc = d.score >= 80 ? COLORS.emerald : d.score >= 50 ? COLORS.amber : COLORS.rose;
              return {
                key: String(i),
                cells: [
                  <span className="text-gray-500 font-mono">{String(i + 1).padStart(2, "0")}</span>,
                  <span className="font-semibold text-gray-200">{d.nom}</span>,
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={d.tauxConformite >= 80 ? "text-emerald-400" : "text-amber-400"}>{d.tauxConformite}%</motion.span>,
                  <span className="text-gray-600 dark:text-gray-400">{d.anomalies}</span>,
                  <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="font-bold" style={{ color: sc }}>{d.score}</motion.span>,
                ],
              };
            })}
          />
        </AnimatedCard>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <AnimatedCard delay={0.1} className="p-4" glow="rose">
          <CardHeader title="Alertes actives" icon={<Bell className="w-3.5 h-3.5 text-rose-400" />} />
          <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
            {data.alerts.slice(0, 8).map((a, i) => {
              const sevColor = a.severite === "HAUTE" ? COLORS.rose : a.severite === "MOYENNE" ? COLORS.amber : COLORS.blue;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2 bg-[#0F172A]/50 rounded-lg border border-white/5 text-xs">
                  <motion.span className="w-2 h-2 rounded-full" style={{ backgroundColor: sevColor }}
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                  <span className="text-gray-600 dark:text-gray-400 font-medium min-w-[60px]">{a.type}</span>
                  <span className="text-gray-200 flex-1">{a.message}</span>
                  <motion.span whileHover={{ scale: 1.05 }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      a.severite === "HAUTE" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      a.severite === "MOYENNE" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>{a.severite}</motion.span>
                </motion.div>
              );
            })}
          </div>
        </AnimatedCard>
      )}

      {/* AI Report Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setAiModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl w-[700px] max-w-[90vw] max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-white">Rapport IA — Synthèse Flotte</h3>
                </div>
                <motion.button onClick={() => setAiModalOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {aiGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-8 h-8 text-violet-400" />
                    </motion.div>
                    <p className="text-sm text-gray-400">Génération du rapport en cours...</p>
                  </div>
                ) : aiReport ? (
                  <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">{aiReport}</div>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/5 shrink-0">
                <motion.button onClick={() => setAiModalOpen(false)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg bg-white/5 text-xs text-gray-400 hover:text-gray-200 transition-colors">Fermer</motion.button>
                <motion.button onClick={handleGenerateReport} disabled={aiGenerating}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-bold hover:bg-violet-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {aiGenerating ? "Génération..." : "Régénérer"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExecutiveDashboard;


