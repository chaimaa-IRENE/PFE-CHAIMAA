import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import DashboardLayout from "./ui/DashboardLayout";
import Badge from "./ui/Badge";
import Toast from "./ui/Toast";
import { Html5Qrcode } from "html5-qrcode";
import {
  Shield, CheckCircle, XCircle, Camera, Truck, AlertTriangle, FileText, RefreshCw, FileCheck, FileX, ScanLine, X
} from "lucide-react";

const VEHICLE_API = `${API_BASE}/api/vehicles`;
const CHECKUP_API = `${API_BASE}/api/checkups`;

const CHECKUP_ELEMENTS = [
  { element: "Pneus avant", categorie: "PNEUS" },
  { element: "Pneus arriere", categorie: "PNEUS" },
  { element: "Freins", categorie: "FREINS" },
  { element: "Eclairage", categorie: "ECLAIRAGE" },
  { element: "Direction", categorie: "DIRECTION" },
  { element: "Carrosserie", categorie: "CARROSSERIE" },
  { element: "Cabine", categorie: "CABINE" },
  { element: "Niveau huile", categorie: "MECANIQUE" },
  { element: "Niveau eau", categorie: "MECANIQUE" },
  { element: "Ceinture securite", categorie: "SECURITE" },
  { element: "Triangle signalisation", categorie: "SECURITE" },
  { element: "Extincteur", categorie: "SECURITE" },
  { element: "Carte grise", categorie: "DOCUMENTS" },
  { element: "Assurance", categorie: "DOCUMENTS" },
  { element: "Visite technique", categorie: "DOCUMENTS" },
];

const REQUIRED_DOCUMENTS = ["Carte grise", "Assurance", "Visite technique"];

const DOC_TYPE_MAP: Record<string, string> = {
  "Carte grise": "CARTE_GRISE",
  "Assurance": "ASSURANCE",
  "Visite technique": "VISITE_TECHNIQUE",
};

