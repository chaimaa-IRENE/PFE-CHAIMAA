import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Truck, CheckCircle, XCircle, AlertTriangle,
  Shield, RefreshCw, AlertCircle, Lock, Unlock
} from "lucide-react";

export default function FleetComparisonPanel() {
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [selectedImm, setSelectedImm] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get<any[]>("http://localhost:8080/api/vehicules").then(res => {
      setVehicules(res.data || []);
    }).catch(() => {});
  }, []);

  const compare = useCallback(async () => {
    if (!selectedImm) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`http://localhost:8080/api/fleet/comparison/${selectedImm}`);
      setResult(res.data);
    } catch {
      setError("Véhicule non trouvé ou pas de checklist");
    } finally {
      setLoading(false);
    }
  }, [selectedImm]);

  // Auto-comparaison dès qu'un véhicule est sélectionné
  useEffect(() => { compare(); }, [compare]);

  const unblock = async () => {
    try {
      await axios.post(`http://localhost:8080/api/fleet/comparison/unblock/${selectedImm}`, { debloquePar: "Admin" });
      compare();
    } catch {}
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "CONFORME": return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case "ALERTE": return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case "URGENT": return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case "CRITIQUE": return <AlertCircle className="w-6 h-6 text-red-500" />;
      case "BLOQUANT": return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <Shield className="w-6 h-6 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusClass = (statut: string) => {
    switch (statut) {
      case "CONFORME": return "bg-emerald-50 border-emerald-300 text-emerald-700";
      case "ALERTE": return "bg-amber-50 border-amber-300 text-amber-700";
      case "URGENT": return "bg-orange-50 border-orange-300 text-orange-700";
      case "CRITIQUE": return "bg-red-50 border-red-300 text-red-700";
      case "BLOQUANT": return "bg-red-100 border-red-400 text-red-800";
      default: return "bg-slate-50 border-slate-300 text-slate-600";
    }
  };

  const getItemIcon = (statut: string) => {
    switch (statut) {
      case "CONFORME": return "✅";
      case "ALERTE": return "⚠️";
      case "URGENT": return "⚠️";
      case "CRITIQUE": return "❌";
      case "BLOQUANT": return "🚫";
      default: return "—";
    }
  };

  const cardClass = "bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-danone-blue" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Système — Comparaison Automatique</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Analyse checklist vs base documentaire</p>
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className={cardClass}>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Véhicule</label>
        <div className="flex gap-2">
          <select value={selectedImm} onChange={e => setSelectedImm(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-dark-border border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue">
            <option value="">Sélectionnez un véhicule</option>
            {vehicules.map((v: any) => (
              <option key={v.id} value={v.immatriculation}>{v.immatriculation} — {v.marque} {v.modele}</option>
            ))}
          </select>
          <button onClick={compare} disabled={!selectedImm || loading} title="Rafraîchir"
            className="px-3 py-2.5 bg-gradient-to-r from-danone-blue to-danone-blue-dark text-white rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Comparaison automatique à la sélection</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && <div className="h-32 bg-slate-100 dark:bg-dark-border rounded-2xl animate-pulse" />}

      {/* Comparison Result */}
      {result && !loading && (
        <>
          {/* Global Status */}
          <div className={`${cardClass} ${getStatusClass(result.statutGlobal)} border-2`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(result.statutGlobal)}
              <div>
                <h2 className="text-lg font-bold">{result.statutGlobal}</h2>
                <p className="text-sm opacity-80">{result.description}</p>
              </div>
            </div>
            {result.statutGlobal === "BLOQUANT" && (
              <button onClick={unblock}
                className="mt-3 px-4 py-2 bg-white rounded-xl text-sm font-bold shadow hover:shadow-md transition-all flex items-center gap-2">
                <Unlock className="w-4 h-4" /> Débloquer le véhicule
              </button>
            )}
          </div>

          {/* Vehicle Info */}
          <div className={`${cardClass} grid grid-cols-1 sm:grid-cols-3 gap-4`}>
            <div><span className="text-xs text-slate-600 dark:text-slate-400">Immatriculation</span><p className="font-bold text-slate-800">{result.vehiculeImmatriculation}</p></div>
            <div><span className="text-xs text-slate-600 dark:text-slate-400">Marque/Modèle</span><p className="font-bold text-slate-800">{result.marque} {result.modele}</p></div>
            <div><span className="text-xs text-slate-600 dark:text-slate-400">Dernière checklist</span><p className="font-bold text-slate-800">{result.lastChecklist ? new Date(result.lastChecklist.dateChecklist).toLocaleDateString("fr-FR") : "Jamais"}</p></div>
          </div>

          {/* Comparison Items */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Détail de la comparaison</h2>
            <div className="space-y-3">
              {result.items?.map((item: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  item.statut === "CONFORME" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10" :
                  item.statut === "ALERTE" ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10" :
                  item.statut === "CRITIQUE" ? "border-red-200 bg-red-50 dark:bg-red-900/10" :
                  "border-red-300 bg-red-100 dark:bg-red-900/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getItemIcon(item.statut)}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-white">{item.element}</p>
                      <p className="text-xs text-slate-500">
                        Physique: {item.presentPhysiquement ? "✅ Présent" : "❌ Absent"} · 
                        Admin: {item.valideAdministrativement ? "✅ Valide" : "❌ Expiré"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    item.statut === "CONFORME" ? "bg-emerald-100 text-emerald-700" :
                    item.statut === "ALERTE" ? "bg-amber-100 text-amber-700" :
                    item.statut === "CRITIQUE" ? "bg-red-100 text-red-700" :
                    "bg-red-200 text-red-800"
                  }`}>{item.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          {result.documents?.length > 0 && (
            <div className={cardClass}>
              <h2 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Documents légaux</h2>
              <div className="space-y-2">
                {result.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-dark-border/50 rounded-lg">
                    <div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-white">{doc.type}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">N° {doc.numeroDocument || "—"}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      doc.statut === "VALIDE" ? "bg-green-100 text-green-700" :
                      doc.statut === "BIENTOT_EXPIRE" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>{doc.statut}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-200 dark:border-dark-border">
        <img src="/logo-danone.svg" alt="Danone" className="h-8 opacity-50" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wider">ONE PLANET. ONE HEALTH</p>
      </div>
    </div>
  );
}
