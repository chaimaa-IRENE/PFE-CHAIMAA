import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AlertTriangle, Truck, Mail, FileSpreadsheet, CheckCircle, XCircle, Clock, RefreshCw, Search, Filter, Download, X, Wrench, Shield, Bell, ArrowRight, Phone, LogOut } from 'lucide-react';
import DashboardLayout from './ui/DashboardLayout';
import * as XLSX from 'xlsx';

const API = 'http://localhost:8080';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  COMPLETE: { label: 'Non conforme', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  REPAIRE: { label: 'Réparé — Attente validation RS', color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: Clock },
  VALIDATED: { label: 'Validé — Camion débloqué', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  REJECTED: { label: 'Refusée — Reprendre intervention', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  NON_CONFORME: { label: 'Non conforme', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  EN_COURS: { label: 'En cours', color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: Clock },
  VALIDE: { label: 'Validé', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  REPARE: { label: 'Réparé', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Wrench },
};

const ITEM_LABELS: Record<string, string> = {
  pneus: 'Pneus', freins: 'Freins', feux: 'Feux', extincteur: 'Extincteur',
  documents: 'Documents', carrosserie: 'Carrosserie', huileNiveau: 'Huile',
  batterie: 'Batterie', essuieGlaces: 'Essuie-glaces', ceinturesSecurite: 'Ceintures',
};

const ITEM_ICONS: Record<string, string> = {
  pneus: '🛞', freins: '🛑', feux: '💡', extincteur: '🧯',
  documents: '📄', carrosserie: '🚘', huileNiveau: '🛢️', batterie: '🔋',
  essuieGlaces: '💧', ceinturesSecurite: '🔗',
};

export default function ModernSLDashboard({ currentUser, onLogout }: any) {
  const [nonConformeChecklists, setNonConformeChecklists] = useState<any[]>([]);
  const [allChecklists, setAllChecklists] = useState<any[]>([]);
  const [blockedVehicules, setBlockedVehicules] = useState<any[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [searchVehicule, setSearchVehicule] = useState('');
  const [searchChauffeur, setSearchChauffeur] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'anomalies' | 'reparations' | 'historique'>('anomalies');
  const [alertRSModal, setAlertRSModal] = useState<any>(null);
  const [alertRSMessage, setAlertRSMessage] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => { loadData(); const interval = setInterval(loadData, 30000); return () => clearInterval(interval); }, []);

  const loadData = async () => {
    try {
      const [ncRes, allRes, blkRes] = await Promise.all([
        axios.get(`${API}/api/fleet/checklist/non-conforme`),
        axios.get(`${API}/api/fleet/checklist/all`),
        axios.get(`${API}/api/fleet/checklist/blocked-vehicules`),
      ]);
      const nc = Array.isArray(ncRes.data) ? ncRes.data : [];
      setNonConformeChecklists(nc);
      setAllChecklists(Array.isArray(allRes.data) ? allRes.data : []);
      setBlockedVehicules(Array.isArray(blkRes.data) ? blkRes.data : []);
      if (nc.length > 0) setAlertMessage(`${nc.length} anomalie(s) détectée(s) — Action terrain requise`);
    } catch {}
  };

  const filteredChecklists = useMemo(() => {
    return nonConformeChecklists.filter((cl: any) => {
      if (searchVehicule && !(cl.vehiculeImmatriculation || '').toLowerCase().includes(searchVehicule.toLowerCase())) return false;
      if (searchChauffeur && !(cl.chauffeurNom || '').toLowerCase().includes(searchChauffeur.toLowerCase())) return false;
      if (filterDate && cl.dateChecklist) { const d = new Date(cl.dateChecklist).toISOString().slice(0, 10); if (d !== filterDate) return false; }
      if (filterStatus !== 'ALL' && cl.statut !== filterStatus) return false;
      return true;
    });
  }, [nonConformeChecklists, searchVehicule, searchChauffeur, filterDate, filterStatus]);

  const repairChecklists = filteredChecklists.filter((cl: any) => cl.statut === 'REPAIRE');
  const openChecklists = filteredChecklists.filter((cl: any) => cl.statut !== 'REPAIRE' && cl.statut !== 'VALIDATED');
  const validatedChecklists = filteredChecklists.filter((cl: any) => cl.statut === 'VALIDATED');

  const getStatusInfo = (cl: any) => {
    if (cl.statut === 'VALIDATED') return STATUS_MAP.VALIDATED;
    if (cl.statut === 'REPAIRE') return STATUS_MAP.REPAIRE;
    if (cl.statut === 'REJECTED') return STATUS_MAP.REJECTED;
    if (cl.estConforme) return STATUS_MAP.VALIDE;
    return STATUS_MAP.COMPLETE;
  };

  const handleExportExcel = () => {
    const data = filteredChecklists.map((cl: any) => ({
      'Date': cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleDateString('fr-FR') : '-',
      'Véhicule': cl.vehiculeImmatriculation || '-',
      'Chauffeur': cl.chauffeurNom || '-',
      'Tournée': cl.tourneeId || '-',
      'Statut': getStatusInfo(cl).label,
      'Défauts': (() => { try { const defs = JSON.parse(cl.defautsJson || '[]'); return Array.isArray(defs) ? defs.map((d: any) => d.item).filter(Boolean).join(', ') : '-'; } catch { return '-'; } })(),
      'Workflow': cl.statut || '-',
      'Validé par': cl.validePar || '-',
      'Commentaire': cl.commentaireGeneral || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anomalies');
    ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 10 }, { wch: 20 }, { wch: 30 }];
    XLSX.writeFile(wb, `Rapport_Anomalies_SL_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const parseDefects = (defautsJson: string) => {
    try { const defs = JSON.parse(defautsJson || '[]'); return Array.isArray(defs) ? defs : []; } catch { return []; }
  };

  const handleAlertRS = (cl: any) => {
    setAlertRSModal(cl);
    setAlertRSMessage(`Anomalie signalée sur ${cl.vehiculeImmatriculation} par ${cl.chauffeurNom} — Intervention urgente requise. Défauts: ${cl.defautsJson || 'Non spécifiés'}`);
    setAlertSent(false);
  };

  const sendAlertRS = () => {
    if (!alertRSModal) return;
    const subject = encodeURIComponent(`[DriverHub SL] Alerte terrain — ${alertRSModal.vehiculeImmatriculation}`);
    const body = encodeURIComponent(alertRSMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setAlertSent(true);
    setTimeout(() => { setAlertRSModal(null); setAlertSent(false); }, 2000);
  };

  const conformantCount = allChecklists.filter((cl: any) => cl.estConforme === true).length;
  const ncCount = nonConformeChecklists.length;

  const navItems = [
    { id: "sl-dashboard", label: "Superviseur Livraison", icon: <Shield className="w-5 h-5" />, active: true, onClick: () => {} },
    { id: "logout", label: "Déconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: onLogout },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Superviseur Livraison" subtitle={`${currentUser?.firstname} ${currentUser?.name} — Coordination terrain`} currentUser={currentUser} onLogout={onLogout}>
      {/* RED ALERT BANNER */}
      {alertMessage && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded-xl flex items-center gap-3 shadow-lg animate-pulse">
          <Bell className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">ACTION TERRAIN REQUISE</p>
            <p className="text-xs opacity-90">{alertMessage}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('anomalies')} className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 flex items-center gap-1">
              <ArrowRight className="w-4 h-4" /> Voir anomalies
            </button>
            <button onClick={() => setAlertMessage(null)} className="px-2 py-1 text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filtres
          </button>
          <button onClick={loadData} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={handleExportExcel} disabled={filteredChecklists.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Anomalies ouvertes', value: openChecklists.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
          { label: 'En réparation', value: repairChecklists.length, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
          { label: 'Véhicules bloqués', value: blockedVehicules.length, icon: Truck, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10' },
          { label: 'Validées', value: validatedChecklists.length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'Total contrôles', value: allChecklists.length, icon: FileSpreadsheet, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} rounded-xl border border-gray-200 dark:border-dark-border p-4`}>
            <div className="flex items-center gap-2 mb-1"><kpi.icon className={`w-4 h-4 ${kpi.color}`} /><span className="text-xs text-gray-500">{kpi.label}</span></div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Véhicule</label>
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-600 dark:text-gray-400" />
              <input type="text" value={searchVehicule} onChange={e => setSearchVehicule(e.target.value)} placeholder="Immatriculation..." className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm" /></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Chauffeur</label>
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-600 dark:text-gray-400" />
              <input type="text" value={searchChauffeur} onChange={e => setSearchChauffeur(e.target.value)} placeholder="Nom chauffeur..." className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm" /></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Statut workflow</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm">
                <option value="ALL">Tous les statuts</option>
                <option value="COMPLETE">Non conforme</option>
                <option value="REPAIRE">En attente validation RS</option>
                <option value="VALIDATED">Validée — Débloqué</option>
                <option value="REJECTED">Refusée</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm" />
            </div>
            <div className="flex items-end"><button onClick={() => { setSearchVehicule(''); setSearchChauffeur(''); setFilterDate(''); setFilterStatus('ALL'); }} className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800"><X className="w-4 h-4 inline mr-1" />Réinitialiser</button></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([
          { key: 'anomalies' as const, label: 'Anomalies ouvertes', count: openChecklists.length, icon: AlertTriangle, color: 'red' },
          { key: 'reparations' as const, label: 'Réparations', count: repairChecklists.length, icon: Wrench, color: 'orange' },
          { key: 'historique' as const, label: 'Historique', count: filteredChecklists.length, icon: Clock, color: 'purple' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-blue-500 text-white shadow-md' : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border hover:bg-gray-50'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'anomalies' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Anomalies ouvertes ({openChecklists.length})</h2>
          </div>
          {openChecklists.length === 0 ? (
            <div className="text-center py-8"><CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400" /><p className="text-gray-600 dark:text-gray-400">Aucune anomalie ouverte — Tout est conforme</p></div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {openChecklists.map((cl: any) => {
                const status = getStatusInfo(cl);
                const StatusIcon = status.icon;
                const defects = parseDefects(cl.defautsJson);
                return (
                  <div key={cl.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-700 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedChecklist(cl)}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-4 h-4 text-red-500" />
                          <span className="font-bold text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}><StatusIcon className="w-3 h-3 inline" /> {status.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{cl.chauffeurNom} | Tournée: {cl.tourneeId || '—'}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleString('fr-FR') : '—'}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {defects.map((d: any, i: number) => (
                            <span key={i} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                              {ITEM_ICONS[d.item] || ''} {ITEM_LABELS[d.item] || d.item} {d.motif ? `(${d.motif})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleAlertRS(cl); }} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 flex items-center gap-1 whitespace-nowrap">
                          <Mail className="w-3 h-3" /> Alerter RS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reparations' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Réparations en attente validation RS ({repairChecklists.length})</h2>
          </div>
          {repairChecklists.length === 0 ? (
            <div className="text-center py-8"><Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p className="text-gray-600 dark:text-gray-400">Aucune réparation en attente de validation</p></div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {repairChecklists.map((cl: any) => {
                const defects = parseDefects(cl.defautsJson);
                const repairedItems = defects.filter((d: any) => d.repare === true);
                return (
                  <div key={cl.id} className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          {cl.vehiculeImmatriculation}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">Réparé — en attente validation RS</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{cl.chauffeurNom} | {cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleString('fr-FR') : '—'}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {repairedItems.map((d: any, i: number) => (
                            <span key={i} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">✅ {ITEM_LABELS[d.item] || d.item}</span>
                          ))}
                          {defects.filter((d: any) => d.repare !== true).map((d: any, i: number) => (
                            <span key={i} className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">❌ {ITEM_LABELS[d.item] || d.item}</span>
                          ))}
                        </div>
                        {cl.reparationsJson && (() => { try { const r = JSON.parse(cl.reparationsJson); return <p className="text-xs italic text-gray-500 mt-1">Notes: {r.notes || '—'} | Par: {r.reparePar || '—'}</p>; } catch { return null; }})()}
                      </div>
                      <button onClick={() => handleAlertRS(cl)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Alerter RS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'historique' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500" /><h2 className="font-semibold text-gray-800 dark:text-white">Historique ({filteredChecklists.length})</h2></div>
          </div>
          {filteredChecklists.length === 0 ? <div className="text-center py-8 text-gray-600 dark:text-gray-400">Aucun historique</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Véhicule</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Chauffeur</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Défauts</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Validé par</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Statut</th>
                </tr></thead>
                <tbody>{filteredChecklists.map((cl: any) => { const status = getStatusInfo(cl); const StatusIcon = status.icon;
                  return (
                    <tr key={cl.id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/20 cursor-pointer" onClick={() => setSelectedChecklist(cl)}>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-300 text-xs">{cl.dateChecklist ? new Date(cl.dateChecklist).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">{cl.vehiculeImmatriculation}</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{cl.chauffeurNom}</td>
                      <td className="py-2 px-3"><div className="flex flex-wrap gap-1">{parseDefects(cl.defautsJson).map((d: any, i: number) => (
                        <span key={i} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">{ITEM_ICONS[d.item] || ''} {ITEM_LABELS[d.item] || d.item}</span>
                      ))}</div></td>
                      <td className="py-2 px-3 text-xs text-gray-500">{cl.validePar || '—'}</td>
                      <td className="py-2 px-3 text-center"><span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${status.color} ${status.bg}`}><StatusIcon className="w-3 h-3" />{status.label}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Blocked Vehicles */}
      {blockedVehicules.length > 0 && (
        <div className="mt-6 bg-white dark:bg-dark-surface rounded-xl shadow-sm border-2 border-red-200 dark:border-red-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-700 dark:text-red-300">Véhicules bloqués ({blockedVehicules.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blockedVehicules.map((vb: any) => (
              <div key={vb.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-700">
                <div className="flex items-center justify-between mb-2"><p className="font-bold text-red-700 dark:text-red-300 text-lg">{vb.vehiculeImmatriculation}</p><XCircle className="w-5 h-5 text-red-500" /></div>
                <p className="text-xs text-gray-500">Raison: {vb.raison || vb.motif || 'Non conforme'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Blocage: {vb.dateBlocage ? new Date(vb.dateBlocage).toLocaleString('fr-FR') : '—'}</p>
                {vb.debloquePar && <p className="text-xs text-emerald-500 mt-1">✅ Débloqué par: {vb.debloquePar}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedChecklist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedChecklist(null)}>
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Détail anomalie — {selectedChecklist.vehiculeImmatriculation}</h3>
              <button onClick={() => setSelectedChecklist(null)} className="w-8 h-8 bg-gray-100 dark:bg-dark-border rounded-lg flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg"><span className="text-gray-500 block text-xs">Véhicule</span><span className="font-bold text-gray-800 dark:text-white">{selectedChecklist.vehiculeImmatriculation}</span></div>
                <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg"><span className="text-gray-500 block text-xs">Conducteur</span><span className="font-bold text-gray-800 dark:text-white">{selectedChecklist.chauffeurNom}</span></div>
                <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg"><span className="text-gray-500 block text-xs">Date</span><span className="font-bold text-gray-800 dark:text-white">{selectedChecklist.dateChecklist ? new Date(selectedChecklist.dateChecklist).toLocaleString('fr-FR') : '—'}</span></div>
                <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg"><span className="text-gray-500 block text-xs">Statut</span>{(() => { const s = getStatusInfo(selectedChecklist); const I = s.icon; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color} ${s.bg}`}><I className="w-3 h-3" />{s.label}</span>; })()}</div>
              </div>
              {selectedChecklist.estConforme === false && selectedChecklist.messageAlerteArabe && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-700 text-right" dir="rtl">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{selectedChecklist.messageAlerteArabe}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <p className="text-gray-500 mb-2 font-medium">Éléments défectueux :</p>
                {parseDefects(selectedChecklist.defautsJson).length > 0 ? parseDefects(selectedChecklist.defautsJson).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1.5 p-2 bg-red-50 dark:bg-red-900/10 rounded">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{ITEM_ICONS[d.item] || ''} {ITEM_LABELS[d.item] || d.item}</span>
                    {d.motif && <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">({d.motif})</span>}
                  </div>
                )) : <p className="text-gray-600 dark:text-gray-400">—</p>}
              </div>
              {selectedChecklist.reparationsJson && (() => { try { const r = JSON.parse(selectedChecklist.reparationsJson); return (
                <div className="border-t pt-3">
                  <p className="text-gray-500 mb-2 font-medium">Réparations signalées :</p>
                  <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded text-sm text-green-700 dark:text-green-300">{r.notes || '—'} | Par: {r.reparePar || '—'}</div>
                </div>
              ); } catch { return null; }})()}
              {selectedChecklist.validePar && (
                <div className="border-t pt-3">
                  <p className="text-gray-500 mb-2 font-medium">Validation :</p>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded text-sm">
                    <p><span className="font-medium">Validé par:</span> {selectedChecklist.validePar}</p>
                    {selectedChecklist.dateValidation && <p><span className="font-medium">Date:</span> {new Date(selectedChecklist.dateValidation).toLocaleString('fr-FR')}</p>}
                  </div>
                </div>
              )}
              {selectedChecklist.commentaireGeneral && (
                <div className="border-t pt-3"><p className="text-gray-500 mb-1 font-medium">Commentaire :</p><p className="p-2 bg-gray-50 dark:bg-dark-bg rounded text-sm">{selectedChecklist.commentaireGeneral}</p></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setSelectedChecklist(null); handleAlertRS(selectedChecklist); }} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Alerter RS
              </button>
              <button onClick={() => setSelectedChecklist(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert RS Modal */}
      {alertRSModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAlertRSModal(null)}>
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-blue-500" /></div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Alerter le Responsable Support</h3>
            </div>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <p className="font-medium text-gray-800 dark:text-white">{alertRSModal.vehiculeImmatriculation}</p>
                <p className="text-xs text-gray-500">Conducteur: {alertRSModal.chauffeurNom} | Tournée: {alertRSModal.tourneeId || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message d'alerte</label>
                <textarea value={alertRSMessage} onChange={(e) => setAlertRSMessage(e.target.value)} rows={4} className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={sendAlertRS} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center justify-center gap-2" disabled={alertSent}>
                {alertSent ? <><CheckCircle className="w-4 h-4" /> Envoyé !</> : <><Mail className="w-4 h-4" /> Envoyer l'alerte</>}
              </button>
              <button onClick={() => setAlertRSModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}