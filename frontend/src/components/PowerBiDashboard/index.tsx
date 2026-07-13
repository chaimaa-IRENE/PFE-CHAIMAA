import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Truck, AlertTriangle, Users,
  ChevronRight, RefreshCw, Calendar, MapPin,
  SlidersHorizontal, Building2, UserCog, Wrench
} from "lucide-react";
import { pageTransition, sidebarItem } from "../../lib/animations";
import { DashboardSkeleton } from "../../lib/Skeleton";
import ExecutiveDashboard from "./ExecutiveDashboard";
import VehicleDetail from "./VehicleDetail";
import AnomalyAnalysis from "./AnomalyAnalysis";
import DriverPerformance from "./DriverPerformance";
import { PageKey, NavItem, EnrichedFilters } from "./types";
import { useDashboard } from "./hooks/useDashboard";
import { filterDashboardData } from "./utils/dashboardCalculations";

const headerMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } },
};

const filterPanelMotion = {
  initial: { height: 0, opacity: 0, overflow: "hidden" as const },
  animate: { height: "auto", opacity: 1, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

function today() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const PowerBiDashboard: React.FC = () => {
  const [page, setPage] = useState<PageKey>("executive");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { data, loading, error, filters, updateFilter, refresh } = useDashboard();
  const filteredData = useMemo(() =>
    data ? filterDashboardData(data, filters) : null,
    [data, filters]
  );

  const navItems: NavItem[] = [
    { key: "executive", label: "Executive Dashboard", icon: "LayoutDashboard" },
    { key: "vehicles", label: "Détail Véhicules", icon: "Truck" },
    { key: "anomalies", label: "Analyse Anomalies", icon: "AlertTriangle" },
    { key: "drivers", label: "Performance Chauffeurs", icon: "Users" },
  ];

  const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />,
    Truck: <Truck className="w-4 h-4" strokeWidth={1.5} />,
    AlertTriangle: <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />,
    Users: <Users className="w-4 h-4" strokeWidth={1.5} />,
  };

  if (loading && !data) {
    return (
      <div className="flex h-screen bg-[#0F172A]">
        <div className="w-64 bg-[#08192D] border-r border-white/5" />
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0F172A] text-gray-100 overflow-hidden">
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="bg-[#08192D] border-r border-white/5 flex flex-col shrink-0 overflow-hidden"
      >
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05, rotate: -5 }}
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="w-5 h-5 text-white" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}>
                  <h2 className="text-sm font-bold text-white tracking-tight">Smart Fleet</h2>
                  <p className="text-[9px] text-blue-300/60 font-medium">Power BI Dashboard</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = page === item.key;
            return (
              <motion.button key={item.key} onClick={() => setPage(item.key)}
                variants={sidebarItem} initial="idle" whileHover="hover" whileTap="tap"
                animate={isActive ? { scale: 1, boxShadow: "0 0 16px rgba(59,130,246,0.25)" } : { scale: 1, boxShadow: "0 0 0px rgba(59,130,246,0)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium relative overflow-hidden ${
                  isActive ? "bg-blue-600/20 text-blue-300 border border-blue-500/20" : "text-gray-600 dark:text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                }`}>
                {isActive && <motion.span layoutId="activeNavGlow" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />}
                <span className={`transition-colors duration-300 ${isActive ? "text-blue-400" : "text-gray-500"}`}>{iconMap[item.icon]}</span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 22 }}
                      className="flex-1 text-left overflow-hidden whitespace-nowrap">{item.label}</motion.span>
                  )}
                </AnimatePresence>
                {isActive && !sidebarCollapsed && (
                  <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-white/5">
          <motion.button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.15 }}>
                  Réduire
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header initial="initial" animate="animate"
          className="bg-[#0F172A] border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <motion.h1 variants={headerMotion} className="text-base font-bold text-white tracking-tight">
              {navItems.find(n => n.key === page)?.label || "Executive Dashboard"}
            </motion.h1>
            <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {today()}
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 22 }}
              className="flex items-center gap-1 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
              <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              <select value={filters.period} onChange={e => updateFilter("period", e.target.value)}
                className="bg-transparent text-xs text-gray-300 border-none outline-none appearance-none cursor-pointer">
                <option value="7j" className="bg-[#0F172A]">7 jours</option>
                <option value="30j" className="bg-[#0F172A]">30 jours</option>
                <option value="90j" className="bg-[#0F172A]">90 jours</option>
                <option value="1a" className="bg-[#0F172A]">1 an</option>
              </select>
            </motion.div>
            <motion.button onClick={() => setFilterOpen(!filterOpen)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${filterOpen ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-200"}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button onClick={refresh}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors relative">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading && data && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full" />}
            </motion.button>
          </div>
        </motion.header>

        <AnimatePresence>
          {filterOpen && data && (
            <motion.div key="filterPanel" variants={filterPanelMotion} initial="initial" animate="animate" exit="exit"
              className="bg-[#08192D] border-b border-white/5 px-6 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
              {[
                { icon: Calendar, key: "period" as const, options: [{ v: "7j", l: "7 jours" }, { v: "30j", l: "30 jours" }, { v: "90j", l: "90 jours" }, { v: "1a", l: "1 an" }], placeholder: "Période" },
                { icon: MapPin, key: "site" as const, options: data.filterOptions.sites.map(s => ({ v: s, l: s })), placeholder: "Tous sites" },
                { icon: Truck, key: "vehicle" as const, options: data.filterOptions.vehicles.map(v => ({ v: v.immatriculation, l: v.immatriculation })), placeholder: "Tous véhicules" },
                { icon: Users, key: "driver" as const, options: data.filterOptions.drivers.map(d => ({ v: d, l: d })), placeholder: "Tous chauffeurs" },
                { icon: AlertTriangle, key: "status" as const, options: data.filterOptions.status.map(s => ({ v: s, l: s })), placeholder: "Tous statuts" },
                { icon: AlertTriangle, key: "criticite" as const, options: (data.filterOptions.criticites || []).map(c => ({ v: c, l: c })), placeholder: "Toutes criticites" },
                { icon: Wrench, key: "typePanne" as const, options: (data.filterOptions.typesPanne || []).map(t => ({ v: t, l: t })), placeholder: "Tous types panne" },
                { icon: Building2, key: "region" as const, options: data.filterOptions.regions.map(r => ({ v: r, l: r })), placeholder: "Toutes régions" },
                { icon: UserCog, key: "prestataire" as const, options: ((data.filterOptions.prestataires || []).length > 0 ? data.filterOptions.prestataires!.map(p => ({ v: p, l: p })) : []), placeholder: (!data.filterOptions.prestataires || data.filterOptions.prestataires.length === 0) ? "Aucun prestataire" : "Tous prestataires" },
                { icon: Building2, key: "ville" as const, options: (data.filterOptions.villes || []).map(v => ({ v, l: v })), placeholder: "Toutes villes" },
                { icon: Calendar, key: "annee" as const, options: (data.filterOptions.annees || []).map(a => ({ v: a, l: a })), placeholder: "Toutes années" },
                { icon: Calendar, key: "mois" as const, options: (data.filterOptions.mois || []).map(m => ({ v: m, l: m })), placeholder: "Tous mois" },
              ].map(({ icon: Icon, key, options, placeholder }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-gray-500 shrink-0" />
                  <select value={(filters as any)[key]} onChange={e => updateFilter(key, e.target.value)}
                    className="w-full bg-white/5 text-[10px] text-gray-300 border border-white/10 rounded-lg px-2 py-1.5 outline-none appearance-none cursor-pointer">
                    <option value="" className="bg-[#08192D]">{placeholder}</option>
                    {options.map(o => <option key={o.v} value={o.v} className="bg-[#08192D]">{o.l}</option>)}
                  </select>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          {error && !data && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertTriangle className="w-12 h-12 text-rose-400/50" />
              <p className="text-sm text-gray-500">{error}</p>
              <motion.button onClick={refresh} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors">
                Réessayer
              </motion.button>
            </motion.div>
          )}
          {data && (
            <AnimatePresence mode="wait">
              <motion.div key={page} variants={pageTransition} initial="initial" animate="animate" exit="exit">
                {page === "executive" && <ExecutiveDashboard data={filteredData || data} />}
                {page === "vehicles" && <VehicleDetail data={filteredData || data} />}
                {page === "anomalies" && <AnomalyAnalysis data={filteredData || data} />}
                {page === "drivers" && <DriverPerformance data={filteredData || data} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
};

export default PowerBiDashboard;


