import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import { Html5Qrcode } from "html5-qrcode";
import { motion } from "framer-motion";
import {
  Truck, Search, CheckCircle, QrCode,
  Send, AlertCircle, ChevronDown, ChevronUp,
  ClipboardList, Smile, Wrench, XCircle, Globe, Pen, Camera, X, User
} from "lucide-react";
import { staggerSlow, cardSlideUp, springSnappy, easeOut, easeOutFast } from "../lib/animations";

const API = API_BASE;
const PRESENCE_API = `${API_BASE}/api/driver-presence`;

const MOTIFS_DEFAUT = [
  "Usure excessive", "Dégât visible", "Fuite", "Non fonctionnel",
  "Manquant", "Date expirée", "Corrosion", "Document manquant", "Autre"
];

const CHECKLIST_ITEMS = [
  { label: "Pneus", labelAr: "الإطارات", icon: "🛞", key: "pneus" },
  { label: "Freins", labelAr: "الفرامل", icon: "🛑", key: "freins" },
  { label: "Feux", labelAr: "الأضواء", icon: "💡", key: "feux" },
  { label: "Extincteur", labelAr: "طفاية الحريق", icon: "🧯", key: "extincteur" },
  // Documents requis: Carte grise, Assurance, Visite technique
  // Si un document est manquant, le chauffeur doit sélectionner "Non conforme" et indiquer le motif
  { label: "Documents", labelAr: "الوثائق", icon: "📄", key: "documents" },
  { label: "Carrosserie", labelAr: "الهيكل", icon: "🚘", key: "carrosserie" },
  { label: "Niveau d'huile", labelAr: "مستوى الزيت", icon: "🛢️", key: "huileNiveau" },
  { label: "Batterie", labelAr: "البطارية", icon: "🔋", key: "batterie" },
  { label: "Essuie-glaces", labelAr: "الماسحات", icon: "💧", key: "essuieGlaces" },
  { label: "Ceintures sécurité", labelAr: "أحزمة الأمان", icon: "🔗", key: "ceinturesSecurite" },
];

const FEEDBACK_OPTIONS = [
  { emoji: "😊", label: "Très satisfait", value: "😊" },
  { emoji: "😐", label: "Moyen", value: "😐" },
  { emoji: "😟", label: "Insatisfait", value: "😟" },
  { emoji: "🚫", label: "Inacceptable", value: "🚫" },
];

const T: Record<string, Record<string, string>> = {
  fr: {
    title: "Contrôle Véhicule",
    identify: "Identifier le véhicule",
    scanPlaceholder: "QR code ou code-barres du camion",
    scanButton: "Scanner",
    orSelect: "Ou sélectionner dans la liste",
    identified: "Véhicule identifié",
    checklist: "Checklist 10 points",
    submittedLabel: "(Soumis)",
    expandAll: "Tout cocher conforme",
    collapseAll: "Tout remettre à zéro",
    conforme: "✅ Conforme",
    nonConforme: "❌ Non conforme",
    allConforme: "Tout est conforme",
    nonConformeDetected: "Éléments non conformes détectés",
    validate: "✅ Valider et débuter la tournée",
    saveAnomalies: "Enregistrer les anomalies",
    recording: "Enregistrement...",
    startTour: "✅ Vous pouvez débuter votre tournée",
    truckBlocked: "❌ Camion bloqué - Contacter la maintenance",
    repairModule: "Module de réparation",
    feedback: "Feedback — état général du véhicule",
    requiredStep: "* Le contrôle ne peut débuter sans cette étape",
    defect: "Motif du défaut *",
    comment: "Commentaire (optionnel)",
    langSwitch: "عربي",
  },
  ar: {
    title: "فحص المركبة",
    identify: "تحديد المركبة",
    scanPlaceholder: "رمز QR أو الباركود",
    scanButton: "مسح",
    orSelect: "أو اختيار من القائمة",
    identified: "تم تحديد المركبة",
    checklist: "قائمة الفحص 10 نقاط",
    submittedLabel: "(تم الإرسال)",
    expandAll: "تحديد الكل مطابق",
    collapseAll: "إعادة تعيين",
    conforme: "✅ مطابق",
    nonConforme: "❌ غير مطابق",
    allConforme: "كل شيء مطابق",
    nonConformeDetected: "عناصر غير مطابقة مكتشفة",
    validate: "✅ تأكيد وبدء الجولة",
    saveAnomalies: "تسجيل المخالفات",
    recording: "جاري التسجيل...",
    startTour: "✅ يمكنك بدء جولتك",
    truckBlocked: "❌ الشاحنة محظورة - اتصل بالصيانة",
    repairModule: "وحدة الإصلاح",
    feedback: "ملاحظات - الحالة العامة للمركبة",
    requiredStep: "* لا يمكن بدء الفحص بدون هذه الخطوة",
    defect: "سبب العيب *",
    comment: "تعليق (اختياري)",
    langSwitch: "Français",
  },
};

