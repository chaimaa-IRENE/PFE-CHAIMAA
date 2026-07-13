import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "./ui/DashboardLayout";
import Badge from "./ui/Badge";
import Toast from "./ui/Toast";
import {
  Truck, Plus, Search, XCircle, Edit3, RefreshCw, Shield, ShieldOff, Trash2, ChevronDown, ChevronUp
} from "lucide-react";

const API_URL = "http://localhost:8080/api/vehicles";

interface VehiculeData {
  id?: number; vehicleId?: string; truckNumber?: string; immatriculation: string;
  marque?: string; modele?: string; type?: string; branchCode?: string;
  kilometrage?: number; annee?: number; carburant?: string; statut?: string;
  agence?: string; tournee?: string; chauffeurId?: number; chauffeurNom?: string;
  conforme?: boolean; documentsDisponibles?: string; notes?: string;
}

const emptyVehicule: VehiculeData = {
  immatriculation: "", marque: "", modele: "", type: "", branchCode: "",
  kilometrage: 0, annee: 2024, carburant: "Diesel", statut: "DISPONIBLE",
  agence: "", tournee: "", chauffeurNom: "", conforme: true, notes: ""
};

export default function AdminCamionsCRUD() {
  const [vehicles, setVehicles] = useState<VehiculeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehiculeData | null>(null);
  const [form, setForm] = useState<VehiculeData>(emptyVehicule);
  const [stats, setStats] = useState<any>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => { fetchVehicles(); fetchStats(); }, []);

  const showToast = (m: string, t: "success" | "error" | "info" | "warning") => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 4000); };

  const fetchVehicles = async () => {
    setLoading(true);
    try { const res = await axios.get<any>(API_URL); setVehicles(res.data.vehicles || res.data || []); }
    catch { showToast("Erreur chargement véhicules", "error"); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const res = await axios.get<any>(`${API_URL}/stats`); setStats(res.data.stats || {}); } catch {}
  };

  const handleSave = async () => {
    if (!form.immatriculation) { showToast("Immatriculation obligatoire", "error"); return; }
    try {
      if (editVehicle?.id) { await axios.put(`${API_URL}/${editVehicle.id}`, form); showToast("Véhicule mis à jour", "success"); }
      else { await axios.post(API_URL, form); showToast("Véhicule créé", "success"); }
      setShowModal(false); setEditVehicle(null); setForm(emptyVehicule); fetchVehicles(); fetchStats();
    } catch (err: any) { showToast(err.response?.data?.error || "Erreur sauvegarde", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce véhicule ?")) return;
    try { await axios.delete(`${API_URL}/${id}`); showToast("Véhicule supprimé", "success"); fetchVehicles(); fetchStats(); }
    catch { showToast("Erreur suppression", "error"); }
  };

  const toggleStatut = async (v: VehiculeData) => {
    const newStatut = v.statut === "BLOQUE" ? "DISPONIBLE" : "BLOQUE";
    try { await axios.put(`${API_URL}/${v.id}/statut`, { statut: newStatut }); showToast(`Véhicule ${newStatut}`, newStatut === "DISPONIBLE" ? "success" : "warning"); fetchVehicles(); fetchStats(); }
    catch { showToast("Erreur", "error"); }
  };

  const filtered = vehicles.filter(v =>
    v.immatriculation?.toLowerCase().includes(search.toLowerCase()) ||
    v.truckNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.marque?.toLowerCase().includes(search.toLowerCase()) ||
    v.chauffeurNom?.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-danone-blue focus:border-transparent";
  const navItems = [{ id: 'camions', label: 'Camions', icon: <Truck className="w-5 h-5" />, active: true, onClick: () => {} }];

  return (
    <DashboardLayout navItems={navItems} title="Admin Camions" currentUser={{ name: "Admin", role: "ADMIN" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total || 0, icon: <Truck className="w-5 h-5" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Conformes", value: stats.conforme || 0, icon: <Shield className="w-5 h-5" />, color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
          { label: "Bloqués", value: stats.bloque || 0, icon: <ShieldOff className="w-5 h-5" />, color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
          { label: "Taux Conformité", value: stats.tauxConformite || "0%", icon: <RefreshCw className="w-5 h-5" />, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4 flex items-center gap-3`}>{s.icon}<div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs font-medium opacity-80">{s.label}</div></div></div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-xl text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-danone-blue" />
        </div>
        <button onClick={fetchVehicles} className="p-2 rounded-xl bg-slate-100 dark:bg-dark-border hover:bg-slate-200"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
        <button onClick={() => { setForm(emptyVehicule); setEditVehicle(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-danone-blue text-white rounded-xl shadow-soft hover:bg-danone-blue-dark text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 dark:bg-dark-border">
              {["N° Camion", "Immatriculation", "Marque/Modèle", "Chauffeur", "Statut", "Conforme", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-dark-text-secondary">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600 dark:text-slate-400">Chargement...</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600 dark:text-slate-400">Aucun véhicule</td></tr> :
              filtered.map(v => (
                <React.Fragment key={v.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-border/50">
                    <td className="px-4 py-3 font-semibold">{v.truckNumber || "-"}</td>
                    <td className="px-4 py-3 font-mono text-sm">{v.immatriculation}</td>
                    <td className="px-4 py-3">{v.marque} {v.modele}</td>
                    <td className="px-4 py-3">{v.chauffeurNom || <span className="text-slate-600 dark:text-slate-400 italic">Non assigné</span>}</td>
                    <td className="px-4 py-3"><Badge variant={v.statut === "DISPONIBLE" ? "success" : v.statut === "BLOQUE" ? "danger" : "warning"}>{v.statut}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={v.conforme ? "success" : "danger"}>{v.conforme ? "Oui" : "Non"}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setForm({...v}); setEditVehicle(v); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggleStatut(v)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title={v.statut === "BLOQUE" ? "Débloquer" : "Bloquer"}>
                          {v.statut === "BLOQUE" ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id!)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500">
                          {expandedId === v.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDelete(v.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr><td colSpan={7} className="px-6 py-3 bg-slate-50/50 dark:bg-dark-border/30">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-slate-600 dark:text-slate-400">VehicleID:</span> <span className="font-medium">{v.vehicleId || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Type:</span> <span className="font-medium">{v.type || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Km:</span> <span className="font-medium">{v.kilometrage?.toLocaleString() || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Année:</span> <span className="font-medium">{v.annee || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Carburant:</span> <span className="font-medium">{v.carburant || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Agence:</span> <span className="font-medium">{v.agence || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Tournée:</span> <span className="font-medium">{v.tournee || "-"}</span></div>
                        <div><span className="text-slate-600 dark:text-slate-400">Documents:</span> <span className="font-medium">{v.documentsDisponibles || "-"}</span></div>
                        {v.notes && <div className="col-span-2 sm:col-span-4"><span className="text-slate-600 dark:text-slate-400">Notes:</span> <span className="font-medium">{v.notes}</span></div>}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Truck className="w-5 h-5 text-danone-blue" />{editVehicle ? "Modifier Camion" : "Nouveau Camion"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border"><XCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Immatriculation *</label><input value={form.immatriculation} onChange={e => setForm({...form, immatriculation: e.target.value})} className={inputClass} placeholder="12345-A-6" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">N° Camion</label><input value={form.truckNumber || ""} onChange={e => setForm({...form, truckNumber: e.target.value})} className={inputClass} placeholder="CAM-001" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Marque</label><input value={form.marque || ""} onChange={e => setForm({...form, marque: e.target.value})} className={inputClass} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Modèle</label><input value={form.modele || ""} onChange={e => setForm({...form, modele: e.target.value})} className={inputClass} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Statut</label>
                <select value={form.statut || "DISPONIBLE"} onChange={e => setForm({...form, statut: e.target.value})} className={inputClass}>
                  <option value="DISPONIBLE">DISPONIBLE</option><option value="BLOQUE">BLOQUE</option><option value="EN_MAINTENANCE">EN MAINTENANCE</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Chauffeur</label><input value={form.chauffeurNom || ""} onChange={e => setForm({...form, chauffeurNom: e.target.value})} className={inputClass} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Conforme</label>
                <select value={form.conforme ? "true" : "false"} onChange={e => setForm({...form, conforme: e.target.value === "true"})} className={inputClass}>
                  <option value="true">Oui</option><option value="false">Non</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Km</label><input type="number" value={form.kilometrage || 0} onChange={e => setForm({...form, kilometrage: Number(e.target.value)})} className={inputClass} /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label><textarea value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-border text-slate-600 text-sm font-medium">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-danone-blue text-white shadow-soft hover:bg-danone-blue-dark text-sm font-medium">{editVehicle ? "Mettre à jour" : "Créer"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
