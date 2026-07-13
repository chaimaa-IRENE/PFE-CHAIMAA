import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Shield, Car, Calendar, AlertTriangle, CheckCircle, Clock, Upload, X, Plus } from 'lucide-react';

const API = 'http://localhost:8080';

const DOC_TYPES = [
  { label: 'Assurance', key: 'ASSURANCE', icon: Shield },
  { label: 'ONSSA', key: 'ONSSA', icon: FileText },
  { label: 'Visite Technique', key: 'VISITE_TECHNIQUE', icon: Car },
  { label: 'Carte Grise', key: 'CARTE_GRISE', icon: FileText },
  { label: 'Métrologique', key: 'METROLOGIQUE', icon: Calendar },
];

function getStatusColor(dateStr: string | null): { color: string; label: string; bg: string } {
  if (!dateStr) return { color: 'text-red-600', label: 'Absent', bg: 'bg-red-50 dark:bg-red-900/20' };
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { color: 'text-red-600', label: `Expiré (${Math.abs(days)}j)`, bg: 'bg-red-50 dark:bg-red-900/20' };
  if (days < 30) return { color: 'text-orange-500', label: `Expire dans ${days}j`, bg: 'bg-orange-50 dark:bg-orange-900/20' };
  return { color: 'text-emerald-600', label: `Valide (${days}j)`, bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
}

const DUREE_PAR_TYPE: Record<string, { mois: number; label: string }> = {
  ASSURANCE: { mois: 12, label: '+1 an' },
  ONSSA: { mois: 24, label: '+2 ans (réglementation)' },
  VISITE_TECHNIQUE: { mois: 6, label: '+6 mois' },
  CARTE_GRISE: { mois: 120, label: '+10 ans' },
  METROLOGIQUE: { mois: 12, label: '+1 an' },
};

function calculerDateExpiration(type: string): string {
  const duree = DUREE_PAR_TYPE[type];
  if (!duree) return '';
  const d = new Date();
  d.setMonth(d.getMonth() + duree.mois);
  return d.toISOString().split('T')[0];
}

export default function LegalDocumentDashboard() {
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedV, setSelectedV] = useState<any>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ type: 'ASSURANCE', numeroDocument: '', proprietaire: '', dateExpiration: '' });
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get(`${API}/api/vehicules`).then(r => setVehicules(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API}/api/fleet/documents/all`).then(r => setDocuments(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };

  const openImport = () => {
    const type = 'ASSURANCE';
    setImportForm({ type, numeroDocument: '', proprietaire: '', dateExpiration: calculerDateExpiration(type) });
    setShowImport(true);
    setImportMsg('');
  };

  const handleImportTypeChange = (type: string) => {
    setImportForm(prev => ({ ...prev, type, dateExpiration: calculerDateExpiration(type) }));
  };

  const handleImport = async () => {
    if (!selectedV) return;
    try {
      await axios.post(`${API}/api/fleet/documents/import`, {
        vehiculeImmatriculation: selectedV.immatriculation,
        type: importForm.type,
        numeroDocument: importForm.numeroDocument || null,
        dateExpiration: importForm.dateExpiration || null,
        proprietaire: importForm.proprietaire || null,
        importePar: 'RS',
      });
      setImportMsg('Document importé avec succès');
      fetchData();
      setTimeout(() => setShowImport(false), 1500);
    } catch {
      setImportMsg('Erreur lors de l\'import');
    }
  };

  const getDaysUntilExpiry = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getDocsForVehicule = (imm: string) => {
    return documents.filter((d: any) => d.vehiculeImmatriculation === imm);
  };

  const getDoc = (imm: string, type: string) => {
    return documents.find((d: any) => d.vehiculeImmatriculation === imm && d.type === type);
  };

  const filtered = vehicules.filter(v =>
    !vehicleSearch || v.immatriculation?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-blue-500" />
        <h2 className="font-semibold text-gray-800 dark:text-white">Validité documents légaux</h2>
      </div>

      <input type="text" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)}
        placeholder="Rechercher par immatriculation..."
        className="w-full px-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg" />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-dark-border text-xs text-gray-500">
              <th className="p-2 text-left">Véhicule</th>
              {DOC_TYPES.map(dt => (
                <th key={dt.key} className="p-2 text-center">
                  <dt.icon className="w-3 h-3 mx-auto" />
                  <span className="block mt-1">{dt.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map(v => {
              const docs = getDocsForVehicule(v.immatriculation);
              return (
                <tr key={v.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer"
                    onClick={() => setSelectedV(v)}>
                  <td className="p-2 font-semibold text-gray-800 dark:text-white">{v.immatriculation}</td>
                  {DOC_TYPES.map(dt => {
                    const doc = getDoc(v.immatriculation, dt.key);
                    const status = getStatusColor(doc?.dateExpiration || null);
                    return (
                      <td key={dt.key} className="p-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}>
                          {status.label.includes('Valide') ? <CheckCircle className="w-3 h-3" /> :
                           status.label.includes('Expiré') ? <AlertTriangle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedV && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!showImport) setSelectedV(null); }}>
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white">{selectedV.immatriculation} — Documents</h3>
              <button onClick={() => { setSelectedV(null); setShowImport(false); }} className="w-8 h-8 bg-gray-100 dark:bg-dark-border rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-border/80">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!showImport ? (
              <>
                <div className="space-y-3 mb-4">
                  {DOC_TYPES.map(dt => {
                    const doc = getDoc(selectedV.immatriculation, dt.key);
                    const status = getStatusColor(doc?.dateExpiration || null);
                    const days = getDaysUntilExpiry(doc?.dateExpiration || null);
                    return (
                      <div key={dt.key} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-white">{dt.label}</p>
                          <p className={`text-xs ${status.color}`}>{status.label}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {doc?.dateExpiration ? new Date(doc.dateExpiration).toLocaleDateString('fr-FR') : '—'}
                          {doc?.numeroDocument && <span className="block opacity-60">N°{doc.numeroDocument}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={openImport}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all">
                  <Plus className="w-4 h-4" /> Importer un document
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type de document</label>
                  <select value={importForm.type} onChange={e => handleImportTypeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white">
                    {DOC_TYPES.map(dt => (
                      <option key={dt.key} value={dt.key}>{dt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date d'expiration</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" value={importForm.dateExpiration}
                      onChange={e => setImportForm(prev => ({ ...prev, dateExpiration: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white" />
                    <span className="text-xs text-blue-500 font-medium whitespace-nowrap">{DUREE_PAR_TYPE[importForm.type]?.label}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Numéro de document</label>
                  <input type="text" value={importForm.numeroDocument}
                    onChange={e => setImportForm(prev => ({ ...prev, numeroDocument: e.target.value }))}
                    placeholder="Ex: A123456" className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Propriétaire</label>
                  <input type="text" value={importForm.proprietaire}
                    onChange={e => setImportForm(prev => ({ ...prev, proprietaire: e.target.value }))}
                    placeholder="Nom du propriétaire" className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-800 dark:text-white" />
                </div>
                {importMsg && (
                  <p className={`text-sm font-medium text-center ${importMsg.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
                    {importMsg}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowImport(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">
                    Annuler
                  </button>
                  <button onClick={handleImport}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all">
                    <Upload className="w-4 h-4" /> Importer
                  </button>
                </div>
              </div>
            )}

            {!showImport && (
              <button onClick={() => { setSelectedV(null); setShowImport(false); }} className="mt-3 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">
                Fermer
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Valide (30j+)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Expire bientôt (&lt;30j)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Expiré / Absent</span>
      </div>
    </div>
  );
}
