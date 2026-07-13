import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, AlertTriangle, Truck, TrendingUp, Fuel, CheckCircle, XCircle, Users, LogOut } from 'lucide-react';
import KpiReportDashboard from './KpiReportDashboard';
import DashboardLayout from './ui/DashboardLayout';

const API = 'http://localhost:8080';

export default function ModernLDDashboard({ currentUser, onLogout }: any) {
  const [blockedCount, setBlockedCount] = useState(0);
  const [nonConformeCount, setNonConformeCount] = useState(0);
  const [stats, setStats] = useState<any>({});
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [showKpiReport, setShowKpiReport] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ncRes, blkRes, alertsRes, dashboardRes] = await Promise.all([
        axios.get(`${API}/api/fleet/checklist/non-conforme`),
        axios.get(`${API}/api/fleet/checklist/blocked-vehicules`),
        axios.get(`${API}/api/fleet/alerts`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/admin/fleet/dashboard`).catch(() => ({ data: {} })),
      ]);
      setNonConformeCount(Array.isArray(ncRes.data) ? ncRes.data.length : 0);
      setBlockedCount(Array.isArray(blkRes.data) ? blkRes.data.length : 0);
      setCriticalAlerts((alertsRes.data || []).filter((a: any) => a.criticite === 'CRITIQUE'));
      setStats(dashboardRes.data || {});
    } catch {}
  };

  const KPIs = [
    { label: 'Taux conformité', value: stats.tauxConformite || '--', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Taux immobilisation', value: stats.tauxImmobilisation || '--', icon: XCircle, color: 'text-red-500' },
    { label: 'Véhicules actifs', value: stats.vehiculesActifs || '0', icon: Truck, color: 'text-blue-500' },
    { label: 'Consommation moy.', value: stats.consommationMoyenne ? `${stats.consommationMoyenne}L/100km` : '--', icon: Fuel, color: 'text-orange-500' },
  ];

  const navItems = [
    { id: "ld-dashboard", label: "Logistics Director", icon: <TrendingUp className="w-5 h-5" />, active: true, onClick: () => {} },
    { id: "logout", label: "Déconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: onLogout },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Logistics Director" subtitle="Pilotage stratégique" currentUser={currentUser} onLogout={onLogout}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-6">
        <button onClick={() => setShowKpiReport(!showKpiReport)}
          className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-1">
          <BarChart3 className="w-4 h-4" /> KPI
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {KPIs.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {criticalAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-700 dark:text-red-300">Alertes critiques ({criticalAlerts.length})</h2>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((a: any) => (
              <div key={a.id} className="flex justify-between items-center p-2 bg-white dark:bg-dark-bg rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{a.vehiculeImmatriculation || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">{a.criticite}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Indicateurs IVMS</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Score conduite', value: stats.scoreConduite || '--', color: 'bg-green-500' },
              { label: 'Freinage brusque', value: stats.freinageBrusque || '0', color: 'bg-orange-500' },
              { label: 'Excès vitesse', value: stats.excesVitesse || '0', color: 'bg-red-500' },
              { label: 'Ralenti moteur', value: stats.ralentiMoteur || '0', color: 'bg-blue-500' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-600 dark:text-blue-400 text-center">
            Données synchronisées via Power BI
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Synthèse parc</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Taux conformité', value: `${stats.tauxConformite || '--'}%`, color: stats.tauxConformite > 80 ? 'text-green-500' : 'text-orange-500' },
              { label: 'Taux immobilisation', value: `${stats.tauxImmobilisation || '--'}%`, color: 'text-red-500' },
              { label: 'Coûts carburant (MAD)', value: stats.coutsCarburant || '--', color: 'text-blue-500' },
              { label: 'Véhicules non conformes', value: nonConformeCount, color: nonConformeCount > 0 ? 'text-red-500' : 'text-green-500' },
              { label: 'Véhicules bloqués', value: blockedCount, color: blockedCount > 0 ? 'text-red-500' : 'text-green-500' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-100 dark:border-dark-border pb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showKpiReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-6xl w-full my-8">
            <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reporting KPI — Logistics Director</h2>
              <button onClick={() => setShowKpiReport(false)} className="w-8 h-8 bg-gray-100 dark:bg-dark-border rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-border/80">
                ✕
              </button>
            </div>
            <div className="p-6">
              <KpiReportDashboard />
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
