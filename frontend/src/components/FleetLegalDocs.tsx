import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText, Upload, Search, CheckCircle, AlertCircle, Clock,
  Truck, Calendar, User, X, RefreshCw
} from "lucide-react";

export default function FleetLegalDocs() {
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedImm, setSelectedImm] = useState("");
  const [loading, setLoading] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({
    vehiculeImmatriculation: "", type: "CARTE_GRISE",
    numeroDocument: "", dateExpiration: "", proprietaire: "", importePar: "Admin"
  });

  const docTypes = [
    { value: "CARTE_GRISE", label: "Carte Grise", color: "blue" },
    { value: "ASSURANCE", label: "Assurance", color: "green" },
    { value: "ONSSA", label: "ONSSA", color: "amber" },
    { value: "METROLOGIQUE", label: "Métrologique", color: "purple" },
  ];

  useEffect(() => {
    axios.get<any[]>("http://localhost:8080/api/vehicules").then(res => {
      setVehicules(res.data || []);
      if (res.data?.length > 0) {
        setSelectedImm(res.data[0].immatriculation);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedImm) loadDocuments(selectedImm);
  }, [selectedImm]);

  const loadDocuments = async (imm: string) => {
    setLoading(true);
    try {
      const res = await axios.get<any[]>(`http://localhost:8080/api/fleet/documents/vehicule/${imm}`);
      setDocuments(res.data || []);
    } catch { setDocuments([]); }
    finally { setLoading(false); }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/fleet/documents/import", importForm);
      setShowImport(false);
      setImportForm({ vehiculeImmatriculation: selectedImm, type: "CARTE_GRISE", numeroDocument: "", dateExpiration: "", proprietaire: "", importePar: "Admin" });
      loadDocuments(selectedImm);
    } catch { alert("Erreur import"); }
  };

  const statutBadge = (statut: string) => {
    switch (statut) {
      case "VALIDE": return <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-green-100 text-green-700">✅ Valide</span>;
      case "BIENTOT_EXPIRE": return <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-amber-100 text-amber-700">⚠️ Bientôt expiré</span>;
      case "EXPIRE": return <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-red-100 text-red-700">❌ Expiré</span>;
      default: return <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-slate-100 text-slate-600">—</span>;
    }
  };

  const cardClass = "bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-danone-blue" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Transport — Documents Légaux</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Import OCR & suivi documentaire</p>
          </div>
        </div>
        <button onClick={() => setShowImport(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-danone-blue to-danone-blue-dark text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2">
          <Upload className="w-4 h-4" /> Importer un document
        </button>
      </div>

      {/* Vehicle Selector */}
      <div className={cardClass}>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Sélectionner un véhicule</label>
        <div className="flex gap-2">
          <select value={selectedImm} onChange={e => setSelectedImm(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue">
            {vehicules.map((v: any) => (
              <option key={v.id} value={v.immatriculation}>{v.immatriculation} — {v.marque} {v.modele}</option>
            ))}
          </select>
          <button onClick={() => loadDocuments(selectedImm)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-border hover:bg-slate-200 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docTypes.map(dt => {
          const doc = documents.find((d: any) => d.type === dt.value);
          return (
            <div key={dt.value} className={`${cardClass} border-l-4 ${
              !doc ? 'border-l-slate-300' :
              doc.statut === 'VALIDE' ? 'border-l-green-500' :
              doc.statut === 'BIENTOT_EXPIRE' ? 'border-l-amber-500' : 'border-l-red-500'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white">{dt.label}</h3>
                  {doc ? (
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p><span className="font-semibold">N°:</span> {doc.numeroDocument || "—"}</p>
                      <p><span className="font-semibold">Propriétaire:</span> {doc.proprietaire || "—"}</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-semibold">Expire le:</span> {doc.dateExpiration || "—"}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-semibold">Importé le:</span> {doc.dateImport ? new Date(doc.dateImport).toLocaleDateString("fr-FR") : "—"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Aucun document importé</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {statutBadge(doc?.statut)}
                  {!doc && <span className="text-xs text-slate-600 dark:text-slate-400">Non importé</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* All Documents Table */}
      {documents.length > 0 && (
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Tous les documents</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-border/50">
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">N° Document</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Propriétaire</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Expiration</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-dark-border/30">
                    <td className="px-3 py-2 font-semibold text-slate-700 dark:text-white">{doc.type}</td>
                    <td className="px-3 py-2 text-slate-600">{doc.numeroDocument || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{doc.proprietaire || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{doc.dateExpiration || "—"}</td>
                    <td className="px-3 py-2">{statutBadge(doc.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowImport(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Importer un document</h2>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Véhicule</label>
                <select value={importForm.vehiculeImmatriculation} onChange={e => setImportForm({...importForm, vehiculeImmatriculation: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm">
                  {vehicules.map((v: any) => (
                    <option key={v.id} value={v.immatriculation}>{v.immatriculation}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type de document</label>
                <select value={importForm.type} onChange={e => setImportForm({...importForm, type: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm">
                  {docTypes.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">N° Document</label>
                  <input type="text" value={importForm.numeroDocument} onChange={e => setImportForm({...importForm, numeroDocument: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Date expiration</label>
                  <input type="date" value={importForm.dateExpiration} onChange={e => setImportForm({...importForm, dateExpiration: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Propriétaire</label>
                <input type="text" value={importForm.proprietaire} onChange={e => setImportForm({...importForm, proprietaire: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowImport(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Annuler</button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-danone-blue to-danone-blue-dark text-white rounded-xl text-sm font-bold">Importer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-200 dark:border-dark-border">
        <img src="/logo-danone.svg" alt="Danone" className="h-8 opacity-50" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wider">ONE PLANET. ONE HEALTH</p>
      </div>
    </div>
  );
}
