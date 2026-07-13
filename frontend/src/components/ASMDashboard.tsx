import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AlertTriangle, Truck, CheckCircle, XCircle, Clock, Shield, RefreshCw, FileText, LogOut } from 'lucide-react';
import DashboardLayout from './ui/DashboardLayout';

const API = 'http://localhost:8080';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETE: { label: 'Non conforme', color: 'text-red-700', bg: 'bg-red-100' },
  REPAIRE: { label: 'En attente validation RS', color: 'text-orange-700', bg: 'bg-orange-100' },
  VALIDATED: { label: 'Validée — Débloqué', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  REJECTED: { label: 'Refusée — Reprendre', color: 'text-red-700', bg: 'bg-red-100' },
  PENDING: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

const ITEM_LABELS: Record<string, string> = {
  pneus: '🛞 Pneus', freins: '🛑 Freins', feux: '💡 Feux', extincteur: '🧯 Extincteur',
  documents: '📄 Documents', carrosserie: '🚘 Carrosserie', huileNiveau: '🛢️ Huile',
  batterie: '🔋 Batterie', essuieGlaces: '💧 Essuie-glaces', ceinturesSecurite: '🔗 Ceintures',
};

export default function ASMDashboard({ currentUser, onLogout }: any) {
  const [allChecklists, setAllChecklists] = useState<any[]>([]);
  const [blockedVehicules, setBlockedVehicules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'anomalies' | 'workflow' | 'vehicules'>('anomalies');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [ncRes, blkRes] = await Promise.all([
        axios.get(`${API}/api/fleet/checklist/non-conforme`),
        axios.get(`${API}/api/fleet/checklist/blocked-vehicules`),
      ]);
      setAllChecklists(Array.isArray(ncRes.data) ? ncRes.data : []);
      setBlockedVehicules(Array.isArray(blkRes.data) ? blkRes.data : []);
    } catch {}
  };

  const filteredChecklists = useMemo(() => {
    if (filterStatus === 'ALL') return allChecklists;
    return allChecklists.filter((cl: any) => cl.statut === filterStatus);
  }, [allChecklists, filterStatus]);

  const stats = useMemo(() => ({
    total: allChecklists.length,
    nc: allChecklists.filter((cl: any) => cl.statut === 'COMPLETE').length,
    repaire: allChecklists.filter((cl: any) => cl.statut === 'REPAIRE').length,
    validated: allChecklists.filter((cl: any) => cl.statut === 'VALIDATED').length,
    rejected: allChecklists.filter((cl: any) => cl.statut === 'REJECTED').length,
    blocked: blockedVehicules.length,
  }), [allChecklists, blockedVehicules]);

  const parseDefects = (json: string) => {
    try { const d = JSON.parse(json || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
  };

  const navItems = [
    { id: "asm-dashboard", label: "ASM", icon: <Shield className="w-5 h-5" />, active: true, onClick: () => {} },
    { id: "logout", label: "Déconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: onLogout },
  ];

  return (
    <DashboardLayout navItems={navItems} title="ASM — Agent Sécurité & Méthodes" subtitle="Contrôle qualité & conformité" currentUser={currentUser} onLogout={onLogout}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-bold ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`} onClick={() => setToast(null)}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total anomalies', value: stats.total, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
          { label: 'Non conforme', value: stats.nc, icon: XCircle, color: 'from-red-600 to-red-800' },
          { label: 'En attente RS', value: stats.repaire, icon: Clock, color: 'from-orange-500 to-amber-600' },
          { label: 'Validées', value: stats.validated, icon: CheckCircle, color: 'from-emerald-500 to-green-600' },
          { label: 'Refusées', value: stats.rejected, icon: XCircle, color: 'from-red-400 to-red-600' },
          { label: 'Véhicules bloqués', value: stats.blocked, icon: Truck, color: 'from-gray-700 to-gray-900' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-2`}>
              <kpi.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
            <p className="text-xs text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
          { id: 'workflow', label: 'Workflow', icon: FileText },
          { id: 'vehicules', label: 'Véhicules bloqués', icon: Truck },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2 mb-3">
            {['ALL', 'COMPLETE', 'REPAIRE', 'VALIDATED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  filterStatus === s ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300'
                }`}>
                {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>

          {filteredChecklists.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface rounded-xl p-8 text-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>Aucune anomalie pour ce filtre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChecklists.map((cl: any) => {
                const statusInfo = STATUS_CONFIG[cl.statut] || STATUS_CONFIG.COMPLETE;
                const defects = parseDefects(cl.defautsJson);
                return (
                  <div key={cl.id} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Conducteur: {cl.chauffeurNom} | {cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleString('fr-FR') : '-'}</p>
                        {cl.validePar && (
                          <p className="text-xs text-emerald-600 mt-1">
                            {cl.statut === 'VALIDATED' ? `✅ Validé par: ${cl.validePar}` : cl.statut === 'REJECTED' ? `❌ Refusé par: ${cl.validePar}` : ''}
                            {cl.dateValidation ? ` — ${new Date(cl.dateValidation).toLocaleString('fr-FR')}` : ''}
                          </p>
                        )}
                        {cl.motifRefus && <p className="text-xs text-red-500 mt-1">Motif refus: {cl.motifRefus}</p>}
                      </div>
                    </div>
                    {defects.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {defects.map((d: any, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            {ITEM_LABELS[d.item] || d.item}: {d.motif || 'ND'}
                          </span>
                        ))}
                      </div>
                    )}
                    {cl.reparationsJson && (() => {
                      try {
                        const rep = JSON.parse(cl.reparationsJson);
                        return (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs">
                            <span className="font-semibold text-blue-700 dark:text-blue-300">Réparations:</span>{' '}
                            {Array.isArray(rep.itemsRepares) ? rep.itemsRepares.map((it: string) => ITEM_LABELS[it] || it).join(', ') : 'N/A'}
                            {rep.reparePar && <span className="text-blue-500 ml-2">Par: {rep.reparePar}</span>}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Workflow des anomalies
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-blue-700">
                  <th className="p-3 text-left text-xs font-bold text-white">Véhicule</th>
                  <th className="p-3 text-left text-xs font-bold text-white">Conducteur</th>
                  <th className="p-3 text-left text-xs font-bold text-white">Date</th>
                  <th className="p-3 text-left text-xs font-bold text-white">Statut</th>
                  <th className="p-3 text-left text-xs font-bold text-white">Validé/Refusé par</th>
                  <th className="p-3 text-left text-xs font-bold text-white">Motif refus</th>
                  <th className="p-3 text-left text-xs font-bold text-white">Défauts</th>
                </tr>
              </thead>
              <tbody>
                {allChecklists.map((cl: any) => {
                  const statusInfo = STATUS_CONFIG[cl.statut] || STATUS_CONFIG.COMPLETE;
                  const defects = parseDefects(cl.defautsJson);
                  return (
                    <tr key={cl.id} className="border-b border-gray-100 dark:border-dark-border">
                      <td className="p-3 font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{cl.chauffeurNom}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span></td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{cl.validePar || '-'}</td>
                      <td className="p-3 text-red-500 text-xs">{cl.motifRefus || '-'}</td>
                      <td className="p-3 text-xs">{defects.map((d: any) => ITEM_LABELS[d.item] || d.item).join(', ') || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicules' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-red-500" /> Véhicules bloqués ({blockedVehicules.length})
          </h3>
          {blockedVehicules.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>Aucun véhicule bloqué</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedVehicules.map((v: any) => (
                <div key={v.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-800 dark:text-white">{v.vehiculeImmatriculation}</span>
                    <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full font-semibold">Bloqué</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Raison: {v.raison || '-'} | Bloqué par: {v.bloquePar || '-'} | Date: {v.dateBlocage ? new Date(v.dateBlocage[0], v.dateBlocage[1]-1, v.dateBlocage[2]).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}