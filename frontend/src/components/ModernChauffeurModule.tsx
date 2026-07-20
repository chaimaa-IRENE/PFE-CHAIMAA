import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import { User, TypePanne, Criticite, DeclarationIncident } from "../types/incident";
import DriverChecklistView from "./DriverChecklistView";
import DashboardLayout from "./ui/DashboardLayout";
import Card from "./ui/Card";
import Toast from "./ui/Toast";
import Badge from "./ui/Badge";
import Skeleton from "./ui/Skeleton";
import { FormInput, FormSelect, FormTextarea, FormSection, FormStepper, FormUpload, FormModal } from "../lib/premium/forms";
import {
  LayoutDashboard, FileText, FilePlus, User as UserIcon,
  MapPin, Truck, AlertTriangle, CheckCircle, XCircle,
  ArrowLeft, ArrowRight, RefreshCw,
  X, ChevronRight, ChevronLeft, Inbox, Edit3, Eye, Calendar, Clock,
  ClipboardCheck, Search, UserCheck
} from "lucide-react";
import { TruckLifecycle } from "../lib/premium/immersive/TruckLifecycle";
import { StatusTimeline } from "../lib/premium/immersive/StatusTimeline";

interface ModernChauffeurModuleProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const ModernChauffeurModule: React.FC<ModernChauffeurModuleProps> = ({ currentUser, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [location, setLocation] = useState({ city: '', latitude: null as number | null, longitude: null as number | null });
  const [manualVehicleType, setManualVehicleType] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [declaration, setDeclaration] = useState({
    typePanne: TypePanne.MECANIQUE,
    criticite: Criticite.NON_BLOQUANT,
    description: '',
    kilometrage: '',
    chauffeurNom: currentUser?.name || currentUser?.firstname || '',
    immatriculation: '',
    vehiculeId: 0,
    source: '',
    elementVehicule: '',
    detailElement: '',
    categorie: ''
  });
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [selectedVehicule, setSelectedVehicule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [dateTime] = useState(new Date().toISOString());
  const [activeTab, setActiveTab] = useState('declaration');
  const [declarations, setDeclarations] = useState<DeclarationIncident[]>([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationIncident | null>(null);
  const [declarationsLoading, setDeclarationsLoading] = useState(false);
  const [declarationsError, setDeclarationsError] = useState("");

  // Vérification de matricule
  const [plateInput, setPlateInput] = useState("");
  const [plateVerified, setPlateVerified] = useState(false);
  const [plateChecking, setPlateChecking] = useState(false);
  const [plateError, setPlateError] = useState("");
  const [chauffeurVehicules, setChauffeurVehicules] = useState<any[]>([]);
  const [vehiculesLoaded, setVehiculesLoaded] = useState(false);
  const [inputMode, setInputMode] = useState<"manuel" | "liste">("manuel");

  const selectVehicule = (v: any) => {
    setSelectedVehicule(v);
    setManualVehicleType(v.type || "");
    setPlateInput(v.immatriculation);
    setDeclaration((prev) => ({
      ...prev,
      vehiculeId: v.id,
      immatriculation: v.immatriculation,
      kilometrage: v.kilometrage?.toString() || prev.kilometrage,
    }));
    setPlateVerified(true);
    setPlateError("");
  };

  const verifyPlate = async (plate: string) => {
    if (!plate || plate.trim().length < 3) { setPlateError(""); setPlateVerified(false); return; }
    setPlateChecking(true);
    setPlateError("");
    const ref = plate.trim().toUpperCase();
    try {
      const chauffeurId = currentUser?.id || 0;
      let vehicles = chauffeurVehicules;
      if (!vehiculesLoaded && chauffeurId > 0) {
        try {
          const res = await axios.get(`${API_BASE}/api/vehicules/chauffeur/${chauffeurId}`);
          vehicles = Array.isArray(res.data) ? res.data : [];
          setChauffeurVehicules(vehicles);
          setVehiculesLoaded(true);
        } catch { }
      }
      const found = vehicles.find((v: any) =>
        v.immatriculation?.toUpperCase() === ref
      );
      if (found) {
        selectVehicule(found);
      } else {
        setSelectedVehicule(null);
        setPlateVerified(false);
        setPlateError(`Matricule "${ref}" non trouvé parmi vos véhicules affectés.`);
      }
    } catch { setPlateError("Erreur de vérification"); }
    finally { setPlateChecking(false); }
  };

  const resetPlate = () => {
    setPlateInput("");
    setPlateVerified(false);
    setPlateError("");
    setSelectedVehicule(null);
    setDeclaration((prev) => ({ ...prev, vehiculeId: 0, immatriculation: "" }));
  };

  useEffect(() => {
    const savedData = localStorage.getItem('chauffeurFormData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setLocation(data.location || { city: '', latitude: null, longitude: null });
      setManualVehicleType(data.manualVehicleType || '');
      setManualCity(data.manualCity || '');
      setDeclaration(data.declaration || {
        typePanne: TypePanne.MECANIQUE,
        criticite: Criticite.NON_BLOQUANT,
        description: '',
        kilometrage: '',
        chauffeurNom: currentUser?.name || currentUser?.firstname || '',
        immatriculation: '',
        vehiculeId: 0,
        source: '',
        elementVehicule: '',
        detailElement: '',
        categorie: ''
      });
      setSelectedVehicule(data.selectedVehicule || null);
      setCurrentStep(data.currentStep || 1);
    }
    fetchVehicules();
  }, []);

  useEffect(() => {
    localStorage.setItem('chauffeurFormData', JSON.stringify({ location, declaration, currentStep, manualVehicleType, manualCity, selectedVehicule }));
  }, [location, declaration, currentStep, manualVehicleType, manualCity, selectedVehicule]);

  const fetchVehicules = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/vehicules`);
      setVehicules(Array.isArray(data) ? data : []);
      const chauffeurId = currentUser?.id || 0;
      if (chauffeurId > 0) {
        try {
          const r = await axios.get(`${API_BASE}/api/vehicules/chauffeur/${chauffeurId}`);
          if (Array.isArray(r.data)) {
            setChauffeurVehicules(r.data);
            setVehiculesLoaded(true);
          }
        } catch { }
      }
    } catch (err) {
      console.error("Erreur chargement véhicules:", err);
    }
  };

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the actual city value (manual or selected)
    const actualCity = location.city === 'MANUEL' ? manualCity : location.city;
    
    // Validate
    if (!actualCity || !manualVehicleType || !declaration.description) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('numeroDemande', `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);
      formData.append('dateHeure', new Date().toISOString());
      formData.append('typePanne', declaration.typePanne);
      formData.append('criticite', declaration.criticite);
      formData.append('description', declaration.description);
      formData.append('location', actualCity);
      formData.append('lieu', actualCity);
      formData.append('chauffeurId', (currentUser?.id ?? 1).toString());
      formData.append('chauffeurNom', declaration.chauffeurNom);
      formData.append('kilometrage', declaration.kilometrage);
      formData.append('vehiculeImmatriculation', declaration.immatriculation);
      formData.append('vehiculeId', declaration.vehiculeId.toString());
      formData.append('vehiculeType', manualVehicleType);

      formData.append('source', declaration.source);
      formData.append('elementVehicule', declaration.elementVehicule);
      formData.append('detailElement', declaration.detailElement);
      formData.append('categorie', declaration.categorie);

      if (photo) {
        formData.append('photo', photo);
      } else {
        formData.append('photo', new Blob([''], {type: 'image/jpeg'}), 'placeholder.jpg');
      }

      if (video) {
        formData.append('video', video);
      }
      
      await axios.post(`${API_BASE}/api/declarations`, formData);
      setSuccess("Déclaration envoyée");
      setToastMessage("✓ Déclaration envoyée - En attente de prise en charge");
      setToastType("success");
      setShowToast(true);
      setError("");
      setLocation({ city: '', latitude: null, longitude: null });
      setManualCity('');
      setManualVehicleType('');
      setDeclaration({
        typePanne: TypePanne.MECANIQUE,
        criticite: Criticite.NON_BLOQUANT,
        description: '',
        kilometrage: '',
        chauffeurNom: '',
        immatriculation: '',
        vehiculeId: 0,
        source: '',
        elementVehicule: '',
        detailElement: '',
        categorie: ''
      });
      setSelectedVehicule(null);
      setCurrentStep(1);
      localStorage.removeItem('chauffeurFormData');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Erreur lors de l'envoi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !location.city) { setError("Sélectionnez une localisation"); return; }
    if (currentStep === 2 && !plateVerified) { setError("Vérifiez d'abord votre matricule"); return; }
    setError("");
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => setCurrentStep(currentStep - 1);

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'fr',
          'User-Agent': 'DanoneIncidents/1.0'
        }
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const addr = data.address;
    return (addr.city || addr.town || addr.village || addr.locality || addr.municipality || addr.county || '').toUpperCase();
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const cityName = await reverseGeocode(latitude, longitude);
          if (cityName) {
            setLocation({ city: cityName, latitude, longitude });
            setSuccess(`Localisation détectée : ${cityName}`);
          } else {
            setLocation({ city: 'MANUEL', latitude, longitude });
            setManualCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setError("Ville non trouvée par GPS. Saisissez la ville manuellement.");
          }
        } catch {
          setLocation({ city: 'MANUEL', latitude, longitude });
          setManualCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setError("Impossible de déterminer la ville. Saisissez-la manuellement.");
        }
        setLoading(false);
      },
      (error) => {
        let msg = "Impossible d'obtenir votre position";
        if (error.code === 1) msg = "Accès à la géolocalisation refusé";
        else if (error.code === 2) msg = "Position non disponible";
        else if (error.code === 3) msg = "Délai d'attente expiré";
        setError(`${msg}. Veuillez utiliser le mode manuel.`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchDeclarations = async () => {
    setDeclarationsLoading(true);
    setDeclarationsError("");
    try {
      const id = currentUser?.id || 1;
      const { data } = await axios.get<DeclarationIncident[]>(`${API_BASE}/api/declarations/chauffeur/${id}`);
      setDeclarations(data);
    } catch (err) {
      setDeclarationsError("Erreur lors du chargement des déclarations");
    } finally {
      setDeclarationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mes-declarations') {
      fetchDeclarations();
    }
  }, [activeTab]);

const navItems = [
      { id: 'declaration', label: 'Nouvelle déclaration', icon: <FilePlus className="w-5 h-5" />, onClick: () => setActiveTab('declaration'), active: activeTab === 'declaration' },
      { id: 'mes-declarations', label: 'Mes déclarations', icon: <FileText className="w-5 h-5" />, onClick: () => setActiveTab('mes-declarations'), active: activeTab === 'mes-declarations' },
      { id: 'checklist', label: 'Checklist', icon: <ClipboardCheck className="w-5 h-5" />, onClick: () => setActiveTab('checklist'), active: activeTab === 'checklist' },
      { id: 'profil', label: 'Profil', icon: <UserIcon className="w-5 h-5" />, onClick: () => setActiveTab('profil'), active: activeTab === 'profil' },
    ];

  const statusVariant = (statut?: string): "en-cours" | "cloture" | "en-attente" | "en-validation" | "retourne" | "refuse" | "default" => {
    switch (statut) {
      case 'EN_ATTENTE': return 'en-attente';
      case 'EN_COURS': return 'en-cours';
      case 'EN_VALIDATION': return 'en-validation';
      case 'CLOTURE': case 'TRAITE': return 'cloture';
      case 'RETOURNEE': return 'retourne';
      case 'REFUSE': return 'refuse';
      default: return 'default';
    }
  };

  const statusLabel = (statut?: string): string => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_COURS': return 'En cours';
      case 'EN_VALIDATION': return 'En validation';
      case 'CLOTURE': case 'TRAITE': return 'Clôturé';
      case 'RETOURNEE': return 'Retournée';
      case 'REFUSE': return 'Refusé';
      default: return statut || 'Inconnu';
    }
  };

  const villeFromLabel = (loc: string): string => {
    const n = loc.toLowerCase();
    const map: Record<string, string> = {
      casablanca: 'CASABLANCA', casa: 'CASABLANCA',
      rabat: 'RABAT', marrakech: 'MARRAKECH', tanger: 'TANGER',
      fès: 'FES', fes: 'FES', agadir: 'AGADIR', oujda: 'OUJDA',
    };
    for (const [key, val] of Object.entries(map)) {
      if (n.includes(key)) return val;
    }
    return 'MANUEL';
  };

  const matchVehiculeFromIA = (vehiculeRef: string) => {
    if (!vehiculeRef || vehiculeRef === 'UNKNOWN') return;
    const ref = vehiculeRef.trim().toLowerCase();
    const assigned = chauffeurVehicules.length > 0 ? chauffeurVehicules : vehicules;
    const found = assigned.find(
      (v: any) =>
        v.immatriculation?.toLowerCase().includes(ref) ||
        String(v.id) === ref ||
        v.immatriculation?.replace(/\D/g, '').includes(ref.replace(/\D/g, ''))
    );
    if (found) {
      setSelectedVehicule(found);
      setManualVehicleType(found.type || '');
      setPlateVerified(true);
      setPlateInput(found.immatriculation);
      setDeclaration((prev) => ({
        ...prev,
        vehiculeId: found.id,
        immatriculation: found.immatriculation || vehiculeRef,
        kilometrage: found.kilometrage?.toString() || prev.kilometrage,
      }));
    } else {
      setDeclaration((prev) => ({
        ...prev,
        immatriculation: vehiculeRef,
      }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAIAnalyse = (_r: Record<string, string>) => { };

  const handlePhotoAnalyse = (mapped: Record<string, string>) => {
    setDeclaration((prev) => ({
      ...prev,
      immatriculation: mapped.plaqueDetectee || prev.immatriculation,
      chauffeurNom: currentUser?.name || prev.chauffeurNom,
      description: mapped.description || prev.description,
      elementVehicule: mapped.elementVehicule || prev.elementVehicule,
      detailElement: mapped.detailElement || prev.detailElement,
      categorie: mapped.categorie || prev.categorie,
      criticite:
        mapped.criticite === 'BLOQUANT'
          ? Criticite.BLOQUANT
          : mapped.criticite === 'URGENT'
            ? Criticite.URGENT
            : mapped.criticite === 'SECURITE'
              ? Criticite.SECURITE
              : Criticite.NON_BLOQUANT,
      source: mapped.source || 'Photo IA',
    }));
    setCurrentStep(3);
    setActiveTab('declaration');
    setToastMessage('Formulaire prérempli par l\'analyse photo IA');
    setToastType('success');
    setShowToast(true);
  };

  const mapTypePanne = (typePanne: string, element: string): TypePanne => {
    if (typePanne) {
      const upper = typePanne.toUpperCase();
      if (upper === 'ELECTRIQUE') return TypePanne.ELECTRIQUE;
      if (upper === 'SECURITE') return TypePanne.SECURITE;
      if (upper === 'CABINE') return TypePanne.CABINE;
      if (upper === 'CAISSE') return TypePanne.CAISSE;
      if (upper === 'MECANIQUE') return TypePanne.MECANIQUE;
    }
    return TypePanne.MECANIQUE;
  };

  const renderDeclarationForm = () => (
    <>
      <FormStepper
        steps={[
          { label: "Localisation", icon: <MapPin className="w-4 h-4" /> },
          { label: "Véhicule", icon: <Truck className="w-4 h-4" /> },
          { label: "Déclaration", icon: <FileText className="w-4 h-4" /> }
        ]}
        currentStep={currentStep - 1}
        onStepClick={(step) => setCurrentStep(step + 1)}
        className="mb-8"
      />

      {currentStep === 1 && (
        <FormSection title="Localisation" description="Indiquez votre position actuelle" icon={<MapPin className="w-5 h-5" />} index={0}>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleGPS} disabled={loading} className="relative bg-gradient-to-r from-danone-blue to-danone-blue-dark p-4 sm:p-6 rounded-xl text-white font-bold hover:from-danone-blue-dark hover:to-blue-900 transition-all duration-200 hover:scale-105 shadow-lg shadow-danone-blue/20 disabled:opacity-50 disabled:scale-100">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Détection...
                </span>
              ) : (
                <>
                  <MapPin className="w-6 h-6 mx-auto mb-1" />
                  GPS
                </>
              )}
            </button>
            <button onClick={() => setLocation({ city: 'MANUEL', latitude: null, longitude: null })} disabled={loading} className="bg-white/[0.04] border border-white/[0.08] p-4 sm:p-6 rounded-xl text-slate-300 font-bold hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100">
              <Edit3 className="w-6 h-6 mx-auto mb-1" />
              Manuel
            </button>
          </div>

          {location.city && location.city !== 'MANUEL' && (
            <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-emerald-400 text-sm">Localisation détectée</p>
                  <p className="text-lg font-bold text-[#f1f5f9] mt-0.5">{location.city}</p>
                  {location.latitude && location.longitude && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Coordonnées : {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setLocation({ city: 'MANUEL', latitude: location.latitude, longitude: location.longitude })}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Modifier
                </button>
              </div>
            </div>
          )}

          <FormSelect
            label={`Ville ${!location.city || location.city === 'MANUEL' ? '' : '(modifier si besoin)'}`}
            value={location.city === 'MANUEL' ? 'MANUEL' : (location.city || '')}
            onChange={(value) => {
              if (value === 'MANUEL') {
                setLocation({ city: 'MANUEL', latitude: location.latitude, longitude: location.longitude });
                setManualCity('');
              } else {
                setLocation({ city: value, latitude: location.latitude, longitude: location.longitude });
                setManualCity('');
              }
            }}
            options={[
              { value: 'CASABLANCA', label: 'Casablanca' },
              { value: 'RABAT', label: 'Rabat' },
              { value: 'MARRAKECH', label: 'Marrakech' },
              { value: 'TANGER', label: 'Tanger' },
              { value: 'FES', label: 'Fès' },
              { value: 'MANUEL', label: 'Autre (saisie manuelle)' },
            ]}
            icon={<MapPin className="w-4 h-4" />}
            required
            placeholder="Sélectionnez une ville"
          />

          {(location.city === 'MANUEL' || !location.city) && (
            <FormInput
              label="Nom de la ville"
              value={manualCity}
              onChange={(value) => setManualCity(value)}
              placeholder="Entrez le nom de la ville..."
              icon={<Edit3 className="w-4 h-4" />}
            />
          )}

          <div className="flex justify-end pt-2">
            <button onClick={nextStep} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105">Suivant <ArrowRight className="w-4 h-4 inline ml-1" /></button>
          </div>
        </FormSection>
      )}

      {currentStep === 2 && (
        <FormSection title="Véhicule" description="Choisissez votre véhicule" icon={<Truck className="w-5 h-5" />} index={0}>
          {!plateVerified ? (
            <div className="space-y-4">
              {/* Mode selector tabs */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
                <button onClick={() => setInputMode("manuel")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${inputMode === "manuel" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:text-white"}`}>
                  <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Manuel
                </button>
                <button onClick={() => setInputMode("liste")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${inputMode === "liste" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:text-white"}`}>
                  <Truck className="w-3.5 h-3.5 inline mr-1" /> Mes véhicules
                </button>
              </div>

              {inputMode === "manuel" && (
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Entrez le matricule</label>
                      <input type="text" value={plateInput} onChange={(e) => { setPlateInput(e.target.value.toUpperCase()); setPlateVerified(false); setPlateError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") verifyPlate(plateInput); }}
                        placeholder="Ex: AA-123-BC"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase tracking-wider" />
                    </div>
                    <button onClick={() => verifyPlate(plateInput)} disabled={plateChecking || plateInput.trim().length < 3}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 h-[42px]">
                      {plateChecking ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                      Vérifier
                    </button>
                  </div>
                  {plateError && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {plateError}</p>
                    </div>
                  )}
                </div>
              )}

              {inputMode === "liste" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Sélectionnez votre véhicule parmi ceux affectés :</p>
                  {chauffeurVehicules.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500">Aucun véhicule affecté trouvé</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                      {chauffeurVehicules.map((v: any) => (
                        <button key={v.id} onClick={() => selectVehicule(v)}
                          className="flex items-center gap-3 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl px-4 py-3 text-left transition-all">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{v.immatriculation}</p>
                            <p className="text-xs text-slate-400 truncate">{v.marque} {v.modele} · {v.type} · {v.kilometrage || "-"} km</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-300 mb-1">Matricule validé</p>
                    <p className="text-lg font-bold text-white">{selectedVehicule?.immatriculation}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      <p><span className="text-slate-500">Marque:</span> <span className="text-slate-200 font-semibold">{selectedVehicule?.marque}</span></p>
                      <p><span className="text-slate-500">Modèle:</span> <span className="text-slate-200 font-semibold">{selectedVehicule?.modele}</span></p>
                      <p><span className="text-slate-500">Type:</span> <span className="text-slate-200 font-semibold">{selectedVehicule?.type || "-"}</span></p>
                      <p><span className="text-slate-500">Km:</span> <span className="text-slate-200 font-semibold">{selectedVehicule?.kilometrage || "-"} km</span></p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-500/20">
                      <p className="text-xs text-slate-500">Chauffeur associé : <span className="text-emerald-300 font-bold">{currentUser?.firstname} {currentUser?.name}</span></p>
                    </div>
                  </div>
                  <button onClick={resetPlate} className="text-xs text-blue-400 hover:text-blue-300 font-semibold shrink-0">Modifier</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={prevStep} className="bg-white/[0.04] border border-white/[0.08] text-slate-300 px-6 py-2.5 rounded-xl font-bold hover:bg-white/[0.08] transition-all duration-200 hover:scale-105"><ArrowLeft className="w-4 h-4 inline mr-1" /> Précédent</button>
            <button onClick={nextStep} disabled={!plateVerified} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100">Suivant <ArrowRight className="w-4 h-4 inline ml-1" /></button>
          </div>
        </FormSection>
      )}

      {currentStep === 3 && (
        <FormSection title="Détails de l'incident" description="Remplissez les informations de l'incident" icon={<AlertTriangle className="w-5 h-5" />} index={0} accentColor="amber">
          <form onSubmit={handleSubmitDeclaration} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Type de panne"
                value={declaration.typePanne}
                onChange={(val) => setDeclaration({...declaration, typePanne: val as TypePanne})}
                options={[
                  { value: TypePanne.MECANIQUE, label: 'Mécanique' },
                  { value: TypePanne.ELECTRIQUE, label: 'Électrique' },
                  { value: TypePanne.CAISSE, label: 'Caisse' },
                  { value: TypePanne.CABINE, label: 'Cabine' },
                  { value: TypePanne.SECURITE, label: 'Sécurité' },
                  { value: TypePanne.AUTRES, label: 'Autres' },
                ]}
                icon={<AlertTriangle className="w-4 h-4" />}
                required
              />
              <FormSelect
                label="Criticité"
                value={declaration.criticite}
                onChange={(val) => setDeclaration({...declaration, criticite: val as Criticite})}
                options={[
                  { value: Criticite.NON_BLOQUANT, label: 'Non bloquant' },
                  { value: Criticite.URGENT, label: 'Urgent' },
                  { value: Criticite.BLOQUANT, label: 'Bloquant' },
                  { value: Criticite.SECURITE, label: 'Sécurité' },
                ]}
                required
              />
            </div>

            <FormTextarea
              label="Description"
              value={declaration.description}
              onChange={(val) => setDeclaration({...declaration, description: val})}
              rows={4}
              placeholder="Décrivez le problème..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Nom du chauffeur"
                value={declaration.chauffeurNom}
                onChange={() => {}}
                readOnly
                required
                icon={<UserIcon className="w-4 h-4" />}
              />
              <FormInput
                label="Kilométrage (km)"
                value={declaration.kilometrage}
                onChange={(val) => setDeclaration({...declaration, kilometrage: val})}
                type="number"
                placeholder="Entrez le kilométrage actuel..."
              />
            </div>

            <FormInput
              label="Date et heure (automatique)"
              value={new Date(dateTime).toLocaleString('fr-FR')}
              onChange={() => {}}
              disabled
              icon={<Calendar className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Source"
                value={declaration.source}
                onChange={(val) => setDeclaration({...declaration, source: val})}
                options={[
                  { value: 'FICHE_ALERTE', label: "Fiche d'alerte" },
                  { value: 'MAINTENANCE_CURATIVE', label: 'Maintenance Curative' },
                  { value: 'MAINT_PREV_MENSUELLE', label: 'Maintenance Préventive mensuelle' },
                  { value: 'MAINT_PREV_HEBDOMADAIRE', label: 'Maintenance Préventive hebdomadaire' },
                  { value: 'MAINT_PREV_TRIMESTRIELLE', label: 'Maintenance Préventive trimestrielle' },
                  { value: 'PANNE_MARCHE', label: 'Panne marché' },
                  { value: 'INCIDENT_MARCHE', label: 'Incident marché' },
                ]}
                required
                placeholder="Sélectionnez la source"
                searchable
              />
              <FormSelect
                label="Élément véhicule"
                value={declaration.elementVehicule}
                onChange={(val) => setDeclaration({...declaration, elementVehicule: val})}
                options={[
                  { value: 'CABINE', label: 'Cabine' },
                  { value: 'CAISSE', label: 'Caisse' },
                  { value: 'ECLAIRAGE', label: 'Éclairage' },
                  { value: 'FROID', label: 'Froid' },
                  { value: 'MECANIQUE', label: 'Mécanique' },
                  { value: 'PAPIER_ACCESSOIRE', label: 'Papier Accessoire' },
                ]}
                required
                placeholder="Sélectionnez l'élément"
              />
            </div>

            <FormSelect
              label="Détail élément"
              value={declaration.detailElement}
              onChange={(val) => setDeclaration({...declaration, detailElement: val})}
              options={[
                { value: 'KLAXON', label: 'Klaxon' },
                { value: 'PLANCHER', label: 'Plancher' },
                { value: 'PANNEAUX', label: 'Panneaux' },
                { value: 'PLAFOND', label: 'Plafond' },
                { value: 'FACE_AVANT', label: 'Face Avant' },
                { value: 'PONTS', label: 'Ponts' },
                { value: 'ETANCHEITE', label: 'Étanchéité' },
                { value: 'LANIERE_ARRIERE', label: 'Lanière arrière' },
                { value: 'LANIERE_LATERALE', label: 'Lanière latérale' },
                { value: 'MARCH_PIED', label: 'March-pied' },
                { value: 'HAYON', label: 'Hayon' },
                { value: 'POIGNEE_INOX', label: 'Poignée inox' },
                { value: 'BARRES_PARE_CYCLISTE', label: 'Barres pare-cycliste' },
                { value: 'BANDES_REFLECHISSANTES', label: 'Bandes réfléchissantes' },
                { value: 'TROIS_POINTS_APPUI', label: "3 points d'appui" },
              ]}
              placeholder="Sélectionnez le détail"
              searchable
            />

            <FormSelect
              label="Catégorie"
              value={declaration.categorie}
              onChange={(val) => setDeclaration({...declaration, categorie: val})}
              options={[
                { value: 'MECANIQUE', label: 'Mécanique' },
                { value: 'SECURITE', label: 'Sécurité' },
                { value: 'QUALITE', label: 'Qualité' },
                { value: 'VISIBILITE', label: 'Visibilité' },
                { value: 'DOCUMENTATION_LEGALE', label: 'Documentation légale' },
                { value: 'EXTERIEUR', label: 'Extérieur' },
              ]}
              required
              placeholder="Sélectionnez la catégorie"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormUpload
                label="Photo (optionnel)"
                accept="image/*"
                onChange={(files) => setPhoto(files?.[0] || null)}
              />
              <FormUpload
                label="Vidéo (optionnel)"
                accept="video/*"
                onChange={(files) => setVideo(files?.[0] || null)}
              />
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={prevStep} className="bg-white/[0.04] border border-white/[0.08] text-slate-300 px-6 py-2.5 rounded-xl font-bold hover:bg-white/[0.08] transition-all duration-200 hover:scale-105"><ArrowLeft className="w-4 h-4 inline mr-1" /> Précédent</button>
              <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100">{loading ? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </form>
        </FormSection>
      )}
    </>
  );

  const renderMesDeclarations = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mes déclarations</h2>
        <button onClick={fetchDeclarations} className="flex items-center gap-2 text-sm text-danone-blue hover:text-danone-blue-dark font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {declarationsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : declarationsError ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 dark:text-red-400 font-medium">{declarationsError}</p>
        </div>
      ) : declarations.length === 0 ? (
        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-xl p-12 text-center border border-slate-200/50 dark:border-dark-border">
          <FileText className="w-16 h-16 text-slate-300 dark:text-dark-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-2">Aucune déclaration</h3>
          <p className="text-slate-500 dark:text-dark-text-secondary">Vous n'avez pas encore soumis de déclaration.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-border/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">N° Déclaration</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Véhicule</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-dark-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {declarations.map((dec) => (
                  <tr key={dec.id} className="hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{dec.numeroDeclaration || `#${dec.id}`}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-dark-text-secondary whitespace-nowrap">
                      {dec.dateDeclaration ? new Date(dec.dateDeclaration).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700 dark:text-white">{dec.typePanneFrancais || dec.typePanne || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-dark-text-secondary">
                      {dec.vehiculeImmatriculation || dec.vehicule?.immatriculation || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(dec.statut)}>{statusLabel(dec.statut)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedDeclaration(dec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-danone-blue bg-danone-blue/5 hover:bg-danone-blue/10 border border-danone-blue/20 transition-all duration-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-border/30">
            <p className="text-xs text-slate-500 dark:text-dark-text-secondary">
              {declarations.length} déclaration{declarations.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <FormModal
        open={!!selectedDeclaration}
        onClose={() => setSelectedDeclaration(null)}
        title="Détail de la déclaration"
        description={selectedDeclaration?.numeroDeclaration || (selectedDeclaration ? `#${selectedDeclaration.id}` : undefined)}
        icon={<Eye className="w-5 h-5" />}
        size="lg"
      >
        {selectedDeclaration && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">N° Déclaration</p>
                <p className="text-lg font-bold text-[#f1f5f9]">{selectedDeclaration.numeroDeclaration || `#${selectedDeclaration.id}`}</p>
              </div>
              <Badge variant={statusVariant(selectedDeclaration.statut)}>{statusLabel(selectedDeclaration.statut)}</Badge>
            </div>

            {selectedDeclaration && (
              <div className="mb-4">
                <TruckLifecycle status={selectedDeclaration.statut || ''} vehicleInfo={{ immatriculation: selectedDeclaration.vehiculeImmatriculation }} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Date</p>
                <p className="text-sm text-slate-300">
                  {selectedDeclaration.dateDeclaration
                    ? new Date(selectedDeclaration.dateDeclaration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Type de panne</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.typePanneFrancais || selectedDeclaration.typePanne || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Criticité</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.criticite || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Localisation</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.location || selectedDeclaration.lieuIncidentFrancais || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Véhicule</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.vehiculeImmatriculation || selectedDeclaration.vehicule?.immatriculation || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Chauffeur</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.chauffeurNom || selectedDeclaration.chauffeur?.firstname || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Source</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.source || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Catégorie</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.categorie || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Élément véhicule</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.elementVehicule || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Détail élément</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.detailElement || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Kilométrage</p>
                <p className="text-sm text-slate-300">{selectedDeclaration.kilometrage ? `${selectedDeclaration.kilometrage} km` : '-'}</p>
              </div>
              {(selectedDeclaration.motifRefus || selectedDeclaration.motifRetour) && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-semibold mb-0.5">Motif</p>
                  <p className="text-sm text-rose-400">{selectedDeclaration.motifRefus || selectedDeclaration.motifRetour}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold mb-0.5">Description</p>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedDeclaration.description || 'Aucune description'}</p>
              </div>
            </div>

            {(selectedDeclaration.actionsRealisees || selectedDeclaration.piecesNecessaires || selectedDeclaration.coutProbleme) && (
              <div className="border-t border-white/[0.06] pt-4">
                <h4 className="text-sm font-bold text-[#f1f5f9] mb-3">Rapport d'intervention</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Actions réalisées</p>
                    <p className="text-slate-300">{selectedDeclaration.actionsRealisees || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Pièces utilisées</p>
                    <p className="text-slate-300">{selectedDeclaration.piecesNecessaires || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Durée</p>
                    <p className="text-slate-300">{selectedDeclaration.dureeReparation != null ? (() => { const totalSec = Number(selectedDeclaration.dureeReparation); const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60; if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${s}s`; return `${s}s`; })() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Coût</p>
                    <p className="text-slate-300">{selectedDeclaration.coutProbleme ? `${selectedDeclaration.coutProbleme} MAD` : '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/[0.06] pt-4 mt-4">
              <h4 className="text-sm font-bold text-[#f1f5f9] mb-3">Cycle de vie</h4>
              <StatusTimeline
                events={[
                  { status: "EN_ATTENTE", label: "Déclaration", date: selectedDeclaration.dateDeclaration ? new Date(selectedDeclaration.dateDeclaration).toLocaleDateString('fr-FR') : undefined, actor: selectedDeclaration.chauffeurNom },
                  { status: "PRISE_EN_CHARGE", label: "Prise en charge", actor: selectedDeclaration.rapportIntervention?.nomIntervenant || selectedDeclaration.responsableSupport },
                  { status: "EN_REPARATION", label: "Réparation" },
                  { status: selectedDeclaration.statut === "REPARE" || selectedDeclaration.statut === "TRAITE" || selectedDeclaration.statut === "CLOTURE" || selectedDeclaration.statut === "VALIDE" ? "REPARE" : selectedDeclaration.statut === "EN_VALIDATION" ? "EN_VALIDATION" : selectedDeclaration.statut === "RETOURNEE" ? "RETOURNEE" : selectedDeclaration.statut === "REFUSE" ? "REFUSE" : "REPARE", label: "Résolution" },
                ]}
                currentStatus={selectedDeclaration.statut || ''}
                compact
              />
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );

  const renderProfil = () => (
    <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200/50 dark:border-dark-border">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Mon profil</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-dark-border/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold uppercase tracking-wider">Nom</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{currentUser?.name || '-'}</p>
        </div>
        <div className="bg-slate-50 dark:bg-dark-border/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold uppercase tracking-wider">Prénom</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{currentUser?.firstname || '-'}</p>
        </div>
        <div className="bg-slate-50 dark:bg-dark-border/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold uppercase tracking-wider">Email</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{currentUser?.email || '-'}</p>
        </div>
        <div className="bg-slate-50 dark:bg-dark-border/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold uppercase tracking-wider">Code branche</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{currentUser?.branchCode || '-'}</p>
        </div>
        <div className="bg-slate-50 dark:bg-dark-border/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold uppercase tracking-wider">Ville</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{currentUser?.ville || '-'}</p>
        </div>
        <div className="bg-slate-50 dark:bg-dark-border/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold uppercase tracking-wider">Code personnel</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{currentUser?.personCode || '-'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      navItems={navItems}
      title="Chauffeur"
      subtitle="Déclaration d'incident"
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <div className="p-4 sm:p-6 space-y-5">
        {activeTab === 'declaration' && renderDeclarationForm()}
        {activeTab === 'mes-declarations' && renderMesDeclarations()}

        {activeTab === 'checklist' && <DriverChecklistView currentUser={currentUser} />}
        {activeTab === 'profil' && renderProfil()}
      </div>
    </DashboardLayout>
  );
};

export default ModernChauffeurModule;
