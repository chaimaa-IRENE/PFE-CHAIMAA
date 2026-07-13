import React, { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { soundManager } from "./SoundManager";
import confetti from "canvas-confetti";
import {
  Truck, Camera, MapPin, QrCode, FileText, AlertTriangle,
  Check, ChevronRight, ChevronLeft, Upload, X, Zap, Gauge,
} from "lucide-react";

type Criticite = "BLOQUANT" | "URGENT" | "NON_BLOQUANT" | "SECURITE";
type TypePanne = "MECANIQUE" | "ELECTRIQUE" | "CAISSE" | "CABINE" | "SECURITE" | "AUTRES";

interface DeclarationData {
  vehiculeImmatriculation: string;
  vehiculeId: string;
  chauffeurNom: string;
  kilometrage: string;
  typePanne: TypePanne | "";
  criticite: Criticite | "";
  elementVehicule: string;
  detailElement: string;
  categorie: string;
  description: string;
  source: string;
  photo: string | null;
  gps: { lat: number | null; lng: number | null } | null;
}

const STEPS = [
  { id: 1, label: "Vehicule", icon: Truck },
  { id: 2, label: "Panne", icon: AlertTriangle },
  { id: 3, label: "Photo & GPS", icon: Camera },
  { id: 4, label: "Validation", icon: Check },
];

const CRITICITE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  BLOQUANT: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  URGENT: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  NON_BLOQUANT: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  SECURITE: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
};

const TYPE_PANNE_ICONS: Record<string, React.ReactNode> = {
  MECANIQUE: <Gauge className="w-5 h-5" />,
  ELECTRIQUE: <Zap className="w-5 h-5" />,
  CAISSE: <Truck className="w-5 h-5" />,
  CABINE: <Truck className="w-5 h-5" />,
  SECURITE: <AlertTriangle className="w-5 h-5" />,
  AUTRES: <FileText className="w-5 h-5" />,
};

const ELEMENTS = ["MOTEUR", "FREINS", "PNEUS", "BATTERIE", "RESERVOIR", "CABINE", "ESSIEUX", "EMBRAYAGE", "DIRECTION", "ELECTRIQUE"];
const CATEGORIES = ["PREVENTIF", "CURATIF", "PLANIFIE", "URGENCE"];

interface PremiumDeclarationFormProps {
  currentUser?: { firstname?: string; name?: string; id?: number } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PremiumDeclarationForm: React.FC<PremiumDeclarationFormProps> = ({
  currentUser,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<DeclarationData>({
    vehiculeImmatriculation: "",
    vehiculeId: "",
    chauffeurNom: currentUser ? `${currentUser.firstname || ""} ${currentUser.name || ""}`.trim() : "",
    kilometrage: "",
    typePanne: "",
    criticite: "",
    elementVehicule: "",
    detailElement: "",
    categorie: "",
    description: "",
    source: "CHAUFFEUR",
    photo: null,
    gps: null,
  });

  const update = useCallback((field: keyof DeclarationData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return data.vehiculeImmatriculation && data.chauffeurNom && data.kilometrage;
      case 2: return data.typePanne && data.criticite && data.elementVehicule && data.description;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }, [step, data]);

  const handleNext = () => {
    if (!canProceed) {
      setError("Veuillez remplir tous les champs requis");
      soundManager.error();
      return;
    }
    soundManager.tap();
    setStep((s) => Math.min(4, s + 1));
  };

  const handlePrev = () => {
    soundManager.tap();
    setStep((s) => Math.max(1, s - 1));
  };

  const handleScanQR = () => {
    soundManager.tap();
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      update("vehiculeImmatriculation", "AW-456-78");
      update("vehiculeId", "12");
      soundManager.success();
    }, 2500);
  };

  const handleGPS = () => {
    soundManager.tap();
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      update("gps", { lat: 33.5731, lng: -7.5898 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("gps", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        soundManager.success();
      },
      () => {
        update("gps", { lat: 33.5731, lng: -7.5898 });
        setGpsLoading(false);
      },
    );
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Veuillez selectionner une image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      update("photo", e.target?.result as string);
      soundManager.success();
    };
    reader.readAsDataURL(file);
  }, [update]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("typePanne", data.typePanne);
      formData.append("criticite", data.criticite);
      formData.append("description", data.description);
      formData.append("chauffeurNom", data.chauffeurNom);
      formData.append("kilometrage", data.kilometrage);
      formData.append("vehiculeImmatriculation", data.vehiculeImmatriculation);
      formData.append("vehiculeId", data.vehiculeId || "0");
      formData.append("source", data.source);
      formData.append("elementVehicule", data.elementVehicule);
      formData.append("detailElement", data.detailElement);
      formData.append("categorie", data.categorie);

