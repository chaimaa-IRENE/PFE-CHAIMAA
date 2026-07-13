import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, CheckCircle, XCircle, Truck, ClipboardList, Clock, AlertTriangle, RefreshCw, History, LogOut } from 'lucide-react';
import DashboardLayout from './ui/DashboardLayout';

const API = 'http://localhost:8080';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'En attente', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  COMPLETE: { label: 'Non conforme', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  REPAIRE: { label: 'En attente validation RS', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  VALIDATED: { label: 'Validée — Camion débloqué', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  REJECTED: { label: 'Refusée — Reprendre intervention', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function ModernMaintenanceModule({ currentUser, onLogout }: any) {
  const [nonConformeList, setNonConformeList] = useState<any[]>([]);
  const [allChecklists, setAllChecklists] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'interventions' | 'history'>('interventions');
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [repairedItems, setRepairedItems] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmNonRepare, setConfirmNonRepare] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [ncRes, allRes] = await Promise.all([
        axios.get(`${API}/api/fleet/checklist/non-conforme`),
        axios.get(`${API}/api/fleet/checklist/all`),
      ]);
      setNonConformeList(Array.isArray(ncRes.data) ? ncRes.data : []);
      setAllChecklists(Array.isArray(allRes.data) ? allRes.data : []);
    } catch {}
  };

  const openRepair = (cl: any) => {
    setSelectedChecklist(cl);
    setRepairNotes('');
    const defects = cl.defautsJson ? JSON.parse(cl.defautsJson) : [];
    setRepairedItems(defects.map((d: any) => d.item).filter(Boolean));
  };

  const toggleRepairItem = (item: string) => {
    setRepairedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const submitRepair = async () => {
    if (!selectedChecklist) return;
    try {
      const reparationsJson = JSON.stringify({
        reparePar: currentUser?.firstname + ' ' + currentUser?.name,
        dateReparation: new Date().toISOString(),
        itemsRepares: repairedItems,
        notes: repairNotes,
      });
      await axios.post(`${API}/api/fleet/checklist/repair/${selectedChecklist.id}`, {
        reparationsJson,
        repairBy: currentUser?.firstname + ' ' + currentUser?.name,
      });
      setToast({ msg: 'Réparation soumise — En attente validation RS', type: 'success' });
      setSelectedChecklist(null);
      loadData();
    } catch {
      setToast({ msg: 'Erreur lors de la soumission', type: 'error' });
    }
  };

  const markNonRepare = async (cl: any, motif: string) => {
    try {
      const reparationsJson = JSON.stringify({
        reparePar: currentUser?.firstname + ' ' + currentUser?.name,
        dateReparation: new Date().toISOString(),
        itemsRepares: [],
        notes: motif || 'Non réparable — pièces ou expertise requise',
        nonReparable: true,
      });
      await axios.post(`${API}/api/fleet/checklist/repair/${cl.id}`, {
        reparationsJson,
        repairBy: currentUser?.firstname + ' ' + currentUser?.name,
      });
      setToast({ msg: 'Marqué comme non réparé — RS notifié pour décision', type: 'info' });
      loadData();
    } catch {
      setToast({ msg: 'Erreur', type: 'error' });
    }
  };

  const pendingInterventions = nonConformeList.filter(cl => !cl.postRepair && cl.statut !== 'REJECTED');
  const waitingValidation = nonConformeList.filter(cl => cl.postRepair && cl.statut === 'REPAIRE');
  const rejectedRepairs = nonConformeList.filter(cl => cl.statut === 'REJECTED');

  const navItems = [
    { id: "maintenance", label: "Maintenance", icon: <Wrench className="w-5 h-5" />, active: true, onClick: () => {} },
    { id: "logout", label: "Déconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: onLogout },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Équipe Maintenance" subtitle="Interventions & réparations" currentUser={currentUser} onLogout={onLogout}>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">Interventions requises</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-300">{pendingInterventions.length}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">En attente validation RS</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">{waitingValidation.length}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-700">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">Réparations refusées</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-300">{rejectedRepairs.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Validées aujourd'hui</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
            {allChecklists.filter(c => c.statut === 'VALIDATED').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('interventions')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
            activeTab === 'interventions' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300'
          }`}>
          <Wrench className="w-4 h-4" /> Interventions ({pendingInterventions.length + waitingValidation.length + rejectedRepairs.length})
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
            activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300'
          }`}>
          <History className="w-4 h-4" /> Historique ({allChecklists.filter(c => c.statut === 'VALIDATED').length})
        </button>
      </div>

      {activeTab === 'interventions' && (
        <div className="space-y-4">
          {/* Pending Interventions */}
          {pendingInterventions.length > 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Interventions requises ({pendingInterventions.length})
              </h3>
              <div className="space-y-3">
                {pendingInterventions.map(cl => (
                  <div key={cl.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-500" />
                          <p className="font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</p>
                          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-semibold">
                            Bloqué
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Conducteur: {cl.chauffeurNom} | {cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openRepair(cl)}
                          className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Réparer
                        </button>
                        <button onClick={() => setConfirmNonRepare(cl)}
                          className="px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Non réparé
                        </button>
                      </div>
                    </div>
                    {cl.defautsJson && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {JSON.parse(cl.defautsJson || '[]').map((d: any, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            {d.item}: {d.motif || d.commentaire || 'ND'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting Validation */}
          {waitingValidation.length > 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-500" />
                En attente validation RS ({waitingValidation.length})
              </h3>
              <div className="space-y-3">
                {waitingValidation.map(cl => (
                  <div key={cl.id} className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <p className="font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</p>
                      <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full font-semibold">
                        En attente validation RS
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Conducteur: {cl.chauffeurNom}</p>
                    {cl.reparationsJson && (() => {
                      try {
                        const rep = JSON.parse(cl.reparationsJson);
                        return (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Array.isArray(rep.itemsRepares) && rep.itemsRepares.map((item: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                {item} — Réparé
                              </span>
                            ))}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Repairs */}
          {rejectedRepairs.length > 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-500" />
                Réparations refusées — Reprendre l'intervention ({rejectedRepairs.length})
              </h3>
              <div className="space-y-3">
                {rejectedRepairs.map(cl => (
                  <div key={cl.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border-2 border-red-300 dark:border-red-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-red-500" />
                          <p className="font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</p>
                          <span className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 rounded-full font-bold">
                            REFUSÉE par RS — Reprendre
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Conducteur: {cl.chauffeurNom}</p>
                      </div>
                      <button onClick={() => openRepair(cl)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Reprendre
                      </button>
                    </div>
                    {cl.defautsJson && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {JSON.parse(cl.defautsJson || '[]').map((d: any, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            {d.item}: {d.motif || d.commentaire || 'ND'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingInterventions.length === 0 && waitingValidation.length === 0 && rejectedRepairs.length === 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p className="text-gray-600 dark:text-gray-400">Aucune intervention en attente</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-emerald-500" />
            Interventions validées
          </h3>
          {allChecklists.filter(c => c.statut === 'VALIDATED').length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Aucune intervention validée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allChecklists.filter(c => c.statut === 'VALIDATED').map(cl => (
                <div key={cl.id} className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-700 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</p>
                    <p className="text-xs text-gray-500">{cl.chauffeurNom} | {cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleDateString() : '-'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-semibold">
                    Validée
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Repair Modal */}
      {selectedChecklist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedChecklist(null)}>
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Réparation — {selectedChecklist.vehiculeImmatriculation}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Conducteur: {selectedChecklist.chauffeurNom} | Statut: <span className={`font-semibold ${STATUS_CONFIG[selectedChecklist.statut]?.color || 'text-gray-500'}`}>
                {STATUS_CONFIG[selectedChecklist.statut]?.label || selectedChecklist.statut}
              </span>
            </p>

            {selectedChecklist.statut === 'REJECTED' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg mb-3 text-sm text-red-700 dark:text-red-300">
                <strong>Réparation refusée par RS</strong> — Veuillez reprendre l'intervention. Vérifiez les éléments signalés et corrigez-les.
              </div>
            )}

            <p className="text-sm text-gray-500 mb-3">Cochez les éléments réparés :</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {['pneus','freins','feux','extincteur','documents','carrosserie','huileNiveau','batterie','essuieGlaces','ceinturesSecurite']
                .filter(k => selectedChecklist[k] === false)
                .map(k => {
                  const labels: Record<string, string> = {pneus:'Pneus',freins:'Freins',feux:'Feux',extincteur:'Extincteur',documents:'Documents',carrosserie:'Carrosserie',huileNiveau:'Niveau d\'huile',batterie:'Batterie',essuieGlaces:'Essuie-glaces',ceinturesSecurite:'Ceintures'};
                  return (
                    <label key={k} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-dark-bg rounded-lg cursor-pointer">
                      <input type="checkbox" checked={repairedItems.includes(k)} onChange={() => toggleRepairItem(k)} className="w-4 h-4" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{labels[k] || k}</span>
                      {repairedItems.includes(k) && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                    </label>
                  );
                })}
            </div>

            <textarea value={repairNotes} onChange={e => setRepairNotes(e.target.value)}
              placeholder="Notes de réparation (obligatoire pour validation RS)..."
              className="w-full p-3 border border-gray-200 dark:border-dark-border rounded-lg text-sm mb-4 bg-white dark:bg-dark-bg text-gray-800 dark:text-white" rows={3} />

            <div className="flex gap-2">
              <button onClick={submitRepair} disabled={repairedItems.length === 0}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <CheckCircle className="w-4 h-4" /> Soumettre réparation
              </button>
              <button onClick={() => markNonRepare(selectedChecklist, 'Non réparable — pièces ou expertise supplémentaire requise')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Non réparé
              </button>
              <button onClick={() => setSelectedChecklist(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Non-Reparable Modal */}
      {confirmNonRepare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmNonRepare(null)}>
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white">Confirmer : éléments non réparables ?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Véhicule <strong>{confirmNonRepare.vehiculeImmatriculation}</strong> — Cette action signale que les éléments ne peuvent pas être réparés. RS sera notifié pour décision.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { markNonRepare(confirmNonRepare, ''); setConfirmNonRepare(null); }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold">
                Confirmer non réparé
              </button>
              <button onClick={() => setConfirmNonRepare(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}