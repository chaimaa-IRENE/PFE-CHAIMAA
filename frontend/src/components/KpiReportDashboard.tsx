import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3, TrendingUp, Clock, Truck, CheckCircle, XCircle,
  Calendar, RefreshCw, FileText, AlertTriangle
} from 'lucide-react';

const API = 'http://localhost:8080';

const PERIODES = [
  { key: 'daily', label: 'Journalier' },
  { key: 'weekly', label: 'Hebdomadaire' },
  { key: 'monthly', label: 'Mensuel' },
  { key: 'custom', label: 'Personnalisé' },
];

const ITEM_LABELS: Record<string, string> = {
  pneus: '🛞 Pneus', freins: '🛑 Freins', feux: '💡 Feux',
  extincteur: '🧯 Extincteur', documents: '📄 Documents', carrosserie: '🚘 Carrosserie',
  huileNiveau: '🛢️ Huile', batterie: '🔋 Batterie', essuieGlaces: '💧 Essuie-glaces',
  ceinturesSecurite: '🔗 Ceintures',
};

export default function KpiReportDashboard() {
  const [summary, setSummary] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [tempsTraitement, setTempsTraitement] = useState<any>({});
  const [docsStats, setDocsStats] = useState<any>({});
  const [periode, setPeriode] = useState('monthly');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(); }, [periode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = periode !== 'custom' ? { period: periode } : {};
      if (periode === 'custom' && dateDebut && dateFin) {
        params.startDate = dateDebut;
        params.endDate = dateFin;
      }
      const [sumRes, histRes, tempsRes, docsRes] = await Promise.all([
        axios.get(`${API}/api/fleet/kpi/summary`, { params }).catch(() => ({ data: {} })),
        axios.get(`${API}/api/fleet/kpi/history`, { params }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/fleet/kpi/temps-traitement`).catch(() => ({ data: {} })),
        axios.get(`${API}/api/fleet/kpi/documents-stats`).catch(() => ({ data: {} })),
      ]);
      setSummary(sumRes.data);
      setHistory(Array.isArray(histRes.data) ? histRes.data : []);
      setTempsTraitement(tempsRes.data);
      setDocsStats(docsRes.data);
    } catch {} finally { setLoading(false); }
  };

  const KPIs = [
    { label: 'Contrôles réalisés', value: summary.controlesRealises ?? '—', icon: FileText, color: 'text-blue-500' },
    { label: 'Taux conformité', value: summary.tauxConformite != null ? `${summary.tauxConformite}%` : '—', icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Non-conformités', value: summary.nonConformes ?? '—', icon: XCircle, color: 'text-red-500' },
    { label: 'Véhicules bloqués', value: summary.vehiculesBloques ?? '—', icon: Truck, color: 'text-orange-500' },
    { label: 'Taux réparation', value: summary.tauxReparation != null ? `${summary.tauxReparation}%` : '—', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Temps moy. traitement', value: tempsTraitement.tempsMoyenHeures != null ? `${tempsTraitement.tempsMoyenHeures}h` : '—', icon: Clock, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reporting KPI</h2>
        </div>
        <div className="flex gap-2">
          {PERIODES.map(p => (
            <button key={p.key} onClick={() => setPeriode(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                periode === p.key ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}>{p.label}</button>
          ))}
          <button onClick={loadData}
            className="px-3 py-1.5 bg-gray-100 dark:bg-dark-border rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-bg transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {periode === 'custom' && (
        <div className="flex gap-2 items-center">
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm dark:bg-dark-bg dark:text-white" />
          <span className="text-gray-600 dark:text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm dark:bg-dark-bg dark:text-white" />
          <button onClick={loadData} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">Appliquer</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIs.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{String(kpi.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Évolution quotidienne</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Aucune donnée pour cette période</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h: any) => (
                <div key={h.date} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-xs font-medium text-gray-500 w-20">{h.date}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min((h.tauxConformite || 0), 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 w-12 text-right">{h.tauxConformite}%</span>
                  </div>
                  <span className="text-xs text-gray-500">{h.controles} ctrl</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Non-conformités par item</h3>
          </div>
          {summary.nonConformitesParItem && Object.keys(summary.nonConformitesParItem).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(summary.nonConformitesParItem)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([key, count]: any) => {
                  const max = Object.values(summary.nonConformitesParItem as Record<string, number>)
                    .sort((a, b) => b - a)[0] || 1;
                  const pct = (count / max) * 100;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-200 w-32 truncate">{ITEM_LABELS[key] || key}</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.max(pct, 5)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white w-8 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Aucune donnée</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Documents légaux — Statistiques</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: docsStats.total ?? 0, color: 'text-gray-800' },
            { label: 'Valides', value: docsStats.valides ?? 0, color: 'text-emerald-600' },
            { label: 'Expirés', value: docsStats.expires ?? 0, color: 'text-red-600' },
            { label: 'Bientôt expirés', value: docsStats.bientotExpires ?? 0, color: 'text-orange-500' },
            { label: 'En attente', value: docsStats.enAttente ?? 0, color: 'text-yellow-600' },
          ].map((d, i) => (
            <div key={i} className="text-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
              <p className={`text-2xl font-bold ${d.color}`}>{d.value}</p>
              <p className="text-xs text-gray-500">{d.label}</p>
            </div>
          ))}
        </div>
        {docsStats.tauxConformite != null && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg text-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Taux de conformité documentaire :</span>
            <span className="text-lg font-bold text-emerald-600 ml-2">{docsStats.tauxConformite}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Véhicules bloqués</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-orange-500">{summary.vehiculesBloques ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">véhicules actuellement bloqués</p>
          </div>
          {tempsTraitement.blocagesEnCours != null && (
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">{tempsTraitement.blocagesEnCours} blocage(s) en cours</p>
          )}
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Temps de traitement</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-purple-500">{tempsTraitement.tempsMoyenHeures ?? '—'}h</p>
            <p className="text-sm text-gray-500 mt-1">temps moyen de blocage</p>
          </div>
          {tempsTraitement.tempsMedianHeures != null && (
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">Médiane : {tempsTraitement.tempsMedianHeures}h</p>
          )}
        </div>
      </div>

      {(summary.controlesParChauffeur && Object.keys(summary.controlesParChauffeur).length > 0) && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Contrôles par chauffeur</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(summary.controlesParChauffeur as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([chauffeur, count]) => (
                <div key={chauffeur} className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{chauffeur}</p>
                  <p className="text-lg font-bold text-blue-500">{count}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}