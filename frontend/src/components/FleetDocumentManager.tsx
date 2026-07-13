import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Search, CheckCircle, AlertCircle, Clock,
  Truck, Calendar, User, X, RefreshCw, Shield, FileCheck, Car,
  Plus, Trash2, Eye, Download, History, Filter, ChevronDown,
  ChevronUp, AlertTriangle, ShieldCheck, XCircle, Ban, Save,
  Edit3, Paperclip, MessageSquare, BarChart3, Percent, List,
  LayoutDashboard, BellRing, ExternalLink, ChevronLeft, ChevronRight
} from "lucide-react";

// Use empty base so requests go through CRA proxy to localhost:8080
const API = "";
const DOC_API = `/api/documents-vehicule`;
const REG_API = `/api/documents-reglementaires`;
const VEH_API = `/api/vehicles`;
const UPLOAD_API = `/uploads`;

const DOC_TYPES = [
  { value: "ASSURANCE", label: "Assurance", icon: "Shield", defaultMonths: 12, obligatoire: true },
  { value: "CARTE_GRISE", label: "Carte Grise", icon: "FileText", defaultMonths: 120, obligatoire: true },
  { value: "VISITE_TECHNIQUE", label: "Visite Technique", icon: "Car", defaultMonths: 12, obligatoire: true },
  { value: "VIGNETTE", label: "Vignette", icon: "FileCheck", defaultMonths: 12, obligatoire: false },
  { value: "AUTORISATION", label: "Autorisation", icon: "FileText", defaultMonths: 6, obligatoire: false },
  { value: "CONTROLE_TACHYGRAPHE", label: "Contrôle Tachygraphe", icon: "Clock", defaultMonths: 24, obligatoire: true },
  { value: "ONSSA", label: "ONSSA", icon: "ShieldCheck", defaultMonths: 24, obligatoire: true },
  { value: "METROLOGIQUE", label: "Métrologique", icon: "BarChart3", defaultMonths: 12, obligatoire: false },
];
const OBLIGATOIRE_TYPES = DOC_TYPES.filter(d => d.obligatoire).map(d => d.value);

const DOC_ICONS: Record<string, React.ReactNode> = {
  ASSURANCE: <Shield className="w-4 h-4 text-blue-500" />,
  CARTE_GRISE: <FileText className="w-4 h-4 text-green-500" />,
  VISITE_TECHNIQUE: <Car className="w-4 h-4 text-amber-500" />,
  VIGNETTE: <FileCheck className="w-4 h-4 text-purple-500" />,
  AUTORISATION: <FileText className="w-4 h-4 text-cyan-500" />,
  CONTROLE_TACHYGRAPHE: <Clock className="w-4 h-4 text-orange-500" />,
  ONSSA: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
  METROLOGIQUE: <BarChart3 className="w-4 h-4 text-pink-500" />,
};

type TypeDocument = typeof DOC_TYPES[number]["value"];

type StatutDocument = "VALIDE" | "EXPIRE_BIENTOT" | "EXPIRE" | "MANQUANT";

