import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Users, Truck, Filter, X, RefreshCw } from 'lucide-react';

const API = 'http://localhost:8080';
const GRAVITY_COLORS: Record<string, string> = { CRITIQUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', HAUTE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', MOYENNE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Basse: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30' };

const ITEM_LABELS: Record<string, string> = { pneus: '🛞 Pneus', freins: '🛑 Freins', feux: '💡 Feux', extincteur: '🧯 Extincteur', documents: '📄 Documents', carrosserie: '🚘 Carrosserie', huileNiveau: '🛢️ Huile', batterie: '🔋 Batterie', essuieGlaces: '💧 Essuie-glaces', ceinturesSecurite: '🔗 Ceintures' };

export default function RSAnomalyDashboard() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [filterGravite, setFilterGravite] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [ncRes, declRes] = await Promise.all([
        axios.get(`${API}/api/fleet/checklist/non-conforme`),
        axios.get(`${API}/api/declarations`).catch(() => ({ data: [] })),
      ]);
      setAnomalies(Array.isArray(ncRes.data) ? ncRes.data : []);
      setDeclarations(Array.isArray(declRes.data) ? declRes.data : []);
    } catch {} finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return anomalies.filter((a: any) => {
      if (filterGravite && a.criticite !== filterGravite) return false;
      return true;
    });
  }, [anomalies, filterGravite]);

  const byGravite = useMemo(() => {
    const map: Record<string, number> = { CRITIQUE: 0, HAUTE: 0, MOYENNE: 0 };
    anomalies.forEach((a: any) => { const g = a.criticite || 'MOYENNE'; map[g] = (map[g] || 0) + 1; });
    return map;
  }, [anomalies]);

  const byDefaut = useMemo(() => {
    const map: Record<string, number> = {};
    anomalies.forEach((a: any) => {
      try { const defs = JSON.parse(a.defautsJson || '[]'); defs.forEach((d: any) => { const item = ITEM_LABELS[d.item] || d.item; map[item] = (map[item] || 0) + 1; }); } catch {}
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [anomalies]);

  const byChauffeur = useMemo(() => {
    const map: Record<string, number> = {};
    anomalies.forEach((a: any) => { if (a.chauffeurNom) map[a.chauffeurNom] = (map[a.chauffeurNom] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [anomalies]);

  const repairEvolution = useMemo(() => {
    const days: Record<string, { total: number; repaired: number }> = {};
    anomalies.forEach((a: any) => {
      if (!a.dateChecklist) return;
      const day = new Date(a.dateChecklist).toISOString().slice(0, 10);
      if (!days[day]) days[day] = { total: 0, repaired: 0 };
      days[day].total++;
      if (a.postRepair) days[day].repaired++;
    });
    return Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
  }, [anomalies]);

  const maxDef = byDefaut.length > 0 ? byDefaut[0][1] : 1;
  const maxChf = byChauffeur.length > 0 ? byChauffeur[0][1] : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" /> Anomalies & Analyse
        </h2>
        <div className="flex items-center gap-2">
          <select value={filterGravite} onChange={e => setFilterGravite(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm">
            <option value="">Toutes gravités</option>
            <option value="CRITIQUE">Critique</option>
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
          </select>
          <button onClick={loadData} className="p-1.5 bg-gray-100 dark:bg-dark-border rounded-lg"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Gravity cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'CRITIQUE', label: 'Critique', icon: XCircle, count: byGravite.CRITIQUE || 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-700' },
          { key: 'HAUTE', label: 'Haute', icon: AlertTriangle, count: byGravite.HAUTE || 0, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-700' },
          { key: 'MOYENNE', label: 'Moyenne', icon: Clock, count: byGravite.MOYENNE || 0, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-700' },
        ].map(g => (
          <div key={g.key} className={`${g.bg} rounded-xl border ${g.border} p-4 text-center cursor-pointer hover:shadow-sm transition-all`}
            onClick={() => setFilterGravite(filterGravite === g.key ? '' : g.key)}>
            <g.icon className={`w-6 h-6 mx-auto mb-1 ${g.color}`} />
            <p className={`text-2xl font-bold ${g.color}`}>{g.count}</p>
            <p className="text-xs text-gray-500">{g.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top défauts */}
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-blue-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Top défauts</h3></div>
          {byDefaut.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucune donnée</p> : (
            <div className="space-y-2">
              {byDefaut.map(([item, count]) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-200 w-28 truncate">{item}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(count / maxDef) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top chauffeurs */}
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-purple-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Top chauffeurs (anomalies)</h3></div>
          {byChauffeur.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucune donnée</p> : (
            <div className="space-y-2">
              {byChauffeur.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-200 w-28 truncate">{name}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(count / maxChf) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Repair evolution */}
      {repairEvolution.length > 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-emerald-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Évolution réparations</h3></div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {repairEvolution.map(([date, data]: any) => (
              <div key={date} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20">{date.slice(5)}</span>
                <div className="flex-1 flex gap-1 h-4">
                  <div className="bg-red-400 rounded-l-full" style={{ width: `${data.total > 0 ? ((data.total - data.repaired) / data.total) * 100 : 0}%`, minWidth: data.total > 0 ? '4px' : '0' }} />
                  <div className="bg-emerald-400 rounded-r-full" style={{ width: `${data.total > 0 ? (data.repaired / data.total) * 100 : 0}%`, minWidth: data.repaired > 0 ? '4px' : '0' }} />
                </div>
                <span className="text-xs text-gray-600">{data.repaired}/{data.total}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Non traité</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> Réparé</span>
          </div>
        </div>
      )}

      {/* Anomaly list */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-5">
        <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-orange-500" /><h3 className="font-semibold text-gray-800 dark:text-white">Liste des anomalies ({filtered.length})</h3></div>
        {filtered.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Aucune anomalie</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 dark:border-dark-border">
                <th className="text-left py-2 px-3 text-gray-500">Date</th>
                <th className="text-left py-2 px-3 text-gray-500">Véhicule</th>
                <th className="text-left py-2 px-3 text-gray-500">Chauffeur</th>
                <th className="text-left py-2 px-3 text-gray-500">Défauts</th>
                <th className="text-center py-2 px-3 text-gray-500">Statut</th>
              </tr></thead>
              <tbody>
                {filtered.slice(0, 20).map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/20">
                    <td className="py-2 px-3 text-gray-500 text-xs">{a.dateChecklist ? new Date(a.dateChecklist).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">{a.vehiculeImmatriculation}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{a.chauffeurNom || '-'}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(() => { try { return JSON.parse(a.defautsJson || '[]').map((d: any, i: number) => (
                          <span key={i} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">{ITEM_LABELS[d.item] || d.item}</span>
                        )); } catch { return <span className="text-xs text-gray-600 dark:text-gray-400">—</span>; } })()}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.postRepair ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        {a.postRepair ? 'Réparé' : 'Non traité'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}