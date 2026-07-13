import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Role, Vehicule } from "../types/incident";
import DashboardLayout from "./ui/DashboardLayout";
import Badge from "./ui/Badge";
import Toast from "./ui/Toast";
import Skeleton from "./ui/Skeleton";
import FleetOverviewDashboard from "./FleetOverviewDashboard";
import {
  Users,
  Plus, Search, X, Edit3, UserPlus, RefreshCw,
  AlertCircle, ShieldAlert, Trash2, Phone, Mail,
} from "lucide-react";

interface ModernAdministrationCentraleProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

interface UserFormData {
  personCode: string;
  username: string;
  password: string;
  email: string;
  firstname: string;
  name: string;
  phone: string;
  cellularPhone: string;
  branchCode: string;
  profileCode: string;
  role: Role;
  ville: string;
  status: string;
}

const emptyForm: UserFormData = {
  personCode: '', username: '', password: '', email: '',
  firstname: '', name: '', phone: '', cellularPhone: '',
  branchCode: '', profileCode: '', role: Role.CHAUFFEUR, ville: '', status: 'ACTIF'
};

const ModernAdministrationCentrale: React.FC<ModernAdministrationCentraleProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("fleet");
  const [showFleetOverview, setShowFleetOverview] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [vehicleSearchType, setVehicleSearchType] = useState('');
  const [vehicleSearchImmatriculation, setVehicleSearchImmatriculation] = useState('');
  const [searchResult, setSearchResult] = useState<Vehicule | null>(null);
  const [vehicleError, setVehicleError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get<User[]>("http://localhost:8080/users");
      setUsers(res.data);
    } catch {
      showToast("Erreur lors du chargement des utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[+]?[\d\s-]{6,}$/.test(phone);
  const validatePassword = (pwd: string) => pwd.length >= 4;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!userForm.personCode) errors.personCode = "Requis";
    if (!userForm.username) errors.username = "Requis";
    if (!userForm.email) errors.email = "Requis";
    else if (!validateEmail(userForm.email)) errors.email = "Email invalide";
    if (!userForm.firstname) errors.firstname = "Requis";
    if (!userForm.name) errors.name = "Requis";
    if (!userForm.branchCode) errors.branchCode = "Requis";
    if (!userForm.profileCode) errors.profileCode = "Requis";

    if (userForm.phone && !validatePhone(userForm.phone)) errors.phone = "Téléphone invalide";
    if (userForm.cellularPhone && !validatePhone(userForm.cellularPhone)) errors.cellularPhone = "Téléphone invalide";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setEditing(false);
    setUserForm(emptyForm);
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditing(true);
    setUserForm({
      personCode: user.personCode || '',
      username: user.username || '',
      password: '',
      email: user.email || '',
      firstname: user.firstname || '',
      name: user.name || '',
      phone: user.phone || '',
      cellularPhone: user.cellularPhone || '',
      branchCode: user.branchCode || '',
      profileCode: user.profileCode || '',
      role: user.role,
      ville: user.ville || '',
      status: user.status || 'ACTIF'
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
    setHoldReason('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !holdReason.trim()) return;
    try {
      await axios({ method: 'delete', url: `http://localhost:8080/users/${deleteTarget.id}`, data: { holdReason } });
      showToast(`Utilisateur ${deleteTarget.firstname} ${deleteTarget.name} désactivé`, "success");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchUsers();
    } catch {
      showToast("Erreur lors de la désactivation", "error");
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      personCode: userForm.personCode,
      username: userForm.username,
      email: userForm.email,
      firstname: userForm.firstname,
      name: userForm.name,
      branchCode: userForm.branchCode,
      profileCode: userForm.profileCode,
      role: userForm.role,
      ville: userForm.ville,
      phone: userForm.phone || null,
      cellularPhone: userForm.cellularPhone || null,
      status: userForm.status,
    };

    try {
      if (editing && selectedUser) {
        payload.password = userForm.password || undefined;
        await axios.put(`http://localhost:8080/users/${selectedUser.id}`, payload);
        showToast("Utilisateur mis à jour", "success");
      } else {
        const res = await axios.post<{ message?: string }>("http://localhost:8080/api/admin/users", payload);
        showToast(res.data.message || "Utilisateur créé", "success");
      }
      setShowUserModal(false);
      await fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erreur lors de l'opération";
      showToast(msg, "error");
    }
  };

  const handleVehicleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError('');
    setSearchResult(null);
    if (!vehicleSearchType && !vehicleSearchImmatriculation) {
      setVehicleError('Veuillez entrer au moins un critère');
      return;
    }
    try {
      if (vehicleSearchImmatriculation) {
        const res = await axios.get<Vehicule>(`http://localhost:8080/api/vehicules/immatriculation/${vehicleSearchImmatriculation}`);
        setSearchResult(res.data);
      } else if (vehicleSearchType) {
        const res = await axios.get<Vehicule[]>(`http://localhost:8080/api/vehicules/type/${vehicleSearchType}`);
        if (res.data.length > 0) setSearchResult(res.data[0]);
        else setVehicleError('Aucun véhicule trouvé');
      }
    } catch {
      setVehicleError('Véhicule non trouvé');
    }
  };

  const statusVariant = (user: User) => {
    const isHeld = user.holdPerson || user.status === 'INACTIF';
    const isActive = user.status === 'ACTIF' && !user.holdPerson;
    if (isActive) return 'cloture' as const;
    if (isHeld) return 'refuse' as const;
    return 'en-attente' as const;
  };

  const statusLabel = (user: User) => {
    if (user.holdPerson) return 'Désactivé';
    if (user.status === 'INACTIF') return 'Inactif';
    if (user.status === 'ACTIF') return 'Actif';
    return user.status || 'Inconnu';
  };

  const navItems = [
    { id: 'fleet', label: '🚛 Vue Parc', icon: <Users className="w-5 h-5" />, active: activeTab === 'fleet', onClick: () => { setActiveTab('fleet'); setShowFleetOverview(true); } },
    { id: 'users', label: '👥 Utilisateurs', icon: <Users className="w-5 h-5" />, active: activeTab === 'users', onClick: () => { setActiveTab('users'); setShowFleetOverview(false); } },
  ];

  const availableProfiles = [
    { value: 'CHAUFFEUR', label: 'Chauffeur' },
    { value: 'PRESTATAIRE', label: 'Prestataire' },
    { value: 'RS', label: 'Responsable Support' },
    { value: 'ADMIN', label: 'Administration Centrale' },
    { value: 'CPL', label: 'Chef de Parc Logistique' },
    { value: 'DRL', label: 'Directeur Régional Logistique' },
    { value: 'RFL', label: 'Responsable de Flotte' },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-dark-surface border rounded-xl text-sm text-neutral-text dark:text-white placeholder-neutral-text-light/50 focus:ring-2 focus:ring-danone-blue focus:border-transparent transition-all duration-200";
  const inputErrorClass = "border-red-300 dark:border-red-700";
  const labelClass = "block text-sm font-semibold text-neutral-text dark:text-white mb-1";
  const selectClass = inputClass;

  return (
    <DashboardLayout
      navItems={navItems}
      title="Administration"
      subtitle={showFleetOverview ? "Vue globale du parc" : "Gestion des utilisateurs"}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showFleetOverview && (
        <div className="p-4 sm:p-6">
          <FleetOverviewDashboard />
        </div>
      )}

      {activeTab === 'users' && !showFleetOverview && (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des utilisateurs</h1>
          <div className="flex gap-2">
            <button onClick={handleAddUser} className="bg-gradient-to-r from-danone-blue to-danone-blue-dark hover:from-danone-blue-dark hover:to-blue-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-danone-blue/20 transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Nouvel utilisateur
            </button>
            <button onClick={() => setShowVehicleSearch(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" /> Véhicule
            </button>
            <button onClick={fetchUsers} className="bg-neutral-gray dark:bg-dark-border text-neutral-text dark:text-white px-3 py-2.5 rounded-xl hover:bg-neutral-gray-dark dark:hover:bg-dark-border/80 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-border/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Code</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Nom</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Email / Contact</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Profil</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Branche</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-white">{user.personCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-danone-blue to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.firstname?.[0]}{user.name?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{user.firstname} {user.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-dark-text-secondary">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-slate-600 dark:text-dark-text-secondary flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-slate-500 dark:text-dark-text-secondary flex items-center gap-1.5 text-xs">
                              <Phone className="w-3 h-3" /> {user.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-danone-blue/10 text-danone-blue border border-danone-blue/20">
                          {user.profileCode || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 dark:text-dark-text-secondary">{user.branchCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(user)}>{statusLabel(user)}</Badge>
                        {user.holdReason && (
                          <p className="text-[10px] text-red-500 mt-0.5 max-w-[120px] truncate" title={user.holdReason}>{user.holdReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditUser(user)} className="p-2 rounded-lg text-danone-blue hover:bg-danone-blue/5 transition-colors" title="Modifier">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!user.holdPerson && (
                            <button onClick={() => handleDeleteClick(user)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Désactiver">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-border/30 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-dark-text-secondary">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
              <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 dark:text-dark-text-secondary">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-green" /> Actif</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Désactivé</span>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Vehicle Search Modal */}
      {showVehicleSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowVehicleSearch(false); setSearchResult(null); setVehicleError(''); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Rechercher un véhicule</h2>
              <button onClick={() => { setShowVehicleSearch(false); setSearchResult(null); setVehicleError(''); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleVehicleSearch} className="space-y-4">
              <input type="text" placeholder="Type de véhicule (ex: Camion)" value={vehicleSearchType} onChange={(e) => setVehicleSearchType(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Immatriculation (ex: 12345-A-67)" value={vehicleSearchImmatriculation} onChange={(e) => setVehicleSearchImmatriculation(e.target.value)} className={inputClass} />
              {vehicleError && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{vehicleError}</div>}
              {searchResult && (
                <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-accent-green">Détails du véhicule</h3>
                  <div className="text-sm text-neutral-text dark:text-white space-y-1">
                    <p><span className="font-semibold">Immatriculation:</span> {searchResult.immatriculation}</p>
                    <p><span className="font-semibold">Marque:</span> {searchResult.marque} {searchResult.modele}</p>
                    <p><span className="font-semibold">Type:</span> {searchResult.type}</p>
                    <p><span className="font-semibold">Agence:</span> {searchResult.branchCode}</p>
                    {searchResult.kilometrage && <p><span className="font-semibold">Kilométrage:</span> {searchResult.kilometrage} km</p>}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowVehicleSearch(false); setSearchResult(null); setVehicleError(''); }} className="px-4 py-2 border border-neutral-gray dark:border-dark-border rounded-xl text-sm font-semibold hover:bg-neutral-gray dark:hover:bg-dark-border transition-colors">Fermer</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-emerald-700 transition-colors">Rechercher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowUserModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editing ? 'Modifier' : 'Nouvel'} utilisateur
              </h2>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="px-6 py-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-danone-blue mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Identité</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Code personnel *</label>
                    <input type="text" value={userForm.personCode} onChange={(e) => setUserForm({...userForm, personCode: e.target.value})} className={`${inputClass} ${formErrors.personCode ? inputErrorClass : ''}`} placeholder="PERS-001" />
                    {formErrors.personCode && <p className="text-xs text-red-500 mt-1">{formErrors.personCode}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Login *</label>
                    <input type="text" value={userForm.username} onChange={(e) => setUserForm({...userForm, username: e.target.value})} className={`${inputClass} ${formErrors.username ? inputErrorClass : ''}`} placeholder="Nom d'utilisateur" />
                    {formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
                  </div>
                  {editing ? (
                    <div>
                      <label className={labelClass}>Nouveau mot de passe</label>
                      <input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} className={`${inputClass} ${formErrors.password ? inputErrorClass : ''}`} placeholder="Laisser vide pour conserver" />
                      {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>Mot de passe</label>
                      <div className="px-4 py-2.5 bg-slate-100 dark:bg-dark-border rounded-xl text-sm text-slate-500 dark:text-dark-text-secondary">
                        Généré automatiquement et envoyé par email
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelClass}>Prénom *</label>
                    <input type="text" value={userForm.firstname} onChange={(e) => setUserForm({...userForm, firstname: e.target.value})} className={`${inputClass} ${formErrors.firstname ? inputErrorClass : ''}`} />
                    {formErrors.firstname && <p className="text-xs text-red-500 mt-1">{formErrors.firstname}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Nom *</label>
                    <input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className={`${inputClass} ${formErrors.name ? inputErrorClass : ''}`} />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-dark-border pt-4">
                <h3 className="text-sm font-bold text-danone-blue mb-3 flex items-center gap-2"><Mail className="w-4 h-4" /> Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className={`${inputClass} ${formErrors.email ? inputErrorClass : ''}`} placeholder="user@danone.com" />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone</label>
                    <input type="text" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} className={`${inputClass} ${formErrors.phone ? inputErrorClass : ''}`} placeholder="+212 6XX XXX XXX" />
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone mobile</label>
                    <input type="text" value={userForm.cellularPhone} onChange={(e) => setUserForm({...userForm, cellularPhone: e.target.value})} className={`${inputClass} ${formErrors.cellularPhone ? inputErrorClass : ''}`} placeholder="+212 6XX XXX XXX" />
                    {formErrors.cellularPhone && <p className="text-xs text-red-500 mt-1">{formErrors.cellularPhone}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-dark-border pt-4">
                <h3 className="text-sm font-bold text-danone-blue mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Profil & organisation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Profil *</label>
                    <select value={userForm.profileCode} onChange={(e) => { const p = e.target.value; setUserForm({...userForm, profileCode: p, role: p as Role }); }} className={`${selectClass} ${formErrors.profileCode ? inputErrorClass : ''}`}>
                      <option value="">Sélectionnez un profil</option>
                      {availableProfiles.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    {formErrors.profileCode && <p className="text-xs text-red-500 mt-1">{formErrors.profileCode}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Branche *</label>
                    <input type="text" value={userForm.branchCode} onChange={(e) => setUserForm({...userForm, branchCode: e.target.value})} className={`${inputClass} ${formErrors.branchCode ? inputErrorClass : ''}`} placeholder="CASABLANCA" />
                    {formErrors.branchCode && <p className="text-xs text-red-500 mt-1">{formErrors.branchCode}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelClass}>Ville</label>
                    <select value={userForm.ville} onChange={(e) => setUserForm({...userForm, ville: e.target.value})} className={selectClass}>
                      <option value="">Sélectionnez une ville</option>
                      <option value="CASABLANCA">Casablanca</option>
                      <option value="RABAT">Rabat</option>
                      <option value="MARRAKECH">Marrakech</option>
                      <option value="TANGER">Tanger</option>
                      <option value="FES">Fès</option>
                      <option value="AGADIR">Agadir</option>
                      <option value="OUJDA">Oujda</option>
                      <option value="LAAYOUNE">Laâyoune</option>
                    </select>
                  </div>
                  {editing && (
                    <div>
                      <label className={labelClass}>Statut</label>
                      <select value={userForm.status} onChange={(e) => setUserForm({...userForm, status: e.target.value})} className={selectClass}>
                        <option value="ACTIF">Actif</option>
                        <option value="INACTIF">Inactif</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-dark-border">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-5 py-2.5 border border-neutral-gray dark:border-dark-border rounded-xl text-sm font-semibold hover:bg-neutral-gray dark:hover:bg-dark-border transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-danone-blue to-danone-blue-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-danone-blue/20 hover:from-danone-blue-dark hover:to-blue-900 transition-all duration-200">
                  {editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Désactiver l'utilisateur</h3>
              <p className="text-sm text-slate-500 dark:text-dark-text-secondary mt-1">
                Êtes-vous sûr de vouloir désactiver <strong>{deleteTarget.firstname} {deleteTarget.name}</strong> ?
              </p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-white">
                Raison de la désactivation *
              </label>
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Ex: Départ de l'entreprise, Changement de poste..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 border border-neutral-gray dark:border-dark-border rounded-xl text-sm font-semibold hover:bg-neutral-gray dark:hover:bg-dark-border transition-colors">
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!holdReason.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer la désactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ModernAdministrationCentrale;
