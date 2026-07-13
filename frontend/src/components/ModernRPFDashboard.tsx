import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Filter, AlertTriangle, TrendingUp, BarChart3,
  RefreshCw, X, Users, Building2, GraduationCap, UserCog,
  Target, Award, LogOut
} from 'lucide-react';
import KpiReportDashboard from './KpiReportDashboard';
import DashboardLayout from './ui/DashboardLayout';

const API = 'http://localhost:8080';

const PLATEFORMES = ['Casa', 'Rabat', 'Tanger', 'Marrakech', 'Fès', 'Agadir', 'Oujda', 'Laâyoune'];
const ZONES = ['Zone A (Nord)', 'Zone B (Centre)', 'Zone C (Sud)', 'Zone D (Est)'];

export default function ModernRPFDashboard({ currentUser, onLogout }: any) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [allChecklists, setAllChecklists] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [filterPlateforme, setFilterPlateforme] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterChauffeur, setFilterChauffeur] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showKpiReport, setShowKpiReport] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/fleet/alerts`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/fleet/checklist/all`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/users`).catch(() => ({ data: [] })),
    ]).then(([alertsRes, checklistRes, usersRes]) => {
      setAlerts(alertsRes.data || []);
      setAllChecklists(checklistRes.data || []);
      setChauffeurs((usersRes.data || []).filter((u: any) => u.role === 'CHAUFFEUR'));
    });
  }, []);

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];
    if (filterPlateforme) {
      result = result.filter(a => (a.plateforme || a.site || a.zone || '').toLowerCase().includes(filterPlateforme.toLowerCase()));
    }
    if (filterZone) {
      result = result.filter(a => (a.zone || a.site || '').toLowerCase().includes(filterZone.toLowerCase()));
    }
    if (filterChauffeur) {
      result = result.filter(a => (a.chauffeurNom || a.createdBy || '').toLowerCase().includes(filterChauffeur.toLowerCase()));
    }
    return result;
  }, [alerts, filterPlateforme, filterZone, filterChauffeur]);

  const trendData = useMemo(() => {
    const byMarque: Record<string, number> = {};
    const byCategorie: Record<string, number> = {};
    const byMois: Record<string, number> = {};
    allChecklists.forEach(cl => {
      const marque = cl.vehiculeMarque || 'Inconnue';
      const categorie = cl.categorie || 'Générale';
      byMarque[marque] = (byMarque[marque] || 0) + 1;
      byCategorie[categorie] = (byCategorie[categorie] || 0) + 1;
      if (cl.dateChecklist) {
        const mois = new Date(cl.dateChecklist).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        byMois[mois] = (byMois[mois] || 0) + 1;
      }
    });
    return { byMarque, byCategorie, byMois };
  }, [allChecklists]);

  const topMarques = Object.entries(trendData.byMarque).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topCategories = Object.entries(trendData.byCategorie).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Coaching state
  const [coachingPlans, setCoachingPlans] = useState<any[]>([]);
  const [showCoachingForm, setShowCoachingForm] = useState(false);
  const [coachingChauffeur, setCoachingChauffeur] = useState('');
  const [coachingAction, setCoachingAction] = useState('');
  const [coachingDate, setCoachingDate] = useState(new Date().toISOString().split('T')[0]);

  const addCoachingPlan = () => {
    if (!coachingChauffeur || !coachingAction) return;
    const plan = {
      id: Date.now(),
      chauffeur: coachingChauffeur,
      action: coachingAction,
      date: coachingDate,
      statut: 'Planifié',
    };
    setCoachingPlans(prev => [plan, ...prev]);
    setShowCoachingForm(false);
    setCoachingAction('');
  };

  const completeCoaching = (id: number) => {
    setCoachingPlans(prev => prev.map(p => p.id === id ? { ...p, statut: 'Terminé' } : p));
  };

  // Chauffeur anomaly correlation
  const chauffeurAnomalies = useMemo(() => {
    const map: Record<string, { count: number; marques: Set<string>; categories: Set<string> }> = {};
    allChecklists.filter(cl => !cl.estConforme).forEach(cl => {
      const nom = cl.chauffeurNom || cl.createdBy || 'Inconnu';
      if (!map[nom]) map[nom] = { count: 0, marques: new Set(), categories: new Set() };
      map[nom].count++;
      if (cl.vehiculeMarque) map[nom].marques.add(cl.vehiculeMarque);
      if (cl.categorie) map[nom].categories.add(cl.categorie);
    });
    return Object.entries(map)
      .map(([chauffeur, data]) => ({ chauffeur, ...data, marques: Array.from(data.marques as Set<string>), categories: Array.from(data.categories as Set<string>) }))
      .sort((a, b) => b.count - a.count);
  }, [allChecklists]);

  const navItems = [
    { id: "rpf-dashboard", label: "Responsable Plateforme", icon: <Target className="w-5 h-5" />, active: true, onClick: () => {} },
    { id: "logout", label: "Déconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: onLogout },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Responsable Plateforme" subtitle="Pilotage plateformes" currentUser={currentUser} onLogout={onLogout}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end gap-2 mb-6">
        <button onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1.5 px-4 py-2 glass border border-white/[0.06] rounded-lg text-sm font-medium text-slate-300 hover:bg-white/[0.04] transition-all">
          <Filter className="w-4 h-4" /> Filtres
        </button>
        <button onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
        <button onClick={() => setShowKpiReport(!showKpiReport)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-all">
          <BarChart3 className="w-4 h-4" /> KPI
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Plateforme</label>
              <select value={filterPlateforme} onChange={e => setFilterPlateforme(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white">
                <option value="">Toutes</option>
                {PLATEFORMES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Zone</label>
              <select value={filterZone} onChange={e => setFilterZone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white">
                <option value="">Toutes</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Chauffeur</label>
              <select value={filterChauffeur} onChange={e => setFilterChauffeur(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white">
                <option value="">Tous</option>
                {chauffeurs.map((c: any) => (
                  <option key={c.id} value={c.firstname}>{c.firstname} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilterPlateforme(''); setFilterZone(''); setFilterChauffeur(''); }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                <X className="w-4 h-4 inline mr-1" />Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-gray-500">Alertes totales</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{alerts.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">Plateformes actives</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{PLATEFORMES.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-500">Chauffeurs</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{chauffeurs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Top 5 Marques (anomalies)</h2>
          </div>
          <div className="space-y-2">
            {topMarques.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucune donnée</p>
            ) : topMarques.map(([marque, count], i) => {
              const max = topMarques[0]?.[1] || 1;
              const pct = (count / max) * 100;
              return (
                <div key={marque} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 w-6">{i + 1}.</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{marque}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Top Catégories (anomalies)</h2>
          </div>
          <div className="space-y-2">
            {topCategories.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucune donnée</p>
            ) : topCategories.map(([cat, count], i) => {
              const max = topCategories[0]?.[1] || 1;
              const pct = (count / max) * 100;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 w-6">{i + 1}.</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{cat}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coaching Section */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Coaching chauffeurs</h2>
          </div>
          <button onClick={() => setShowCoachingForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-all">
            <Target className="w-3.5 h-3.5" /> Nouveau plan
          </button>
        </div>

        {showCoachingForm && (
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Chauffeur</label>
                <select value={coachingChauffeur} onChange={e => setCoachingChauffeur(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm">
                  <option value="">Sélectionner...</option>
                  {chauffeurs.map((c: any) => (
                    <option key={c.id} value={`${c.firstname} ${c.name}`}>{c.firstname} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Action de coaching</label>
                <input type="text" value={coachingAction} onChange={e => setCoachingAction(e.target.value)}
                  placeholder="Ex: Formation conduite économique, sensibilisation check-up..."
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date prévue</label>
                <input type="date" value={coachingDate} onChange={e => setCoachingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addCoachingPlan}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-all">
                Ajouter
              </button>
              <button onClick={() => setShowCoachingForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}

        {coachingPlans.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Aucun plan de coaching. Créez-en un pour améliorer la performance des chauffeurs.</p>
        ) : (
          <div className="space-y-2">
            {coachingPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCog className={`w-5 h-5 ${plan.statut === 'Terminé' ? 'text-green-500' : 'text-purple-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{plan.chauffeur}</p>
                    <p className="text-xs text-gray-500">{plan.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    plan.statut === 'Terminé' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>{plan.statut}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{new Date(plan.date).toLocaleDateString('fr-FR')}</span>
                  {plan.statut === 'Planifié' && (
                    <button onClick={() => completeCoaching(plan.id)}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
                      <Award className="w-3 h-3 inline mr-1" />Terminer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chauffeur Anomaly Correlation */}
      {chauffeurAnomalies.length > 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Corrélation chauffeurs / anomalies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Chauffeur</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Anomalies</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Marques</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Catégories</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Coaching</th>
                </tr>
              </thead>
              <tbody>
                {chauffeurAnomalies.slice(0, 10).map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/20">
                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">{item.chauffeur}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.count > 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        item.count > 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>{item.count}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300 text-xs">{item.marques.join(', ') || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300 text-xs">{item.categories.join(', ') || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <button onClick={() => { setCoachingChauffeur(item.chauffeur); setShowCoachingForm(true); }}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all">
                        <Target className="w-3 h-3 inline mr-1" />Plan coaching
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-gray-800 dark:text-white">Alertes ({filteredAlerts.length})</h2>
        </div>
        {filteredAlerts.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Aucune alerte pour les filtres sélectionnés</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Véhicule</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Description</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Plateforme</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Zone</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Chauffeur</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Criticité</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/20">
                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">{a.vehiculeImmatriculation || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{a.description || a.message || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{a.plateforme || a.site || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{a.zone || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{a.chauffeurNom || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.criticite === 'CRITIQUE' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        a.criticite === 'HAUTE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>{a.criticite || 'NORMAL'}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{a.dateCreation ? new Date(a.dateCreation).toLocaleDateString('fr-FR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showKpiReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-6xl w-full my-8">
            <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reporting KPI — Responsable Plateforme</h2>
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