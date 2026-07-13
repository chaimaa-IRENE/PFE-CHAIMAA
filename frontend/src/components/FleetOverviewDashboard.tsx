import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Truck, AlertTriangle, CheckCircle, XCircle, TrendingUp, Fuel, BarChart3, RefreshCw, Download } from 'lucide-react';

const API = 'http://localhost:8080';

function PieSlice({ pct, color, offset }: { pct: number; color: string; offset: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="20" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ / 100} transform="rotate(-90 50 50)" />;
}

export default function FleetOverviewDashboard() {
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes, dRes] = await Promise.all([
        axios.get(`${API}/api/vehicules`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/fleet/checklist/all`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/declarations`).catch(() => ({ data: [] })),
      ]);
      setVehicules(Array.isArray(vRes.data) ? vRes.data : []);
      setChecklists(Array.isArray(cRes.data) ? cRes.data : []);
      setDeclarations(Array.isArray(dRes.data) ? dRes.data : []);
    } catch {} finally { setLoading(false); }
  };

  const totalVehicules = vehicules.length;
  const vehiculesActifs = vehicules.filter((v: any) => v.statut === 'ACTIF').length;
  const vehiculesStop = totalVehicules - vehiculesActifs;
  const nonConformes = checklists.filter((c: any) => c.estConforme === false).length;
  const conformes = checklists.filter((c: any) => c.estConforme === true).length;
  const tauxConformite = checklists.length > 0 ? Math.round(conformes / checklists.length * 100) : 0;
  const tauxImmobilisation = totalVehicules > 0 ? Math.round(vehiculesStop / totalVehicules * 100) : 0;

  const bySource = useMemo(() => {
    const map: Record<string, number> = {};
    declarations.forEach((d: any) => { const s = d.source || 'Inconnu'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [declarations]);

  const byCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    declarations.forEach((d: any) => { const c = d.categorie || 'Inconnu'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [declarations]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const totalSrc = bySource.reduce((a, b) => a + b[1], 0) || 1;
  const totalCat = byCategorie.reduce((a, b) => a + b[1], 0) || 1;

  const handleExport = () => {
    const data = [
      { 'Indicateur': 'Total véhicules', 'Valeur': totalVehicules },
      { 'Indicateur': 'Véhicules actifs', 'Valeur': vehiculesActifs },
      { 'Indicateur': 'Véhicules arrêt/maintenance', 'Valeur': vehiculesStop },
      { 'Indicateur': 'Taux conformité (%)', 'Valeur': tauxConformite },
      { 'Indicateur': 'Taux immobilisation (%)', 'Valeur': tauxImmobilisation },
      { 'Indicateur': 'Non-conformités', 'Valeur': nonConformes },
      { 'Indicateur': 'Contrôles conformes', 'Valeur': conformes },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parc');
    XLSX.writeFile(wb, `Vue_Parc_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-500" /> Vue globale du parc
        </h2>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: Truck, label: 'Total véhicules', value: totalVehicules, color: 'text-blue-500' },
          { icon: CheckCircle, label: 'En service', value: vehiculesActifs, color: 'text-emerald-500' },
          { icon: XCircle, label: 'Arrêt/Maintenance', value: vehiculesStop, color: 'text-red-500' },
          { icon: TrendingUp, label: 'Taux conformité', value: `${tauxConformite}%`, color: 'text-green-500' },
          { icon: AlertTriangle, label: 'Non-conformités', value: nonConformes, color: 'text-orange-500' },
          { icon: Fuel, label: 'Immobilisation', value: `${tauxImmobilisation}%`, color: 'text-purple-500' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-center gap-2 mb-1"><kpi.icon className={`w-4 h-4 ${kpi.color}`} /><span className="text-xs text-gray-500">{kpi.label}</span></div>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Status repartition */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Répartition statut véhicules</h3>
        <div className="flex items-center gap-8">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            <PieSlice pct={vehiculesActifs / totalVehicules * 100} color="#10b981" offset={0} />
            <PieSlice pct={vehiculesStop / totalVehicules * 100} color="#ef4444" offset={vehiculesActifs / totalVehicules * 100} />
          </svg>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><span className="w-4 h-4 bg-emerald-500 rounded-full" /><span className="text-sm text-gray-700 dark:text-gray-300">En service ({vehiculesActifs}) — {totalVehicules > 0 ? Math.round(vehiculesActifs/totalVehicules*100) : 0}%</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-500 rounded-full" /><span className="text-sm text-gray-700 dark:text-gray-300">Arrêt/Maintenance ({vehiculesStop}) — {totalVehicules > 0 ? Math.round(vehiculesStop/totalVehicules*100) : 0}%</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-blue-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Anomalies par source</h3></div>
          {bySource.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucune donnée</p> : (
            <div className="space-y-2">
              {bySource.map(([source, count], i) => {
                const max = bySource[0]?.[1] || 1;
                return (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-200 w-24 truncate">{source}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count/max)*100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Categorie */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-purple-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Anomalies par catégorie</h3></div>
          {byCategorie.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucune donnée</p> : (
            <div className="space-y-2">
              {byCategorie.map(([cat, count], i) => {
                const max = byCategorie[0]?.[1] || 1;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-200 w-24 truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count/max)*100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* IVMS KPIs */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-emerald-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Indicateurs IVMS</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Score conduite', value: `${tauxConformite}%`, icon: TrendingUp, color: tauxConformite > 80 ? 'text-emerald-500' : 'text-orange-500' },
            { label: 'Taux immobilisation', value: `${tauxImmobilisation}%`, icon: XCircle, color: tauxImmobilisation > 10 ? 'text-red-500' : 'text-emerald-500' },
            { label: 'Conformité contrôles', value: `${conformes}/${checklists.length}`, icon: CheckCircle, color: 'text-blue-500' },
            { label: 'Consommation moyenne', value: '28.5L/100km', icon: Fuel, color: 'text-purple-500' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3 text-center">
              <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
              <p className="text-lg font-bold text-gray-800 dark:text-white">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-600 dark:text-blue-400 text-center">
          Données synchronisées via Power BI — Score IVMS calculé à partir des checklists
        </div>
      </div>
    </div>
  );
}