import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { User } from "../types/incident";
import DashboardLayout from "./ui/DashboardLayout";
import Toast from "./ui/Toast";
import {
  Users, Truck, Plus, Search, Edit3, Trash2, RefreshCw, Shield, ShieldOff,
  XCircle, Link2, Unlink, LogOut, Activity, CheckCircle, XCircle as XIcon,
  ChevronDown, ChevronUp, UserPlus, Gauge, AlertTriangle,
} from "lucide-react";
import { KPICard, GlassCard, SkeletonShimmer, soundManager } from "../lib/premium";
import { FormInput, FormSelect, FormTextarea, FormSection, FormModal } from "../lib/premium/forms";

const VEHICLE_API = "http://localhost:8080/api/vehicles";
const USER_API = "http://localhost:8080/users";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" }, { value: "CHAUFFEUR", label: "Chauffeur" },
  { value: "PRESTATAIRE", label: "Prestataire" }, { value: "RS", label: "Responsable Support" },
  { value: "MAINTENANCE", label: "Maintenance" }, { value: "SL", label: "Superviseur Livraison" },
  { value: "RPF", label: "RPF" }, { value: "ASM", label: "ASM" },
  { value: "CPL", label: "Chef Parc Logistic" }, { value: "DRL", label: "Dir. Regional Logistic" },
  { value: "RFL", label: "Responsable Flotte" }, { value: "POWERBI", label: "PowerBI" },
];

const ROLE_STYLES: Record<string, { glow: string; text: string }> = {
  ADMIN: { glow: "shadow-glow-rose", text: "text-rose-400" },
  CHAUFFEUR: { glow: "shadow-glow-blue", text: "text-blue-400" },
  RS: { glow: "shadow-glow-violet", text: "text-violet-400" },
  PRESTATAIRE: { glow: "shadow-glow-amber", text: "text-amber-400" },
  MAINTENANCE: { glow: "shadow-glow-emerald", text: "text-emerald-400" },
};

