import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import {
  Truck, Search, AlertCircle, Shield, FileText, Activity, Wrench,
  Calendar, User, Filter, X, RefreshCw, Bell, CheckCircle, XCircle,
  AlertTriangle, Brain, BarChart3, Fuel, Gauge, Clock, Download, ChevronRight,
  ArrowUpRight, ArrowDownRight, Settings, MapPin, Home
} from "lucide-react";
import FleetDocumentManager from "./FleetDocumentManager";
import { TruckLifecycle } from "../lib/premium/immersive/TruckLifecycle";

const API = "http://localhost:8080";
const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
const GRADIENTS = ["from-blue-500 to-blue-600", "from-emerald-500 to-emerald-600", "from-amber-500 to-orange-500", "from-violet-500 to-violet-600", "from-rose-500 to-rose-600", "from-cyan-500 to-cyan-600"];

type TabKey = "overview" | "vehicles" | "drivers" | "alerts" | "documents";

export default function SmartFleetDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleCard, setVehicleCard] = useState<any>(null);
  const [vehicleCardLoading, setVehicleCardLoading] = useState(false);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [fullExport, setFullExport] = useState<any>(null);
  const [filters, setFilters] = useState({ dateDebut: "", dateFin: "", source: "", numeroOrdre: "", chauffeur: "", element: "", categorie: "" });
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [driverName, setDriverName] = useState("");
  const [driverAnalysis, setDriverAnalysis] = useState<any>(null);
  const [driverLoading, setDriverLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<any>(`${API}/api/admin/fleet/dashboard`);
      setData(res.data);
      setFilterOptions(res.data.filters || {});
      const al = await axios.get<any>(`${API}/api/powerbi/v2/alerts`);
      setAlertsData(al.data || []);
    } catch { console.error("Erreur chargement"); }
    finally { setLoading(false); }
  };

  const loadVehicleCard = async (imma: string) => {
    setVehicleCardLoading(true);
    setSelectedVehicle(imma);
    try {
      const res = await axios.get<any>(`${API}/api/powerbi/v2/vehicle-id-card/${imma}`);
      setVehicleCard(res.data);
    } catch { setVehicleCard(null); }
    setVehicleCardLoading(false);
  };

  const loadDriverAnalysis = async () => {
    if (!driverName.trim()) return;
    setDriverLoading(true);
    try {
      const res = await axios.get<any>(`${API}/api/powerbi/v2/driver-deep-analysis/${encodeURIComponent(driverName.trim())}`);
      setDriverAnalysis(res.data);
    } catch { setDriverAnalysis(null); }
    setDriverLoading(false);
  };

  const loadFullExport = async () => {
    try {
      const res = await axios.get<any>(`${API}/api/powerbi/v2/full-export`);
      setFullExport(res.data);
    } catch {}
  };

  const resetFilters = () => setFilters({ dateDebut: "", dateFin: "", source: "", numeroOrdre: "", chauffeur: "", element: "", categorie: "" });

  const filteredClaims = (data?.claims || []).filter((c: any) => {
    if (filters.source && c.source !== filters.source) return false;
    if (filters.numeroOrdre && c.numeroOrdreCamion !== filters.numeroOrdre) return false;
    if (filters.chauffeur && c.chauffeurNom !== filters.chauffeur) return false;
    if (filters.element && c.elementVehicule !== filters.element) return false;
    if (filters.categorie && c.categorie !== filters.categorie) return false;
    if (filters.dateDebut && c.dateReclamation && c.dateReclamation < filters.dateDebut) return false;
    if (filters.dateFin && c.dateReclamation && c.dateReclamation > filters.dateFin + "T23:59:59") return false;
    return true;
  });

  const toChart = (map: Record<string, any>) =>
    Object.entries(map || {}).map(([name, value]) => ({
      name, value: typeof value === 'object' ? (value as any).count || 0 : Number(value)
    }));

  const stats = data?.stats || {};
  const legalDocs = data?.legalDocs || {};
  const vehicles = data?.vehicles || [];
  const claims = data?.claims || [];
  const alerts = data?.alerts || [];
  const alertCounts = data?.alertCounts || {};
  const checklists = data?.checklists || [];
  const ivms = data?.ivms || {};

  const chartByType = toChart(stats.byType);
  const chartByMarque = toChart(stats.byMarque);
  const chartByElement = toChart(stats.byElement);
  const chartByCategorie = toChart(stats.byCategorie);
  const chartByChauffeur = toChart(stats.byChauffeur);

  const totalVeh = stats.totalVehicles || vehicles.length || 0;
  const totalDecs = stats.totalDeclarations || claims.length || 0;

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Vue Globale", icon: Home },
    { key: "vehicles", label: "Camions", icon: Truck },
    { key: "drivers", label: "Chauffeurs", icon: User },
    { key: "alerts", label: "Alertes", icon: Bell },
    { key: "documents", label: "Documents", icon: FileText },
  ];

  const inputClass = "w-full px-3 py-2 bg-white/80 dark:bg-dark-border/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-400/40 focus:border-transparent backdrop-blur-sm transition-all";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-dark-text-secondary mb-1.5 tracking-wide uppercase";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 space-y-4">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Smart Fleet ID</h1>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium -mt-0.5">Danone · Parc Véhicules</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadFullExport} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5">
                <Download className="w-3 h-3" /> Export
              </button>
              <button onClick={fetchData} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ========== TAB: OVERVIEW ========== */}
        {activeTab === "overview" && (
          <>
            {/* Hero KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Véhicules", value: totalVeh, icon: Truck, color: "from-blue-500 to-blue-600", sub: `${vehicles.filter((v:any) => v.statut === 'ACTIF').length} actifs` },
                { label: "Déclarations", value: totalDecs, icon: FileText, color: "from-amber-500 to-orange-500", sub: `${claims.filter((c:any) => c.statut === 'CLOTURE').length} cloturées` },
                { label: "Check-ups", value: checklists.length, icon: CheckCircle, color: "from-emerald-500 to-emerald-600", sub: `${checklists.filter((c:any) => c.estConforme).length} conformes` },
                { label: "Alertes", value: alertCounts.active || 0, icon: Bell, color: "from-rose-500 to-pink-600", sub: `${alertCounts.blocking || 0} bloquantes` },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i} className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300">
                    <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${kpi.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">{kpi.label}</span>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{kpi.value}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{kpi.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* IVMS + Documents row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* IVMS Gauge */}
              <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-white" /></div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white">IVMS</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" className="dark:stroke-slate-700" strokeWidth="3" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="3"
                        strokeDasharray={`${(ivms.fonctionnel || 99.4) / 100 * 100.53} 100.53`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {ivms.fonctionnel || 99.4}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ivms.statut || "Fonctionnel"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{ivms.actif || 0} / {ivms.total || 0} actifs</p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Gauge className="w-3 h-3 text-emerald-500" />
                      <span className="text-slate-500 dark:text-slate-400">Score global</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Docs */}
              <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white">Documents Légaux</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "carteGrise", label: "Carte Grise", color: "bg-blue-500" },
                    { key: "onssa", label: "ONSSA", color: "bg-emerald-500" },
                    { key: "metrologique", label: "Métrologique", color: "bg-amber-500" }
                  ].map(doc => {
                    const info = legalDocs[doc.key] || {};
                    const total = info.count || 1;
                    const valid = info.valid || 0;
                    const pct = Math.round((valid / total) * 100);
                    return (
                      <div key={doc.key} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{doc.label}</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-bold text-slate-800 dark:text-white">{valid}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">/ {total}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                          <div className={`${doc.color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5">{pct}% valides</p>
                      </div>
                    );
                  })}
                </div>
                {(legalDocs.cessationRate || 0) > 0 && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">{legalDocs.cessationRate}% de cessation documentaire</span>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { title: "Réclamations par type de panne", icon: Wrench, data: chartByType, chart: "pie" },
                { title: "Répartition par marque", icon: Truck, data: chartByMarque, chart: "bar" },
                { title: "Répartition par élément", icon: Shield, data: chartByElement, chart: "pie" },
                { title: "Répartition par catégorie", icon: FileText, data: chartByCategorie, chart: "bar" },
              ].map((section, i) => {
                const Icon = section.icon;
                const hasData = section.data.length > 0;
                return (
                  <div key={i} className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-white" /></div>
                      <span className="text-sm font-bold text-slate-700 dark:text-white">{section.title}</span>
                    </div>
                    {hasData ? (
                      section.chart === "pie" ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={section.data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name, value}) => `${name} (${value})`}>
                              {section.data.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={section.data}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                            <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-[260px] text-sm text-slate-600 dark:text-slate-400">Aucune donnée</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Checklists Table */}
            {checklists.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-white" /></div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white">Dernières Checklists</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Date</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chauffeur</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Véhicule</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pneus</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Freins</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Feux</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {checklists.slice(0, 8).map((cl: any) => (
                        <tr key={cl.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2.5 text-xs text-slate-500">{cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleDateString("fr-FR") : "—"}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">{cl.chauffeurNom || "—"}</td>
                          <td className="px-3 py-2.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{cl.vehiculeImmatriculation}</td>
                          <td className="px-3 py-2.5 text-center text-xs">{cl.pneus ? "✅" : "❌"}</td>
                          <td className="px-3 py-2.5 text-center text-xs">{cl.freins ? "✅" : "❌"}</td>
                          <td className="px-3 py-2.5 text-center text-xs">{cl.feux ? "✅" : "❌"}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                              cl.statut === 'COMPLETE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>{cl.statut}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== TAB: VEHICLES ========== */}
        {activeTab === "vehicles" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle List */}
            <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center"><Truck className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-sm font-bold text-slate-700 dark:text-white">Parc ({vehicles.length})</span>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {vehicles.map((v: any) => (
                  <button key={v.id} onClick={() => loadVehicleCard(v.immatriculation)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                      selectedVehicle === v.immatriculation
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-transparent'
                    }`}>
                    <div className="flex items-center gap-2">
                      <TruckLifecycle status={v.statut || 'DISPONIBLE'} compact />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-xs">{v.immatriculation}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{v.marque}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{v.statut || 'ACTIF'}</span>
                      </div>
                      <ChevronRight className={`w-3 h-3 flex-shrink-0 ${selectedVehicle === v.immatriculation ? 'text-blue-500' : 'text-slate-300'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="lg:col-span-2">
              {!selectedVehicle ? (
                <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-10 flex flex-col items-center justify-center text-center">
                  <Truck className="w-12 h-12 text-slate-300 dark:text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Sélectionnez un véhicule</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Cliquez sur un camion pour voir sa fiche détaillée</p>
                </div>
              ) : vehicleCardLoading ? (
                <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-10 flex items-center justify-center">
                  <div className="animate-pulse space-y-4 w-full">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="grid grid-cols-3 gap-3">
                      {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
                    </div>
                  </div>
                </div>
              ) : vehicleCard ? (
                <div className="space-y-4">
                  {/* Identity Card */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center"><Search className="w-3.5 h-3.5 text-white" /></div>
                      <span className="text-sm font-bold text-slate-700 dark:text-white">Carte d'Identité</span>
                    </div>
                    <div className="mb-4 -mx-2">
                      <TruckLifecycle status={vehicleCard.idCard?.statut || 'DISPONIBLE'} vehicleInfo={{ immatriculation: vehicleCard.idCard?.immatriculation }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "N° Ordre", value: vehicleCard.idCard?.numeroOrdre },
                        { label: "Immatriculation", value: vehicleCard.idCard?.immatriculation },
                        { label: "VIN", value: vehicleCard.idCard?.vin },
                        { label: "Marque", value: vehicleCard.idCard?.marque },
                        { label: "Type", value: vehicleCard.idCard?.type },
                        { label: "Année", value: vehicleCard.idCard?.annee },
                        { label: "Kilométrage", value: vehicleCard.idCard?.kilometrage ? `${vehicleCard.idCard.kilometrage.toLocaleString()} km` : "—" },
                        { label: "Statut", value: vehicleCard.idCard?.statut },
                      ].map((field, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{field.label}</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{field.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance */}
                  {vehicleCard.performance && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-white" /></div>
                        <span className="text-sm font-bold text-slate-700 dark:text-white">Performance</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Sécurité", value: vehicleCard.performance.conformiteSecurite, unit: "%" },
                          { label: "Qualité", value: vehicleCard.performance.conformiteQualite, unit: "%" },
                          { label: "Réglementaire", value: vehicleCard.performance.conformiteReglementaire, unit: "%" },
                          { label: "IVMS", value: vehicleCard.performance.scoreIVMS, unit: "%" },
                        ].map((p, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{p.label}</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{p.value ?? "—"}{p.unit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Activities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vehicleCard.dernieresAnomalies?.length > 0 && (
                      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-white">Dernières Anomalies</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {vehicleCard.dernieresAnomalies.map((a: any, i: number) => (
                            <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${a.criticite === 'CRITIQUE' || a.criticite === 'BLOQUANT' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <span className="text-slate-500">{a.date?.split("T")[0]}</span>
                              </div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{a.element || a.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {vehicleCard.derniersCheckups?.length > 0 && (
                      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-white">Derniers Check-ups</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {vehicleCard.derniersCheckups.map((c: any, i: number) => (
                            <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                              <span className="text-slate-500">{c.date?.split("T")[0]}</span>
                              <span className={`font-semibold ${c.conforme ? 'text-emerald-600' : 'text-red-500'}`}>{c.conforme ? 'Conforme' : 'Non conforme'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-10 flex flex-col items-center justify-center text-center">
                  <XCircle className="w-10 h-10 text-red-300 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Erreur chargement fiche véhicule</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAB: DRIVERS ========== */}
        {activeTab === "drivers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search & List */}
            <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center"><User className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-sm font-bold text-slate-700 dark:text-white">Chauffeurs</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)}
                  placeholder="Nom du chauffeur..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  onKeyDown={e => e.key === 'Enter' && loadDriverAnalysis()} />
                <button onClick={loadDriverAnalysis}
                  className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Driver quick list */}
              {chartByChauffeur.length > 0 && (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {chartByChauffeur.map((d: any, i: number) => (
                    <button key={i} onClick={() => { setDriverName(d.name); loadDriverAnalysis(); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{d.name}</span>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">{d.value} décl.</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Driver Analysis */}
            <div className="lg:col-span-2">
              {!driverAnalysis ? (
                <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-10 flex flex-col items-center justify-center text-center">
                  <User className="w-12 h-12 text-slate-300 dark:text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Recherchez un chauffeur</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Entrez un nom ou cliquez dans la liste</p>
                </div>
              ) : driverLoading ? (
                <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Driver Header */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">{driverAnalysis.chauffeurNom}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Analyse de performance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{driverAnalysis.score}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Score</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Anomalies", value: driverAnalysis.totalAnomalies, color: "text-red-500" },
                        { label: "Résolues", value: driverAnalysis.anomaliesResolues, color: "text-emerald-500" },
                        { label: "Check-ups OK", value: driverAnalysis.checkupsOK, color: "text-emerald-500" },
                        { label: "Taux Conformité", value: `${driverAnalysis.tauxConformite}%`, color: "text-blue-500" },
                      ].map((d, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{d.label}</p>
                          <p className={`text-lg font-bold ${d.color}`}>{d.value ?? 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trends Chart */}
                  {driverAnalysis.tendancesMensuelles?.length > 0 && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-white">Tendance Mensuelle</span>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={driverAnalysis.tendancesMensuelles}>
                          <Line type="monotone" dataKey="anomalies" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="checkupsOK" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                          <XAxis dataKey="mois" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Vehicle Breakdown */}
                  {driverAnalysis.anomaliesParVehicule && Object.keys(driverAnalysis.anomaliesParVehicule).length > 0 && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-white">Anomalies par Véhicule</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(driverAnalysis.anomaliesParVehicule as Record<string, number>).map(([veh, count]) => (
                          <div key={veh} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{veh}</span>
                            <span className="font-bold text-red-500">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAB: ALERTS ========== */}
        {activeTab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alerts List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Bell className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-sm font-bold text-slate-700 dark:text-white">Alertes Actives</span>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">{alertsData.length} alerte(s)</span>
                </div>
                {alertsData.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold">Aucune alerte active</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alertsData.map((a: any, i: number) => {
                      const sevColor = a.severite === "HAUTE" ? "border-l-red-500 bg-red-50 dark:bg-red-900/10" : a.severite === "MOYENNE" ? "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10" : "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10";
                      return (
                        <div key={i} className={`border-l-4 ${sevColor} rounded-xl px-4 py-3 text-xs`}>
                          <div className="flex items-center gap-2">
                            {a.severite === "HAUTE" ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : a.severite === "MOYENNE" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <Bell className="w-3.5 h-3.5 text-blue-500" />}
                            <span className="font-bold text-slate-700 dark:text-slate-200">{a.type}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${a.severite === "HAUTE" ? 'bg-red-100 text-red-600' : a.severite === "MOYENNE" ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{a.severite}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-5.5">{a.message}</p>
                          {a.vehicule && <p className="text-slate-600 dark:text-slate-400 mt-0.5 ml-5.5">Véhicule: <span className="font-mono font-bold text-slate-600">{a.vehicule}</span></p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Side Summary */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-white">Résumé</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Alertes HAUTE", count: alertsData.filter(a => a.severite === "HAUTE").length, color: "text-red-500" },
                    { label: "Alertes MOYENNE", count: alertsData.filter(a => a.severite === "MOYENNE").length, color: "text-amber-500" },
                    { label: "Alertes INFO", count: alertsData.filter(a => a.severite === "INFORMATION" || !a.severite).length, color: "text-blue-500" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                      <span className="text-slate-500">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-white">Actions</span>
                </div>
                <div className="space-y-2">
                  <button onClick={fetchData} className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Actualiser les alertes
                  </button>
                  <button onClick={loadFullExport} className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <Download className="w-3 h-3" /> Exporter les données
                  </button>
                </div>
              </div>

              {/* Full Export Stats */}
              {fullExport && (
                <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-white">Exporté</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Véhicules</span><span className="font-bold text-slate-700 dark:text-slate-200">{fullExport.totalVehicules}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Déclarations</span><span className="font-bold text-slate-700 dark:text-slate-200">{fullExport.totalDeclarations}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Check-lists</span><span className="font-bold text-slate-700 dark:text-slate-200">{fullExport.totalChecklists}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Documents</span><span className="font-bold text-slate-700 dark:text-slate-200">{fullExport.totalDocuments}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAB: DOCUMENTS ========== */}
        {activeTab === "documents" && (
          <FleetDocumentManager />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200/50 dark:border-slate-800/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium tracking-wider">Smart Fleet ID © 2026 · Danone</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400">{stats.totalVehicles || 0} véhicules · {stats.totalDeclarations || 0} déclarations</p>
        </div>
      </div>
    </div>
  );
}