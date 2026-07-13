import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DeclarationIncident, StatutDeclaration, User } from "../types/incident";
import PrestataireStepper from "./PrestataireStepper";
import DashboardLayout from "./ui/DashboardLayout";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Toast from "./ui/Toast";
import Skeleton from "./ui/Skeleton";
import {
  LayoutDashboard, FileText, Wrench, Calendar,
  Filter, ListOrdered, RefreshCw, X, Eye, Edit3,
  FileDown, CheckCircle, XCircle, Clock, AlertCircle,
  Search, SlidersHorizontal, ArrowLeft, Inbox
} from "lucide-react";

interface ModernPrestataireDashboardProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const ModernPrestataireDashboard: React.FC<ModernPrestataireDashboardProps> = ({ currentUser, onLogout }) => {
  const [declarations, setDeclarations] = useState<DeclarationIncident[]>([]);
  const [filteredDeclarations, setFilteredDeclarations] = useState<DeclarationIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationIncident | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStepper, setShowStepper] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    mois: '',
    categorie: '',
    statut: '',
    elementVehicule: '',
    site: '',
    typePanne: '',
    sla: '',
    coutMin: '',
    coutMax: ''
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  }, []);

  const [updateForm, setUpdateForm] = useState({
    dateDebutIntervention: new Date().toISOString().slice(0, 16),
    actionsRealisees: '',
    piecesNecessaires: '',
    contratBonCommande: '',
    dateReparation: '',
    dureeReparation: '',
    etatReparation: '',
    coutProbleme: ''
  });

  // Safe date formatter
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('fr-FR');
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('prestataireDeclarations');
    if (savedData) setDeclarations(JSON.parse(savedData));
    fetchDeclarations();
  }, []);

  useEffect(() => {
    if (declarations.length > 0) localStorage.setItem('prestataireDeclarations', JSON.stringify(declarations));
  }, [declarations]);

  useEffect(() => {
    // Apply filters
    let filtered = [...declarations];
    if (filters.mois) {
      filtered = filtered.filter(d => d.mois === filters.mois);
    }
    if (filters.categorie) {
      filtered = filtered.filter(d => d.categorie === filters.categorie);
    }
    if (filters.statut) {
      filtered = filtered.filter(d => d.statut === filters.statut);
    }
    if (filters.elementVehicule) {
      filtered = filtered.filter(d => d.elementVehicule === filters.elementVehicule);
    }
    if (filters.site) {
      filtered = filtered.filter(d => (d.vehicule?.branchCode || '').toLowerCase().includes(filters.site.toLowerCase()));
    }
    if (filters.typePanne) {
      filtered = filtered.filter(d => (d.typePanneFrancais || d.typePanne || '').toLowerCase().includes(filters.typePanne.toLowerCase()));
    }
    if (filters.sla) {
      filtered = filtered.filter(d => d.sla != null && d.sla >= parseInt(filters.sla));
    }
    if (filters.coutMin) {
      filtered = filtered.filter(d => (d as any).coutProbleme != null && (d as any).coutProbleme >= parseFloat(filters.coutMin));
    }
    if (filters.coutMax) {
      filtered = filtered.filter(d => (d as any).coutProbleme != null && (d as any).coutProbleme <= parseFloat(filters.coutMax));
    }
    setFilteredDeclarations(filtered);
  }, [declarations, filters]);

  const fetchDeclarations = async () => {
    setLoading(true);
    try {
      const {data} = await axios.get("http://localhost:8080/api/declarations");
      console.log("API Response:", JSON.stringify(data, null, 2));
      // @ts-ignore
      setDeclarations(data);
      setError("");
    } catch (err) {
      console.error("API Error:", err);
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (declaration: DeclarationIncident) => {
    setSelectedDeclaration(declaration);
    setShowModal(true);
  };

  const toLocalISO = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const handleUpdate = (declaration: DeclarationIncident) => {
    setSelectedDeclaration(declaration);
    setUpdateForm({
      dateDebutIntervention: declaration.dateDebutIntervention || toLocalISO(new Date()),
      actionsRealisees: declaration.actionsRealisees || '',
      piecesNecessaires: declaration.piecesNecessaires || '',
      contratBonCommande: declaration.contratBonCommande || '',
      dateReparation: declaration.dateReparation || '',
      dureeReparation: declaration.dureeReparation?.toString() || '',
      etatReparation: declaration.etat || '',
      coutProbleme: declaration.coutProbleme?.toString() || ''
    });
    setShowUpdateModal(true);
  };

  const handleTakeCharge = async (declaration: DeclarationIncident) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await axios.put(`http://localhost:8080/api/declarations/${declaration.id}/takeCharge`, {}, {
        headers: {
          'X-User-Role': currentUser.role || 'PRESTATAIRE'
        }
      });
      await fetchDeclarations();
      setSuccess("Déclaration prise en charge");
      setError("");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Erreur lors de la prise en charge";
      setError(msg);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeclaration) return;

    // Validation des champs
    if (!updateForm.dateDebutIntervention) {
      setError("La date de début d'intervention est obligatoire");
      return;
    }

    if (!updateForm.actionsRealisees.trim()) {
      setError("Les actions réalisées sont obligatoires");
      return;
    }

    if (!updateForm.coutProbleme || parseFloat(updateForm.coutProbleme) <= 0) {
      setError("Le coût est obligatoire et doit être supérieur à zéro");
      return;
    }

    if (!updateForm.contratBonCommande) {
      setError("Veuillez choisir Contrat ou Bon de commande");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('dateDebutIntervention', updateForm.dateDebutIntervention.replace('Z', ''));
      formData.append('actionsRealisees', updateForm.actionsRealisees);
      formData.append('contratBonCommande', updateForm.contratBonCommande);
      formData.append('piecesNecessaires', updateForm.piecesNecessaires || '');
      formData.append('qualification', 'REPARATION');
      formData.append('cout', updateForm.coutProbleme);
      const now = new Date();
      formData.append('dateReparation', now.toISOString().replace('Z', ''));
      if (updateForm.etatReparation) {
        formData.append('etatReparation', updateForm.etatReparation);
      }
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await axios.put(`http://localhost:8080/api/declarations/${selectedDeclaration.id}/update`, formData, {
        headers: {
          'X-User-Role': currentUser.role || 'PRESTATAIRE'
        }
      });

      await fetchDeclarations();
      setShowUpdateModal(false);
      setSuccess("Rapport mis à jour");
      setError("");
    } catch (err: any) {
      console.error("Erreur mise à jour:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erreur lors de la mise à jour";
      setError(errorMessage);
    }
  };

  const handleGenerateReport = (declaration: DeclarationIncident) => {
    setSelectedDeclaration(declaration);
    const reportContent = `
RAPPORT D'INTERVENTION
======================
N° Déclaration: ${declaration.numeroDeclaration}
Date: ${declaration.dateDeclaration ? new Date(declaration.dateDeclaration).toLocaleString('fr-FR') : 'N/A'}

Chauffeur: ${declaration.chauffeurNom || (declaration.chauffeur?.firstname || '') + ' ' + (declaration.chauffeur?.name || '') || 'N/A'}
Véhicule: ${declaration.vehiculeImmatriculation || declaration.vehicule?.immatriculation || 'N/A'}
Type de panne: ${declaration.typePanne || 'N/A'}
Description: ${declaration.descriptionFrancais || declaration.description || 'N/A'}

Actions réalisées: ${declaration.actionsRealisees || 'Non renseigné'}
Pièces nécessaires: ${declaration.piecesNecessaires || 'Non renseigné'}
Qualification: ${declaration.qualification || 'Non renseigné'}
Coût: ${declaration.coutProbleme ? declaration.coutProbleme + ' MAD' : 'Non renseigné'}
État: ${declaration.etat || 'Non renseigné'}

Statut: ${declaration.statut}
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${declaration.numeroDeclaration}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess("Rapport généré avec succès");
  };

  const stats = {
    total: filteredDeclarations.length,
    enAttente: filteredDeclarations.filter(d => d.statut === StatutDeclaration.EN_ATTENTE).length,
    enCours: filteredDeclarations.filter(d => d.statut === StatutDeclaration.EN_COURS).length,
    enValidation: filteredDeclarations.filter(d => d.statut === StatutDeclaration.EN_VALIDATION).length,
    cloturees: filteredDeclarations.filter(d => d.statut === StatutDeclaration.CLOTURE).length,
    retournees: filteredDeclarations.filter(d => d.statut === StatutDeclaration.RETOURNEE).length,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'interventions', label: 'Interventions', icon: <Wrench className="w-5 h-5" />, badge: filteredDeclarations.length },
    { id: 'rapports', label: 'Rapports', icon: <FileText className="w-5 h-5" /> },
    { id: 'calendrier', label: 'Calendrier', icon: <Calendar className="w-5 h-5" /> },
  ];

  if (loading) return (
    <DashboardLayout navItems={navItems} title="Prestataire" subtitle="Gestion des interventions" currentUser={currentUser} onLogout={onLogout}>
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-danone-blue rounded-2xl flex items-center justify-center mx-auto shadow-soft animate-pulse">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <p className="text-neutral-text-light dark:text-dark-text-secondary font-medium animate-pulse">Chargement des données...</p>
          <div className="flex gap-3 justify-center">
            <Skeleton className="w-24 h-8 rounded-lg" />
            <Skeleton className="w-32 h-8 rounded-lg" />
            <Skeleton className="w-28 h-8 rounded-lg" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      navItems={navItems}
      title="Prestataire"
      subtitle="Gestion des interventions"
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <div className="p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600 font-semibold mt-1">Total</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-6 border border-blue-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-3xl font-bold text-blue-600">{stats.enAttente}</div>
            <div className="text-sm text-blue-700 font-semibold mt-1">En attente</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-yellow-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-3xl font-bold text-yellow-600">{stats.enCours}</div>
            <div className="text-sm text-yellow-700 font-semibold mt-1">En cours</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-xl p-6 border border-purple-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-3xl font-bold text-purple-600">{stats.enValidation}</div>
            <div className="text-sm text-purple-700 font-semibold mt-1">En validation</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border border-green-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-3xl font-bold text-green-600">{stats.cloturees}</div>
            <div className="text-sm text-green-700 font-semibold mt-1">Clôturées</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-xl p-6 border border-red-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-3xl font-bold text-red-600">{stats.retournees}</div>
            <div className="text-sm text-red-700 font-semibold mt-1">Retournées</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50">
          <div className="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Déclarations ({filteredDeclarations.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold transition-all duration-200"
              >
                🔍 Filtres
              </button>
              <button
                onClick={() => setShowStepper(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105"
              >
                🔧 Mode Stepper
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mois</label>
                  <select
                    value={filters.mois}
                    onChange={(e) => setFilters({...filters, mois: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="1">Janvier</option>
                    <option value="2">Février</option>
                    <option value="3">Mars</option>
                    <option value="4">Avril</option>
                    <option value="5">Mai</option>
                    <option value="6">Juin</option>
                    <option value="7">Juillet</option>
                    <option value="8">Août</option>
                    <option value="9">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Catégorie</label>
                  <select
                    value={filters.categorie}
                    onChange={(e) => setFilters({...filters, categorie: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="PANNE">Panne</option>
                    <option value="ACCIDENT">Accident</option>
                    <option value="USURE">Usure normale</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Statut</label>
                  <select
                    value={filters.statut}
                    onChange={(e) => setFilters({...filters, statut: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="EN_VALIDATION">En validation</option>
                    <option value="CLOTURE">Clôturé</option>
                    <option value="RETOURNEE">Retourné</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Élément véhicule</label>
                  <input
                    type="text"
                    value={filters.elementVehicule}
                    onChange={(e) => setFilters({...filters, elementVehicule: e.target.value})}
                    placeholder="Ex: Moteur, Freins..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Site</label>
                  <input
                    type="text"
                    value={filters.site}
                    onChange={(e) => setFilters({...filters, site: e.target.value})}
                    placeholder="Ex: PARIS, LYON..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type panne</label>
                  <input
                    type="text"
                    value={filters.typePanne}
                    onChange={(e) => setFilters({...filters, typePanne: e.target.value})}
                    placeholder="Ex: Moteur, Freins..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">SLA min (jours)</label>
                  <input
                    type="number"
                    value={filters.sla}
                    onChange={(e) => setFilters({...filters, sla: e.target.value})}
                    placeholder="Ex: 7"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Coût min (MAD)</label>
                  <input
                    type="number"
                    value={filters.coutMin}
                    onChange={(e) => setFilters({...filters, coutMin: e.target.value})}
                    placeholder="Ex: 1000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Coût max (MAD)</label>
                  <input
                    type="number"
                    value={filters.coutMax}
                    onChange={(e) => setFilters({...filters, coutMax: e.target.value})}
                    placeholder="Ex: 10000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFilters({ mois: '', categorie: '', statut: '', elementVehicule: '', site: '', typePanne: '', sla: '', coutMin: '', coutMax: '' })}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold transition-all duration-200"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-[1400px]">
              <table className="min-w-full">
                <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">N° Demande</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type Panne</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Criticité</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Statut</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Chauffeur</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Immatriculation</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kilométrage</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Lieu</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date Réparation</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Durée Réparation</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">État</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Coût Problème</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Statut Final</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeclarations.map((decl) => (
                  <tr key={decl.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-3 text-sm font-bold text-slate-800">{decl.numeroDeclaration || '-'}</td>
                    <td className="px-2 py-3 text-sm text-slate-600 font-medium">{formatDate(decl.dateDeclaration)}</td>
                    <td className="px-2 py-3 text-sm text-slate-800 font-semibold">{decl.typePanneFrancais || decl.typePanne || '-'}</td>
                    <td className="px-2 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        decl.criticite === 'BLOQUANT' || decl.criticite === 'SECURITE' ? 'bg-red-100 text-red-800' :
                        decl.criticite === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                        decl.criticite === 'NON_BLOQUANT' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {decl.criticite || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        decl.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                        decl.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                        decl.statut === 'EN_VALIDATION' ? 'bg-purple-100 text-purple-800' :
                        decl.statut === 'CLOTURE' ? 'bg-green-100 text-green-800' :
                        decl.statut === 'RETOURNEE' ? 'bg-red-100 text-red-800' :
                        decl.statut === 'REFUSE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {decl.statut || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm text-slate-600 max-w-xs truncate" title={decl.descriptionFrancais || decl.description}>{decl.descriptionFrancais || decl.description || '-'}</td>
                    <td className="px-2 py-3 text-sm text-slate-800 font-semibold">{decl.chauffeurNom || (decl.chauffeur?.firstname || '') + ' ' + (decl.chauffeur?.name || '') || '-'}</td>
                    <td className="px-2 py-3 text-sm text-slate-800 font-semibold">{decl.vehiculeImmatriculation || decl.vehicule?.immatriculation || '-'}</td>
                    <td className="px-2 py-3 text-sm text-slate-800 font-semibold">{decl.kilometrage ? `${decl.kilometrage} km` : (decl.vehicule?.kilometrage ? `${decl.vehicule.kilometrage} km` : '-')}</td>
                    <td className="px-2 py-3 text-sm text-slate-600">{decl.lieuIncidentFrancais || decl.location || decl.chauffeur?.ville || '-'}</td>
                    <td className="px-2 py-3 text-sm text-slate-600">{decl.dateReparation ? new Date(decl.dateReparation).toLocaleString('fr-FR') : '-'}</td>
                    <td className="px-2 py-3 text-sm text-slate-800 font-semibold">{decl.dureeReparation != null ? (() => { const totalSec = Number(decl.dureeReparation); const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60; if (h > 0) return `${h}h ${m}m ${s}s`; if (m > 0) return `${m}m ${s}s`; return `${s}s`; })() : '-'}</td>
                    <td className="px-2 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        decl.etat === 'REPARE' ? 'bg-green-100 text-green-800' :
                        decl.etat === 'TRAITE' ? 'bg-blue-100 text-blue-800' :
                        decl.etat === 'NON_TRAITE' ? 'bg-red-100 text-red-800' :
                        decl.etat === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {decl.etat || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm text-slate-800 font-semibold">{decl.coutProbleme ? `${decl.coutProbleme} MAD` : '-'}</td>
                    <td className="px-2 py-3 text-sm">
                      {decl.statut === 'CLOTURE' && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Clôturée</span>
                      )}
                      {decl.statut === 'RETOURNEE' && (
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Retournée</span>
                          {decl.motifRefus && (
                            <div className="text-xs text-red-600 mt-1" title={decl.motifRefus}>{decl.motifRefus}</div>
                          )}
                        </div>
                      )}
                      {decl.statut === 'REFUSE' && (
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Refusée</span>
                          {decl.motifRefus && (
                            <div className="text-xs text-red-600 mt-1" title={decl.motifRefus}>{decl.motifRefus}</div>
                          )}
                        </div>
                      )}
                      {decl.statut !== 'CLOTURE' && decl.statut !== 'RETOURNEE' && decl.statut !== 'REFUSE' && '-'}
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                        <button onClick={() => handleViewDetails(decl)} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors text-xs">Détails</button>
                        {decl.statut === 'EN_ATTENTE' && (
                          <button onClick={() => handleTakeCharge(decl)} className="text-green-600 hover:text-green-800 font-semibold transition-colors text-xs">Prendre en charge</button>
                        )}
                        {decl.statut === 'EN_COURS' && (
                          <button onClick={() => handleUpdate(decl)} className="text-orange-600 hover:text-orange-800 font-semibold transition-colors text-xs">Mettre à jour</button>
                        )}
                        <button onClick={() => handleGenerateReport(decl)} className="text-green-600 hover:text-green-800 font-semibold transition-colors text-xs">Rapport</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {showModal && selectedDeclaration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Détails complets - {selectedDeclaration.numeroDeclaration}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-600">×</button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Informations générales</h4>
                  <div><strong className="text-gray-900">Numéro de déclaration:</strong> <span className="text-gray-700">{selectedDeclaration.numeroDeclaration || '-'}</span></div>
                  <div><strong className="text-gray-900">Date de déclaration:</strong> <span className="text-gray-700">{formatDateTime(selectedDeclaration.dateDeclaration || '')}</span></div>
                  <div><strong className="text-gray-900">Date de transmission:</strong> <span className="text-gray-700">{formatDateTime(selectedDeclaration.dateTransmission)}</span></div>
                  <div><strong className="text-gray-900">Statut:</strong> <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    selectedDeclaration.statut === 'EN_COURS' ? 'bg-yellow-100 text-yellow-800' :
                    selectedDeclaration.statut === 'CLOTUREE' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>{selectedDeclaration.statut || '-'}</span></div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Chauffeur</h4>
                  <div><strong className="text-gray-900">Nom:</strong> <span className="text-gray-700">{selectedDeclaration.chauffeur?.firstname || ''} {selectedDeclaration.chauffeur?.name || ''}</span></div>
                  <div><strong className="text-gray-900">Code personne:</strong> <span className="text-gray-700">{selectedDeclaration.chauffeur?.personCode || '-'}</span></div>
                  <div><strong className="text-gray-900">Email:</strong> <span className="text-gray-700">{selectedDeclaration.chauffeur?.email || '-'}</span></div>
                  <div><strong className="text-gray-900">Ville:</strong> <span className="text-gray-700">{selectedDeclaration.chauffeur?.ville || '-'}</span></div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Véhicule</h4>
                  <div><strong className="text-gray-900">Immatriculation:</strong> <span className="text-gray-700">{selectedDeclaration.vehicule?.immatriculation || selectedDeclaration.vehiculeImmatriculation || '-'}</span></div>
                  <div><strong className="text-gray-900">Marque:</strong> <span className="text-gray-700">{selectedDeclaration.vehicule?.marque || selectedDeclaration.vehiculeMarque || '-'}</span></div>
                  <div><strong className="text-gray-900">Modèle:</strong> <span className="text-gray-700">{selectedDeclaration.vehicule?.modele || selectedDeclaration.vehiculeModele || '-'}</span></div>
                  <div><strong className="text-gray-900">Type:</strong> <span className="text-gray-700">{selectedDeclaration.vehicule?.type || selectedDeclaration.vehiculeType || '-'}</span></div>
                  <div><strong className="text-gray-900">Kilométrage:</strong> <span className="text-gray-700">{selectedDeclaration.vehicule?.kilometrage ? `${selectedDeclaration.vehicule.kilometrage} km` : (selectedDeclaration.kilometrage ? `${selectedDeclaration.kilometrage} km` : '-')}</span></div>
                  <div><strong className="text-gray-900">Code agence:</strong> <span className="text-gray-700">{selectedDeclaration.vehicule?.branchCode || '-'}</span></div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Incident</h4>
                  <div><strong className="text-gray-900">Type de panne (Français):</strong> <span className="text-gray-700">{selectedDeclaration.typePanneFrancais || selectedDeclaration.typePanne || '-'}</span></div>
                  {selectedDeclaration.typePanneArabe && (
                    <div><strong className="text-gray-900">Type de panne (Arabe):</strong> <span className="text-gray-700" dir="rtl">{selectedDeclaration.typePanneArabe}</span></div>
                  )}
                  <div><strong className="text-gray-900">Criticité:</strong> <span className="text-gray-700">{selectedDeclaration.criticite || '-'}</span></div>
                  <div><strong className="text-gray-900">Lieu incident (Français):</strong> <span className="text-gray-700">{selectedDeclaration.lieuIncidentFrancais || selectedDeclaration.location || '-'}</span></div>
                  {selectedDeclaration.lieuIncidentArabe && (
                    <div><strong className="text-gray-900">Lieu incident (Arabe):</strong> <span className="text-gray-700" dir="rtl">{selectedDeclaration.lieuIncidentArabe}</span></div>
                  )}
                  <div><strong className="text-gray-900">Description (Français):</strong> <span className="text-gray-700">{selectedDeclaration.descriptionFrancais || selectedDeclaration.description || '-'}</span></div>
                  {selectedDeclaration.descriptionArabe && (
                    <div><strong className="text-gray-900">Description (Arabe):</strong> <span className="text-gray-700" dir="rtl">{selectedDeclaration.descriptionArabe}</span></div>
                  )}
                </div>

                {(selectedDeclaration.photo || selectedDeclaration.photoUrl) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Photo</h4>
                    <img src={selectedDeclaration.photo ? `data:image/jpeg;base64,${selectedDeclaration.photo}` : selectedDeclaration.photoUrl} alt="Photo incident" className="max-w-full h-auto rounded-lg" />
                  </div>
                )}

                {(selectedDeclaration.video || selectedDeclaration.videoUrl) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Vidéo</h4>
                    {selectedDeclaration.videoUrl ? (
                      <a href={selectedDeclaration.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold">Ouvrir la vidéo</a>
                    ) : (
                      <span className="text-gray-600">Vidéo disponible (Base64)</span>
                    )}
                  </div>
                )}

                {(selectedDeclaration.actionsRealisees || selectedDeclaration.piecesNecessaires || selectedDeclaration.qualification) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2">Rapport d'intervention</h4>
                    <div><strong className="text-gray-900">Date d'intervention:</strong> <span className="text-gray-700">{selectedDeclaration.dateDebutIntervention ? new Date(selectedDeclaration.dateDebutIntervention).toLocaleString('fr-FR') : '-'}</span></div>
                    <div><strong className="text-gray-900">Actions réalisées:</strong> <span className="text-gray-700">{selectedDeclaration.actionsRealisees || '-'}</span></div>
                    <div><strong className="text-gray-900">Pièces nécessaires:</strong> <span className="text-gray-700">{selectedDeclaration.piecesNecessaires || '-'}</span></div>
                    <div><strong className="text-gray-900">Qualification:</strong> <span className="text-gray-700">{selectedDeclaration.qualification || '-'}</span></div>
                    <div><strong className="text-gray-900">Contrat/Bon de commande:</strong> <span className="text-gray-700">{selectedDeclaration.contratBonCommande || '-'}</span></div>
                  </div>
                )}

                {selectedDeclaration.motifRetour && (
                  <div className="bg-red-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-red-900 text-lg border-b pb-2">Motif de retour</h4>
                    <div><strong className="text-red-900">Motif:</strong> <span className="text-red-700">{selectedDeclaration.motifRetour}</span></div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {showUpdateModal && selectedDeclaration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-medium text-gray-900">Mettre à jour - {selectedDeclaration.numeroDeclaration}</h3>
                <button onClick={() => setShowUpdateModal(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-600">×</button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début d'intervention — enregistrée lors de la prise en charge</label>
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                      {selectedDeclaration?.dateDebutIntervention ? new Date(selectedDeclaration.dateDebutIntervention).toLocaleString('fr-FR') : 'Non définie'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actions réalisées *</label>
                    <textarea required rows={3} value={updateForm.actionsRealisees} onChange={(e) => setUpdateForm({...updateForm, actionsRealisees: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pièces nécessaires</label>
                    <textarea rows={2} value={updateForm.piecesNecessaires} onChange={(e) => setUpdateForm({...updateForm, piecesNecessaires: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contrat / Bon de commande *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500">
                        <input type="radio" name="contratBonCommande" value="Contrat" checked={updateForm.contratBonCommande === 'Contrat'} onChange={(e) => setUpdateForm({...updateForm, contratBonCommande: e.target.value})} className="accent-blue-600" />
                        <span className="text-gray-900">Contrat</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500">
                        <input type="radio" name="contratBonCommande" value="Bon de commande" checked={updateForm.contratBonCommande === 'Bon de commande'} onChange={(e) => setUpdateForm({...updateForm, contratBonCommande: e.target.value})} className="accent-blue-600" />
                        <span className="text-gray-900">Bon de commande</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée de réparation — calculée automatiquement</label>
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold">
                      {(() => {
                        if (!updateForm.dateDebutIntervention) return 'Sélectionnez la date de début...';
                        const debut = new Date(updateForm.dateDebutIntervention);
                        const fin = new Date();
                        const diffMs = fin.getTime() - debut.getTime();
                        if (diffMs < 0) return 'La date de début est dans le futur';
                        if (diffMs < 60000) return 'Moins d\'une minute';
                        const totalMin = Math.floor(diffMs / 60000);
                        const j = Math.floor(totalMin / 1440);
                        const h = Math.floor((totalMin % 1440) / 60);
                        const m = totalMin % 60;
                        if (j > 0) return `${j}j ${h}h ${m}m`;
                        if (h > 0) return `${h}h ${m}m`;
                        return `${m}m`;
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Calculée automatiquement entre la date de début et la soumission.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">État de réparation</label>
                    <select value={updateForm.etatReparation} onChange={(e) => setUpdateForm({...updateForm, etatReparation: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Sélectionnez l'état</option>
                      <option value="TRAITE">Traité</option>
                      <option value="NON_TRAITE">Non traité</option>
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="REPARE">Réparé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût du problème (MAD) *</label>
                    <input type="number" required value={updateForm.coutProbleme} onChange={(e) => { const value = e.target.value; if (value === '' || parseFloat(value) > 0) { setUpdateForm({...updateForm, coutProbleme: value}); } }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: 5000" min="0.01" step="0.01" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t flex-shrink-0">
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Annuler</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Mettre à jour</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showStepper && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-neutral-gray dark:border-dark-border px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-danone-blue to-danone-blue-dark rounded-xl flex items-center justify-center shadow-soft">
                    <ListOrdered className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-text dark:text-white">Mode Stepper</h2>
                </div>
                <button onClick={() => setShowStepper(false)} className="w-8 h-8 bg-neutral-gray dark:bg-dark-border rounded-lg flex items-center justify-center text-neutral-text-light dark:text-dark-text-secondary hover:bg-neutral-gray-dark dark:hover:bg-dark-border/80 transition-all" aria-label="Fermer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <PrestataireStepper />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ModernPrestataireDashboard;