      if (data.photo) {
        const blob = await fetch(data.photo).then((r) => r.blob());
        formData.append("photo", blob, "panne.jpg");
      }
      if (data.gps) {
        formData.append("latitude", String(data.gps.lat));
        formData.append("longitude", String(data.gps.lng));
      }

      await axios.post("http://localhost:8080/api/declarations", formData);
      setSuccess(true);
      soundManager.success();

      const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#10b981", "#f59e0b", "#8b5cf6"];
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors, disableForReducedMotion: true, scalar: 0.8 });
      setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors, disableForReducedMotion: true }), 200);
      setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors, disableForReducedMotion: true }), 400);

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err: any) {
      soundManager.error();
      setError(err?.response?.data?.message || "Erreur lors de l'envoi de la declaration");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 px-6"
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-glow-emerald mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Declaration envoyee!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md"
        >
          Votre declaration de panne pour le vehicule {data.vehiculeImmatriculation} a ete transmise au support technique.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <motion.svg width="180" height="90" viewBox="0 0 340 170" fill="none" initial={{ x: -200 }} animate={{ x: 0 }} transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <rect x="8" y="28" width="195" height="82" rx="6" fill="#2563eb" opacity="0.8" />
            <rect x="195" y="22" width="108" height="88" rx="8" fill="#1e293b" />
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "75px 120px" }}>
              <circle cx="75" cy="120" r="18" fill="#0a0f18" />
              <circle cx="75" cy="120" r="9" fill="#1e293b" />
            </motion.g>
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "255px 120px" }}>
              <circle cx="255" cy="120" r="18" fill="#0a0f18" />
              <circle cx="255" cy="120" r="9" fill="#1e293b" />
            </motion.g>
          </motion.svg>
        </motion.div>
      </motion.div>
    );
  }

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="glass-strong rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.03]">
          <h2 className="text-xl font-bold text-white mb-1">Declaration de Panne</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Signalez une panne en quelques etapes</p>

          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <React.Fragment key={s.id}>
                  <motion.div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive ? "glass border border-blue-500/30 text-blue-400" : isDone ? "text-emerald-400" : "text-slate-500"
                    }`}
                    animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isActive ? "bg-blue-500/20" : isDone ? "bg-emerald-500/15" : "bg-white/[0.03]"}`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px ${isDone ? "bg-emerald-500/20" : "bg-white/[0.04]"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-4 h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
          </div>
        </div>

        <div className="p-6 min-h-[340px]">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-300 text-center"
              >
                {error}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Immatriculation *</label>
                  <div className="flex gap-2">
                    <input
                      value={data.vehiculeImmatriculation}
                      onChange={(e) => update("vehiculeImmatriculation", e.target.value)}
                      placeholder="Ex: AW-456-78"
                      className="flex-1 px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all"
                    />
                    <motion.button
                      onClick={handleScanQR}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-3 glass border border-white/[0.06] rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">Scanner QR</span>
                    </motion.button>
                  </div>
                </div>

                {scanning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative p-8 glass rounded-2xl flex flex-col items-center"
                  >
                    <div className="w-48 h-48 relative">
                      <div className="absolute inset-0 border-2 border-blue-500/30 rounded-2xl" />
                      <motion.div className="absolute left-2 right-2 h-0.5 bg-blue-400" animate={{ top: ["10%", "85%", "10%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                      <QrCode className="w-full h-full text-slate-700" />
                    </div>
                    <p className="text-sm text-blue-400 mt-3 animate-pulse">Scan en cours...</p>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Chauffeur *</label>
                    <input
                      value={data.chauffeurNom}
                      onChange={(e) => update("chauffeurNom", e.target.value)}
                      placeholder="Nom"
                      className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Kilometrage *</label>
                    <input
                      value={data.kilometrage}
                      onChange={(e) => update("kilometrage", e.target.value)}
                      placeholder="Ex: 125000"
                      type="number"
                      className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Localisation GPS</label>
                  <motion.button
                    onClick={handleGPS}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-slate-300 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {gpsLoading ? "Acquisition GPS..." : data.gps ? `GPS: ${data.gps.lat?.toFixed(4)}, ${data.gps.lng?.toFixed(4)}` : "Activer le GPS"}
                    {gpsLoading && <motion.div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Type de panne *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(TYPE_PANNE_ICONS).map((t) => {
                      const isActive = data.typePanne === t;
                      return (
                        <motion.button
                          key={t}
                          onClick={() => { update("typePanne", t); soundManager.tap(); }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${isActive ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "glass border-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-200"}`}
                        >
                          {TYPE_PANNE_ICONS[t]}
                          <span className="text-[10px] font-medium">{t}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Criticite *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(CRITICITE_COLORS).map((c) => {
                      const isActive = data.criticite === c;
                      const cfg = CRITICITE_COLORS[c];
                      return (
                        <motion.button
                          key={c}
                          onClick={() => { update("criticite", c); soundManager.tap(); }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${isActive ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "glass border-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-200"}`}
                        >
                          {c.replace("_", " ")}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Element *</label>
                    <select
                      value={data.elementVehicule}
                      onChange={(e) => update("elementVehicule", e.target.value)}
                      className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 transition-all"
                    >
                      <option value="" className="bg-[#0a0f1c]">Selectionner...</option>
                      {ELEMENTS.map((el) => <option key={el} value={el} className="bg-[#0a0f1c]">{el}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Categorie</label>
                    <select
                      value={data.categorie}
                      onChange={(e) => update("categorie", e.target.value)}
                      className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 transition-all"
                    >
                      <option value="" className="bg-[#0a0f1c]">Selectionner...</option>
                      {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0a0f1c]">{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Description *</label>
                  <textarea
                    value={data.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Decrivez la panne en detail..."
                    rows={3}
                    className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Photo de la panne</label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {data.photo ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-2xl overflow-hidden group">
                      <img src={data.photo} alt="Panne" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <motion.button onClick={() => update("photo", null)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 bg-rose-500/80 rounded-full text-white">
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center gap-3 ${dragOver ? "border-blue-500/40 bg-blue-500/5" : "border-white/[0.08] hover:border-white/[0.12]"}`}
                    >
                      <motion.div animate={dragOver ? { scale: 1.1 } : { scale: 1 }} className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Upload className="w-6 h-6" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-sm text-slate-300 font-medium">Glissez une photo ici</p>
                        <p className="text-xs text-slate-500 mt-1">ou cliquez pour parcourir</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2 block">Localisation</label>
                  <motion.button
                    onClick={handleGPS}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 glass border border-white/[0.06] rounded-xl text-sm text-slate-300 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {gpsLoading ? "Acquisition..." : data.gps ? `${data.gps.lat?.toFixed(4)}, ${data.gps.lng?.toFixed(4)}` : "Activer le GPS"}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-white mb-3">Verification des informations</h3>
                {[
                  { label: "Vehicule", value: data.vehiculeImmatriculation },
                  { label: "Chauffeur", value: data.chauffeurNom },
                  { label: "Kilometrage", value: `${data.kilometrage} km` },
                  { label: "Type de panne", value: data.typePanne },
                  { label: "Criticite", value: data.criticite },
                  { label: "Element", value: data.elementVehicule },
                  { label: "Description", value: data.description },
                  { label: "Photo", value: data.photo ? "Jointe" : "Aucune" },
                  { label: "GPS", value: data.gps ? "Active" : "Non active" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 px-3 glass rounded-xl"
                  >
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-white truncate ml-2">{item.value || "—"}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <motion.button
                onClick={handlePrev}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 px-4 py-2.5 glass rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </motion.button>
            )}
            {onCancel && (
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 text-sm text-slate-500 hover:text-rose-400 transition-colors"
              >
                Annuler
              </motion.button>
            )}
          </div>

          {step < 4 ? (
            <motion.button
              onClick={handleNext}
              disabled={!canProceed}
              whileHover={canProceed ? { scale: 1.02 } : {}}
              whileTap={canProceed ? { scale: 0.98 } : {}}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${canProceed ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-glow-blue" : "glass text-slate-600 cursor-not-allowed"}`}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-glow-emerald"
            >
              {submitting ? (
                <>
                  <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                  Envoi...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
