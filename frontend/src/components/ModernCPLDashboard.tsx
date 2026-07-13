import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Users, Truck, Route, ClipboardList, AlertTriangle, CheckCircle, Clock, MapPin, Calendar, LogOut } from 'lucide-react';
import DashboardLayout from './ui/DashboardLayout';

const API = 'http://localhost:8080';

interface ChecklistItem {
  id: number;
  chauffeurNom: string;
  vehiculeImmatriculation: string;
  statut: string;
  estConforme: boolean;
  dateChecklist: string;
  tourneeId: string;
  defautsJson: string;
  validePar: string;
}

export default function ModernCPLDashboard({ currentUser, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'planning' | 'chauffeurs' | 'alertes'>('overview');
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [blockedVehicles, setBlockedVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [clRes, blkRes, usersRes, kpiRes] = await Promise.all([
        axios.get(`${API}/api/fleet/checklist/all`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/fleet/checklist/blocked-vehicules`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/admin/users`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/fleet/kpi/summary`).catch(() => ({ data: {} })),
      ]);
      setChecklists(Array.isArray(clRes.data) ? clRes.data : []);
      setBlockedVehicles(Array.isArray(blkRes.data) ? blkRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setStats(kpiRes.data || {});
    } catch {} finally { setLoading(false); }
  };

  const chauffeurs = users.filter((u: any) => u.role === 'CHAUFFEUR');
  const ncChecklists = checklists.filter((c: any) => c.estConforme === false);
  const pendingChecklists = checklists.filter((c: any) => c.statut === 'PENDING');
  const validatedChecklists = checklists.filter((c: any) => c.statut === 'VALIDATED');

  const getStatusBadge = (statut: string) => {
    const map: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETE': 'bg-blue-100 text-blue-800',
      'REPAIRE': 'bg-orange-100 text-orange-800',
      'VALIDATED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    return map[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (statut: string) => {
    const map: Record<string, string> = {
      'PENDING': 'En attente',
      'COMPLETE': 'Complété',
      'REPAIRE': 'Réparé',
      'VALIDATED': 'Validé',
      'REJECTED': 'Refusé',
    };
    return map[statut] || statut;
  };

  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { key: 'planning', label: 'Planning tournées', icon: Route },
    { key: 'chauffeurs', label: 'Chauffeurs', icon: Users },
    { key: 'alertes', label: 'Alertes', icon: AlertTriangle },
  ] as const;

  const navItems = [
    { id: "cpl-dashboard", label: "Chef Parc Logistic", icon: <ClipboardList className="w-5 h-5" />, active: true, onClick: () => {} },
    { id: "logout", label: "Déconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: onLogout },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Chef de Parc Logistique" subtitle="Coordination & planification" currentUser={currentUser} onLogout={onLogout}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-dark-surface rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white dark:bg-dark-bg shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Chauffeurs actifs', value: chauffeurs.length, icon: Users, color: 'text-blue-500' },
              { label: 'Véhicules bloqués', value: blockedVehicles.length, icon: Truck, color: 'text-red-500' },
              { label: 'Taux conformité', value: `${stats.tauxConformite ?? '--'}%`, icon: CheckCircle, color: 'text-green-500' },
              { label: 'Tournées en cours', value: pendingChecklists.length + validatedChecklists.length, icon: Route, color: 'text-purple-500' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  <span className="text-xs text-gray-500">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Non-conformités récentes
              </h2>
              {ncChecklists.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">Aucune non-conformité en cours</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ncChecklists.slice(0, 10).map((cl) => (
                    <div key={cl.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</p>
                        <p className="text-xs text-gray-500">{cl.chauffeurNom} — {cl.tourneeId}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(cl.statut)}`}>
                        {getStatusLabel(cl.statut)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-red-500" /> Véhicules bloqués
              </h2>
              {blockedVehicles.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">Aucun véhicule bloqué</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {blockedVehicles.map((b: any) => (
                    <div key={b.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">{b.vehiculeImmatriculation}</p>
                        <p className="text-xs text-gray-500">Bloqué le {b.dateBlocage ? new Date(b.dateBlocage).toLocaleDateString('fr-FR') : 'N/A'}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">Bloqué</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Planning Tab */}
      {activeTab === 'planning' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-500" /> Planning des tournées
          </h2>
          {checklists.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">Aucune tournée planifiée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-border">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Véhicule</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Chauffeur</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Tournée</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Statut</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Conforme</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.slice(0, 20).map(cl => (
                    <tr key={cl.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                      <td className="py-2 px-3 font-medium">{cl.vehiculeImmatriculation}</td>
                      <td className="py-2 px-3">{cl.chauffeurNom}</td>
                      <td className="py-2 px-3">{cl.tourneeId}</td>
                      <td className="py-2 px-3 text-xs">{cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="py-2 px-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(cl.statut)}`}>{getStatusLabel(cl.statut)}</span></td>
                      <td className="py-2 px-3">{cl.estConforme ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Chauffeurs Tab */}
      {activeTab === 'chauffeurs' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" /> Chauffeurs du parc
          </h2>
          {chauffeurs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">Aucun chauffeur enregistré</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chauffeurs.map((ch: any) => {
                const chChecklists = checklists.filter((c: any) => c.chauffeurNom === `${ch.firstname} ${ch.name}`);
                const ncCount = chChecklists.filter((c: any) => c.estConforme === false).length;
                return (
                  <div key={ch.id} className="p-4 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{ch.firstname} {ch.name}</p>
                        <p className="text-xs text-gray-500">{ch.matricule || ch.personCode || '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white dark:bg-dark-surface rounded-lg">
                        <p className="font-bold text-gray-800 dark:text-white">{chChecklists.length}</p>
                        <p className="text-gray-500">Check-ups</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-dark-surface rounded-lg">
                        <p className={`font-bold ${ncCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{ncCount}</p>
                        <p className="text-gray-500">Non-conformes</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alertes Tab */}
      {activeTab === 'alertes' && (
        <div className="space-y-4">
          {blockedVehicles.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-red-700 dark:text-red-300">Véhicules bloqués ({blockedVehicles.length})</h2>
              </div>
              {blockedVehicles.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center p-3 bg-white dark:bg-dark-surface rounded-lg mb-2">
                  <div>
                    <p className="text-sm font-medium">{b.vehiculeImmatriculation}</p>
                    <p className="text-xs text-gray-500">Motif: {b.motif || 'Non-conformité'} — {b.dateBlocage ? new Date(b.dateBlocage).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium">Bloqué</span>
                </div>
              ))}
            </div>
          )}
          {ncChecklists.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-orange-700 dark:text-orange-300">En attente de réparation ({ncChecklists.length})</h2>
              </div>
              {ncChecklists.slice(0, 10).map(cl => (
                <div key={cl.id} className="flex justify-between items-center p-3 bg-white dark:bg-dark-surface rounded-lg mb-2">
                  <div>
                    <p className="text-sm font-medium">{cl.vehiculeImmatriculation} — {cl.chauffeurNom}</p>
                    <p className="text-xs text-gray-500">{cl.defautsJson || 'Défauts non spécifiés'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(cl.statut)}`}>{getStatusLabel(cl.statut)}</span>
                </div>
              ))}
            </div>
          )}
          {blockedVehicles.length === 0 && ncChecklists.length === 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-green-700 font-medium">Aucune alerte en cours</p>
              <p className="text-green-600 text-sm">Tous les véhicules sont conformes et opérationnels</p>
            </div>
          )}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}