interface DefectItem {
  item: string;
  conforme: boolean;
  motifs: string[];
  commentaire: string;
}

interface DriverChecklistViewProps {
  currentUser?: any;
}

export default function DriverChecklistView({ currentUser }: DriverChecklistViewProps) {
  const [lang, setLang] = useState<"fr" | "ar">("fr");
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [selectedVehicule, setSelectedVehicule] = useState<any>(null);
  const [vehicleListOpen, setVehicleListOpen] = useState(false);
  const [checklistId, setChecklistId] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean | null>>({});
  const [defects, setDefects] = useState<Record<string, DefectItem>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [qrInput, setQrInput] = useState("");
  const [qrError, setQrError] = useState("");
  const [arabeAlert, setArabeAlert] = useState<string | null>(null);
  const [estConforme, setEstConforme] = useState<boolean | null>(null);
  const [checklistStatus, setChecklistStatus] = useState<string>("PENDING");
  const [chauffeurInfo, setChauffeurInfo] = useState({
    nom: currentUser?.name || currentUser?.firstname || "",
    matricule: currentUser?.matricule || currentUser?.personCode || "",
    id: currentUser?.id || 0,
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [tourneeId] = useState(() => "TRN-" + Date.now().toString(36).toUpperCase());
  const [canDepart, setCanDepart] = useState<{ canDepart: boolean; reason: string; isBlocked: boolean; lastChecklistDate: string | null; lastChecklistStatut: string | null } | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const allChecked = CHECKLIST_ITEMS.every(item => checkedItems[item.key] !== null);
  const allOk = CHECKLIST_ITEMS.every(item => checkedItems[item.key] === true);
  const hasDefects = Object.keys(defects).length > 0;

  // Scanner camera + présence chauffeur
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ID = "qr-scanner";
  const [showPhotoOption, setShowPhotoOption] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driverPresent, setDriverPresent] = useState(false);
  const [driverCheckinLoading, setDriverCheckinLoading] = useState(false);

  const cameraLabel = cameraFacing === "environment" ? "Arrière" : "Avant";

  useEffect(() => {
    const chauffeurId = currentUser?.id || chauffeurInfo.id;
    if (chauffeurId) {
      axios.get<any[]>(`${API}/api/vehicules/chauffeur/${chauffeurId}`).then(res => setVehicules(res.data || [])).catch(() => {
        axios.get<any[]>(`${API}/api/vehicules`).then(res => setVehicules(res.data || [])).catch(() => {});
      });
    } else {
      axios.get<any[]>(`${API}/api/vehicules`).then(res => setVehicules(res.data || [])).catch(() => {});
    }
  }, [currentUser]);

  const showToast = (msg: string, type: "success" | "error" | "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const selectVehicule = (v: any) => {
    setSelectedVehicule(v);
    setVehicleListOpen(false);
    setSubmitted(false);
    setChecklistId(null);
    setFeedback("");
    setArabeAlert(null);
    setEstConforme(null);
    setCheckedItems({});
    setDefects({});
    setDriverPresent(true);
    checkInDriver();
    loadExistingChecklist(v.immatriculation);
    checkDepartAuthorization(v.immatriculation);
    verifierDocuments(v.immatriculation);
  };

  const verifierDocuments = async (imm: string) => {
    try {
      const vehRes = await axios.get<any[]>(`${API}/api/vehicules`);
      const veh = (vehRes.data || []).find((v: any) => v.immatriculation === imm);
      if (!veh) return;
      const res = await axios.get<any>(`${API}/api/vehicles/${veh.id}/history`);
      const docStatus = res.data?.history?.documentStatus || {};
      const requiredDocs = ["ASSURANCE", "CARTE_GRISE", "VISITE_TECHNIQUE"];
      const invalidDocs: string[] = [];
      for (const type of requiredDocs) {
        const ds = docStatus[type];
        if (!ds || ds.etat === "MANQUANT" || ds.etat === "EXPIRE" || ds.etat === "EXPIRE_BIENTOT") {
          invalidDocs.push(ds?.label || type);
        }
      }
      if (invalidDocs.length > 0) {
        setArabeAlert("يُمنع استعمال الشاحنة لوجود وثائق منتهية الصلاحية. المرجو التواصل مع المسؤول المعني");
        showToast(`Documents expirés/manquants: ${invalidDocs.join(", ")} - Départ interdit`, "error");
      }
    } catch {
      // Erreur lors de la vérification, continuer quand même
    }
  };

  const checkDepartAuthorization = async (imm: string) => {
    try {
      const res = await axios.get<any>(`${API}/api/fleet/checklist/can-depart/${imm}`);
      setCanDepart(res.data);
    } catch {
      setCanDepart(null);
    }
  };

  const loadExistingChecklist = async (imm: string) => {
    try {
      const res = await axios.get<any>(`${API}/api/fleet/checklist/latest/${imm}`);
      if (res.data && res.data.id) {
        // Only load active (PENDING) checklists — terminal states allow fresh start
        if (res.data.statut === "PENDING") {
          setChecklistId(res.data.id);
          const items: Record<string, boolean | null> = {};
          CHECKLIST_ITEMS.forEach(({ key }) => { items[key] = res.data[key] ?? null; });
          setCheckedItems(items);
          if (res.data.statut) setChecklistStatus(res.data.statut);
          if (res.data.feedback) setFeedback(res.data.feedback);
        } else {
          // Terminal state — reset for a new checkup
          setChecklistId(null);
          setSubmitted(false);
          setCheckedItems({});
          setDefects({});
          setEstConforme(null);
          setArabeAlert(null);
          setFeedback("");
          setChecklistStatus("PENDING");
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (!checklistId || !submitted) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get<any>(`${API}/api/fleet/checklist/latest/${selectedVehicule?.immatriculation}`);
        if (res.data && res.data.statut) {
          setChecklistStatus(res.data.statut);
          if (res.data.statut === "VALIDATED") {
            setEstConforme(true);
            setArabeAlert(null);
            if (selectedVehicule) checkDepartAuthorization(selectedVehicule.immatriculation);
            clearInterval(interval);
          }
          if (res.data.statut === "REJECTED") {
            setArabeAlert("يُمنع استعمال الشاحنة لوجود حالة عدم مطابقة. المرجو التواصل مع المسؤول المعني");
            if (selectedVehicule) checkDepartAuthorization(selectedVehicule.immatriculation);
            clearInterval(interval);
          }
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [checklistId, submitted]);

  const checkInDriver = async () => {
    if (driverPresent || !currentUser) return;
    setDriverCheckinLoading(true);
    const matricule = currentUser.personCode || currentUser.matricule || currentUser.username;
    if (!matricule) { setDriverCheckinLoading(false); return; }
    try {
      await axios.post(`${PRESENCE_API}/check-in`, { matricule });
      setDriverPresent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "";
      if (msg.includes("Déja") || msg.includes("Deja")) {
        setDriverPresent(true);
      }
    }
    setDriverCheckinLoading(false);
  };

  useEffect(() => {
    if (!scanning) return;
    setScanError("");
    const el = document.getElementById(SCANNER_ID);
    if (!el) { setScanError("Element scanner introuvable"); setScanning(false); return; }
    el.innerHTML = "";
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: cameraFacing },
      { fps: 10, qrbox: { width: 280, height: 280 } },
      (decodedText: string) => {
        scanner.stop().catch(() => {});
        scannerRef.current = null;
        setScanning(false);
        setScanError("");
        setQrInput(decodedText);
        scanCodeWithValue(decodedText);
      },
      () => {}
    ).catch(() => {
      setScanError("Impossible d'acceder a la camera");
      setScanning(false);
      scannerRef.current = null;
    });
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning, cameraFacing]);

  const startCameraScanner = () => {
    if (scannerRef.current) return;
    setScanError("");
    setScanning(true);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setScanError("");
  };

  const handleFileScan = async (file: File) => {
    setDecoding(true);
    setShowPhotoOption(false);
    setScanError("");
    const scanner = new Html5Qrcode(SCANNER_ID);
    try {
      const decodedText = await scanner.scanFile(file, true);
      scanCodeWithValue(decodedText);
    } catch {
      setDecoding(false);
      setShowPhotoOption(true);
      setQrError("Impossible de decoder le QR code depuis la photo");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileScan(file);
    e.target.value = "";
  };

  const scanCodeWithValue = async (code: string) => {
    if (!code.trim()) return;
    setQrError("");
    setDecoding(false);
    const plate = code.trim().toUpperCase();
    const match = vehicules.find(
      (v: any) =>
        v.immatriculation?.toUpperCase() === plate ||
        v.truckNumber?.toUpperCase() === plate
    );
    if (match) {
      selectVehicule(match);
      showToast(`Véhicule identifié: ${match.immatriculation}`, "success");
      return;
    }
    try {
      const res = await axios.post<any>(`${API}/api/fleet/qrcode/scan`, { code: plate });
      selectVehicule(res.data);
      showToast("Véhicule identifié: " + res.data.immatriculation, "success");
    } catch {
      setQrError("Code non reconnu — vérifiez le QR code ou code-barres");
    }
  };

  const scanCode = async () => {
     if (!qrInput.trim()) return;
     setQrError("");
     const plate = qrInput.trim().toUpperCase();
     const match = vehicules.find(
       (v: any) =>
         v.immatriculation?.toUpperCase() === plate ||
         v.truckNumber?.toUpperCase() === plate
     );
     if (match) {
       selectVehicule(match);
       showToast(`Véhicule identifié: ${match.immatriculation}`, "success");
       return;
     }
     try {
       const res = await axios.post<any>(`${API}/api/fleet/qrcode/scan`, { code: plate });
       selectVehicule(res.data);
       showToast("Véhicule identifié: " + res.data.immatriculation, "success");
     } catch {
       setQrError("Code non reconnu — vérifiez le QR code ou code-barres");
     }
   };

  const toggleItem = (key: string) => {
    const current = checkedItems[key];
    const newVal = current === null ? true : current === true ? false : null;
    setCheckedItems(prev => ({ ...prev, [key]: newVal }));
    if (newVal === false) {
      setDefects(prev => ({
        ...prev,
        [key]: { item: key, conforme: false, motifs: [], commentaire: "" }
      }));
    } else {
      const newDefects = { ...defects };
      delete newDefects[key];
      setDefects(newDefects);
    }
  };

  const toggleDefectMotif = (key: string, motif: string) => {
    setDefects(prev => {
      const d = prev[key] || { item: key, conforme: false, motifs: [], commentaire: "" };
      const exists = d.motifs.includes(motif);
      return { ...prev, [key]: { ...d, motifs: exists ? d.motifs.filter(m => m !== motif) : [...d.motifs, motif] } };
    });
  };

  const updateDefectComment = (key: string, commentaire: string) => {
    setDefects(prev => ({ ...prev, [key]: { ...(prev[key] || { item: key, conforme: false, motifs: [] as string[], commentaire: "" }), commentaire } }));
  };

  const createChecklist = async () => {
    if (!selectedVehicule) return;
    if (canDepart && canDepart.isBlocked) {
      showToast("Véhicule bloqué — check-up non conforme en cours. Contactez la maintenance.", "error");
      return;
    }
    if (!gpsLocation) {
      showToast("GPS obligatoire — Veuillez activer votre localisation avant de continuer.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post<any>(`${API}/api/fleet/checklist/create`, {
        chauffeurId: chauffeurInfo.id || null,
        chauffeurNom: chauffeurInfo.nom || "Chauffeur",
        chauffeurMatricule: chauffeurInfo.matricule || "CHF000",
        vehiculeImmatriculation: selectedVehicule.immatriculation,
        tourneeId,
        gpsLatitude: gpsLocation.lat,
        gpsLongitude: gpsLocation.lon,
        gpsCity: gpsLocation.city,
      });
      setChecklistId(res.data.id);
      showToast("Checklist créée pour la tournée " + tourneeId, "success");
    } catch { showToast("Erreur création", "error"); }
    finally { setLoading(false); }
  };

  const submitChecklist = async () => {
    if (!checklistId) return;
    if (!signatureData) { setSignatureModalOpen(true); return; }
    setLoading(true);
    try {
      const items: Record<string, any> = {};
      CHECKLIST_ITEMS.forEach(({ key }) => { items[key] = checkedItems[key] === true; });
      items.defautsJson = JSON.stringify(Object.values(defects));
      items.commentaireGeneral = Object.values(defects).map(d => `${d.item}: ${d.motifs.join(' / ')} - ${d.commentaire}`).join("; ");
      items.signature = signatureData;
      const res = await axios.put(`${API}/api/fleet/checklist/submit/${checklistId}`, items);
      setSubmitted(true);
      const data = res.data as any;
      setEstConforme(data.estConforme);
      if (!data.estConforme) {
        setArabeAlert(data.messageAlerteArabe);
      } else {
        showToast("✅ المركبة جاهزة للانطلاق - Véhicule conforme", "success");
        enregistrerDepart(data.id);
       }
       if (selectedVehicule) checkDepartAuthorization(selectedVehicule.immatriculation);
    } catch { showToast("Erreur enregistrement", "error"); }
    finally { setLoading(false); }
  };

  const enregistrerDepart = async (checklistId: number) => {
    if (!selectedVehicule || !gpsLocation) return;
    try {
      await axios.post(`${API}/api/fleet/departs/enregistrer`, {
        checklistId: checklistId,
        site: selectedVehicule.branchCode || "",
        branchCode: selectedVehicule.branchCode || "",
        gpsLatitude: gpsLocation.lat,
        gpsLongitude: gpsLocation.lon,
        gpsCity: gpsLocation.city
      });
      showToast("Départ enregistré dans l'historique", "success");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du départ:", error);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const confirmSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
    setSignatureModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={easeOutFast}
      className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-bold ${
          toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{T[lang].title} — Tournée {tourneeId}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'امسح الشاحنة ← تحقق من 10 نقاط ← تأكيد' : 'Scannez le camion → Vérifiez les 10 points → Validez'}</p>
          </div>
        </div>
        <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-dark-border rounded-lg text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-bg transition-all">
          <Globe className="w-4 h-4" /> {T[lang].langSwitch}
        </button>
      </div>

      {/* Bandeau chauffeur connecté */}
      {currentUser && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {currentUser.firstname} {currentUser.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {currentUser.personCode || currentUser.matricule || currentUser.username}
              {driverPresent && <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold"><CheckCircle className="w-2.5 h-2.5" /> PRÉSENT</span>}
            </p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 font-semibold">{currentUser.branchCode || "CHAUFFEUR"}</span>
        </div>
      )}

      {/* Alerte Arabe */}
      {arabeAlert && (
        <div className={`p-4 rounded-xl text-right text-lg font-bold leading-loose ${
          estConforme
            ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-emerald-700 dark:text-emerald-300"
            : "bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-300"
        }`} dir="rtl">
          {arabeAlert}
        </div>
      )}

      {/* Fréquence du check-up - info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
          <ClipboardList className="w-4 h-4" /> {lang === 'ar' ? 'تكرار الفحص' : 'Fréquence du check-up'}
        </div>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>{lang === 'ar' ? 'إلزامي قبل كل انطلاق شاحنة' : 'Obligatoire avant chaque départ de camion'}</li>
          <li>{lang === 'ar' ? 'عدة جولات في اليوم = عدة فحوصات' : 'Plusieurs tournées/jour = plusieurs check-ups'}</li>
          <li>{lang === 'ar' ? 'لا يمكن بدء الجولة بدون تحقق صالح' : 'Départ impossible sans check-up valide'}</li>
        </ul>
        {canDepart && (
          <div className={`mt-2 px-3 py-2 rounded-xl text-sm font-semibold ${
            canDepart.canDepart
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200'
          }`}>
            {canDepart.canDepart ? '✅' : '🚫'} {canDepart.reason}
          </div>
        )}
      </div>

      {/* QR / Choix vehicule */}
      <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-border p-5">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-blue-500" /> {T[lang].identify}
        </h2>
        <p className="text-xs text-orange-500 mb-2 font-semibold">{T[lang].requiredStep}</p>
        <div className="flex gap-2 mb-3">
          <input type="text" value={qrInput} onChange={e => setQrInput(e.target.value)}
            placeholder={T[lang].scanPlaceholder}
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-sm"
            onKeyDown={e => e.key === 'Enter' && scanCode()} />
          <button onClick={scanCode}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-1">
            <Search className="w-4 h-4" /> {T[lang].scanButton}
          </button>
          <button onClick={scanning ? stopCameraScanner : startCameraScanner}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1 transition-colors ${
              scanning
                ? 'bg-gradient-to-r from-red-500 to-red-700 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white'
            }`}
            title={scanning ? (lang === 'fr' ? 'Arrêter le scan' : 'Stop scanning') : (lang === 'fr' ? 'Scanner avec la caméra' : 'Scan with camera')}>
            {scanning ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>
        {scanError && <p className="text-xs text-red-500 mb-2"><AlertCircle className="w-3 h-3 inline" /> {scanError}</p>}
        {qrError && <p className="text-xs text-red-500 mb-2"><AlertCircle className="w-3 h-3 inline" /> {qrError}</p>}
        {scanning && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Caméra {cameraLabel}</span>
              <button onClick={() => setCameraFacing(f => f === "environment" ? "user" : "environment")}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                <Camera className="w-3 h-3" />⟳
              </button>
            </div>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Placez le QR code du véhicule devant la caméra' : 'Place the vehicle QR code in front of the camera'}</p>
          </div>
        )}
        <div className="border-t border-gray-200 dark:border-dark-border pt-3">
          <button onClick={() => setVehicleListOpen(!vehicleListOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
            <Truck className="w-4 h-4" /> {T[lang].orSelect}
            {vehicleListOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {vehicleListOpen && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {vehicules.map((v: any) => (
                <button key={v.id} onClick={() => selectVehicule(v)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedVehicule?.id === v.id
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-border text-gray-600 dark:text-dark-text-secondary'
                  }`}>
                  {v.immatriculation} — {v.marque} {v.modele}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedVehicule && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 mb-2">✅ Véhicule identifié</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><span className="text-xs text-gray-500 dark:text-gray-400">Immatriculation</span><p className="font-bold text-gray-800 dark:text-white">{selectedVehicule.immatriculation}</p></div>
              <div><span className="text-xs text-gray-500 dark:text-gray-400">Marque/Modèle</span><p className="font-bold text-gray-800 dark:text-white">{selectedVehicule.marque} {selectedVehicule.modele}</p></div>
              <div><span className="text-xs text-gray-500 dark:text-gray-400">Tournée</span><p className="font-bold text-gray-800 dark:text-white">{tourneeId}</p></div>
              <div><span className="text-xs text-gray-500 dark:text-gray-400">Site</span><p className="font-bold text-gray-800 dark:text-white">{selectedVehicule.branchCode}</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Checklist */}
      {selectedVehicule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...easeOut }}
          className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-border p-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-500" /> {T[lang].checklist}
            {submitted && <span className="text-xs text-emerald-600 font-normal">(Soumis)</span>}
          </h2>

          {!checklistId && !submitted && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <Globe className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {gpsLocation ? `📍 ${gpsLocation.city} (${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lon.toFixed(4)})` : 'Localisation GPS requise'}
                  </p>
                  <p className="text-xs text-blue-600/70">{gpsLocation ? 'GPS capturé — vous pouvez démarrer le contrôle' : 'Le GPS est obligatoire pour chaque check-up'}</p>
                </div>
                <button onClick={async () => {
                  if (!navigator.geolocation) { showToast("Géolocalisation non disponible", "error"); return; }
                  setGpsLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      const { latitude, longitude } = pos.coords;
                      let city = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                      try {
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
                        const geoData = await geoRes.json();
                        if (geoData.address?.city || geoData.address?.town || geoData.address?.village) {
                          city = geoData.address.city || geoData.address.town || geoData.address.village;
                        }
                      } catch {}
                      setGpsLocation({ lat: latitude, lon: longitude, city });
                      setGpsLoading(false);
                      showToast(`GPS: ${city}`, "success");
                    },
                    () => { setGpsLoading(false); showToast("Impossible d'obtenir le GPS", "error"); },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }} disabled={gpsLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${gpsLocation ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                  <Globe className="w-4 h-4" /> {gpsLoading ? '...' : gpsLocation ? '✓ GPS' : 'Activer GPS'}
                </button>
              </div>
              <button onClick={createChecklist} disabled={loading || !gpsLocation}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                + Démarrer le contrôle {!gpsLocation && '(GPS requis)'}
              </button>
            </div>
          )}

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {CHECKLIST_ITEMS.map((item, idx) => {
              const val = checkedItems[item.key];
              const defect = defects[item.key];
              return (
                <motion.div
                  key={item.key}
                  variants={cardSlideUp}
                  transition={{ delay: idx * 0.03, ...springSnappy }}
                  className={`rounded-xl border-2 transition-all ${
                  val === null ? 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-border/30' :
                  val === true ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                  'border-red-400 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <button onClick={() => toggleItem(item.key)}
                    className="flex items-center gap-3 p-3 w-full text-left">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-700 dark:text-white">{lang === 'ar' ? item.labelAr : item.label}</p>
                      {val !== null && (
<p className={`text-xs font-semibold ${val ? 'text-emerald-600' : 'text-red-600'}`}>
                            {val ? T[lang].conforme : T[lang].nonConforme}
                          </p>
                      )}
                    </div>
                    {val === null && <span className="text-xs text-gray-500 dark:text-gray-400">—</span>}
                  </button>
                  {val === false && (
                    <div className="px-3 pb-3 space-y-2 border-t border-red-100 pt-2 mt-0">
                      <p className="text-[10px] font-semibold text-red-500 mb-1">{T[lang].defect}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MOTIFS_DEFAUT.map(m => {
                          const checked = defect?.motifs?.includes(m) || false;
                          return (
                            <button key={m} onClick={() => toggleDefectMotif(item.key, m)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                                checked
                                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                  : 'bg-white dark:bg-dark-bg text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-red-300'
                              }`}>
                              {checked ? '✓ ' : ''}{m}
                            </button>
                          );
                        })}
                      </div>
                      <input type="text" value={defect?.commentaire || ""} onChange={e => updateDefectComment(item.key, e.target.value)}
                        placeholder={T[lang].comment}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white dark:bg-dark-bg" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Résumé + Submit */}
          {allChecked && checklistId && (
            <div className="mt-4">
              <div className={`p-4 rounded-xl ${
                allOk ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-500' : 'bg-gradient-to-br from-red-600 to-red-700 border border-red-500'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {allOk ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
                  <span className="text-sm font-bold text-white">
                    {allOk ? T[lang].allConforme : T[lang].nonConformeDetected}
                  </span>
                </div>
                {hasDefects && (
                  <div className="mt-2 space-y-1">
                    {Object.values(defects).map(d => (
                      <div key={d.item} className="flex items-center gap-2 text-xs text-red-100">
                        <XCircle className="w-3 h-3 text-red-200" />
                        <span className="capitalize text-red-100">{d.item.replace(/([A-Z])/g,' $1')}</span>
                        {d.motifs && d.motifs.length > 0 && <span className="text-red-200">— {d.motifs.join(', ')}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!submitted ? (
                <div className="mt-4 space-y-3">
                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${signatureData ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500' : 'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-500'}`}>
                    <Pen className={`w-5 h-5 ${signatureData ? 'text-emerald-200' : 'text-amber-200'}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${signatureData ? 'text-white' : 'text-white'}`}>
                        {signatureData ? '✅ Signature enregistrée' : 'Signature électronique requise'}
                      </p>
                      <p className={`text-xs ${signatureData ? 'text-emerald-100' : 'text-amber-100'}`}>
                        {signatureData ? `${signatureData.length} bytes` : 'Signez sur le pavé ci-dessous avant de valider'}
                      </p>
                    </div>
                    <button onClick={() => setSignatureModalOpen(true)}
                      className="px-3 py-1.5 bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold hover:bg-white/30 backdrop-blur">
                      {signatureData ? 'Modifier' : 'Signer'}
                    </button>
                  </div>
                  <button onClick={submitChecklist} disabled={loading || !signatureData}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <Send className="w-4 h-4" /> {loading ? T[lang].recording : (allOk ? T[lang].validate : T[lang].saveAnomalies)}
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`mt-4 p-5 rounded-xl text-center ${
                    checklistStatus === "VALIDATED" ? "bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-500 shadow-lg shadow-emerald-500/20" :
                    checklistStatus === "REJECTED" ? "bg-gradient-to-br from-red-600 to-red-700 border border-red-500 shadow-lg shadow-red-500/20" :
                    estConforme ? "bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-500 shadow-lg shadow-emerald-500/20" :
                    "bg-gradient-to-br from-amber-600 to-amber-700 border border-amber-500 shadow-lg shadow-amber-500/20"
                  }`}>
                  {checklistStatus === "VALIDATED" ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-white mx-auto mb-2 drop-shadow-glow" />
                      <p className="text-base font-bold text-white">✅ Camion débloqué — Réparation validée par RS</p>
                      <p className="text-sm font-medium text-emerald-100 mt-1">Vous pouvez reprendre votre tournée</p>
                    </>
                  ) : checklistStatus === "REJECTED" ? (
                    <>
                      <XCircle className="w-10 h-10 text-white mx-auto mb-2" />
                      <p className="text-base font-bold text-white">❌ Réparation refusée par RS</p>
                      <p className="text-sm font-medium text-red-100 mt-1">Véhicule reste bloqué — Contactez la maintenance</p>
                    </>
                  ) : checklistStatus === "REPAIRE" ? (
                    <>
                      <Wrench className="w-10 h-10 text-white mx-auto mb-2" />
                      <p className="text-base font-bold text-white">⏳ Réparation soumise — En attente de validation RS</p>
                    </>
                  ) : estConforme ? (
                    <>
                      <div className="relative mb-2">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse" />
                        <CheckCircle className="w-12 h-12 text-white mx-auto relative drop-shadow-glow" />
                      </div>
                      <p className="text-xl font-bold text-white drop-shadow-lg">{T[lang].startTour}</p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-sm font-medium text-emerald-100 mt-1"
                      >
                        Bonne route ! 🚛
                      </motion.p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-10 h-10 text-white mx-auto mb-2" />
                      <p className="text-base font-bold text-white">{T[lang].truckBlocked}</p>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Post-repair — géré par Maintenance + RS */}
      {submitted && !allOk && estConforme === false && checklistStatus !== "VALIDATED" && (
        <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-border p-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-500" /> {T[lang].repairModule}
          </h2>
          {checklistStatus === "COMPLETE" && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-300 text-center">
              🚫 Check-up non conforme — véhicule bloqué.<br />
              L'équipe Maintenance a été alertée et interviendra pour réparer.<br />
              <strong>Statut : En attente réparation Maintenance</strong>
            </div>
          )}
          {checklistStatus === "REPAIRE" && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-800 dark:text-blue-300 text-center">
              ⏳ Réparation effectuée par Maintenance — en attente de validation RS.
            </div>
          )}
          {checklistStatus === "REJECTED" && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-800 dark:text-red-300 text-center">
              ❌ Réparation refusée par RS — Le véhicule reste bloqué.
            </div>
          )}
        </div>
      )}

      {/* Signature Modal */}
      {signatureModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Pen className="w-5 h-5 text-blue-500" /> Signature électronique
              </h2>
              <button onClick={() => setSignatureModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <XCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Signez dans le cadre ci-dessous :</p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden mb-3">
              <canvas
                ref={signatureCanvasRef}
                width={500}
                height={200}
                className="w-full h-48 bg-white cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="flex justify-between gap-3">
              <button onClick={clearSignatureCanvas}
                className="px-4 py-2 bg-slate-100 dark:bg-dark-border text-slate-600 rounded-xl text-sm font-medium">
                Effacer
              </button>
              <button onClick={confirmSignature}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                Confirmer la signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {submitted && (
        <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-border p-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-500" /> Feedback — état général du véhicule
          </h2>
          <div className="flex gap-4 justify-center">
            {FEEDBACK_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => {
                setFeedback(opt.value);
                if (checklistId) axios.put(`${API}/api/fleet/checklist/feedback/${checklistId}`, { feedback: opt.value }).catch(() => {});
              }}
                className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all hover:scale-110 ${
                  feedback === opt.value ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-border/30 hover:border-blue-500/50'
                }`}>
                <span className="text-4xl">{opt.emoji}</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scanner — toujours dans le DOM, visible quand actif */}
      <div id={SCANNER_ID}
        className="w-full max-w-md mx-auto rounded-xl overflow-hidden bg-black"
        style={scanning ? {} : { display: 'none' }} />
    </motion.div>
  );
}
