import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "./ui/DashboardLayout";
import Badge from "./ui/Badge";
import Toast from "./ui/Toast";
import {
  Wrench, AlertTriangle, CheckCircle, XCircle, Truck, RefreshCw,
  Search, Clock, ChevronDown, ChevronUp, ClipboardList, ShieldCheck, FileText,
  Shield, Car, Calendar, Upload, Plus
} from "lucide-react";

const ANOMALIE_API = "http://localhost:8080/api/anomalies-checkup";
const VEHICLE_API = "http://localhost:8080/api/vehicles";
const DOCUMENTS_API = "http://localhost:8080/api/documents-reglementaires";

const DOC_TYPES = [
  { label: 'Assurance', key: 'ASSURANCE', icon: Shield },
  { label: 'ONSSA', key: 'ONSSA', icon: FileText },
  { label: 'Visite Technique', key: 'VISITE_TECHNIQUE', icon: Car },
  { label: 'Carte Grise', key: 'CARTE_GRISE', icon: FileText },
  { label: 'Métrologique', key: 'METROLOGIQUE', icon: Calendar },
];

const DUREE_PAR_TYPE: Record<string, { mois: number; label: string }> = {
  ASSURANCE: { mois: 12, label: '+1 an' },
  ONSSA: { mois: 24, label: '+2 ans (réglementation)' },
  VISITE_TECHNIQUE: { mois: 6, label: '+6 mois' },
  CARTE_GRISE: { mois: 120, label: '+10 ans' },
  METROLOGIQUE: { mois: 12, label: '+1 an' },
};