interface PieceJointe {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface DocHistory {
  action: string;
  userName: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

interface VehicleDocument {
  id?: number;
  vehiculeId: number;
  vehiculeImmatriculation: string;
  typeDocument: TypeDocument;
  numeroDocument: string;
  dateEmission: string;
  dureeValiditeMois: number;
  dateExpiration: string;
  statut: StatutDocument;
  joursRestants: number;
  piecesJointes: PieceJointe[];
  notes: string;
  importePar: string;
  responsableNom: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  historique: DocHistory[];
}

interface VehiculeDocStats {
  valides: number;
  expireBientot: number;
  expires: number;
  manquants: number;
  total: number;
  conformite: number;
}

function toDate(v: any): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (Array.isArray(v)) {
    const [y, m, d, h = 0, mi = 0] = v.map(Number);
    return new Date(y, m - 1, d, h, mi);
  }
  const dt = new Date(v);
  return isNaN(dt.getTime()) ? null : dt;
}

function calculateStatus(dateExpiration: any): { statut: StatutDocument; joursRestants: number } {
  if (!dateExpiration) return { statut: "MANQUANT", joursRestants: 0 };
  const exp = toDate(dateExpiration);
  if (!exp) return { statut: "MANQUANT", joursRestants: 0 };
  const now = new Date();
  const diff = exp.getTime() - now.getTime();
  const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (jours < 0) return { statut: "EXPIRE", joursRestants: jours };
  if (jours <= 30) return { statut: "EXPIRE_BIENTOT", joursRestants: jours };
  return { statut: "VALIDE", joursRestants: jours };
}

function calculateExpiry(dateEmission: any, annees: number, mois: number, jours: number): string {
  if (!dateEmission) return "";
  const d = toDate(dateEmission);
  if (!d) return "";
  d.setFullYear(d.getFullYear() + annees);
  d.setMonth(d.getMonth() + mois);
  d.setDate(d.getDate() + jours);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: any): string {
  const d = toDate(dateStr);
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: any): string {
  const d = toDate(dateStr);
  if (!d) return "—";
  return d.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getTypeLabel(type: string): string {
  return DOC_TYPES.find(d => d.value === type)?.label || type;
}

const statusConfig: Record<StatutDocument, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  VALIDE: { label: "Valide", color: "text-green-700", bg: "bg-green-100", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  EXPIRE_BIENTOT: { label: "Expire bientôt", color: "text-amber-700", bg: "bg-amber-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  EXPIRE: { label: "Expiré", color: "text-red-700", bg: "bg-red-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  MANQUANT: { label: "Manquant", color: "text-slate-700", bg: "bg-slate-200", icon: <Ban className="w-3.5 h-3.5" /> },
};

const NOTIFICATION_DELAYS = [30, 15, 7, 1, 0];

export default function FleetDocumentManager() {
  const [currentUser, setCurrentUser] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"dashboard" | "documents" | "notifications">("dashboard");
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterVehicle, setFilterVehicle] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState<VehicleDocument | null>(null);
  const [showDetail, setShowDetail] = useState<VehicleDocument | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [notifDocs, setNotifDocs] = useState<{ doc: VehicleDocument; joursRestants: number }[]>([]);
  const [blockedVehicles, setBlockedVehicles] = useState<any[]>([]);

  const [form, setForm] = useState({
    vehiculeId: 0,
    vehiculeImmatriculation: "",
    typeDocument: "ASSURANCE" as TypeDocument,
    numeroDocument: "",
    dateEmission: "",
    dureeAnnees: 1,
    dureeMois: 0,
    dureeJours: 0,
    notes: "",
    fichiers: [] as File[],
  });

  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
      setCurrentUser(u);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(VEH_API),
      axios.get(DOC_API),
    ]).then(([vehRes, docRes]) => {
      const vehData: any = vehRes.data;
      const vehList: any[] = Array.isArray(vehData) ? vehData : (vehData?.vehicles || []);
      setVehicules(vehList);
      const rawDocs: any = (docRes as any).data;
      const docsList: any[] = Array.isArray(rawDocs) ? rawDocs : (rawDocs?.documents || []);
      const docs = docsList.map((d: any) => enrichDoc(d));
      setDocuments(docs);
      setLoading(false);
      checkNotifications(docs);
      checkBlockedVehicles(docs, vehList);
    }).catch((err) => {
      console.error("FleetDocumentManager: Erreur chargement", err);
      setLoading(false);
    });
  }, []);

  function enrichDoc(d: any): VehicleDocument {
    const { statut, joursRestants } = calculateStatus(d.dateExpiration);
    return {
      ...d,
      statut: d.estDisponible === false ? "MANQUANT" : statut,
      joursRestants: d.estDisponible === false ? 0 : joursRestants,
      piecesJointes: d.piecesJointes || (d.fichierUrl ? [{ name: d.fichierUrl, url: d.fichierUrl, type: "", uploadedAt: d.createdAt || "" }] : []),
      historique: d.historique || [],
      notes: d.notes || "",
      responsableNom: d.importePar || d.responsableNom || "",
      createdAt: d.createdAt || d.dateImport || "",
      updatedAt: d.updatedAt || "",
    };
  }

  function checkNotifications(docs: VehicleDocument[]) {
    const all = docs
      .filter(d => d.statut !== "MANQUANT" && d.dateExpiration)
      .map(d => ({
        doc: d,
        joursRestants: calculateStatus(d.dateExpiration).joursRestants,
      }))
      .filter(d => d.joursRestants <= 30);
    setNotifDocs(all);
  }

  function checkBlockedVehicles(docs: VehicleDocument[], vehs: any[]) {
    const blocked: any[] = [];
    for (const v of vehs) {
      const vDocs = docs.filter(d => d.vehiculeId === v.id);
      for (const reqType of OBLIGATOIRE_TYPES) {
        const doc = vDocs.find(d => d.typeDocument === reqType);
        if (!doc || doc.statut === "MANQUANT" || doc.statut === "EXPIRE") {
          blocked.push({
            vehiculeId: v.id,
            immatriculation: v.immatriculation || v.truckNumber,
            typeManquant: getTypeLabel(reqType),
            statut: !doc ? "MANQUANT" : doc.statut,
          });
          break;
        }
      }
    }
    setBlockedVehicles(blocked);
  }

  const docStats = useMemo((): VehiculeDocStats & { vehiculeConformite: { immatriculation: string; conformite: number; total: number; valides: number }[] } => {
    const valides = documents.filter(d => d.statut === "VALIDE").length;
    const expireBientot = documents.filter(d => d.statut === "EXPIRE_BIENTOT").length;
    const expires = documents.filter(d => d.statut === "EXPIRE").length;
    const manquants = documents.filter(d => d.statut === "MANQUANT").length;

    const vehiculeConformite = vehicules.map(v => {
      const vDocs = documents.filter(d => d.vehiculeId === v.id);
      const obligatoires = OBLIGATOIRE_TYPES.map(t => {
        const doc = vDocs.find(d => d.typeDocument === t);
        return doc && (doc.statut === "VALIDE" || doc.statut === "EXPIRE_BIENTOT");
      });
      const validesCount = obligatoires.filter(Boolean).length;
      return {
        immatriculation: v.immatriculation || v.truckNumber || "",
        total: OBLIGATOIRE_TYPES.length,
        valides: validesCount,
        conformite: OBLIGATOIRE_TYPES.length > 0 ? Math.round((validesCount / OBLIGATOIRE_TYPES.length) * 100) : 100,
      };
    });

    return { valides, expireBientot, expires, manquants, total: documents.length, conformite: 0, vehiculeConformite };
  }, [documents, vehicules]);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      if (search && !d.vehiculeImmatriculation?.toLowerCase().includes(search.toLowerCase()) && !d.numeroDocument?.toLowerCase().includes(search.toLowerCase()) && !getTypeLabel(d.typeDocument).toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && d.typeDocument !== filterType) return false;
      if (filterStatus && d.statut !== filterStatus) return false;
      if (filterVehicle && d.vehiculeImmatriculation !== filterVehicle) return false;
      return true;
    });
  }, [documents, search, filterType, filterStatus, filterVehicle]);

  function validateForm(): boolean {
    if (!form.vehiculeId) { showToast("Sélectionnez un véhicule", "error"); return false; }
    if (!form.typeDocument) { showToast("Sélectionnez un type de document", "error"); return false; }
    if (!form.numeroDocument.trim()) { showToast("Entrez le numéro du document", "error"); return false; }
    if (!form.dateEmission) { showToast("Sélectionnez la date d'émission", "error"); return false; }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const totalMois = form.dureeAnnees * 12 + form.dureeMois;
    const payload = {
      vehiculeId: form.vehiculeId,
      vehiculeImmatriculation: form.vehiculeImmatriculation,
      typeDocument: form.typeDocument,
      numeroDocument: form.numeroDocument,
      dateEmission: form.dateEmission,
      dureeValiditeMois: totalMois,
      dureeJours: form.dureeJours,
      dateExpiration: expiryDate,
      notes: form.notes,
      importePar: currentUser?.username || currentUser?.name || "Admin",
    };

    try {
      if (form.fichiers.length > 0) {
        const formData = new FormData();
        form.fichiers.forEach(f => formData.append("files", f));
        formData.append("document", JSON.stringify(payload));
        await axios.post(`${DOC_API}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        if (editDoc?.id) {
          await axios.put(`${DOC_API}/${editDoc.id}`, payload);
        } else {
          await axios.post(`${DOC_API}`, payload);
        }
      }
      showToast(editDoc ? "Document mis à jour" : "Document ajouté avec succès", "success");
      refreshDocuments();
      resetForm();
    } catch {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  }

  async function handleDelete(docId: number) {
    if (!window.confirm("Archiver ce document définitivement ?")) return;
    try {
      await axios.put(`${DOC_API}/${docId}/archive`, { archivedBy: currentUser?.username || "Admin" });
      showToast("Document archivé", "success");
      refreshDocuments();
    } catch {
      showToast("Erreur lors de l'archivage", "error");
    }
  }

  function refreshDocuments() {
    axios.get(DOC_API).then(res => {
      const rawDocs: any = res.data;
      const docsList: any[] = Array.isArray(rawDocs) ? rawDocs : (rawDocs?.documents || []);
      const docs = docsList.map((d: any) => enrichDoc(d));
      setDocuments(docs);
      checkNotifications(docs);
      checkBlockedVehicles(docs, vehicules);
    }).catch(() => {});
  }

  function resetForm() {
    setForm({ vehiculeId: 0, vehiculeImmatriculation: "", typeDocument: "ASSURANCE", numeroDocument: "", dateEmission: "", dureeAnnees: 1, dureeMois: 0, dureeJours: 0, notes: "", fichiers: [] });
    setExpiryDate("");
    setEditDoc(null);
    setShowForm(false);
  }

  function openEdit(doc: VehicleDocument) {
    setEditDoc(doc);
    const em = toDate(doc.dateEmission);
    const ex = toDate(doc.dateExpiration);
    let yrs = 1, mos = 0, dys = 0;
    if (em && ex) {
      let totalM = (ex.getFullYear() - em.getFullYear()) * 12 + (ex.getMonth() - em.getMonth());
      if (ex.getDate() < em.getDate()) totalM -= 1;
      if (totalM < 1) totalM = DOC_TYPES.find(dt => dt.value === doc.typeDocument)?.defaultMonths || 12;
      yrs = Math.floor(totalM / 12);
      mos = totalM % 12;
      const temp = new Date(em);
      temp.setFullYear(temp.getFullYear() + yrs);
      temp.setMonth(temp.getMonth() + mos);
      temp.setDate(em.getDate());
      dys = Math.round((ex.getTime() - temp.getTime()) / (1000 * 86400));
      if (dys < 0) dys = 0;
    }
    setForm({
      vehiculeId: doc.vehiculeId,
      vehiculeImmatriculation: doc.vehiculeImmatriculation,
      typeDocument: doc.typeDocument,
      numeroDocument: doc.numeroDocument,
      dateEmission: doc.dateEmission ? doc.dateEmission.split("T")[0] : "",
      dureeAnnees: yrs,
      dureeMois: mos,
      dureeJours: dys,
      notes: doc.notes || "",
      fichiers: [],
    });
    setExpiryDate(doc.dateExpiration ? doc.dateExpiration.split("T")[0] : "");
    setShowForm(true);
  }

  function showToast(message: string, type: "success" | "error" | "warning" | "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleTypeChange(type: TypeDocument) {
    const dt = DOC_TYPES.find(d => d.value === type);
    const months = dt?.defaultMonths || 12;
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    setForm(f => ({ ...f, typeDocument: type, dureeAnnees: yrs, dureeMois: mos, dureeJours: 0 }));
    if (form.dateEmission) {
      setExpiryDate(calculateExpiry(form.dateEmission, yrs, mos, 0));
    }
  }

  function handleEmissionChange(date: string) {
    setForm(f => ({ ...f, dateEmission: date }));
    if (date) {
      setExpiryDate(calculateExpiry(date, form.dureeAnnees, form.dureeMois, form.dureeJours));
    } else {
      setExpiryDate("");
    }
  }

  function handleDurationChange(annees: number, mois: number, jours: number) {
    setForm(f => ({ ...f, dureeAnnees: annees, dureeMois: mois, dureeJours: jours }));
    if (form.dateEmission) {
      setExpiryDate(calculateExpiry(form.dateEmission, annees, mois, jours));
    }
  }

  function handleVehicleSelect(vehiculeId: number) {
    const v = vehicules.find(v => v.id === vehiculeId);
    setForm(f => ({ ...f, vehiculeId, vehiculeImmatriculation: v?.immatriculation || v?.truckNumber || "" }));
  }

  function removeFile(index: number) {
    setForm(f => ({ ...f, fichiers: f.fichiers.filter((_, i) => i !== index) }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-danone-blue mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-sm font-semibold flex items-center gap-3 border ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
          toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
          toast.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
          "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> :
           toast.type === "error" ? <AlertCircle className="w-5 h-5" /> :
           toast.type === "warning" ? <AlertTriangle className="w-5 h-5" /> :
           <BellRing className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-danone-blue to-danone-blue-dark flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Documents Véhicules</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Suivi, conformité et alertes documentaires</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshDocuments} className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-border/50 hover:bg-slate-200 dark:hover:bg-dark-border transition-colors" title="Rafraîchir">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={() => { resetForm(); setEditDoc(null); setShowForm(true); }}
            className="px-4 py-2.5 bg-gradient-to-r from-danone-blue to-danone-blue-dark text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau Document
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-dark-border/30 p-1 rounded-xl w-fit">
        {[
          { id: "dashboard" as const, label: "Tableau de bord", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "documents" as const, label: "Documents", icon: <List className="w-4 h-4" /> },
          { id: "notifications" as const, label: "Notifications", icon: <BellRing className="w-4 h-4" />, badge: notifDocs.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-white dark:bg-dark-surface shadow-sm text-danone-blue dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-white"
            }`}>
            {tab.icon} {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-700/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-500"><CheckCircle className="w-5 h-5" /></span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Valides</span>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{docStats.valides}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-700/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-500"><Clock className="w-5 h-5" /></span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Expire bientôt</span>
                </div>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{docStats.expireBientot}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-700/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-500"><AlertCircle className="w-5 h-5" /></span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Expirés</span>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{docStats.expires}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/10 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500"><Ban className="w-5 h-5" /></span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Manquants</span>
                </div>
                <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">{docStats.manquants}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-700/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-500"><FileText className="w-5 h-5" /></span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Total</span>
                </div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{docStats.total}</p>
              </div>
            </div>

            {/* Blocked Vehicles Alert */}
            {blockedVehicles.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ban className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-red-700 dark:text-red-400">{blockedVehicles.length} véhicule(s) non conforme(s)</h3>
                </div>
                <div className="grid gap-2">
                  {blockedVehicles.map((bv, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-dark-surface/50 rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-red-400" />
                        <span className="font-semibold text-red-700 dark:text-red-300">{bv.immatriculation}</span>
                        <span className="text-red-600 dark:text-red-400">— {bv.typeManquant} : {bv.statut === "MANQUANT" ? "Document manquant" : "Document expiré"}</span>
                      </div>
                      <Ban className="w-4 h-4 text-red-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance by Vehicle */}
            <div className="bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-dark-border p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-danone-blue" /> Conformité par véhicule
              </h3>
              <div className="space-y-3">
                {docStats.vehiculeConformite.filter(v => v.immatriculation).map(v => (
                  <div key={v.immatriculation} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-48 shrink-0">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-white">{v.immatriculation}</span>
                    </div>
                    <div className="flex-1 bg-slate-100 dark:bg-dark-border rounded-full h-3 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${v.conformite}%` }} transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${v.conformite === 100 ? "bg-green-500" : v.conformite >= 50 ? "bg-amber-500" : "bg-red-500"}`} />
                    </div>
                    <span className={`text-sm font-bold w-16 text-right ${v.conformite === 100 ? "text-green-600" : v.conformite >= 50 ? "text-amber-600" : "text-red-600"}`}>{v.conformite}%</span>
                    <span className="text-xs text-slate-500 w-24 text-right">{v.valides}/{v.total} documents</span>
                  </div>
                ))}
                {docStats.vehiculeConformite.filter(v => v.immatriculation).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Aucun véhicule</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-dark-border p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par immatriculation, n° document, type..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none">
                  <option value="">Tous les types</option>
                  {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none">
                  <option value="">Tous les statuts</option>
                  <option value="VALIDE">Valide</option>
                  <option value="EXPIRE_BIENTOT">Expire bientôt</option>
                  <option value="EXPIRE">Expiré</option>
                  <option value="MANQUANT">Manquant</option>
                </select>
                <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none">
                  <option value="">Tous les véhicules</option>
                  {vehicules.map((v: any) => <option key={v.id} value={v.immatriculation || v.truckNumber}>{v.immatriculation || v.truckNumber}</option>)}
                </select>
              </div>
            </div>

            {/* Document Table */}
            <div className="bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-border/50 border-b border-slate-200 dark:border-dark-border">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Véhicule</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">N° Document</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Émission</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Expiration</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Jours rest.</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Statut</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {filteredDocs.map(doc => {
                      const cfg = statusConfig[doc.statut];
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-slate-700 dark:text-white">{doc.vehiculeImmatriculation}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {DOC_ICONS[doc.typeDocument]}
                              <span className="text-slate-700 dark:text-white">{getTypeLabel(doc.typeDocument)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{doc.numeroDocument || "—"}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{formatDate(doc.dateEmission)}</td>
                          <td className={`px-4 py-3 text-xs font-medium ${doc.statut === "EXPIRE" ? "text-red-600" : doc.statut === "EXPIRE_BIENTOT" ? "text-amber-600" : "text-slate-600 dark:text-slate-300"}`}>
                            {formatDate(doc.dateExpiration)}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {doc.statut !== "MANQUANT" ? (
                              <span className={`font-bold ${doc.joursRestants <= 0 ? "text-red-600" : doc.joursRestants <= 30 ? "text-amber-600" : "text-green-600"}`}>
                                {doc.joursRestants > 0 ? `${doc.joursRestants}j` : "Expiré"}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setShowDetail(doc)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border/50 text-slate-400 hover:text-danone-blue transition-colors" title="Voir détails">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEdit(doc)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border/50 text-slate-400 hover:text-amber-500 transition-colors" title="Modifier">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {doc.id && (
                                <button onClick={() => handleDelete(doc.id!)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border/50 text-slate-400 hover:text-red-500 transition-colors" title="Archiver">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun document trouvé</p>
                          <p className="text-xs text-slate-400 mt-1">Ajoutez un nouveau document ou modifiez vos filtres</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-slate-50 dark:bg-dark-border/30 border-t border-slate-200 dark:border-dark-border text-xs text-slate-500">
                {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""} sur {documents.length} total
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-dark-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-danone-blue" /> Alertes d'expiration
                </h3>
                <span className="text-xs text-slate-500">{notifDocs.length} document(s) nécessitent attention</span>
              </div>

              {/* Expired documents section */}
              {(() => {
                const expired = notifDocs.filter(n => n.joursRestants < 0);
                if (expired.length === 0) return null;
                return (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" /> Documents expirés — Action requise : Recréer
                      <span className="text-xs font-normal text-slate-400 ml-2">({expired.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {expired.map(n => (
                        <div key={n.doc.id} className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 rounded-xl px-4 py-2.5 border border-red-200 dark:border-red-700/50">
                          <div className="flex items-center gap-3">
                            {DOC_ICONS[n.doc.typeDocument]}
                            <div>
                              <span className="font-semibold text-sm text-red-700 dark:text-red-300">{getTypeLabel(n.doc.typeDocument)}</span>
                              <span className="text-xs text-red-500 ml-2">— {n.doc.vehiculeImmatriculation}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-red-500">Expiré depuis le {formatDate(n.doc.dateExpiration)}</span>
                            <span className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full">Re-créer</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Today & upcoming */}
              {NOTIFICATION_DELAYS.map(delay => {
                const items = notifDocs.filter(n => {
                  if (delay === 0) return n.joursRestants === 0;
                  if (delay === 1) return n.joursRestants === 1;
                  if (delay === 7) return n.joursRestants > 1 && n.joursRestants <= 7;
                  if (delay === 15) return n.joursRestants > 7 && n.joursRestants <= 15;
                  return n.joursRestants > 15;
                });
                if (items.length === 0) return null;
                return (
                  <div key={delay} className="mb-4 last:mb-0">
                    <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                      delay === 0 ? "text-red-600" : delay <= 7 ? "text-amber-600" : "text-slate-600"
                    }`}>
                      {delay === 0 ? <AlertCircle className="w-4 h-4" /> :
                       delay <= 7 ? <AlertTriangle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                      {delay === 0 ? "Expire aujourd'hui" :
                       delay === 1 ? "Expire demain" :
                       `Expire dans ${delay} jours`}
                      <span className="text-xs font-normal text-slate-400 ml-2">({items.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {items.map(n => (
                        <div key={n.doc.id} className="flex items-center justify-between bg-slate-50 dark:bg-dark-border/30 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-dark-border/50">
                          <div className="flex items-center gap-3">
                            {DOC_ICONS[n.doc.typeDocument]}
                            <div>
                              <span className="font-semibold text-sm text-slate-700 dark:text-white">{getTypeLabel(n.doc.typeDocument)}</span>
                              <span className="text-xs text-slate-500 ml-2">— {n.doc.vehiculeImmatriculation}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">Expire le {formatDate(n.doc.dateExpiration)}</span>
                            <span className={`text-xs font-bold ${n.joursRestants <= 0 ? "text-red-600" : n.joursRestants <= 7 ? "text-amber-600" : "text-slate-600"}`}>
                              J-{n.joursRestants}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {notifDocs.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Tous les documents sont à jour</p>
                  <p className="text-xs text-slate-400 mt-1">Aucune expiration imminente</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Document Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { if (!editDoc) resetForm(); else setShowForm(false); }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-dark-surface z-10 flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-dark-border">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {editDoc ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-green-500" />}
                  {editDoc ? "Modifier le document" : "Nouveau document"}
                </h2>
                <button onClick={() => { resetForm(); setShowForm(false); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border/50 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Véhicule <span className="text-red-500">*</span></label>
                    <select value={form.vehiculeId} onChange={e => handleVehicleSelect(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" required>
                      <option value={0}>Sélectionner un véhicule</option>
                      {vehicules.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.immatriculation || v.truckNumber} — {v.marque} {v.modele}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Type de document <span className="text-red-500">*</span></label>
                    <select value={form.typeDocument} onChange={e => handleTypeChange(e.target.value as TypeDocument)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none">
                      {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}{dt.obligatoire ? " (Obligatoire)" : ""}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Numéro du document <span className="text-red-500">*</span></label>
                  <input type="text" value={form.numeroDocument} onChange={e => setForm(f => ({ ...f, numeroDocument: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Date d'émission <span className="text-red-500">*</span></label>
                    <input type="date" value={form.dateEmission} onChange={e => handleEmissionChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Années</label>
                    <input type="number" min={0} max={20} value={form.dureeAnnees} onChange={e => handleDurationChange(Number(e.target.value), form.dureeMois, form.dureeJours)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Mois</label>
                    <input type="number" min={0} max={11} value={form.dureeMois} onChange={e => handleDurationChange(form.dureeAnnees, Number(e.target.value), form.dureeJours)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Jours</label>
                    <input type="number" min={0} max={30} value={form.dureeJours} onChange={e => handleDurationChange(form.dureeAnnees, form.dureeMois, Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date d'expiration (calculée) :</label>
                  <input type="date" value={expiryDate} readOnly
                    className="px-4 py-2 bg-slate-100 dark:bg-dark-border/50 border border-slate-200 dark:border-dark-border rounded-xl text-sm text-slate-500 cursor-not-allowed w-52" />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Pièces jointes (PDF, Image)</label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-dark-border rounded-xl p-4 hover:border-danone-blue/50 transition-colors">
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif" onChange={e => {
                      if (e.target.files) {
                        const fileArray = Array.from(e.target.files!) as File[];
                        setForm(f => ({ ...f, fichiers: [...f.fichiers, ...fileArray] }));
                      }
                      e.target.value = "";
                    }} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="text-sm text-slate-500">Cliquez pour ajouter des fichiers</span>
                      <span className="text-xs text-slate-400">PDF, JPG, PNG acceptés</span>
                    </label>
                  </div>
                  {form.fichiers.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {form.fichiers.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-dark-border/30 rounded-lg px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-700 dark:text-white">{f.name}</span>
                            <span className="text-slate-400">({(f.size / 1024).toFixed(0)} Ko)</span>
                          </div>
                          <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-danone-blue outline-none resize-none"
                    placeholder="Informations complémentaires..." />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-dark-border">
                  <div className="text-xs text-slate-400">
                    {currentUser?.name && <span>Responsable : <span className="font-semibold text-slate-600 dark:text-slate-300">{currentUser.name}</span></span>}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                      className="px-5 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-border/50 transition-colors">
                      Annuler
                    </button>
                    <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-danone-blue to-danone-blue-dark text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2">
                      <Save className="w-4 h-4" /> {editDoc ? "Mettre à jour" : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-dark-surface z-10 flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-dark-border">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {DOC_ICONS[showDetail.typeDocument]} {getTypeLabel(showDetail.typeDocument)}
                </h2>
                <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border/50 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Véhicule</span>
                    <span className="font-semibold text-slate-700 dark:text-white">{showDetail.vehiculeImmatriculation}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Statut</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusConfig[showDetail.statut].bg} ${statusConfig[showDetail.statut].color}`}>
                      {statusConfig[showDetail.statut].icon} {statusConfig[showDetail.statut].label}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">N° Document</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-white">{showDetail.numeroDocument || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Jours restants</span>
                    <span className={`font-bold ${showDetail.joursRestants <= 0 ? "text-red-600" : showDetail.joursRestants <= 30 ? "text-amber-600" : "text-green-600"}`}>
                      {showDetail.statut !== "MANQUANT" ? `${showDetail.joursRestants} jours` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Date d'émission</span>
                    <span className="font-semibold text-slate-700 dark:text-white">{formatDate(showDetail.dateEmission)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Date d'expiration</span>
                    <span className={`font-semibold ${showDetail.statut === "EXPIRE" ? "text-red-600" : ""}`}>{formatDate(showDetail.dateExpiration)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Durée de validité</span>
                    <span className="font-semibold text-slate-700 dark:text-white">{showDetail.dureeValiditeMois} mois</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Responsable</span>
                    <span className="font-semibold text-slate-700 dark:text-white">{showDetail.responsableNom || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Créé le</span>
                    <span className="font-semibold text-slate-700 dark:text-white">{formatDateTime(showDetail.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Dernière modif.</span>
                    <span className="font-semibold text-slate-700 dark:text-white">{showDetail.updatedAt ? formatDateTime(showDetail.updatedAt) : "—"}</span>
                  </div>
                </div>

                {/* Notes */}
                {showDetail.notes && (
                  <div className="bg-slate-50 dark:bg-dark-border/30 rounded-xl p-3">
                    <span className="text-xs text-slate-500 block mb-1">Notes</span>
                    <p className="text-sm text-slate-700 dark:text-white whitespace-pre-wrap">{showDetail.notes}</p>
                  </div>
                )}

                {/* Attachments */}
                {showDetail.piecesJointes.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-2">Pièces jointes</span>
                    <div className="space-y-1.5">
                      {showDetail.piecesJointes.map((pj, i) => (
                        <a key={i} href={`${UPLOAD_API}/${pj.url}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-slate-50 dark:bg-dark-border/30 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-dark-border/50 transition-colors">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span className="text-danone-blue underline">{pj.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                {showDetail.historique && showDetail.historique.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-2 flex items-center gap-1"><History className="w-3.5 h-3.5" /> Historique des modifications</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {showDetail.historique.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-slate-50 dark:bg-dark-border/30 rounded-lg px-3 py-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-danone-blue mt-1.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-white">{h.action}</span>
                            {h.fieldChanged && <span className="text-slate-500"> — {h.fieldChanged}</span>}
                            <div className="text-slate-400">
                              par <span className="font-medium">{h.userName}</span> · {formatDateTime(h.timestamp)}
                            </div>
                            {h.oldValue && h.newValue && (
                              <div className="mt-0.5 text-slate-500">
                                <span className="line-through text-red-500">{h.oldValue}</span>
                                <span className="mx-1">→</span>
                                <span className="text-green-600">{h.newValue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing history placeholder */}
                {(!showDetail.historique || showDetail.historique.length === 0) && (
                  <div className="text-center py-4">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400">Aucun historique enregistré côté serveur</p>
                    <p className="text-xs text-slate-400 mt-0.5">Les actions seront tracées à partir de maintenant</p>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-dark-surface border-t border-slate-200 dark:border-dark-border p-4 flex justify-end gap-3">
                <button onClick={() => openEdit(showDetail)} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Modifier
                </button>
                <button onClick={() => setShowDetail(null)} className="px-4 py-2 border border-slate-200 dark:border-dark-border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-200 dark:border-dark-border">
        <p className="text-xs text-slate-400 font-medium tracking-wider">
          {documents.length} documents · {vehicules.length} véhicules · {docStats.conformite}% conformité
        </p>
      </div>
    </div>
  );
}