export default function ChauffeurCheckup() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"select" | "checklist" | "result">("select");
  const [details, setDetails] = useState<any[]>([]);
  const [kilometrage, setKilometrage] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [conforme, setConforme] = useState<boolean | null>(null);
  const [checkups, setCheckups] = useState<any[]>([]);
  const [expandedCheckup, setExpandedCheckup] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [docStatus, setDocStatus] = useState<Record<string, boolean>>({});
  const [vehDocStatus, setVehDocStatus] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showPhotoOption, setShowPhotoOption] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const SCANNER_ID = "qr-scanner";

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch {}
    }
    fetchAvailableVehicles();
  }, []);

  const getDocStatusFromApi = (apiStatus: Record<string, any>): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    for (const doc of REQUIRED_DOCUMENTS) {
      const typeKey = DOC_TYPE_MAP[doc];
      const ds = apiStatus[typeKey];
      if (ds && ds.etat === "VALIDE" && ds.estDisponible !== false) {
        result[doc] = true;
      } else {
        result[doc] = false;
      }
    }
    return result;
  };

  const allDocsPresent = () => Object.values(docStatus).every(v => v);
  const getMissingDocs = () => REQUIRED_DOCUMENTS.filter(d => !docStatus[d]);

  const showToast = (m: string, t: "success" | "error" | "info" | "warning") => {
    setToast({ message: m, type: t });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAvailableVehicles = async () => {
    setLoading(true);
    try {
      const chauffeurId = currentUser?.id;
      if (chauffeurId) {
        try {
          const res = await axios.get<any[]>(`${API_BASE}/api/vehicules/chauffeur/${chauffeurId}`);
          setVehicles(res.data || []);
          setLoading(false);
          return;
        } catch { }
      }
      const res = await axios.get<any>(VEHICLE_API);
      setVehicles(res.data.vehicles || res.data || []);
    } catch {
      showToast("Erreur chargement vehicules", "error");
    } finally {
      setLoading(false);
    }
  };

  const startCheckup = async (v: any) => {
    if (currentUser) {
      v = { ...v, chauffeurId: currentUser.id, chauffeurNom: `${currentUser.firstname} ${currentUser.name}` };
    }
    setSelectedVehicle(v);
    setKilometrage(v.kilometrage || 0);
    setNotes("");
    setConforme(null);
    setDetails(CHECKUP_ELEMENTS.map(e => ({ element: e.element, categorie: e.categorie, statut: "CONFORME", observation: "", criticite: "BASSE" })));
    setStep("checklist");
    try {
      const docRes = await axios.get(`${VEHICLE_API}/${v.id}/history`);
      const apiStatus = (docRes.data as any)?.history?.documentStatus || {};
      setVehDocStatus(apiStatus);
      setDocStatus(getDocStatusFromApi(apiStatus));
    } catch {
      const fallback: Record<string, boolean> = {};
      const docsStr = v?.documentsDisponibles || "";
      if (docsStr) {
        const available = docsStr.split(",").map((s: string) => s.trim().toLowerCase());
        REQUIRED_DOCUMENTS.forEach(d => { fallback[d] = available.includes(d.toLowerCase()); });
      } else {
        REQUIRED_DOCUMENTS.forEach(d => { fallback[d] = false; });
      }
      setDocStatus(fallback);
      setVehDocStatus({});
    }
  };

  const updateDetail = (i: number, field: string, value: string) => {
    const updated = [...details];
    (updated as any)[i][field] = value;
    if (field === "statut") {
      updated[i].criticite = value === "NON_CONFORME" ? "HAUTE" : "BASSE";
    }
    setDetails(updated);
  };

  const submitCheckup = async (autorise: boolean) => {
    if (submitting || !selectedVehicle) return;
    setSubmitting(true);
    const docAvailable = allDocsPresent();
    const finalConforme = autorise && docAvailable;
    const payload = {
      vehiculeId: selectedVehicle.id,
      vehiculeImmatriculation: selectedVehicle.immatriculation,
      vehiculeTruckNumber: selectedVehicle.truckNumber,
      chauffeurId: selectedVehicle.chauffeurId,
      chauffeurNom: selectedVehicle.chauffeurNom,
      kilometrage,
      conforme: finalConforme,
      documentsDisponibles: REQUIRED_DOCUMENTS.filter(d => docStatus[d]).join(","),
      notes,
      details,
    };
    try {
      if (finalConforme) {
        await axios.post<any>(CHECKUP_API, payload);
        showToast("Depart autorise - Vehicule DISPONIBLE", "success");
      } else {
        const res = await axios.post<any>(CHECKUP_API, payload);
        const checkupId = res.data?.checkup?.id || res.data?.id;
        if (!autorise) {
          await axios.put(`${CHECKUP_API}/${checkupId}/signal-anomalie`, { notes });
          showToast("Anomalie signalee - Vehicule BLOQUE", "warning");
        } else {
          showToast("Documents manquants - Vehicule BLOQUE", "warning");
          if (checkupId) {
            await axios.put(`${CHECKUP_API}/${checkupId}/signal-anomalie`, {
              notes: "Documents manquants: " + getMissingDocs().join(", "),
            });
          }
        }
      }
      setStep("result");
      setConforme(finalConforme);
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Erreur enregistrement checkup", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setScanError("");
    setShowPhotoOption(false);
  }, []);

  const onScanSuccess = (decodedText: string) => {
    stopScanner();
    const plate = decodedText.trim().toUpperCase();
    const match = vehicles.find(
      (v: any) =>
        v.immatriculation?.toUpperCase() === plate ||
        v.truckNumber?.toUpperCase() === plate
    );
    if (match) {
      startCheckup(match);
      showToast(`Vehicule ${plate} identifie`, "success");
    } else {
      showToast(`Aucun vehicule trouve pour la plaque: ${plate}`, "error");
    }
  };

  const handleFileScan = async (file: File) => {
    setDecoding(true);
    const scanner = new Html5Qrcode(SCANNER_ID);
    try {
      const decodedText = await scanner.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch {
      setDecoding(false);
      showToast("Impossible de decoder le QR code depuis la photo", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileScan(file);
    e.target.value = "";
  };

  const startScanner = () => {
    setScanning(true);
    setShowPhotoOption(true);
  };

  const fetchCheckupHistory = async (vehiculeId: number) => {
    try {
      const res = await axios.get<any>(`${CHECKUP_API}/vehicle/${vehiculeId}`);
      setCheckups(res.data.checkups || res.data || []);
    } catch {
      setCheckups([]);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-danone-blue focus:border-transparent";

  const getDocBadge = (doc: string) => {
    const typeKey = DOC_TYPE_MAP[doc];
    const ds = vehDocStatus[typeKey];
    if (!ds) return null;
    if (ds.etat === "EXPIRE")
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 ml-2">
          Expire
        </span>
      );
    if (ds.etat === "EXPIRE_BIENTOT")
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 ml-2">
          Expire bientot
        </span>
      );
    if (ds.etat === "MANQUANT")
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 ml-2">
          Non enregistre
        </span>
      );
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 ml-2">
        Valide
      </span>
    );
  };

  const navItems = [
    {
      id: "checkup",
      label: "Checkup Depart",
      icon: <Shield className="w-5 h-5" />,
      active: true,
      onClick: () => {},
    },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      title="Checkup Depart"
      currentUser={{ name: currentUser?.firstname || "Chauffeur", role: "CHAUFFEUR" }}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {scanning && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-border">
              <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-danone-blue" /> Scanner QR / Code-barres
              </h3>
              <button onClick={stopScanner} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <div id={SCANNER_ID} className="w-full aspect-square bg-black rounded-xl overflow-hidden" style={{ display: showPhotoOption ? 'none' : 'block' }} />
              {showPhotoOption && (
                <div className="text-center py-4">
                  {decoding ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="w-8 h-8 border-4 border-danone-blue border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Analyse du QR code...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 mb-3">
                        Prends en photo le QR code ou le code-barres du camion
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 rounded-xl bg-danone-blue text-white font-semibold shadow-soft hover:bg-danone-blue-dark transition-colors"
                      >
                        Prendre une photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "select" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-danone-blue" /> Selection du Vehicule
            </h2>
            <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-4">
              Choisissez le camion dans la liste ou scannez son QR code pour demarrer le checkup.
            </p>
            <button
              onClick={startScanner}
              className="w-full mb-4 py-3 rounded-xl bg-danone-blue text-white font-semibold text-sm shadow-soft hover:bg-danone-blue-dark transition-colors flex items-center justify-center gap-2"
            >
              <ScanLine className="w-5 h-5" /> Scanner QR Code du vehicule
            </button>
            {loading ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">Chargement...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles
                  .filter((v: any) => v.statut !== "BLOQUE")
                  .map((v: any) => (
                    <div
                      key={v.id}
                      onClick={() => startCheckup(v)}
                      className="border border-slate-200 dark:border-dark-border rounded-xl p-4 hover:border-danone-blue dark:hover:border-danone-blue cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-700 dark:text-white">
                          {v.truckNumber || v.immatriculation}
                        </span>
                        <Badge variant={v.statut === "DISPONIBLE" ? "success" : "warning"}>
                          {v.statut}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-dark-text-secondary space-y-1">
                        <div>
                          {v.marque} {v.modele} - {v.immatriculation}
                        </div>
                        <div>Chauffeur: {v.chauffeurNom || "Non assigne"}</div>
                        <div>
                          Km: {v.kilometrage?.toLocaleString() || "-"} | Tournee: {v.tournee || "-"}
                        </div>
                        <div>Site: {v.branchCode || v.agence || "-"}</div>
                      </div>
                      <button className="mt-3 w-full py-2 rounded-lg bg-danone-blue/10 text-danone-blue group-hover:bg-danone-blue group-hover:text-white transition-colors text-sm font-medium">
                        Demarrer le Checkup
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "checklist" && selectedVehicle && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-danone-blue" /> Checkup -{" "}
              {selectedVehicle.truckNumber || selectedVehicle.immatriculation}
            </h2>
            <button onClick={() => setStep("select")} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-600">
              Retour
            </button>
          </div>
          <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Camion:</span>{" "}
                <span className="font-semibold">{selectedVehicle.truckNumber || selectedVehicle.immatriculation}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Immatriculation:</span>{" "}
                <span className="font-semibold font-mono">{selectedVehicle.immatriculation}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Chauffeur:</span>{" "}
                <span className="font-semibold">{selectedVehicle.chauffeurNom}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Tournee:</span>{" "}
                <span className="font-semibold">{selectedVehicle.tournee || "-"}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-dark-text-secondary mb-1">
                Kilometrage actuel
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={kilometrage}
                  onChange={(e) => setKilometrage(Number(e.target.value))}
                  className={inputClass + " max-w-[200px]"}
                />
                <button className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Photo km">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Verifications
            </h3>
            <div className="space-y-2">
              {details.map((d: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-border/50"
                >
                  <div className="w-5 text-xs text-slate-500 dark:text-slate-400 font-mono">{i + 1}</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-24">{d.categorie}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-white">{d.element}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateDetail(i, "statut", "CONFORME")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        d.statut === "CONFORME"
                          ? "bg-green-500 text-white"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" /> OK
                    </button>
                    <button
                      onClick={() => updateDetail(i, "statut", "NON_CONFORME")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        d.statut === "NON_CONFORME"
                          ? "bg-red-500 text-white"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                    >
                      <XCircle className="w-3 h-3 inline mr-1" /> Defaut
                    </button>
                  </div>
                  {d.statut === "NON_CONFORME" && (
                    <>
                      <select
                        value={d.criticite}
                        onChange={(e) => updateDetail(i, "criticite", e.target.value)}
                        className="px-2 py-1 text-xs border rounded-lg bg-white dark:bg-dark-border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200"
                      >
                        <option value="BASSE">Basse</option>
                        <option value="MOYENNE">Moyenne</option>
                        <option value="HAUTE">Haute</option>
                        <option value="CRITIQUE">Critique</option>
                      </select>
                      <input
                        value={d.observation || ""}
                        onChange={(e) => updateDetail(i, "observation", e.target.value)}
                        placeholder="Observation..."
                        className="flex-1 min-w-[120px] px-2 py-1 text-xs border rounded-lg bg-white dark:bg-dark-border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-green-500" /> Documents requis
            </h3>
            {REQUIRED_DOCUMENTS.map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-border/50"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-white">{doc}</span>
                  {getDocBadge(doc)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDocStatus((prev) => ({ ...prev, [doc]: true }))}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      docStatus[doc]
                        ? "bg-green-500 text-white"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 inline mr-1" /> Disponible
                  </button>
                  <button
                    onClick={() => setDocStatus((prev) => ({ ...prev, [doc]: false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      !docStatus[doc]
                        ? "bg-red-500 text-white"
                        : "bg-red-50 text-red-500 hover:bg-red-100"
                    }`}
                  >
                    <XCircle className="w-3 h-3 inline mr-1" /> Manquant
                  </button>
                </div>
              </div>
            ))}
            {!allDocsPresent() && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <FileX className="w-4 h-4" /> Le vehicule contient un ou plusieurs documents manquants. Depart interdit
                  jusqu'a regularisation.
                </p>
                <p className="text-[10px] text-red-500 mt-1">
                  Documents manquants: {getMissingDocs().join(", ")}
                </p>
              </div>
            )}
            {allDocsPresent() && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <FileCheck className="w-4 h-4" /> Tous les documents sont disponibles
                </p>
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-dark-surface/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-dark-text-secondary mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              rows={3}
              placeholder="Observations..."
            />
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
            Non conforme = Vehicule BLOQUE + Anomalie creee (SANS verification budget - validation directe par RS)
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => submitCheckup(true)}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm shadow-soft hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" /> Conforme - Autoriser Depart
            </button>
            <button
              onClick={() => submitCheckup(false)}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm shadow-soft hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <AlertTriangle className="w-5 h-5" /> Non Conforme - Signaler Anomalie
            </button>
          </div>
        </div>
      )}

      {step === "result" && selectedVehicle && conforme !== null && (
        <div className="max-w-lg mx-auto text-center py-12">
          {conforme ? (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Depart Autorise</h2>
              <p className="text-slate-500 dark:text-dark-text-secondary mb-2">
                Vehicule {selectedVehicle.truckNumber || selectedVehicle.immatriculation} - Conforme
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Tous les elements sont conformes. Le vehicule est DISPONIBLE.
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={() => {
                    setStep("select");
                    setSelectedVehicle(null);
                  }}
                  className="px-6 py-2 rounded-xl bg-danone-blue text-white shadow-soft hover:bg-danone-blue-dark transition-colors text-sm font-medium"
                >
                  Nouveau Checkup
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Camion Bloque</h2>
              <p className="text-slate-500 dark:text-dark-text-secondary mb-2">
                Vehicule {selectedVehicle.truckNumber || selectedVehicle.immatriculation} - NON CONFORME
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Le vehicule est bloque. Une anomalie a ete enregistree et le statut du vehicule est bloque.
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={() => {
                    setStep("select");
                    setSelectedVehicle(null);
                  }}
                  className="px-6 py-2 rounded-xl bg-slate-500 text-white shadow-soft hover:bg-slate-600 transition-colors text-sm font-medium"
                >
                  Retour Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