const fmtDate = (d: any): string => {
  if (!d) return "-";
  if (typeof d === "string") return d.substring(0, 16).replace("T", " ");
  if (Array.isArray(d)) { const [y, mo, da, h, mi] = d; return y + "-" + String(mo).padStart(2, "0") + "-" + String(da).padStart(2, "0") + " " + String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0"); }
  return String(d);
};

const inputClass = "w-full px-4 h-12 glass border border-white/[0.06] rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 focus:shadow-glow-blue transition-all";

interface AdminModuleProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function AdminModule({ currentUser, onLogout }: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<"users" | "vehicles" | "assign" | "history">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userHistory, setUserHistory] = useState<Record<number, any>>({});

  const showToast = (m: string, t: "success" | "error" | "info" | "warning") => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, vRes] = await Promise.all([axios.get(USER_API), axios.get(VEHICLE_API)]);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setVehicles((vRes.data as any)?.vehicles || vRes.data || []);
      setChauffeurs((Array.isArray(uRes.data) ? uRes.data : []).filter((u: any) => u.role === "CHAUFFEUR"));
    } catch { showToast("Erreur chargement", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchUserHistory = async (userId: number) => {
    try {
      const res = await axios.get(USER_API + "/" + userId + "/history");
      setUserHistory(prev => ({ ...prev, [userId]: res.data }));
    } catch { setUserHistory(prev => ({ ...prev, [userId]: { connections: [], audits: [] } })); }
  };

  const handleLogout = () => {
    soundManager.click();
    localStorage.removeItem("currentUser");
    if (onLogout) onLogout();
    else window.location.reload();
  };

  const filteredUsers = users.filter((u: any) =>
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.firstname || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredVehicles = vehicles.filter((v: any) =>
    (v.immatriculation || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.truckNumber || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.chauffeurNom || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveUser = async () => {
    if (!form.username || !form.role) { showToast("Username et role obligatoires", "error"); return; }
    try {
      if (editItem?.id) { await axios.put(USER_API + "/" + editItem.id, form); showToast("Utilisateur mis a jour", "success"); }
      else { await axios.post(USER_API, form); showToast("Utilisateur cree", "success"); }
      setShowModal(false); setEditItem(null); setForm({}); fetchAll();
    } catch (err: any) { showToast(err?.response?.data?.error || "Erreur", "error"); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Desactiver cet utilisateur ?")) return;
    try { await axios.delete(USER_API + "/" + id, { headers: { "Content-Type": "application/json" }, data: { holdReason: "Desactivation admin" } } as any); showToast("Utilisateur desactive", "success"); fetchAll(); }
    catch (err: any) { showToast(err?.response?.data?.error || "Erreur", "error"); }
  };

  const toggleUserStatus = async (u: any) => {
    const newStatus = u.status === "ACTIF" ? "INACTIF" : "ACTIF";
    try { await axios.put(USER_API + "/" + u.id + "/status", { status: newStatus, reason: newStatus === "INACTIF" ? "Desactivation par admin" : "Reactivation par admin" }); showToast("Utilisateur " + newStatus, "success"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const handleSaveVehicle = async () => {
    if (!form.immatriculation) { showToast("Immatriculation obligatoire", "error"); return; }
    try {
      if (editItem?.id) { await axios.put(VEHICLE_API + "/" + editItem.id, form); showToast("Vehicule mis a jour", "success"); }
      else { await axios.post(VEHICLE_API, form); showToast("Vehicule cree", "success"); }
      setShowModal(false); setEditItem(null); setForm({}); fetchAll();
    } catch (err: any) { showToast(err?.response?.data?.error || "Erreur", "error"); }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm("Supprimer ce vehicule ?")) return;
    try { await axios.delete(VEHICLE_API + "/" + id); showToast("Vehicule supprime", "success"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const handleAssignChauffeur = async (vehicleId: number, chauffeurId: number, chauffeurNom: string) => {
    try { await axios.put(VEHICLE_API + "/" + vehicleId, { chauffeurId, chauffeurNom }); showToast("Chauffeur " + chauffeurNom + " affecte", "success"); fetchAll(); }
    catch (err: any) { showToast(err?.response?.data?.error || "Erreur affectation", "error"); }
  };

  const handleUnassignChauffeur = async (vehicleId: number) => {
    try { await axios.put(VEHICLE_API + "/" + vehicleId, { chauffeurId: null, chauffeurNom: null }); showToast("Chauffeur desaffecte", "info"); fetchAll(); }
    catch { showToast("Erreur", "error"); }
  };

  const navItems = [
    { id: "users", label: "Utilisateurs", icon: <Users className="w-5 h-5" />, active: activeTab === "users", onClick: () => { soundManager.tap(); setActiveTab("users"); } },
    { id: "vehicles", label: "Camions", icon: <Truck className="w-5 h-5" />, active: activeTab === "vehicles", onClick: () => { soundManager.tap(); setActiveTab("vehicles"); } },
    { id: "assign", label: "Affectations", icon: <Link2 className="w-5 h-5" />, active: activeTab === "assign", onClick: () => { soundManager.tap(); setActiveTab("assign"); } },
    { id: "history", label: "Historique", icon: <Activity className="w-5 h-5" />, active: activeTab === "history", onClick: () => { soundManager.tap(); setActiveTab("history"); } },
    { id: "logout", label: "Deconnexion", icon: <LogOut className="w-5 h-5" />, active: false, onClick: handleLogout },
  ];

  const activeCount = users.filter((u: any) => u.status === "ACTIF" || !u.status).length;
  const inactiveCount = users.filter((u: any) => u.status === "INACTIF").length;
  const availableVehicles = vehicles.filter((v: any) => v.statut === "DISPONIBLE").length;

  const tabButtons = [
    { id: "users" as const, label: "Utilisateurs", count: users.length, icon: Users },
    { id: "vehicles" as const, label: "Camions", count: vehicles.length, icon: Truck },
    { id: "assign" as const, label: "Affectations", count: 0, icon: Link2 },
    { id: "history" as const, label: "Historique", count: 0, icon: Activity },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Administration" subtitle="Gestion utilisateurs, camions & affectations" currentUser={currentUser} onLogout={onLogout}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass-strong rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <SkeletonShimmer className="h-11 w-11" rounded="rounded-2xl" />
                  <SkeletonShimmer className="h-4 w-16" />
                </div>
                <SkeletonShimmer className="h-8 w-28" />
                <SkeletonShimmer className="h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="glass-strong rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.03]"><SkeletonShimmer className="h-5 w-48" /></div>
            {[...Array(5)].map((_, r) => (
              <div key={r} className="p-4 flex gap-4 border-b border-white/[0.02]">
                {[...Array(6)].map((_, c) => <SkeletonShimmer key={c} className="h-4 flex-1" rounded="rounded-md" />)}
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Administration" subtitle="Gestion utilisateurs, camions & affectations" currentUser={currentUser} onLogout={onLogout}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Utilisateurs actifs" value={activeCount} icon={<Users className="w-5 h-5" />} glow="emerald" delay={0} />
          <KPICard label="Utilisateurs inactifs" value={inactiveCount} icon={<ShieldOff className="w-5 h-5" />} glow="rose" delay={0.08} />
          <KPICard label="Chauffeurs" value={chauffeurs.length} icon={<Truck className="w-5 h-5" />} glow="blue" delay={0.16} />
          <KPICard label="Camions disponibles" value={availableVehicles} icon={<CheckCircle className="w-5 h-5" />} glow="violet" delay={0.24} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tabButtons.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => { soundManager.tap(); setActiveTab(tab.id); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={"flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium relative overflow-hidden transition-colors " + (isActive ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-200")}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent rounded-2xl border border-blue-500/20"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                {tab.count > 0 && <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/[0.06] text-slate-600 dark:text-slate-400">{tab.count}</span>}
              </motion.button>
            );
          })}
          <motion.button onClick={() => { soundManager.tap(); fetchAll(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ml-auto p-2.5 glass rounded-xl hover:bg-white/[0.06] transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }} className="space-y-5">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher utilisateur..." className="w-full pl-10 pr-4 h-12 glass border border-white/[0.06] rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/30 transition-all" />
                </div>
                <motion.button onClick={() => { soundManager.click(); setForm({ username: "", firstname: "", name: "", role: "CHAUFFEUR", email: "", phone: "", branchCode: "", passwordDigest: "", status: "ACTIF" }); setEditItem(null); setShowModal(true); }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-sm font-semibold shadow-glow-blue hover:shadow-glow-blue-lg transition-shadow">
                  <UserPlus className="w-4 h-4" /> Nouvel utilisateur
                </motion.button>
              </div>

              <div className="glass-strong rounded-3xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {["ID", "Username", "Nom complet", "Email", "Role", "Statut", "Derniere connexion", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredUsers.map((u: any, i: number) => (
                          <motion.tr key={u.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                            <td className="px-4 py-3 text-xs text-slate-500">{u.id}</td>
                            <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                            <td className="px-4 py-3 text-slate-300">{u.firstname} {u.name}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{u.email || "-"}</td>
                            <td className="px-4 py-3"><span className={"inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold glass " + (ROLE_STYLES[u.role]?.text || "text-slate-600 dark:text-slate-400")}>{ROLE_OPTIONS.find(r => r.value === u.role)?.label || u.role}</span></td>
                            <td className="px-4 py-3">
                              <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold glass " + (u.status === "INACTIF" ? "text-rose-400" : "text-emerald-400")}>
                                <span className={"w-1.5 h-1.5 rounded-full " + (u.status === "INACTIF" ? "bg-rose-400" : "bg-emerald-400")} />{u.status || "ACTIF"}
                              </span>
                              {u.holdPerson && <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/15 text-rose-400">BLOQUE</span>}
                            </td>
                            <td className="px-4 py-3 text-[10px] text-slate-500">{fmtDate(u.lastConnectionDate)}</td>
                            <td className="px-4 py-3"><div className="flex gap-1">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.tap(); setForm({...u}); setEditItem(u); setShowModal(true); }} className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.tap(); toggleUserStatus(u); }} className={"p-2 rounded-lg transition-colors " + (u.status === "ACTIF" ? "hover:bg-amber-500/10 text-amber-400" : "hover:bg-emerald-500/10 text-emerald-400")} title={u.status === "ACTIF" ? "Desactiver" : "Activer"}>{u.status === "ACTIF" ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}</motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.tap(); setExpandedUser(expandedUser === u.id ? null : u.id); }} className="p-2 rounded-lg hover:bg-white/[0.04] text-slate-600 dark:text-slate-400 transition-colors" title="Details">{expandedUser === u.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</motion.button>
                            </div></td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && <div className="py-16 text-center"><Users className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500">Aucun utilisateur trouve</p></div>}
              </div>

              <AnimatePresence>
                {expandedUser !== null && userHistory[expandedUser] !== undefined && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <GlassCard hover={false} className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: "Person Code", value: users.find(u => u.id === expandedUser)?.personCode },
                          { label: "Telephone", value: users.find(u => u.id === expandedUser)?.phone },
                          { label: "Mobile", value: users.find(u => u.id === expandedUser)?.cellularPhone },
                          { label: "Ville", value: users.find(u => u.id === expandedUser)?.ville },
                          { label: "Branch Code", value: users.find(u => u.id === expandedUser)?.branchCode },
                          { label: "Cree le", value: fmtDate(users.find(u => u.id === expandedUser)?.creationDate) },
                          { label: "Motif blocage", value: users.find(u => u.id === expandedUser)?.holdReason },
                        ].map((d, idx) => (
                          <div key={idx}><span className="text-slate-500">{d.label}:</span><span className="ml-1.5 font-medium text-slate-300">{d.value || "-"}</span></div>
                        ))}
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Historique connexions</p>
                        {(userHistory[expandedUser].connections || []).slice(0, 10).map((c: any, ci: number) => (
                          <div key={ci} className="flex items-center gap-3 px-3 py-2 glass rounded-xl text-xs">
                            <span className={c.success ? "text-emerald-400" : "text-rose-400"}>{c.success ? <CheckCircle className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}</span>
                            <span className="text-slate-600 dark:text-slate-400">{fmtDate(c.connectionDate)}</span>
                            <span className="text-slate-500">via {c.authMethod}</span>
                            {c.ipAddress && <span className="text-slate-600">IP: {c.ipAddress}</span>}
                          </div>
                        ))}
                        {(userHistory[expandedUser].connections || []).length === 0 && <p className="text-xs text-slate-600">Aucune connexion enregistree</p>}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "vehicles" && (
            <motion.div key="vehicles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }} className="space-y-5">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher camion..." className="w-full pl-10 pr-4 h-12 glass border border-white/[0.06] rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/30 transition-all" />
                </div>
                <motion.button onClick={() => { soundManager.click(); setForm({ immatriculation: "", marque: "", modele: "", type: "", statut: "DISPONIBLE", truckNumber: "", conforme: true, kilometrage: 0 }); setEditItem(null); setShowModal(true); }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-sm font-semibold shadow-glow-blue hover:shadow-glow-blue-lg transition-shadow">
                  <Plus className="w-4 h-4" /> Ajouter camion
                </motion.button>
              </div>

              <div className="glass-strong rounded-3xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.04]">{["N Camion", "Immatriculation", "Marque/Modele", "Chauffeur", "Statut", "Conforme", "Actions"].map(h => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredVehicles.map((v: any, i: number) => (
                          <motion.tr key={v.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                            <td className="px-4 py-3 font-semibold text-white">{v.truckNumber || "-"}</td>
                            <td className="px-4 py-3 font-mono text-blue-400">{v.immatriculation}</td>
                            <td className="px-4 py-3 text-slate-300">{v.marque} {v.modele}</td>
                            <td className="px-4 py-3">{v.chauffeurNom ? <span className="text-slate-200">{v.chauffeurNom}</span> : <span className="text-slate-600 italic">Non assigne</span>}</td>
                            <td className="px-4 py-3"><span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold glass " + (v.statut === "DISPONIBLE" ? "text-emerald-400" : v.statut === "BLOQUE" ? "text-rose-400" : "text-amber-400")}><span className={"w-1.5 h-1.5 rounded-full " + (v.statut === "DISPONIBLE" ? "bg-emerald-400" : v.statut === "BLOQUE" ? "bg-rose-400" : "bg-amber-400")} />{v.statut}</span></td>
                            <td className="px-4 py-3"><span className={"inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold glass " + (v.conforme ? "text-emerald-400" : "text-rose-400")}>{v.conforme ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {v.conforme ? "Oui" : "Non"}</span></td>
                            <td className="px-4 py-3"><div className="flex gap-1">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.tap(); setForm({...v}); setEditItem(v); setShowModal(true); }} className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={async () => { soundManager.tap(); const ns = v.statut === "BLOQUE" ? "DISPONIBLE" : "BLOQUE"; await axios.put(VEHICLE_API + "/" + v.id + "/statut", { statut: ns }); showToast("Vehicule " + ns, "success"); fetchAll(); }} className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors" title="Bloquer/Debloquer">{v.statut === "BLOQUE" ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}</motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.tap(); handleDeleteVehicle(v.id); }} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></motion.button>
                            </div></td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                {filteredVehicles.length === 0 && <div className="py-16 text-center"><Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500">Aucun camion trouve</p></div>}
              </div>
            </motion.div>
          )}

          {activeTab === "assign" && (
            <motion.div key="assign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }} className="space-y-5">
              <GlassCard hover={false}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0"><Link2 className="w-5 h-5 text-blue-400" /></div>
                  <p className="text-sm text-slate-300 pt-2"><strong className="text-white">Affectation Chauffeur-Camion :</strong> 1 chauffeur peut avoir plusieurs camions. Un camion ne peut appartenir qu'a un seul chauffeur.</p>
                </div>
              </GlassCard>
              <div className="glass-strong rounded-3xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.04]">{["Camion", "Immatriculation", "Statut", "Chauffeur actuel", "Affecter", ""].map(h => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody>
                      {vehicles.map((v: any, i: number) => (
                        <motion.tr key={v.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-semibold text-white">{v.truckNumber || "-"}</td>
                          <td className="px-4 py-3 font-mono text-blue-400">{v.immatriculation}</td>
                          <td className="px-4 py-3"><span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold glass " + (v.statut === "DISPONIBLE" ? "text-emerald-400" : v.statut === "BLOQUE" ? "text-rose-400" : "text-amber-400")}><span className={"w-1.5 h-1.5 rounded-full " + (v.statut === "DISPONIBLE" ? "bg-emerald-400" : v.statut === "BLOQUE" ? "bg-rose-400" : "bg-amber-400")} />{v.statut}</span></td>
                          <td className="px-4 py-3">{v.chauffeurNom ? <span className="font-medium text-slate-200">{v.chauffeurNom}</span> : <span className="text-slate-600 italic">Non assigne</span>}</td>
                          <td className="px-4 py-3">
                            <FormSelect label="" value={String(v.chauffeurId || "")} onChange={(val) => { const cId = val ? Number(val) : null; const ch = chauffeurs.find((c: any) => c.id === Number(val)); if (cId && ch) handleAssignChauffeur(v.id, cId, (ch.firstname || "") + " " + (ch.name || "").trim()); else handleUnassignChauffeur(v.id); }} options={[{ value: "", label: "-- Aucun --" }, ...chauffeurs.map((c: any) => ({ value: String(c.id), label: (c.firstname || "") + " " + (c.name || "") + " (" + (c.username || "") + ")" }))]} />
                          </td>
                          <td className="px-4 py-3">{v.chauffeurId && <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.tap(); handleUnassignChauffeur(v.id); }} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors" title="Desaffecter"><Unlink className="w-4 h-4" /></motion.button>}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }} className="space-y-5">
              <GlassCard hover={false} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Dernieres connexions</h3>
                  <motion.button onClick={async () => { soundManager.click(); try { const res = await axios.get(USER_API + "/connections/all"); setUserHistory(prev => ({ ...prev, all: res.data })); } catch { showToast("Erreur chargement connexions", "error"); } }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-4 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-glow-blue transition-shadow">
                    <RefreshCw className="w-4 h-4" /> Charger toutes les connexions
                  </motion.button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {(userHistory as any)["all"]?.connections?.slice(0, 50).map((c: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 px-4 py-3 glass rounded-xl">
                      <span className={c.success ? "text-emerald-400" : "text-rose-400"}>{c.success ? <CheckCircle className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}</span>
                      <span className="text-sm font-medium text-white">{c.username}</span>
                      <span className="text-xs text-slate-500">{c.role}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 ml-auto">{fmtDate(c.connectionDate)}</span>
                      <span className="text-xs text-slate-500">{c.authMethod}</span>
                    </motion.div>
                  )) || <div className="text-center py-12"><Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500">Cliquez sur "Charger toutes les connexions" pour voir l'historique</p></div>}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <FormModal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={activeTab === "users" ? (editItem ? "Modifier utilisateur" : "Nouvel utilisateur") : (editItem ? "Modifier camion" : "Nouveau camion")}
          icon={activeTab === "users" ? <Users className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(false)} className="px-5 h-11 glass rounded-2xl text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-slate-200 transition-colors">Annuler</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={activeTab === "users" ? handleSaveUser : handleSaveVehicle} className="px-5 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-sm font-semibold shadow-glow-blue transition-shadow">{editItem ? "Mettre a jour" : "Creer"}</motion.button>
            </div>
          }
        >
          {activeTab === "users" ? (
            <div className="space-y-6">
              <FormSection title="Identite" icon={<Users className="w-4 h-4" />} index={0} accentColor="blue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Username" value={form.username || ""} onChange={(v) => setForm({...form, username: v})} required />
                  <FormInput label="Prenom" value={form.firstname || ""} onChange={(v) => setForm({...form, firstname: v})} />
                  <FormInput label="Nom" value={form.name || ""} onChange={(v) => setForm({...form, name: v})} />
                  <FormInput label="Email" value={form.email || ""} onChange={(v) => setForm({...form, email: v})} type="email" />
                </div>
              </FormSection>
              <FormSection title="Contact" icon={<Gauge className="w-4 h-4" />} index={1} accentColor="emerald">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Telephone" value={form.phone || ""} onChange={(v) => setForm({...form, phone: v})} type="tel" />
                  <FormInput label="Mobile" value={form.cellularPhone || ""} onChange={(v) => setForm({...form, cellularPhone: v})} type="tel" />
                </div>
              </FormSection>
              <FormSection title="Acces & Securite" icon={<Shield className="w-4 h-4" />} index={2} accentColor="violet">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect label="Role" value={form.role || "CHAUFFEUR"} onChange={(v) => setForm({...form, role: v})} options={ROLE_OPTIONS} required />
                  <FormSelect label="Statut" value={form.status || "ACTIF"} onChange={(v) => setForm({...form, status: v})} options={[{ value: "ACTIF", label: "ACTIF" }, { value: "INACTIF", label: "INACTIF" }]} />
                  <FormInput label="Person Code" value={form.personCode || ""} onChange={(v) => setForm({...form, personCode: v})} placeholder="PC-001" required />
                  <FormInput label="Code branche" value={form.branchCode || ""} onChange={(v) => setForm({...form, branchCode: v})} />
                  <FormInput label="Ville" value={form.ville || ""} onChange={(v) => setForm({...form, ville: v})} />
                  <FormInput label={editItem ? "Mot de passe (laisser vide)" : "Mot de passe"} value={form.passwordDigest || ""} onChange={(v) => setForm({...form, passwordDigest: v})} type="password" required={!editItem} />
                </div>
              </FormSection>
            </div>
          ) : (
            <div className="space-y-6">
              <FormSection title="Identification" icon={<Truck className="w-4 h-4" />} index={0} accentColor="blue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Immatriculation" value={form.immatriculation || ""} onChange={(v) => setForm({...form, immatriculation: v})} required />
                  <FormInput label="N Camion" value={form.truckNumber || ""} onChange={(v) => setForm({...form, truckNumber: v})} />
                  <FormInput label="Marque" value={form.marque || ""} onChange={(v) => setForm({...form, marque: v})} />
                  <FormInput label="Modele" value={form.modele || ""} onChange={(v) => setForm({...form, modele: v})} />
                </div>
              </FormSection>
              <FormSection title="Configuration" icon={<Gauge className="w-4 h-4" />} index={1} accentColor="emerald">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect label="Type" value={form.type || ""} onChange={(v) => setForm({...form, type: v})} options={[{ value: "", label: "-- Type --" }, { value: "CAMION", label: "Camion" }, { value: "UTILITAIRE", label: "Utilitaire" }, { value: "BUS", label: "Bus" }, { value: "FOURGON", label: "Fourgon" }, { value: "TRACTEUR", label: "Tracteur" }, { value: "REMORQUE", label: "Remorque" }]} />
                  <FormInput label="Site / Agence" value={form.branchCode || form.agence || ""} onChange={(v) => setForm({...form, branchCode: v, agence: v})} placeholder="Ex: PARIS, LYON..." />
                  <FormSelect label="Statut" value={form.statut || "DISPONIBLE"} onChange={(v) => setForm({...form, statut: v})} options={[{ value: "DISPONIBLE", label: "DISPONIBLE" }, { value: "BLOQUE", label: "BLOQUE" }, { value: "EN_MAINTENANCE", label: "EN MAINTENANCE" }]} />
                  <FormInput label="Chauffeur" value={form.chauffeurNom || ""} onChange={(v) => setForm({...form, chauffeurNom: v})} />
                  <FormInput label="Km" value={form.kilometrage || 0} onChange={(v) => setForm({...form, kilometrage: Number(v)})} type="number" />
                  <FormSelect label="Conforme" value={form.conforme ? "true" : "false"} onChange={(v) => setForm({...form, conforme: v === "true"})} options={[{ value: "true", label: "Oui" }, { value: "false", label: "Non" }]} />
                </div>
              </FormSection>
              <FormSection title="Notes" icon={<Edit3 className="w-4 h-4" />} index={2} accentColor="amber">
                <FormTextarea label="Notes" value={form.notes || ""} onChange={(v) => setForm({...form, notes: v})} rows={2} />
              </FormSection>
            </div>
          )}
        </FormModal>
      </div>
    </DashboardLayout>
  );
}
