import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { User } from "../types/incident";
import DashboardLayout from "./ui/DashboardLayout";
import Toast from "./ui/Toast";
import PowerBiDashboard from "./PowerBiDashboard";
import FleetDocumentManager from "./FleetDocumentManager";

import {
  LayoutDashboard, FileText, AlertTriangle, Wrench, CheckCircle,
  XCircle, Truck, RefreshCw, Search, Clock, ChevronDown, ChevronUp,
  ShieldCheck, DollarSign, Eye, SlidersHorizontal, X, Upload, History,
  Shield, Calendar, Car, FileCheck, AlertCircle, Archive, Plus,
  ClipboardList
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";

const DECLARATION_API = "/api/declarations";
const VEHICLE_API = "/api/vehicles";
const CHECKUP_API = "/api/checkups";
const CHECKLIST_API = "/api/fleet/checklist";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (Array.isArray(v)) {
    const [y, m, d, h = 0, mi = 0] = v.map(Number);
    return new Date(y, m - 1, d, h, mi);
  }
  const dt = new Date(v);
  return isNaN(dt.getTime()) ? null : dt;
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

const ANOMALIE_STATUT_LABELS: Record<string, string> = {
  DETECTEE: "Detectee", EN_REPARATION: "En reparation", REPAREE: "Reparee",
  NON_REPAREE: "Non reparable", VALIDEE: "Validee", ANNULEE: "Annulee"
};

const ANOMALIE_STATUT_COLORS: Record<string, string> = {
  DETECTEE: "bg-red-100 text-red-700", EN_REPARATION: "bg-amber-100 text-amber-700",
  REPAREE: "bg-blue-100 text-blue-700", NON_REPAREE: "bg-slate-100 text-slate-700",
  VALIDEE: "bg-green-100 text-green-700", ANNULEE: "bg-gray-100 text-gray-500"
};

const DECL_STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente", EN_COURS: "En cours", EN_VALIDATION: "En validation",
  CLOTURE: "Cloture", RETOURNEE: "Retourne", REFUSE: "Refuse"
};

const DECL_STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700", EN_COURS: "bg-blue-100 text-blue-700",
  EN_VALIDATION: "bg-purple-100 text-purple-700", CLOTURE: "bg-green-100 text-green-700",
  RETOURNEE: "bg-red-100 text-red-700", REFUSE: "bg-red-100 text-red-700"
};

interface ModernResponsableSupportDashboardProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const ModernResponsableSupportDashboard: React.FC<ModernResponsableSupportDashboardProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<"declarations" | "checklists" | "powerbi" | "documents" | "vehicleHistory">("declarations");
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [declFilterStatut, setDeclFilterStatut] = useState("");
  const [declFilterCategorie, setDeclFilterCategorie] = useState("");
  const [declFilterVehicule, setDeclFilterVehicule] = useState("");
  const [declFilterDateDebut, setDeclFilterDateDebut] = useState("");
  const [declFilterDateFin, setDeclFilterDateFin] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showDeclFilters, setShowDeclFilters] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnMotif, setReturnMotif] = useState("");
  const [expandedDeclId, setExpandedDeclId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [quarterlyBudget, setQuarterlyBudget] = useState<any>(null);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);
  const [showBudgetCheckModal, setShowBudgetCheckModal] = useState(false);
  const [budgetCheckResult, setBudgetCheckResult] = useState<any>(null);
  const [budgetDecision, setBudgetDecision] = useState<"approuver" | "rejeter" | "différer" | "">("");
  const [budgetMotif, setBudgetMotif] = useState("");
  const [newBudgetForm, setNewBudgetForm] = useState({ annee: new Date().getFullYear(), trimestre: 1, budgetTotal: "" });
  const [checklists, setChecklists] = useState<any[]>([]);
  const [pendingChecklists, setPendingChecklists] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<any>(null);
  const [historyVehicleId, setHistoryVehicleId] = useState<number | null>(null);

  const showToast = (m: string, t: "success" | "error" | "info") => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, vRes] = await Promise.all([
        axios.get(DECLARATION_API),
        axios.get(VEHICLE_API),
      ]);
      setDeclarations(Array.isArray(dRes.data) ? dRes.data : []);
      setVehicles(Array.isArray((vRes.data as any)?.vehicles || vRes.data) ? ((vRes.data as any)?.vehicles || vRes.data) : []);
      try { const bRes = await axios.get("/api/budget/active"); setQuarterlyBudget(bRes.data); } catch { setQuarterlyBudget(null); }
      try {
        const [ncRes, rpRes, pendingRes] = await Promise.all([
          axios.get(`${CHECKLIST_API}/non-conforme`),
          axios.get(`${CHECKLIST_API}/statut/REPAIRE`),
          axios.get(`${CHECKLIST_API}/statut/PENDING`),
        ]);
        setChecklists([
          ...(Array.isArray(ncRes.data) ? ncRes.data : []),
          ...(Array.isArray(rpRes.data) ? rpRes.data : []),
        ]);
        setPendingChecklists(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      } catch {}
    } catch { showToast("Erreur chargement donnees", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchAll, 30000);
      return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
    } else {
      if (refreshIntervalRef.current) { clearInterval(refreshIntervalRef.current); refreshIntervalRef.current = null; }
    }
  }, [autoRefresh, fetchAll]);

  const handleSmoothFilter = (statut: string) => {
    setDeclFilterStatut(statut);
    setActiveTab("declarations");
    setShowDeclFilters(true);
    setTimeout(() => document.getElementById("declarations-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ===== CHECKLIST ACTIONS =====
  const validerChecklistRepair = async (id: number) => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.post(`${CHECKLIST_API}/validate-repair/${id}`, { validatedBy: ((u?.firstname || "") + " " + (u?.name || "")).trim() || "RS" });
      showToast("Reparation validee — Vehicule debloque", "success"); fetchAll();
    } catch { showToast("Erreur validation", "error"); }
  };
  const rejeterChecklistRepair = async (id: number) => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.post(`${CHECKLIST_API}/reject-repair/${id}`, { rejectedBy: ((u?.firstname || "") + " " + (u?.name || "")).trim() || "RS" });
      showToast("Reparation rejetee", "info"); fetchAll();
    } catch { showToast("Erreur rejet", "error"); }
  };
  const marquerChecklistRepare = async (id: number) => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.post(`${CHECKLIST_API}/repair/${id}`, { reparationsJson: "[]", repairBy: ((u?.firstname || "") + " " + (u?.name || "")).trim() || "RS (pour Maintenance)" });
      showToast("Reparation effectuee par Maintenance — en attente de validation", "success"); fetchAll();
    } catch { showToast("Erreur", "error"); }
  };
  const validerPendingChecklist = async (id: number) => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const res = await axios.post(`${CHECKLIST_API}/validate-pending/${id}`, { validatedBy: ((u?.firstname || "") + " " + (u?.name || "")).trim() || "RS" });
      showToast((res.data as any)?.message || "Check-up valide", "success"); fetchAll();
    } catch (e: any) { showToast(e?.response?.data?.error || "Erreur validation", "error"); }
  };

  const fetchVehicleHistory = async (vehicleId: number) => {
    try {
      const [histRes, docsRes, declRes, blkRes] = await Promise.all([
        axios.get(`${VEHICLE_API}/${vehicleId}/history`).catch(() => ({ data: {} })),
        axios.get(`/api/documents-vehicule`).catch(() => ({ data: [] })),
        axios.get(`${DECLARATION_API}`).catch(() => ({ data: [] })),
        axios.get(`/api/fleet/checklist/blocked-vehicules`).catch(() => ({ data: [] })),
      ]);

      const data: any = (histRes as any).data?.history || (histRes as any).data || {};
      const veh: any = data.vehicle || {};

      // Compute counts from real API data
      const rawDocs: any = (docsRes as any).data;
      const docsList: any[] = Array.isArray(rawDocs) ? rawDocs : (rawDocs?.documents || []);
      const docsCount = docsList.filter((d: any) => d.vehiculeId === vehicleId).length;

      const rawDecls: any = (declRes as any).data;
      const declList: any[] = Array.isArray(rawDecls) ? rawDecls : (rawDecls?.declarations || rawDecls?.content || []);
      const anomaliesCount = declList.filter((d: any) => (d.vehiculeId === vehicleId || d.vehicule?.id === vehicleId) && (d.typePanne === "ANOMALIE" || d.categorie === "ANOMALIE")).length;

      // Checklists count from already-loaded data
      const vehicleChecklists = checklists.filter((c: any) => c.vehiculeId === vehicleId);
      const checkupsCount = vehicleChecklists.length + pendingChecklists.filter((c: any) => c.vehiculeId === vehicleId).length;

      // === BLOCAGE INFO : try 4 sources ===
      let blocageInfo: any = null;

      // Source 1: currently blocked from /api/fleet/checklist/blocked-vehicules
      const blockedList: any[] = (blkRes as any).data;
      const blockedVehicle = Array.isArray(blockedList) ? blockedList.find((bv: any) =>
        bv.id === vehicleId || bv.vehiculeId === vehicleId || bv.vehiculeImmatriculation === (veh.immatriculation || "")
      ) : null;
      if (blockedVehicle) {
        blocageInfo = {
          dateBlocage: blockedVehicle.dateBlocage || blockedVehicle.blockedAt || null,
          dateDeblocage: blockedVehicle.dateDeblocage || null,
          raisonBlocage: blockedVehicle.raison || blockedVehicle.raisonBlocage || "Documents non conformes",
          bloquePar: blockedVehicle.bloquePar || "Système",
          debloquePar: blockedVehicle.debloquePar || null,
        };
      }

      // Source 2: from history endpoint's blocages array
      if (!blocageInfo || !blocageInfo.dateBlocage) {
        const blocages: any[] = (data as any).blocages || [];
        if (Array.isArray(blocages) && blocages.length > 0) {
          // Collect all available fields from any entry
          let dateBlocageVal: string | null = null;
          let dateDeblocageVal: string | null = null;
          let raisonVal: string | null = null;
          let bloqueParVal: string | null = null;
          let debloqueParVal: string | null = null;

          for (const b of blocages) {
            if (b.dateBlocage) dateBlocageVal = b.dateBlocage;
            if (b.dateDeblocage) dateDeblocageVal = b.dateDeblocage;
            if (b.raison || b.raisonBlocage) raisonVal = b.raison || b.raisonBlocage;
            if (b.bloquePar || b.userName) bloqueParVal = b.bloquePar || b.userName;
            if (b.debloquePar) debloqueParVal = b.debloquePar;
            // Use timestamp as fallback
            if (!dateBlocageVal && b.timestamp) dateBlocageVal = b.timestamp;
          }

          // As absolute last resort, use dateDeblocage as dateBlocage if no separate block date
          if (!dateBlocageVal && dateDeblocageVal) dateBlocageVal = dateDeblocageVal;

          blocageInfo = {
            dateBlocage: dateBlocageVal,
            dateDeblocage: dateDeblocageVal,
            raisonBlocage: raisonVal || "—",
            bloquePar: bloqueParVal || "—",
            debloquePar: debloqueParVal || null,
          };
        }
      }

      // Source 3: from history endpoint's blocageInfo
      if (!blocageInfo || !blocageInfo.dateBlocage) {
        blocageInfo = (data as any).blocageInfo || null;
      }

      // Source 4: vehicle object fields directly
      if (!blocageInfo || !blocageInfo.dateBlocage) {
        if (veh.dateBlocage || veh.raisonBlocage || veh.bloquePar) {
          blocageInfo = {
            dateBlocage: veh.dateBlocage || null,
            dateDeblocage: veh.dateDeblocage || null,
            raisonBlocage: veh.raisonBlocage || veh.raison || "—",
            bloquePar: veh.bloquePar || "—",
            debloquePar: veh.debloquePar || null,
          };
        }
      }

      // Source 5: from the already-loaded vehicles[] state
      if (!blocageInfo || !blocageInfo.dateBlocage) {
        const localVeh = vehicles.find((v: any) => v.id === vehicleId);
        if (localVeh) {
          const lv: any = localVeh;
          if (lv.dateBlocage || lv.raisonBlocage || lv.bloquePar) {
            blocageInfo = {
              dateBlocage: lv.dateBlocage || null,
              dateDeblocage: lv.dateDeblocage || null,
              raisonBlocage: lv.raisonBlocage || lv.raison || "—",
              bloquePar: lv.bloquePar || "—",
              debloquePar: lv.debloquePar || null,
            };
          }
        }
      }

      // === DEPARTS / TOURNEES ===
      let departsCount = (data as any).departsCount ?? 0;
      let tourneesCount = (data as any).tourneesCount ?? 0;
      // Try from vehicle object
      if (!departsCount && !tourneesCount) {
        departsCount = veh.departsCount || veh.nbDeparts || 0;
        tourneesCount = veh.tourneesCount || veh.nbTournees || 0;
      }
      // Try from local vehicles data
      if (!departsCount && !tourneesCount) {
        const localVeh = vehicles.find((v: any) => v.id === vehicleId);
        if (localVeh) {
          departsCount = (localVeh as any).departsCount || (localVeh as any).nbDeparts || 0;
          tourneesCount = (localVeh as any).tourneesCount || (localVeh as any).nbTournees || 0;
        }
      }

      setVehicleHistory({
        ...data,
        documentsCount: docsCount,
        anomaliesCount,
        checkupsCount,
        departsCount,
        tourneesCount,
        blocageInfo,
      });
      setHistoryVehicleId(vehicleId);
    } catch { showToast("Erreur chargement historique", "error"); }
  };

  // ===== DECLARATION ACTIONS =====
  const handleClose = async () => {
    if (!selectedDeclaration) return;
    try {
      await axios.put(`${DECLARATION_API}/${selectedDeclaration.id}/close`, {});
      showToast("Declaration cloturee", "success"); setShowCloseModal(false); fetchAll();
    } catch (err: any) { showToast(err?.response?.data?.error || "Erreur", "error"); }
  };
  const handleReturn = async () => {
    if (!selectedDeclaration || !returnMotif.trim()) return;
    try {
      await axios.put(`${DECLARATION_API}/${selectedDeclaration.id}/return`, { motif: returnMotif });
      showToast("Declaration retournee", "success"); setShowReturnModal(false); setReturnMotif(""); fetchAll();
    } catch (err: any) { showToast(err?.response?.data?.error || "Erreur", "error"); }
  };

  const checkBudgetForDeclaration = async (declarationId: number) => {
    try {
      const res = await axios.get(`/admin/budget/check/${declarationId}`);
      setBudgetCheckResult(res.data);
      setSelectedDeclaration(declarations.find((d: any) => d.id === declarationId));
      setShowBudgetCheckModal(true);
    } catch { showToast("Erreur verification budget", "error"); }
  };

  const makeBudgetDecision = async () => {
    if (!selectedDeclaration || !budgetDecision) return;
    try {
      await axios.post(`/admin/budget/decision/${selectedDeclaration.id}`, { decision: budgetDecision, motif: budgetMotif || undefined });
      showToast(`Decision ${budgetDecision} enregistree`, "success");
      setShowBudgetCheckModal(false); setBudgetDecision(""); setBudgetMotif(""); setBudgetCheckResult(null); fetchAll();
    } catch { showToast("Erreur decision budget", "error"); }
  };

  const handleCreateBudget = async () => {
    try {
      const total = parseFloat(newBudgetForm.budgetTotal);
      if (isNaN(total) || total <= 0) { showToast("Montant invalide", "error"); return; }
      await axios.post("/api/budget/create", { annee: newBudgetForm.annee, trimestre: newBudgetForm.trimestre, budgetTotal: total });
      showToast("Budget trimestriel cree", "success"); setShowCreateBudgetModal(false); setNewBudgetForm({ annee: new Date().getFullYear(), trimestre: 1, budgetTotal: "" }); fetchAll();
    } catch { showToast("Erreur creation budget", "error"); }
  };

  const filteredDeclarations = useMemo(() => declarations.filter((d: any) => {
    if (declFilterStatut && d.statut !== declFilterStatut) return false;
    if (declFilterCategorie && d.categorie !== declFilterCategorie && d.typePanne !== declFilterCategorie) return false;
    if (declFilterVehicule && !(d.vehiculeImmatriculation || "").toLowerCase().includes(declFilterVehicule.toLowerCase())) return false;
    if (declFilterDateDebut) { const dd = d.dateDeclaration ? toDate(d.dateDeclaration) : null; if (!dd || dd < toDate(declFilterDateDebut)!) return false; }
    if (declFilterDateFin) { const dd = d.dateDeclaration ? toDate(d.dateDeclaration) : null; if (!dd || dd > toDate(declFilterDateFin + "T23:59:59")!) return false; }
    return true;
  }), [declarations, declFilterStatut, declFilterCategorie, declFilterVehicule, declFilterDateDebut, declFilterDateFin]);

  const declStats = useMemo(() => ({
    total: filteredDeclarations.length,
    enAttente: filteredDeclarations.filter((d: any) => d.statut === "EN_ATTENTE").length,
    enCours: filteredDeclarations.filter((d: any) => d.statut === "EN_COURS").length,
    enValidation: filteredDeclarations.filter((d: any) => d.statut === "EN_VALIDATION").length,
    cloturees: filteredDeclarations.filter((d: any) => d.statut === "CLOTURE").length,
    retournees: filteredDeclarations.filter((d: any) => d.statut === "RETOURNEE").length,
  }), [filteredDeclarations]);

  const navItems = [
    { id: "declarations", label: "Declarations", icon: <FileText className="w-5 h-5" />, badge: declarations.filter((d: any) => d.statut === "EN_VALIDATION").length },
    { id: "checklists", label: "Checklists", icon: <ClipboardList className="w-5 h-5" />, badge: checklists.filter((c: any) => c.statut === "REPAIRE" || (c.statut === "COMPLETE" && c.estConforme === false)).length + pendingChecklists.length, active: activeTab === "checklists", onClick: () => setActiveTab("checklists") },

    { id: "powerbi", label: "Power BI", icon: <LayoutDashboard className="w-5 h-5" />, active: activeTab === "powerbi", onClick: () => setActiveTab("powerbi") },

    { id: "documents", label: "Documents RS", icon: <Upload className="w-5 h-5" />, active: activeTab === "documents", onClick: () => setActiveTab("documents") },
    { id: "vehicleHistory", label: "Historique Vehicule", icon: <History className="w-5 h-5" />, active: activeTab === "vehicleHistory", onClick: () => setActiveTab("vehicleHistory") },
  ];

  if (loading) return <DashboardLayout navItems={navItems} title="Responsable Support" subtitle="Chargement..." currentUser={currentUser} onLogout={onLogout}><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-danone-blue" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Responsable Support" subtitle="Gestion anomalies & declarations" currentUser={currentUser} onLogout={onLogout}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="p-4 sm:p-6 space-y-5">

        {/* TAB BUTTONS */}
        <div className="flex gap-2 mb-2 flex-wrap">
          <button onClick={() => setActiveTab("declarations")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "declarations" ? "bg-danone-blue text-white shadow-md" : "bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border"}`}>
            <FileText className="w-4 h-4 inline mr-1" /> Declarations
            <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700">AVEC budget</span>
          </button>
          <button onClick={() => setActiveTab("checklists")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "checklists" ? "bg-indigo-500 text-white shadow-md" : "bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border"}`}>
            <ClipboardList className="w-4 h-4 inline mr-1" /> Checklists
            {checklists.filter((c: any) => c.statut === "REPAIRE" || (c.statut === "COMPLETE" && c.estConforme === false)).length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-indigo-100 text-indigo-700">{checklists.filter((c: any) => c.statut === "REPAIRE" || (c.statut === "COMPLETE" && c.estConforme === false)).length}</span>
            )}
          </button>

          <button onClick={() => setActiveTab("documents")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "documents" ? "bg-green-500 text-white shadow-md" : "bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border"}`}>
            <Upload className="w-4 h-4 inline mr-1" /> Documents RS
          </button>
          <button onClick={() => setActiveTab("vehicleHistory")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "vehicleHistory" ? "bg-cyan-500 text-white shadow-md" : "bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border"}`}>
            <History className="w-4 h-4 inline mr-1" /> Historique Vehicule
          </button>
          <button onClick={fetchAll} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-border dark:hover:bg-dark-border/80"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
        </div>

        {/* ===== DECLARATIONS TAB ===== */}
        {activeTab === "declarations" && (
          <div className="space-y-4">
            {/* Budget Trimestriel */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" /> Budget Trimestriel</h2>
                <button onClick={() => setShowCreateBudgetModal(true)} className="bg-danone-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-danone-blue-dark transition-all shadow-soft">+ Nouveau Budget</button>
              </div>
              {quarterlyBudget ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-danone-blue/5 dark:bg-danone-blue/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-medium">Budget Total</p>
                      <p className="text-xl font-bold text-danone-blue dark:text-danone-blue-light">{quarterlyBudget.budgetTotal?.toLocaleString() || 0} MAD</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-medium">Utilise</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{quarterlyBudget.budgetUtilise?.toLocaleString() || 0} MAD</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${quarterlyBudget.budgetRestant > 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                      <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-medium">Restant</p>
                      <p className={`text-xl font-bold ${quarterlyBudget.budgetRestant > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{quarterlyBudget.budgetRestant?.toLocaleString() || 0} MAD</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-dark-border rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${quarterlyBudget.budgetRestant > 0 ? 'bg-danone-blue' : 'bg-red-500'}`} style={{ width: `${Math.min(100, ((quarterlyBudget.budgetUtilise || 0) / (quarterlyBudget.budgetTotal || 1)) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-dark-text-secondary">Periode: T{quarterlyBudget.trimestre} {quarterlyBudget.annee}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-600 dark:text-slate-400"><DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">Aucun budget trimestriel actif</p><p className="text-xs mt-1">Cliquez sur "+ Nouveau Budget" pour en creer un</p></div>
              )}
            </div>

            {/* Interactive chart — clickable pie */}
            <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Repartition des declarations</h3>
                <div className="flex gap-2 text-xs">
                  {[
                    { label: "Attente", color: "#f59e0b" },
                    { label: "Cours", color: "#3b82f6" },
                    { label: "Validation", color: "#8b5cf6" },
                    { label: "Cloture", color: "#10b981" },
                    { label: "Retour", color: "#ef4444" },
                  ].map((l) => <span key={l.label} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{backgroundColor: l.color}} />{l.label}</span>)}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: "En attente", value: declStats.enAttente, fill: "#f59e0b" },
                    { name: "En cours", value: declStats.enCours, fill: "#3b82f6" },
                    { name: "En validation", value: declStats.enValidation, fill: "#8b5cf6" },
                    { name: "Cloturees", value: declStats.cloturees, fill: "#10b981" },
                    { name: "Retournees", value: declStats.retournees, fill: "#ef4444" },
                  ].filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={30}
                    onClick={(entry: any) => {
                      const map: Record<string, string> = { "En attente": "EN_ATTENTE", "En cours": "EN_COURS", "En validation": "EN_VALIDATION", "Cloturees": "CLOTURE", "Retournees": "RETOURNEE" };
                      if (entry.name && map[entry.name]) handleSmoothFilter(map[entry.name]);
                    }}
                    style={{ cursor: "pointer" }}>
                    {[
                      { name: "En attente", value: declStats.enAttente, fill: "#f59e0b" },
                      { name: "En cours", value: declStats.enCours, fill: "#3b82f6" },
                      { name: "En validation", value: declStats.enValidation, fill: "#8b5cf6" },
                      { name: "Cloturees", value: declStats.cloturees, fill: "#10b981" },
                      { name: "Retournees", value: declStats.retournees, fill: "#ef4444" },
                    ].filter(d => d.value > 0).map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats — clickable to filter */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[
                { label: "Total", value: declStats.total, color: "bg-slate-100 text-slate-800 dark:bg-dark-border dark:text-white", filter: "" },
                { label: "En attente", value: declStats.enAttente, color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", filter: "EN_ATTENTE" },
                { label: "En cours", value: declStats.enCours, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", filter: "EN_COURS" },
                { label: "En validation", value: declStats.enValidation, color: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", filter: "EN_VALIDATION" },
                { label: "Cloturees", value: declStats.cloturees, color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400", filter: "CLOTURE" },
                { label: "Retournees", value: declStats.retournees, color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400", filter: "RETOURNEE" },
              ].map((s, i) => (
                <button key={i} onClick={() => handleSmoothFilter(s.filter)} className={`${s.color} rounded-xl p-4 text-center transition-transform hover:scale-105 cursor-pointer`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs font-medium mt-1">{s.label}</div>
                </button>
              ))}
            </div>

            {/* Filter toggle + table */}
            <div id="declarations-section" className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-dark-border">
              <div className="px-6 py-4 border-b border-slate-200/50 dark:border-dark-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Declarations ({filteredDeclarations.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeclFilters(!showDeclFilters)} className="bg-slate-200 hover:bg-slate-300 dark:bg-dark-border dark:hover:bg-dark-border/80 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1"><SlidersHorizontal className="w-4 h-4" /> Filtres</button>
                </div>
              </div>

              {showDeclFilters && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-dark-border/30 border-b border-slate-200/50 dark:border-dark-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1">Statut</label>
                      <select value={declFilterStatut} onChange={e => setDeclFilterStatut(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-surface rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous</option>
                        <option value="EN_ATTENTE">En attente</option><option value="EN_COURS">En cours</option><option value="EN_VALIDATION">En validation</option><option value="CLOTURE">Cloture</option><option value="RETOURNEE">Retourne</option><option value="REFUSE">Refuse</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1">Type panne</label>
                      <select value={declFilterCategorie} onChange={e => setDeclFilterCategorie(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-surface rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous</option>
                        <option value="MECANIQUE">Mecanique</option><option value="ELECTRIQUE">Electrique</option><option value="CAISSE">Caisse</option><option value="CABINE">Cabine</option><option value="SECURITE">Securite</option><option value="AUTRES">Autres</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1">Immatriculation</label>
                      <input type="text" value={declFilterVehicule} onChange={e => setDeclFilterVehicule(e.target.value)} placeholder="Ex: AA-123-BC..." className="w-full px-3 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-surface rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1">Date debut</label>
                      <input type="date" value={declFilterDateDebut} onChange={e => setDeclFilterDateDebut(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-surface rounded-lg text-sm text-slate-700 dark:text-white" />
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1">Date fin</label>
                      <input type="date" value={declFilterDateFin} onChange={e => setDeclFilterDateFin(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-surface rounded-lg text-sm text-slate-700 dark:text-white" />
                    </div>
                    <div className="flex items-end gap-2">
                      <button onClick={() => { setDeclFilterStatut(""); setDeclFilterCategorie(""); setDeclFilterVehicule(""); setDeclFilterDateDebut(""); setDeclFilterDateFin(""); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-dark-border dark:hover:bg-dark-border/80 rounded-lg font-bold text-sm text-slate-700 dark:text-white">Reinitialiser</button>
                      <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 ${autoRefresh ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-dark-border text-slate-700 dark:text-white"}`}><RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`} /> Auto</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">N. Demande</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Type</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Criticite</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Statut</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Chauffeur</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Immatriculation</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Source</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {filteredDeclarations.map((d: any) => (
                      <>
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-border/20 transition-colors cursor-pointer" onClick={() => setExpandedDeclId(expandedDeclId === d.id ? null : d.id)}>
                          <td className="px-3 py-3 text-sm font-bold text-slate-800 dark:text-white">{d.numeroDeclaration || d.numeroDemande || "-"}</td>
                          <td className="px-3 py-3 text-sm text-slate-600">{d.dateDeclaration ? (toDate(d.dateDeclaration)?.toLocaleDateString("fr-FR") ?? "-") : "-"}</td>
                          <td className="px-3 py-3 text-sm font-semibold text-slate-800 dark:text-white">{d.typePanneFrancais || d.typePanne || "-"}</td>
                          <td className="px-3 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-bold ${d.criticite === "BLOQUANT" || d.criticite === "SECURITE" ? "bg-red-100 text-red-800" : d.criticite === "URGENT" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>{d.criticite || "-"}</span></td>
                          <td className="px-3 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-bold ${DECL_STATUT_COLORS[d.statut] || "bg-gray-100 text-gray-800"}`}>{DECL_STATUT_LABELS[d.statut] || d.statut || "-"}</span></td>
                          <td className="px-3 py-3 text-sm text-slate-800 dark:text-white font-semibold">{d.chauffeurNom || "-"}</td>
                          <td className="px-3 py-3 text-sm text-slate-800 dark:text-white font-semibold">{d.vehiculeImmatriculation || "-"}</td>
                          <td className="px-3 py-3 text-sm text-slate-600">{d.source || "-"}</td>
                          <td className="px-3 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1">
                              <button onClick={() => { setSelectedDeclaration(d); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Details</button>
                              {d.statut === "EN_VALIDATION" && <>
                                <button onClick={() => { setSelectedDeclaration(d); setShowCloseModal(true); }} className="text-green-600 hover:text-green-800 font-semibold text-xs">Cloturer</button>
                                <button onClick={() => { setSelectedDeclaration(d); setShowReturnModal(true); }} className="text-red-600 hover:text-red-800 font-semibold text-xs">Retourner</button>
                                <button onClick={() => checkBudgetForDeclaration(d.id)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"><DollarSign className="w-3 h-3 inline" /> Budget</button>
                              </>}
                              {d.statut === "EN_ATTENTE" && <button onClick={async () => { try { await axios.put(`${DECLARATION_API}/${d.id}/takeCharge`, {}); showToast("Prise en charge", "success"); fetchAll(); } catch { showToast("Erreur", "error"); } }} className="text-amber-600 hover:text-amber-800 font-semibold text-xs">Prendre en charge</button>}
                            </div>
                          </td>
                        </tr>
                        {expandedDeclId === d.id && (
                          <tr key={`${d.id}-detail`} className="bg-blue-50/50 dark:bg-dark-border/10">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Cout</span><p className="font-semibold text-slate-800">{d.coutProbleme ? `${d.coutProbleme.toLocaleString()} MAD` : '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Duree reparation</span><p className="font-semibold text-slate-800">{d.dureeReparation != null ? (() => { const t = Math.floor(d.dureeReparation / 60); const h = Math.floor(t / 60); const m = t % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; })() : '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Actions realisees</span><p className="font-semibold text-slate-800">{d.actionsRealisees || '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Contrat / Bon commande</span><p className="font-semibold text-slate-800">{d.contratBonCommande || '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Date debut intervention</span><p className="font-semibold text-slate-800">{d.dateDebutIntervention ? (toDate(d.dateDebutIntervention)?.toLocaleString('fr-FR') ?? '-') : '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Date reparation</span><p className="font-semibold text-slate-800">{d.dateReparation ? (toDate(d.dateReparation)?.toLocaleString('fr-FR') ?? '-') : '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Pieces necessaires</span><p className="font-semibold text-slate-800">{d.piecesNecessaires || '-'}</p></div>
                                <div><span className="text-slate-600 dark:text-slate-400 text-xs">Qualification</span><p className="font-semibold text-slate-800">{d.qualification || '-'}</p></div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODALS */}
        {showDetailModal && selectedDeclaration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Details - {selectedDeclaration.numeroDeclaration || selectedDeclaration.numeroDemande}</h3><button onClick={() => setShowDetailModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-slate-600 dark:text-slate-400">Chauffeur:</span> <span className="font-medium">{selectedDeclaration.chauffeurNom || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Immatriculation:</span> <span className="font-medium">{selectedDeclaration.vehiculeImmatriculation || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Type panne:</span> <span className="font-medium">{selectedDeclaration.typePanneFrancais || selectedDeclaration.typePanne || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Criticite:</span> <span className="font-medium">{selectedDeclaration.criticite || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Statut:</span> <span className={`px-2 py-1 rounded-full text-xs font-bold ${DECL_STATUT_COLORS[selectedDeclaration.statut] || ""}`}>{DECL_STATUT_LABELS[selectedDeclaration.statut] || selectedDeclaration.statut}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Source:</span> <span className="font-medium">{selectedDeclaration.source || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Categorie:</span> <span className="font-medium">{selectedDeclaration.categorie || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Element:</span> <span className="font-medium">{selectedDeclaration.elementVehicule || "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Cout:</span> <span className="font-medium">{selectedDeclaration.coutProbleme ? `${selectedDeclaration.coutProbleme} MAD` : "-"}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-400">Km:</span> <span className="font-medium">{selectedDeclaration.kilometrage ? `${selectedDeclaration.kilometrage} km` : "-"}</span></div>
                </div>
                <div><span className="text-slate-600 dark:text-slate-400">Description:</span><p className="mt-1 p-3 bg-slate-50 dark:bg-dark-border/50 rounded-lg text-slate-700 dark:text-white whitespace-pre-wrap">{selectedDeclaration.descriptionFrancais || selectedDeclaration.description || "-"}</p></div>
                {(selectedDeclaration.actionsRealisees || selectedDeclaration.piecesNecessaires) && (
                  <div className="bg-slate-50 dark:bg-dark-border/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-white">Rapport d'intervention</h4>
                    {selectedDeclaration.dateDebutIntervention && <div><span className="text-slate-600 dark:text-slate-400">Date debut intervention:</span> <span className="font-medium">{toDate(selectedDeclaration.dateDebutIntervention)?.toLocaleString('fr-FR') ?? '-'}</span></div>}
                    {selectedDeclaration.dateReparation && <div><span className="text-slate-600 dark:text-slate-400">Date reparation:</span> <span className="font-medium">{toDate(selectedDeclaration.dateReparation)?.toLocaleString('fr-FR') ?? '-'}</span></div>}
                    {selectedDeclaration.dureeReparation != null && <div><span className="text-slate-600 dark:text-slate-400">Duree reparation:</span> <span className="font-medium">{(() => { const t = Math.floor(selectedDeclaration.dureeReparation / 60); const h = Math.floor(t / 60); const m = t % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; })()}</span></div>}
                    {selectedDeclaration.actionsRealisees && <div><span className="text-slate-600 dark:text-slate-400">Actions realisees:</span> <span className="font-medium">{selectedDeclaration.actionsRealisees}</span></div>}
                    {selectedDeclaration.piecesNecessaires && <div><span className="text-slate-600 dark:text-slate-400">Pieces necessaires:</span> <span className="font-medium">{selectedDeclaration.piecesNecessaires}</span></div>}
                    {selectedDeclaration.qualification && <div><span className="text-slate-600 dark:text-slate-400">Qualification:</span> <span className="font-medium">{selectedDeclaration.qualification}</span></div>}
                    {selectedDeclaration.contratBonCommande && <div><span className="text-slate-600 dark:text-slate-400">Contrat / Bon de commande:</span> <span className="font-medium">{selectedDeclaration.contratBonCommande}</span></div>}
                  </div>
                )}
                {selectedDeclaration.motifRefus && <div className="bg-red-50 p-4 rounded-lg"><span className="font-bold text-red-700">Motif de retour/refus:</span> <span className="text-red-600">{selectedDeclaration.motifRefus}</span></div>}
              </div>
              <div className="flex justify-end mt-6"><button onClick={() => setShowDetailModal(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Fermer</button></div>
            </div>
          </div>
        )}

        {showCloseModal && selectedDeclaration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Cloturer la declaration?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Declaration {selectedDeclaration.numeroDeclaration || selectedDeclaration.numeroDemande} - Statut actuel: {DECL_STATUT_LABELS[selectedDeclaration.statut]}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCloseModal(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Annuler</button>
                <button onClick={handleClose} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Cloturer</button>
              </div>
            </div>
          </div>
        )}

        {showReturnModal && selectedDeclaration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Retourner la declaration</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Declaration {selectedDeclaration.numeroDeclaration || selectedDeclaration.numeroDemande}</p>
              <textarea value={returnMotif} onChange={e => setReturnMotif(e.target.value)} placeholder="Motif du retour..." className="w-full px-4 py-3 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-lg text-sm text-slate-700 dark:text-white mb-4" rows={3} />
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowReturnModal(false); setReturnMotif(""); }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Annuler</button>
                <button onClick={handleReturn} disabled={!returnMotif.trim()} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">Retourner</button>
              </div>
            </div>
          </div>
        )}

        {showBudgetCheckModal && budgetCheckResult && selectedDeclaration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Verification Budget</h3><button onClick={() => { setShowBudgetCheckModal(false); setBudgetCheckResult(null); }} className="text-slate-600 dark:text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
              <p className="text-sm text-slate-500 mb-3">Declaration {selectedDeclaration.numeroDeclaration || selectedDeclaration.numeroDemande} — Cout: <strong>{selectedDeclaration.coutProbleme?.toLocaleString() || 0} MAD</strong></p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Budget total:</span><span className="font-semibold">{budgetCheckResult.budgetTotal?.toLocaleString() || 0} MAD</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Budget utilise:</span><span className="font-semibold text-amber-600">{budgetCheckResult.budgetUtilise?.toLocaleString() || 0} MAD</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Budget restant:</span><span className={`font-semibold ${budgetCheckResult.budgetRestant > 0 ? 'text-green-600' : 'text-red-600'}`}>{budgetCheckResult.budgetRestant?.toLocaleString() || 0} MAD</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Budget suffisant:</span><span className={`font-bold ${budgetCheckResult.suffisant ? 'text-green-600' : 'text-red-600'}`}>{budgetCheckResult.suffisant ? "OUI" : "NON"}</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2"><div className={`h-2 rounded-full ${budgetCheckResult.suffisant ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, budgetCheckResult.pourcentageUtilise || 0)}%` }} /></div>
                <p className="text-xs text-slate-600 dark:text-slate-400 text-right">{budgetCheckResult.pourcentageUtilise || 0}% utilise</p>
              </div>
              {selectedDeclaration.statut === "EN_VALIDATION" && (
                <div className="border-t border-slate-200 dark:border-dark-border pt-4 mt-4">
                  <p className="text-sm font-semibold text-slate-700 dark:text-white mb-2">Decision budgetaire:</p>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setBudgetDecision("approuver")} className={`px-3 py-2 rounded-lg text-sm font-semibold ${budgetDecision === "approuver" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>Approuver</button>
                    <button onClick={() => setBudgetDecision("rejeter")} className={`px-3 py-2 rounded-lg text-sm font-semibold ${budgetDecision === "rejeter" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>Rejeter</button>
                    <button onClick={() => setBudgetDecision("différer")} className={`px-3 py-2 rounded-lg text-sm font-semibold ${budgetDecision === "différer" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"}`}>Differer</button>
                  </div>
                  <textarea value={budgetMotif} onChange={e => setBudgetMotif(e.target.value)} placeholder="Motif (optionnel)..." className="w-full px-4 py-3 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-lg text-sm text-slate-700 dark:text-white mb-3" rows={2} />
                  <button onClick={makeBudgetDecision} disabled={!budgetDecision} className="w-full bg-danone-blue text-white px-4 py-2 rounded-lg hover:bg-danone-blue-dark disabled:opacity-50">Confirmer la decision</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== CHECKLISTS TAB ===== */}
        {activeTab === "checklists" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-500" /> Checklists — Check-up Chauffeur</h3>
              <p className="text-xs text-slate-500 mb-4">Liste des check-up non conformes et réparations en attente de validation RS.</p>
              {checklists.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">Aucune checklist non conforme ou en attente</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-dark-border">
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Véhicule</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Chauffeur</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Statut</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Conforme</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklists.map((cl: any) => (
                        <tr key={cl.id} className="border-b border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border/50">
                          <td className="py-3 px-2 font-medium text-slate-800 dark:text-white">{cl.vehiculeImmatriculation}</td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{cl.chauffeurNom || "-"}</td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{fmtDate(cl.dateChecklist)}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              cl.statut === "COMPLETE" ? "bg-blue-100 text-blue-700" :
                              cl.statut === "REPAIRE" ? "bg-amber-100 text-amber-700" :
                              cl.statut === "VALIDATED" ? "bg-green-100 text-green-700" :
                              cl.statut === "REJECTED" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>{cl.statut}</span>
                          </td>
                          <td className="py-3 px-2">
                            {cl.estConforme === true ? <span className="text-green-600 font-medium">Oui</span> :
                             cl.estConforme === false ? <span className="text-red-600 font-medium">Non</span> :
                             <span className="text-slate-600 dark:text-slate-400">-</span>}
                          </td>
                          <td className="py-3 px-2">
                            {cl.statut === "REPAIRE" && (
                              <div className="flex gap-1">
                                <button onClick={() => validerChecklistRepair(cl.id)}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">
                                  <CheckCircle className="w-3.5 h-3.5 inline mr-1" />Réparé
                                </button>
                                <button onClick={() => rejeterChecklistRepair(cl.id)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">
                                  <XCircle className="w-3.5 h-3.5 inline mr-1" />Non réparé
                                </button>
                              </div>
                            )}
                            {cl.statut === "COMPLETE" && cl.estConforme === false && (
                              <div className="flex gap-1">
                                <button onClick={() => marquerChecklistRepare(cl.id)}
                                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600">
                                  <Wrench className="w-3.5 h-3.5 inline mr-1" />Réparation effectuée
                                </button>
                              </div>
                            )}
                            {cl.statut === "VALIDATED" && <span className="text-xs text-green-600">✓ Validée</span>}
                            {cl.statut === "REJECTED" && <span className="text-xs text-red-600">✗ Rejetée</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {pendingChecklists.length > 0 && (
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5 mt-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> Check-ups en attente de validation RS</h3>
                <p className="text-xs text-slate-500 mb-4">Ces check-ups ont été soumis par les chauffeurs et attendent votre validation pour débloquer le véhicule.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-dark-border">
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Véhicule</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Chauffeur</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Conforme</th>
                        <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingChecklists.map((cl: any) => (
                        <tr key={cl.id} className="border-b border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border/50">
                          <td className="py-3 px-2 font-medium text-slate-800 dark:text-white">{cl.vehiculeImmatriculation}</td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{cl.chauffeurNom || "-"}</td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{fmtDate(cl.dateChecklist)}</td>
                          <td className="py-3 px-2">
                            {cl.estConforme === true ? <span className="text-green-600 font-medium">✓ Conforme</span> :
                             cl.estConforme === false ? <span className="text-red-600 font-medium">✗ Non conforme</span> :
                             <span className="text-slate-600 dark:text-slate-400">-</span>}
                          </td>
                          <td className="py-3 px-2">
                            <button onClick={() => validerPendingChecklist(cl.id)}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />Valider
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <FleetDocumentManager />
        )}

        {/* ===== POWER BI TAB ===== */}
        {activeTab === "powerbi" && <PowerBiDashboard />}

        {/* ===== VEHICLE HISTORY TAB ===== */}
        {activeTab === "vehicleHistory" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><History className="w-5 h-5 text-cyan-500" /> Historique Vehicule</h3>
              <select value={historyVehicleId || ""} onChange={e => { const id = Number(e.target.value); if (id) fetchVehicleHistory(id); else setVehicleHistory(null); }} className="px-4 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-lg text-sm w-80">
                <option value="">-- Selectionner vehicule --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.truckNumber || v.immatriculation} - {v.immatriculation}</option>)}
              </select>
              {historyVehicleId && <button onClick={() => fetchVehicleHistory(historyVehicleId!)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-border dark:hover:bg-dark-border/80"><RefreshCw className="w-4 h-4" /></button>}
            </div>

            {!vehicleHistory ? (
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-12 text-center">
                <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-semibold">Selectionnez un vehicule</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Consultez l'historique complet: checkups, anomalies, documents, blocages, departs, tournees</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vehicle Info Card */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl"><Truck className="w-8 h-8 text-cyan-600" /></div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">{(vehicleHistory as any).vehicle?.truckNumber || (vehicleHistory as any).vehicle?.immatriculation}</h3>
                      <p className="text-sm text-slate-500">{(vehicleHistory as any).vehicle?.immatriculation} - {(vehicleHistory as any).vehicle?.marque} {(vehicleHistory as any).vehicle?.modele}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Chauffeur: {(vehicleHistory as any).vehicle?.chauffeurNom || "Non affecte"} | Statut: <span className={`font-semibold ${(vehicleHistory as any).vehicle?.statut === "BLOQUE" ? "text-red-500" : "text-green-500"}`}>{(vehicleHistory as any).vehicle?.statut || "N/A"}</span></p>
                    </div>
                    <div className="ml-auto grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg"><p className="text-lg font-bold text-blue-600">{(vehicleHistory as any).checkupsCount || 0}</p><p className="text-[10px] text-slate-500">Checkups</p></div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/10 rounded-lg"><p className="text-lg font-bold text-red-600">{(vehicleHistory as any).anomaliesCount || 0}</p><p className="text-[10px] text-slate-500">Anomalies</p></div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg"><p className="text-lg font-bold text-green-600">{(vehicleHistory as any).documentsCount || 0}</p><p className="text-[10px] text-slate-500">Documents</p></div>
                    </div>
                  </div>

                  {/* Blocage/Deblocage Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-dark-border/30">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">Date blocage</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-white">{fmtDate((vehicleHistory as any).blocageInfo?.dateBlocage)}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">{(vehicleHistory as any).blocageInfo?.bloquePar ? `par ${(vehicleHistory as any).blocageInfo.bloquePar}` : ""}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-dark-border/30">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">Date deblocage</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-white">{fmtDate((vehicleHistory as any).blocageInfo?.dateDeblocage)}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">{(vehicleHistory as any).blocageInfo?.debloquePar ? `par ${(vehicleHistory as any).blocageInfo.debloquePar}` : ""}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-dark-border/30">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">Raison blocage</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-white">{(vehicleHistory as any).blocageInfo?.raisonBlocage || "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-dark-border/30">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">Departs / Tournees</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-white">{(vehicleHistory as any).departsCount || 0} / {(vehicleHistory as any).tourneesCount || 0}</p>
                    </div>
                  </div>

                  {/* Document Status per Type */}
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Documents Reglementaires</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries((vehicleHistory as any).documentStatus || {}).map(([type, ds]: [string, any]) => {
                        const colors: Record<string, string> = { VALIDE: "bg-green-100 text-green-700 border-green-200", EXPIRE_BIENTOT: "bg-amber-100 text-amber-700 border-amber-200", EXPIRE: "bg-red-100 text-red-700 border-red-200", MANQUANT: "bg-red-50 text-red-500 border-red-200" };
                        const icons: Record<string, React.ReactNode> = { ASSURANCE: <Shield className="w-4 h-4" />, ONSSA: <FileCheck className="w-4 h-4" />, VISITE_TECHNIQUE: <Car className="w-4 h-4" />, CARTE_GRISE: <FileText className="w-4 h-4" />, METROLOGIQUE: <Calendar className="w-4 h-4" /> };
                        return (
                          <div key={type} className={`p-3 rounded-lg border ${colors[ds.etat] || "bg-slate-50 border-slate-200"} text-center`}>
                            <div className="flex justify-center mb-1">{icons[type] || <FileText className="w-4 h-4" />}</div>
                            <p className="text-[10px] font-bold">{ds.label}</p>
                            <p className="text-[9px] mt-1">{ds.numero || "-"}</p>
                            <p className="text-[9px]">{ds.dateExpiration ? `Exp: ${fmtDate(ds.dateExpiration).substring(0, 10)}` : ""}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Unifies Checkups History (old + new checklists) */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-1"><ClipboardList className="w-4 h-4 text-indigo-500" /> Check-ups Chauffeur ({(vehicleHistory as any).checklistsCount || 0})</h4>
                  {Array.isArray((vehicleHistory as any).checklists) && (vehicleHistory as any).checklists.length > 0 ? (
                    <div className="space-y-4">
                      {(vehicleHistory as any).checklists.map((cl: any) => (
                        <div key={cl.id} className="border border-slate-200 dark:border-dark-border rounded-xl p-4 bg-slate-50/50 dark:bg-dark-border/20">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-white">{fmtDate(cl.dateChecklist)}</p>
                              <p className="text-[10px] text-slate-500">Chauffeur: {cl.chauffeurNom || "-"} | Tournée: {cl.tourneeId || "-"}</p>
                            </div>
                            <div className="flex gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cl.statut === "VALIDATED" ? "bg-green-100 text-green-700" :
                                cl.statut === "PENDING" ? "bg-blue-100 text-blue-700" :
                                cl.statut === "COMPLETE" ? "bg-red-100 text-red-700" :
                                cl.statut === "REPAIRE" ? "bg-amber-100 text-amber-700" :
                                cl.statut === "REJECTED" ? "bg-red-100 text-red-700" :
                                "bg-slate-100 text-slate-600"
                              }`}>{cl.statut}</span>
                              {cl.estConforme === true ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Conforme</span> :
                               cl.estConforme === false ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Non conforme</span> : null}
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 mb-3">
                            {[
                              { key: "pneus", label: "Pneus" },
                              { key: "freins", label: "Freins" },
                              { key: "feux", label: "Feux" },
                              { key: "extincteur", label: "Extincteur" },
                              { key: "documents", label: "Documents" },
                              { key: "carrosserie", label: "Carrosserie" },
                              { key: "huileNiveau", label: "Huile" },
                              { key: "batterie", label: "Batterie" },
                              { key: "essuieGlaces", label: "Essuie-glaces" },
                              { key: "ceinturesSecurite", label: "Ceintures" },
                            ].map(item => (
                              <div key={item.key} className="flex items-center gap-1 text-[10px]">
                                <span className="text-slate-500">{item.label}:</span>
                                {cl[item.key] === true ? <CheckCircle className="w-3 h-3 text-green-500" /> :
                                 cl[item.key] === false ? <XCircle className="w-3 h-3 text-red-500" /> :
                                 <span className="text-slate-300">-</span>}
                              </div>
                            ))}
                          </div>
                          {cl.defautsJson && cl.defautsJson !== "[]" && cl.defautsJson !== "{}" && (
                            <div className="mb-2">
                              <p className="text-[10px] font-bold text-red-600">Défauts:</p>
                              <p className="text-[10px] text-slate-600">{cl.defautsJson}</p>
                            </div>
                          )}
                          {cl.commentaireGeneral && (
                            <div className="mb-2">
                              <p className="text-[10px] font-bold text-slate-600">Commentaire:</p>
                              <p className="text-[10px] text-slate-500">{cl.commentaireGeneral}</p>
                            </div>
                          )}
                          {cl.reparationsJson && cl.reparationsJson !== "[]" && cl.reparationsJson !== "{}" && (
                            <div className="mb-2">
                              <p className="text-[10px] font-bold text-amber-600">Réparations:</p>
                              <p className="text-[10px] text-slate-600">{cl.reparationsJson}</p>
                            </div>
                          )}
                          {cl.validePar && (
                            <div className="mb-2">
                              <p className="text-[10px] text-slate-500">Validé par: {cl.validePar} {cl.dateValidation ? `le ${fmtDate(cl.dateValidation)}` : ""}</p>
                            </div>
                          )}
                          {cl.signature && (
                            <div className="mt-2">
                              <p className="text-[10px] font-bold text-slate-600 mb-1">Signature chauffeur:</p>
                              <img src={cl.signature} alt="Signature" className="h-12 border border-slate-300 dark:border-dark-border rounded bg-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 dark:text-slate-400">Aucun check-up enregistre</p>}
                </div>

                {/* Anomalies History */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" /> Anomalies ({(vehicleHistory as any).anomaliesCount || 0}) - {(vehicleHistory as any).anomaliesOuvertes || 0} ouvertes</h4>
                  {Array.isArray((vehicleHistory as any).anomalies) && (vehicleHistory as any).anomalies.length > 0 ? (
                    <div className="space-y-2">
                      {(vehicleHistory as any).anomalies.slice(0, 10).map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-dark-border/30 rounded-lg">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ANOMALIE_STATUT_COLORS[a.statut] || "bg-gray-100 text-gray-700"}`}>{ANOMALIE_STATUT_LABELS[a.statut] || a.statut}</span>
                          <span className="text-xs text-slate-700 dark:text-white flex-1">{a.element} - {a.description}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{fmtDate(a.dateDetection).substring(0, 10)}</span>
                          {a.photoUrl && <a href={`/uploads/${a.photoUrl}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline">Photo</a>}
                        </div>
                      ))}
                      {(vehicleHistory as any).anomalies.length > 10 && <p className="text-xs text-slate-600 dark:text-slate-400 text-center">... et {(vehicleHistory as any).anomalies.length - 10} autres</p>}
                    </div>
                  ) : <p className="text-xs text-slate-600 dark:text-slate-400">Aucune anomalie enregistree</p>}
                </div>

                {/* Blocages History */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-1"><XCircle className="w-4 h-4 text-orange-500" /> Historique Blocages/Deblocages</h4>
                  {Array.isArray((vehicleHistory as any).blocages) && (vehicleHistory as any).blocages.length > 0 ? (
                    <div className="space-y-2">
                      {(vehicleHistory as any).blocages.map((b: any) => (
                        <div key={b.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-dark-border/30 rounded-lg">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.bloque ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{b.bloque ? "Bloque" : "Debloque"}</span>
                          <span className="text-xs text-slate-700 dark:text-white flex-1">{b.raison || "-"}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">Bloque: {fmtDate(b.dateBlocage).substring(0, 16)}</span>
                          {b.dateDeblocage && <span className="text-[10px] text-green-500">Debloque: {fmtDate(b.dateDeblocage).substring(0, 16)}</span>}
                          {b.bloquePar && <span className="text-[10px] text-slate-600 dark:text-slate-400">par {b.bloquePar}</span>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 dark:text-slate-400">Aucun historique de blocage</p>}
                </div>

                {/* Departs History */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-1"><Truck className="w-4 h-4 text-blue-500" /> Departs ({(vehicleHistory as any).departsCount || 0})</h4>
                  {Array.isArray((vehicleHistory as any).departs) && (vehicleHistory as any).departs.length > 0 ? (
                    <div className="space-y-2">
                      {(vehicleHistory as any).departs.slice(0, 10).map((d: any) => (
                        <div key={d.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-dark-border/30 rounded-lg">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${d.resultatControle === "CONFORME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{d.resultatControle || "-"}</span>
                          <span className="text-xs text-slate-700 dark:text-white">{d.numeroDepart || "-"}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{d.dateDepart} {d.heureDepart}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">Chauffeur: {d.chauffeurNom || "-"}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 dark:text-slate-400">Aucun depart enregistre</p>}
                </div>

                {/* Tournees History */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-1"><Calendar className="w-4 h-4 text-purple-500" /> Tournees ({(vehicleHistory as any).tourneesCount || 0})</h4>
                  {Array.isArray((vehicleHistory as any).tournees) && (vehicleHistory as any).tournees.length > 0 ? (
                    <div className="space-y-2">
                      {(vehicleHistory as any).tournees.slice(0, 10).map((t: any) => (
                        <div key={t.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-dark-border/30 rounded-lg">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.statut === "TERMINEE" ? "bg-green-100 text-green-700" : t.statut === "EN_COURS" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{t.statut || "-"}</span>
                          <span className="text-xs text-slate-700 dark:text-white">{t.numeroTournee || t.idTournee || "-"}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{fmtDate(t.dateTournee).substring(0, 10)}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">Site: {t.site || "-"}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600 dark:text-slate-400">Aucune tournee enregistree</p>}
                </div>
              </div>
            )}
          </div>
        )}


        {showCreateBudgetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Nouveau Budget Trimestriel</h3><button onClick={() => setShowCreateBudgetModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Annee</label><input type="number" value={newBudgetForm.annee} onChange={e => setNewBudgetForm({ ...newBudgetForm, annee: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trimestre</label><select value={newBudgetForm.trimestre} onChange={e => setNewBudgetForm({ ...newBudgetForm, trimestre: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-lg text-sm"><option value={1}>T1 (Jan-Mar)</option><option value={2}>T2 (Avr-Jun)</option><option value={3}>T3 (Jul-Sep)</option><option value={4}>T4 (Oct-Dec)</option></select></div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Budget Total (MAD)</label><input type="number" value={newBudgetForm.budgetTotal} onChange={e => setNewBudgetForm({ ...newBudgetForm, budgetTotal: e.target.value })} placeholder="Ex: 500000" className="w-full px-4 py-2 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setShowCreateBudgetModal(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Annuler</button>
                <button onClick={handleCreateBudget} disabled={!newBudgetForm.budgetTotal} className="bg-danone-blue text-white px-4 py-2 rounded-lg hover:bg-danone-blue-dark disabled:opacity-50">Creer</button>
              </div>
            </div>
          </div>
        )}


      </div>
    </DashboardLayout>
  );
};

export default ModernResponsableSupportDashboard;
