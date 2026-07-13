import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Truck, Search, AlertTriangle, FileText,
  Clock, Gauge, Fuel, Shield, Activity,
  BrainCircuit, Sparkles
} from "lucide-react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import { DashboardData, COLORS, STATUS_COLORS } from "./types";
import { glassmorphism, fadeInUp, cardStagger, premiumCard, listItem, rowStagger } from "../../lib/animations";
import { EmptyState } from "../../lib/EmptyState";
import { AnimatedCard } from "../../lib/AnimatedCard";
import axios from "axios";
import { CircularGauge } from "../../lib/CircularGauge";

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

const VehicleDetail: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [search, setSearch] = useState("");
  const [selectedVeh, setSelectedVeh] = useState<string | null>(null);
  const [aiAnalysing, setAiAnalysing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data.vehicles;
    const q = search.toLowerCase();
    return data.vehicles.filter(v =>
      (v.immatriculation && v.immatriculation.toLowerCase().includes(q)) ||
      (v.marque && v.marque.toLowerCase().includes(q)) ||
      (v.chauffeurNom && v.chauffeurNom.toLowerCase().includes(q))
    );
  }, [data.vehicles, search]);

  const vehicle = selectedVeh ? data.vehicles.find(v => v.immatriculation && v.immatriculation === selectedVeh) : null;
  const vehicleDeclarations = selectedVeh ? data.declarations.filter(d => d.vehicule && d.vehicule === selectedVeh) : [];
  const vehicleDocs = selectedVeh ? data.documents.filter(d => d.vehicule === selectedVeh) : [];

  const scoreColor = (v: number) => v >= 80 ? COLORS.emerald : v >= 50 ? COLORS.amber : COLORS.rose;

  const vehicleKpis = useMemo(() => {
    const v = vehicle;
    if (!v) return [];
    const estHeures = v.kilometrage > 0 ? Math.round(v.kilometrage / 60) : null;
    const estConsoVeh = v.carburant === "Diesel" ? 9.5 : v.carburant === "Essence" ? 11.2 : null;
    const resolvedCount = vehicleDeclarations.filter(d => d.statut === "CLOTURE" || d.statut === "RESOLU").length;
    const perfScore = v.anomalies > 0 ? Math.round((resolvedCount / v.anomalies) * 100) : v.scoreIVMS;
    return [
      { label: "IVMS", value: `${v.scoreIVMS}%`, icon: Shield, color: scoreColor(v.scoreIVMS) },
      { label: "Kilométrage", value: v.kilometrage ? `${v.kilometrage.toLocaleString()} km` : "—", icon: Gauge, color: COLORS.blue },
      { label: "Heures moteur", value: estHeures ? `${estHeures}h` : "—", icon: Clock, color: COLORS.blue },
      { label: "Déclarations", value: `${v.anomalies || 0}`, icon: Activity, color: COLORS.cyan },
      { label: "Résolues", value: `${resolvedCount}/${v.anomalies || 0}`, icon: Activity, color: COLORS.emerald },
      { label: "Consommation", value: estConsoVeh ? `${estConsoVeh.toFixed(1)} L/100km` : "—", icon: Fuel, color: COLORS.emerald },
      { label: "Performance", value: `${perfScore}%`, icon: Activity, color: scoreColor(perfScore) },
    ];
  }, [vehicle, vehicleDeclarations]);

  const statutColor = (s: string) => {
    if (s === "ACTIF") return COLORS.emerald;
    if (s === "MAINTENANCE") return COLORS.amber;
    return COLORS.rose;
  };

  const monthlyData = useMemo(() => {
    const groups: Record<string, { anomalies: number; resolues: number }> = {};
    vehicleDeclarations.forEach(d => {
      if (!d.date) return;
      const parts = d.date.split("-");
      const month = parts[0] + "-" + parts[1];
      if (!groups[month]) groups[month] = { anomalies: 0, resolues: 0 };
      groups[month].anomalies += 1;
      if (d.statut === "CLOTURE" || d.statut === "RESOLU") groups[month].resolues += 1;
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([mois, vals]) => ({ mois, ...vals }));
  }, [vehicleDeclarations]);

  const lastAnomalies = useMemo(() => {
    return [...vehicleDeclarations]
      .filter(d => d.date)
      .sort((a, b) => b.date!.localeCompare(a.date!))
      .slice(0, 10);
  }, [vehicleDeclarations]);

  const predictiveScore = useMemo(() => {
    if (!vehicle) return 0;
    const total = vehicleDeclarations.length;
    const resolved = vehicleDeclarations.filter(d => d.statut === "CLOTURE" || d.statut === "RESOLU").length;
    const historyScore = total > 0 ? (resolved / total) * 100 : 100;
    const docScore = vehicle.documents > 0 ? (vehicle.documentsValides / vehicle.documents) * 100 : 0;
    return Math.round(historyScore * 0.4 + docScore * 0.25 + (vehicle.scoreIVMS || 0) * 0.2 + (vehicle.scoreIVMS || 0) * 0.15);
  }, [vehicle, vehicleDeclarations]);

  const componentScores = useMemo(() => {
    if (!vehicle) return [];
    const total = vehicleDeclarations.length;
    const resolved = vehicleDeclarations.filter(d => d.statut === "CLOTURE" || d.statut === "RESOLU").length;
    return [
      { label: "Historique", value: Math.round(total > 0 ? (resolved / total) * 100 : 100), weight: "40%", color: COLORS.blue },
      { label: "Documents", value: Math.round(vehicle.documents > 0 ? (vehicle.documentsValides / vehicle.documents) * 100 : 0), weight: "25%", color: COLORS.amber },
      { label: "Check-ups", value: vehicle.scoreIVMS || 0, weight: "20%", color: COLORS.cyan },
      { label: "Conducteur", value: Math.round((vehicle.scoreIVMS || 0) * 0.8 + 20), weight: "15%", color: COLORS.violet },
    ];
  }, [vehicle, vehicleDeclarations]);

  const handleAiAnalyze = async () => {
    if (!vehicle) return;
    setAiAnalysing(true);
    setAiResult(null);
    setAiScore(null);
    try {
      const res = await axios.post(`/api/ai/predict/vehicle/${vehicle.id}`, {
        immatriculation: vehicle.immatriculation,
        scoreIVMS: vehicle.scoreIVMS,
        documents: vehicle.documents,
        documentsValides: vehicle.documentsValides,
        declarations: vehicleDeclarations,
        totalKm: vehicle.kilometrage,
      });
      const d = res.data as any;
      if (d.score !== undefined) setAiScore(d.score);
      setAiResult(d.analyse || d.analysis || d.recommendation || JSON.stringify(d));
    } catch {
      setAiScore(predictiveScore);
      setAiResult("⚠️ Analyse IA momentanément indisponible. Score calculé localement.");
    }
    setAiAnalysing(false);
  };

  const docProgressBar = (jrs: number) => Math.min(100, Math.max(0, (jrs / 365) * 100));
  const docStatusColor = (jrs: number) => jrs < 0 ? COLORS.rose : jrs <= 30 ? COLORS.amber : COLORS.emerald;

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-4 gap-5"
      variants={cardStagger}
      initial="hidden"
      animate="visible"
    >
      {/* LEFT SIDEBAR */}
      <motion.div variants={fadeInUp} className={`lg:col-span-1 ${glassmorphism} p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Parc ({data.vehicles.length})</span>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Immatriculation, marque..."
            className="w-full bg-[#0F172A] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/30 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)] transition-all duration-300" />
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
          {filtered.sort((a, b) => {
            const order: Record<string, number> = { IMMOBILISE: 0, BLOQUE: 1, MAINTENANCE: 2, ACTIF: 3 };
            return (order[a.statut] ?? 99) - (order[b.statut] ?? 99);
          }).map(v => {
            const immat = v.immatriculation || String(v.id);
            const isSelected = selectedVeh === immat;
            return (
              <motion.button
                key={v.id}
                onClick={() => setSelectedVeh(immat)}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(59,130,246,0.08)" }}
                whileTap={{ scale: 0.97 }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                  isSelected ? "bg-blue-600/15 border border-blue-500/20" : "hover:bg-white/5 border border-transparent"
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? "bg-blue-600/20" : "bg-white/5"}`}>
                    <Truck className="w-3.5 h-3.5" style={{ color: statutColor(v.statut) }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200 font-mono">{v.immatriculation}</p>
                    <p className="text-[9px] text-gray-500">{v.marque} {v.modele} · {v.chauffeurNom || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {v.documents > 0 && v.documentsValides < v.documents && (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  )}
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statutColor(v.statut) }} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-3 space-y-4">
        {!vehicle ? (
          <motion.div variants={fadeInUp}>
            <EmptyState icon="truck" title="Sélectionnez un véhicule" message="Cliquez sur un camion pour voir sa fiche détaillée" />
          </motion.div>
        ) : (
          <>
            {/* 1. FICHE CAMION */}
            <motion.div variants={fadeInUp} className={`${glassmorphism} p-5`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shrink-0">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-bold text-white">{vehicle.immatriculation || `Véhicule #${vehicle.id}`}</h2>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                      vehicle.statut === "ACTIF" ? "bg-emerald-500/10 text-emerald-400" :
                      vehicle.statut === "MAINTENANCE" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    }`}>{vehicle.statut}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{vehicle.marque} {vehicle.modele} · {vehicle.type} · {vehicle.annee}</p>
                </div>
              </div>
              <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2" variants={cardStagger} initial="hidden" animate="visible">
                {[
                  { label: "N° Châssis (VIN)", value: vehicle.numeroOrdre || "—" },
                  { label: "Immatriculation", value: vehicle.immatriculation },
                  { label: "Marque", value: vehicle.marque },
                  { label: "Modèle", value: vehicle.modele },
                  { label: "Type / Catégorie", value: vehicle.type },
                  { label: "Agence", value: vehicle.agence },
                  { label: "Ville", value: vehicle.agence || vehicle.type || "—" },
                  { label: "Carburant", value: vehicle.carburant || "—" },
                  { label: "Kilométrage", value: vehicle.kilometrage ? `${vehicle.kilometrage.toLocaleString()} km` : "—" },
                  { label: "Anomalies", value: `${vehicle.anomalies || 0} déclarations` },
                  { label: "Statut", badge: vehicle.statut },
                ].map((f: any, i) => (
                  <motion.div key={i} variants={fadeInUp} className="bg-[#0F172A]/50 rounded-lg px-3 py-2 border border-white/5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">{f.label}</p>
                    {f.badge ? (
                      <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        f.badge === "ACTIF" ? "bg-emerald-500/10 text-emerald-400" :
                        f.badge === "MAINTENANCE" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                      }`}>{f.badge}</span>
                    ) : (
                      <p className="text-xs font-bold text-gray-200 truncate">{f.value}</p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* 2. KPI ROW */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {vehicleKpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <motion.div key={i} variants={fadeInUp}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className={`${glassmorphism} p-3.5 flex flex-col items-center gap-1.5 text-center ${premiumCard}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "20" }}>
                      <Icon className="w-4 h-4" style={{ color: kpi.color }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{kpi.value}</p>
                      <p className="text-[9px] text-gray-500 font-medium">{kpi.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* 3. SCORE BARS */}
            <motion.div variants={fadeInUp} className={`${glassmorphism} p-4`}>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "Sécurité", value: vehicle.scoreIVMS >= 60 ? Math.min(vehicle.scoreIVMS + 10, 100) : Math.max(vehicle.scoreIVMS - 10, 0) },
                  { label: "Qualité", value: vehicle.scoreIVMS },
                  { label: "Documentaire", value: vehicle.documents > 0 ? Math.round(vehicle.documentsValides / vehicle.documents * 100) : 0 },
                ].map((bar, i) => {
                  const v = Math.min(bar.value, 100);
                  const bc = scoreColor(v);
                  return (
                    <motion.div key={i} variants={fadeInUp} className="bg-[#0F172A]/50 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-600 dark:text-gray-400">{bar.label}</span>
                        <span className="font-bold" style={{ color: bc }}>{v}%</span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${v}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                          style={{ backgroundColor: bc }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* 3.5 SANTÉ PRÉDICTIVE VÉHICULE */}
            <motion.div variants={fadeInUp} className={`${glassmorphism} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Santé Prédictive</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                    predictiveScore >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                    predictiveScore >= 60 ? "bg-amber-500/10 text-amber-400" :
                    predictiveScore >= 40 ? "bg-orange-500/10 text-orange-400" :
                    "bg-rose-500/10 text-rose-400"
                  }`}>
                    {predictiveScore >= 80 ? "Risque Faible" : predictiveScore >= 60 ? "Risque Moyen" : predictiveScore >= 40 ? "Risque Élevé" : "Risque Critique"}
                  </span>
                  <motion.button
                    onClick={handleAiAnalyze}
                    disabled={aiAnalysing}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiAnalysing ? "Analyse..." : "Analyser IA"}
                  </motion.button>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <CircularGauge value={aiScore !== null ? aiScore : predictiveScore} label="Score Santé" size={100} delay={0.2} />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {componentScores.map((cs, i) => (
                    <motion.div key={i} variants={fadeInUp} className="bg-[#0F172A]/50 rounded-lg px-3 py-2 border border-white/5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{cs.label}</span>
                        <span className="font-bold" style={{ color: cs.color }}>{cs.value}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${cs.value}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          style={{ backgroundColor: cs.color }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-500 mt-0.5">Poids: {cs.weight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg"
                >
                  <p className="text-xs text-gray-300 leading-relaxed">{aiResult}</p>
                </motion.div>
              )}
            </motion.div>

            {/* 4. EVOLUTION CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div variants={fadeInUp} className={`${glassmorphism} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Évolution anomalies vs réparations</span>
                </div>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="mois" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: "#9CA3AF" }} />
                      <Bar dataKey="anomalies" name="Anomalies" fill={COLORS.rose} radius={[3, 3, 0, 0]} barSize={12} animationDuration={1200} />
                      <Line dataKey="resolues" name="Réparations" stroke={COLORS.emerald} strokeWidth={2} dot={{ r: 3, fill: COLORS.emerald }} animationDuration={1200} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon="anomaly" message="Aucune donnée disponible" />
                )}
              </motion.div>
              <motion.div variants={fadeInUp} className={`${glassmorphism} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Dernières anomalies</span>
                </div>
                {lastAnomalies.length > 0 ? (
                  <motion.div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar" variants={rowStagger} initial="hidden" animate="visible">
                    {lastAnomalies.map((d, i) => (
                      <motion.div key={i} variants={listItem} className="flex items-center justify-between px-3 py-2 bg-[#0F172A]/50 rounded-lg text-xs border border-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[d.criticite] || COLORS.slate }} />
                          <span className="text-gray-600 dark:text-gray-400 shrink-0">{d.date?.split("T")[0]}</span>
                          <span className="text-gray-300 font-medium truncate">{d.typePanne || d.element}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            d.criticite === "CRITIQUE" ? "bg-rose-500/10 text-rose-400" :
                            d.criticite === "MAJEURE" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                          }`}>{d.criticite}</span>
                          <span className={`text-[9px] font-bold ${
                            d.statut === "CLOTURE" || d.statut === "RESOLU" ? "text-emerald-400" : "text-amber-400"
                          }`}>{d.statut}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <EmptyState icon="anomaly" message="Aucune anomalie" />
                )}
              </motion.div>
            </div>

            {/* 5. DOCUMENTATION SECTION */}
            {vehicleDocs.length > 0 && (
              <motion.div variants={fadeInUp} className={`${glassmorphism} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Documents ({vehicleDocs.length})</span>
                </div>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" variants={cardStagger} initial="hidden" animate="visible">
                  {vehicleDocs.map((d, i) => {
                    const jrs = d.joursRestants;
                    const sc = docStatusColor(jrs);
                    const progress = docProgressBar(jrs);
                    const statusText = jrs < 0 ? `Expiré (${Math.abs(jrs)}j)` : jrs <= 30 ? `${jrs}j restants` : "Valide";
                    return (
                      <motion.div key={i} variants={fadeInUp} className="bg-[#0F172A]/50 rounded-lg border border-white/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-200">{d.type}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: sc + "20", color: sc }}>
                            {statusText}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            style={{ backgroundColor: sc }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">{d.dateExpiration?.split("T")[0] || "—"}</span>
                          <span className="font-bold" style={{ color: sc }}>{jrs > 0 ? `${jrs}j` : "Expiré"}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default VehicleDetail;