function getStatusColor(dateStr: string | null): { color: string; label: string; bg: string } {
  if (!dateStr) return { color: 'text-red-600', label: 'Absent', bg: 'bg-red-50 dark:bg-red-900/20' };
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { color: 'text-red-600', label: `Expiré (${Math.abs(days)}j)`, bg: 'bg-red-50 dark:bg-red-900/20' };
  if (days < 30) return { color: 'text-orange-500', label: `Expire dans ${days}j`, bg: 'bg-orange-50 dark:bg-orange-900/20' };
  return { color: 'text-emerald-600', label: `Valide (${days}j)`, bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
}

function calculerDateExpiration(type: string): string {
  const duree = DUREE_PAR_TYPE[type];
  if (!duree) return '';
  const d = new Date();
  d.setMonth(d.getMonth() + duree.mois);
  return d.toISOString().split('T')[0];
}

const ANOMALIE_STATUT_LABELS: Record<string, string> = {
  DETECTEE: "Détectée", EN_REPARATION: "En réparation", REPAREE: "Réparée",
  NON_REPAREE: "Non réparable", VALIDEE: "Validée", ANNULEE: "Annulée"
};

const ANOMALIE_STATUT_COLORS: Record<string, "danger" | "warning" | "success" | "secondary" | "en-cours"> = {
  DETECTEE: "danger", EN_REPARATION: "warning", REPAREE: "en-cours",
  NON_REPAREE: "secondary", VALIDEE: "success", ANNULEE: "secondary"
};

const fmtDate = (d: any): string => {
  if (!d) return "-";
  if (typeof d === "string") return d.substring(0, 16).replace("T", " ");
  if (Array.isArray(d)) {
    const [y, mo, da, h, mi] = d;
    return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
  }
  return String(d);
};

const toDateStr = (d: any): string => {
  if (!d) return "";
  if (typeof d === "string") return d.substring(0, 10);
  if (Array.isArray(d)) {
    const [y, mo, da] = d;
    return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
  }
  return String(d);
};

export default function RSModule() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [anomalieStats, setAnomalieStats] = useState<any>({});
  const [vehicleStats, setVehicleStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("ALL");
  const [filterCategorie, setFilterCategorie] = useState("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [expandedAnomalie, setExpandedAnomalie] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [activeTab, setActiveTab] = useState<"anomalies" | "declarations" | "documents">("anomalies");
  const [selectedV, setSelectedV] = useState<any>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ type: 'ASSURANCE', numeroDocument: '', proprietaire: '', dateExpiration: '' });
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const showToast = (m: string, t: "success" | "error" | "info" | "warning") => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 4000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, vRes, asRes, vsRes, dRes] = await Promise.all([
        axios.get<any>(ANOMALIE_API), axios.get<any>(VEHICLE_API),
        axios.get<any>(`${ANOMALIE_API}/stats`), axios.get<any>(`${VEHICLE_API}/stats`),
        axios.get<any>(DOCUMENTS_API)
      ]);
      setAnomalies(aRes.data.anomalies || aRes.data || []);
      setVehicles(vRes.data.vehicles || vRes.data || []);
      setAnomalieStats(asRes.data.stats || {});
      setVehicleStats(vsRes.data.stats || {});
      const docsData = Array.isArray(dRes.data) ? dRes.data : [];
      setDocuments(docsData);
      console.log("Documents chargés:", docsData);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      showToast("Erreur chargement données", "error");
    }
    finally { setLoading(false); }
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
      await axios.post(DOCUMENTS_API, {
        vehiculeId: selectedV.id,
        vehiculeImmatriculation: selectedV.immatriculation,
        typeDocument: importForm.type,
        numeroDocument: importForm.numeroDocument || null,
        dateExpiration: importForm.dateExpiration || null,
        importePar: 'RS',
      });
      setImportMsg('Document importé avec succès');
      fetchAll();
      setTimeout(() => setShowImport(false), 1500);
    } catch {
      setImportMsg('Erreur lors de l\'import');
    }
  };

  const getDocsForVehicule = (imm: string) => {
    return documents.filter((d: any) => d.vehiculeImmatriculation === imm);
  };

  const getDoc = (imm: string, type: string) => {
    return documents.find((d: any) => d.vehiculeImmatriculation === imm && d.typeDocument === type);
  };

  const prendreEnCharge = async (id: number) => {
    try { await axios.put(`${ANOMALIE_API}/${id}/prendre-en-charge`, { assignedTo: "RS-COURANT" }); showToast("Anomalie prise en charge", "success"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const signalerRepare = async (id: number) => {
    try { await axios.put(`${ANOMALIE_API}/${id}/reparer`, { reparePar: "TECHNICIEN", resolutionNotes: "Réparation effectuée" }); showToast("Marqué comme réparé", "success"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const signalerNonRepare = async (id: number) => {
    try { await axios.put(`${ANOMALIE_API}/${id}/non-repare`, { resolutionNotes: "Pièce non disponible" }); showToast("Marqué non réparable", "warning"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const validerReparation = async (id: number) => {
    try { await axios.put(`${ANOMALIE_API}/${id}/valider`, { validePar: "RS-COURANT" }); showToast("Réparation validée (SANS vérification budget)", "success"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const annulerAnomalie = async (id: number) => {
    try { await axios.put(`${ANOMALIE_API}/${id}/annuler`, { reason: "Faux signal" }); showToast("Anomalie annulée", "info"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const unblockVehicle = async (vehicleId: number) => {
    try { await axios.put(`${VEHICLE_API}/${vehicleId}/statut`, { statut: "DISPONIBLE" }); showToast("Véhicule débloqué", "success"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const filteredAnomalies = anomalies.filter((a: any) => {
    if (filterStatut !== "ALL" && a.statut !== filterStatut) return false;
    if (filterCategorie !== "ALL" && a.categorie !== filterCategorie) return false;
    if (filterDateFrom && a.dateDetection && toDateStr(a.dateDetection) < filterDateFrom) return false;
    if (filterDateTo && a.dateDetection && toDateStr(a.dateDetection) > filterDateTo) return false;
    if (search) {
      const s = search.toLowerCase();
      return (a.description || "").toLowerCase().includes(s) || (a.vehiculeImmatriculation || "").toLowerCase().includes(s) ||
        (a.chauffeurNom || "").toLowerCase().includes(s) || (a.anomalieCode || "").toLowerCase().includes(s) || (a.element || "").toLowerCase().includes(s);
    }
    return true;
  });

  const blockedVehicles = vehicles.filter((v: any) => v.statut === "BLOQUE");

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-danone-blue focus:border-transparent";

  const navItems = [
    { id: 'anomalies', label: 'Anomalies Checkup', icon: <AlertTriangle className="w-5 h-5" />, active: activeTab === 'anomalies', onClick: () => setActiveTab('anomalies') },
    { id: 'declarations', label: 'Déclarations', icon: <FileText className="w-5 h-5" />, active: activeTab === 'declarations', onClick: () => setActiveTab('declarations') },
    { id: 'documents', label: 'Documents', icon: <Shield className="w-5 h-5" />, active: activeTab === 'documents', onClick: () => setActiveTab('documents') },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Responsable Support" currentUser={{ name: "RS", role: "RS" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: "Détectées", value: anomalieStats.detectees || 0, icon: <AlertTriangle className="w-4 h-4" />, color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
          { label: "En réparation", value: anomalieStats.enReparation || 0, icon: <Wrench className="w-4 h-4" />, color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
          { label: "Réparées", value: anomalieStats.reparees || 0, icon: <CheckCircle className="w-4 h-4" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Validées", value: anomalieStats.validees || 0, icon: <ShieldCheck className="w-4 h-4" />, color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
          { label: "Non répar.", value: anomalieStats.nonReparees || 0, icon: <XCircle className="w-4 h-4" />, color: "bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400" },
          { label: "Véhicules bloqués", value: blockedVehicles.length, icon: <Truck className="w-4 h-4" />, color: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
          { label: "Taux réparation", value: anomalieStats.tauxReparation || "0%", icon: <Clock className="w-4 h-4" />, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-3 flex items-center gap-2`}>
            {s.icon}
            <div><div className="text-xl font-bold">{s.value}</div><div className="text-[10px] opacity-80">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-dark-border">
        <button onClick={() => setActiveTab("anomalies")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "anomalies" ? "border-red-500 text-red-600" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-600"}`}>
          <AlertTriangle className="w-4 h-4 inline mr-1" /> Anomalies Checkup
        </button>
        <button onClick={() => setActiveTab("declarations")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "declarations" ? "border-danone-blue text-danone-blue" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-600"}`}>
          <FileText className="w-4 h-4 inline mr-1" /> Déclarations
        </button>
        <button onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "documents" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-600"}`}>
          <Shield className="w-4 h-4 inline mr-1" /> Documents
        </button>
        <span className="ml-2 px-2 py-1 text-[10px] rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Anomalies = SANS budget
        </span>
        <span className="px-2 py-1 text-[10px] rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Déclarations = AVEC budget
        </span>
      </div>

      {activeTab === "anomalies" && (
        <div className="space-y-6">
          {/* Blocked vehicles */}
          {blockedVehicles.length > 0 && (
            <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-red-200 dark:border-red-900/50 p-5">
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Véhicules Bloqués ({blockedVehicles.length})
              </h3>
              <div className="space-y-2">
                {blockedVehicles.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-sm">{v.truckNumber || v.immatriculation}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{v.immatriculation}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">– {v.chauffeurNom || "N/A"}</span>
                    </div>
                    <button onClick={() => unblockVehicle(v.id)} className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">Débloquer</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters + historical search */}
          <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Anomalies Checkup
            </h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par immat, chauffeur, élément..."
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-border text-slate-700 dark:text-white" />
              </div>
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-border text-slate-700 dark:text-white">
                <option value="ALL">Tous statuts</option>
                <option value="DETECTEE">Détectée</option>
                <option value="EN_REPARATION">En réparation</option>
                <option value="REPAREE">Réparée</option>
                <option value="NON_REPAREE">Non réparable</option>
                <option value="VALIDEE">Validée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
              <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-border text-slate-700 dark:text-white">
                <option value="ALL">Toutes catégories</option>
                <option value="MECANIQUE">Mécanique</option>
                <option value="PNEUS">Pneus</option>
                <option value="CARROSSERIE">Carrosserie</option>
                <option value="ECLAIRAGE">Éclairage</option>
                <option value="CABINE">Cabine</option>
                <option value="FREINS">Freins</option>
                <option value="SECURITE">Sécurité</option>
              </select>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-border text-slate-700 dark:text-white" title="Date début" />
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-border text-slate-700 dark:text-white" title="Date fin" />
              <button onClick={fetchAll} className="p-2 rounded-lg bg-slate-100 dark:bg-dark-border hover:bg-slate-200"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
            </div>

            <div className="space-y-2">
              {loading ? <div className="text-center py-8 text-slate-600 dark:text-slate-400 text-sm">Chargement...</div> :
              filteredAnomalies.length === 0 ? <div className="text-center py-8 text-slate-600 dark:text-slate-400 text-sm">Aucune anomalie trouvée</div> :
              filteredAnomalies.map((a: any) => (
                <div key={a.id} className="border border-slate-100 dark:border-dark-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-dark-border/50 cursor-pointer" onClick={() => setExpandedAnomalie(expandedAnomalie === a.id ? null : a.id)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant={ANOMALIE_STATUT_COLORS[a.statut] || "default"}>{ANOMALIE_STATUT_LABELS[a.statut] || a.statut}</Badge>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{a.anomalieCode}</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-white truncate">{a.element} – {a.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">{fmtDate(a.dateDetection)}</span>
                      {expandedAnomalie === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {expandedAnomalie === a.id && (
                    <div className="px-4 py-3 bg-slate-50 dark:bg-dark-border/30 border-t border-slate-100 dark:border-dark-border">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                        <div><span className="text-slate-600 dark:text-slate-400">Camion:</span> <span className="font-medium">{a.vehiculeImmatriculation}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Chauffeur:</span> <span className="font-medium">{a.chauffeurNom || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Catégorie:</span> <span className="font-medium">{a.categorie}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Criticité:</span> <span className="font-medium">{a.criticite}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Source:</span> <span className="font-medium">{a.source}</span></div>
<div><span className="text-slate-600 dark:text-slate-400">Détectée:</span> <span className="font-medium">{fmtDate(a.dateDetection)}</span></div>
                         <div><span className="text-slate-600 dark:text-slate-400">Assigné:</span> <span className="font-medium">{a.assignedTo || "Non assigné"}</span></div>
                         {a.datePriseEnCharge && <div><span className="text-slate-600 dark:text-slate-400">Pris en charge:</span> <span className="font-medium">{fmtDate(a.datePriseEnCharge)}</span></div>}
                        {a.reparePar && <div><span className="text-slate-600 dark:text-slate-400">Réparé par:</span> <span className="font-medium">{a.reparePar}</span></div>}
                        {a.validePar && <div><span className="text-slate-600 dark:text-slate-400">Validé par:</span> <span className="font-medium">{a.validePar}</span></div>}
                      </div>
                      {a.observation && <div className="text-xs text-slate-500 mb-2">Observation: {a.observation}</div>}
                      {a.resolutionNotes && <div className="text-xs text-slate-500 mb-2">Résolution: {a.resolutionNotes}</div>}

                      <div className="bg-slate-100 dark:bg-dark-border/50 rounded p-2 mb-2">
                        <span className="text-[10px] font-semibold text-red-500">⚠ SANS vérification budget – validation directe RS</span>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {a.statut === "DETECTEE" && <>
                          <button onClick={() => prendreEnCharge(a.id)} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 flex items-center gap-1"><Wrench className="w-3 h-3" /> Prendre en charge</button>
                          <button onClick={() => annulerAnomalie(a.id)} className="px-3 py-1.5 rounded-lg bg-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Annuler</button>
                        </>}
                        {a.statut === "EN_REPARATION" && <>
                          <button onClick={() => signalerRepare(a.id)} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Réparé</button>
                          <button onClick={() => signalerNonRepare(a.id)} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Non réparable</button>
                        </>}
                        {a.statut === "REPAREE" && <button onClick={() => validerReparation(a.id)} className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Valider (RS)</button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "declarations" && (
        <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="w-5 h-5 text-danone-blue" />
            <h3 className="font-bold text-slate-700 dark:text-white">Déclarations d'incidents</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">Les déclarations sont gérées dans le module Déclarations existant (Prestataire → RS → Budget).</p>
        </div>
      )}

      {activeTab === "documents" && (
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
                {vehicles.filter(v =>
                  !vehicleSearch || v.immatriculation?.toLowerCase().includes(vehicleSearch.toLowerCase())
                ).slice(0, 20).map(v => {
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
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                {!showImport ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {DOC_TYPES.map(dt => {
                        const doc = getDoc(selectedV.immatriculation, dt.key);
                        const status = getStatusColor(doc?.dateExpiration || null);
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
      )}
    </DashboardLayout>
  );
}
