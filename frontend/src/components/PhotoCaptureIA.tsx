import React, { useState, useRef } from "react";
import axios from "axios";

const FIELD_LABELS: Record<string, string> = {
  CABINE: "Cabine", CAISSE: "Caisse", ECLAIRAGE: "\u00c9clairage", FROID: "Froid",
  MECANIQUE: "M\u00e9canique", PAPIER_ACCESSOIRE: "Papier Accessoire", KLAXON: "Klaxon",
  PLANCHER: "Plancher", POIGNEE_INOX: "Poign\u00e9e inox", HAYON: "Hayon",
  PANNEAUX: "Panneaux", FACE_AVANT: "Face Avant", PONTS: "Ponts",
  ETANCHEITE: "\u00c9tanch\u00e9it\u00e9", SECURITE: "S\u00e9curit\u00e9", QUALITE: "Qualit\u00e9",
  VISIBILITE: "Visibilit\u00e9", EXTERIEUR: "Ext\u00e9rieur", DOCUMENTATION_LEGALE: "Documentation L\u00e9gale",
  CARROSSERIE: "Carrosserie", PNEUS: "Pneus", FREINS: "Freins", CHEMIN: "Chemin",
  BLOQUANT: "Bloquant", URGENT: "Urgent", NON_BLOQUANT: "Non bloquant",
};

const TYPEPANNE_LABELS: Record<string, string> = {
  MECANIQUE: "M\u00e9canique", ELECTRIQUE: "\u00c9lectrique", CAISSE: "Caisse",
  CABINE: "Cabine", SECURITE: "S\u00e9curit\u00e9", AUTRES: "Autres",
  PNEUS: "Pneus", FREINS: "Freins", ECLAIRAGE: "\u00c9clairage",
  FROID: "Froid", KLAXON: "Klaxon", CARROSSERIE: "Carrosserie",
};

interface PhotoCaptureIAProps {
  currentUser?: { name?: string; id?: number } | null;
  locationCity?: string;
}

interface ExtractResult {
  success: boolean;
  immatriculation?: string;
  plaqueDetectee?: string;
  kilometrage?: number;
  elementVehicule?: string;
  detailElement?: string;
  categorie?: string;
  typePanne?: string;
  criticite?: string;
  description?: string;
  detections?: { label: string; confidence: number }[];
  analysisTimeMs?: number;
  confidence?: Record<string, { value: string | number; confidence: number; sources?: string[] }>;
}

interface DeclarationResult {
  success: boolean;
  declaration?: {
    id: number;
    numeroDeclaration: string;
    statut: string;
    descriptionFrancais: string;
    criticite: string;
    source: string;
    elementVehicule: string;
    detailElement: string;
    categorie: string;
    typePanne: string;
    vehiculeImmatriculation: string;
    kilometrage: number;
    location: string;
    chauffeurNom: string;
    dateDeclaration: string;
  };
  analysis?: any;
  confidence?: Record<string, { value: string | number; confidence: number }>;
  videoInfo?: any;
  missingFields?: string[];
  darijaMessage?: string;
  error?: string;
}

const STEP_KM = 1;
const STEP_PLATE = 2;
const STEP_PANNE = 3;
const STEP_RESULT = 4;

function ConfidencePill({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-gray-600 dark:text-gray-400">{pct}%</span>
    </span>
  );
}

const PhotoCaptureIA: React.FC<PhotoCaptureIAProps> = ({ currentUser, locationCity }) => {
  const [step, setStep] = useState(STEP_KM);
  const [kmPhoto, setKmPhoto] = useState<string | null>(null);
  const [platePhoto, setPlatePhoto] = useState<string | null>(null);
  const [pannePhoto, setPannePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kmResult, setKmResult] = useState<ExtractResult | null>(null);
  const [plateResult, setPlateResult] = useState<ExtractResult | null>(null);
  const [panneResult, setPanneResult] = useState<ExtractResult | null>(null);
  const [declResult, setDeclResult] = useState<DeclarationResult | null>(null);
  const kmInputRef = useRef<HTMLInputElement>(null);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const panneInputRef = useRef<HTMLInputElement>(null);

  const extractKmFromPhoto = async (file: File): Promise<{ success: boolean; kilometrage: number; confidence: number; sources: string[]; analysisTimeMs?: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post<{ success: boolean; kilometrage: number; confidence: number; sources: string[]; analysisTimeMs?: number }>(
      "http://localhost:8080/api/declarations/extract-km",
      formData,
      { timeout: 180000 }
    );
    return res.data;
  };

  const extractPlateFromPhoto = async (file: File): Promise<{ success: boolean; immatriculation: string; plaqueDetectee: string; confidence: number; sources: string[]; detections: { label: string; confidence: number }[]; analysisTimeMs?: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post<{ success: boolean; immatriculation: string; plaqueDetectee: string; confidence: number; sources: string[]; detections: { label: string; confidence: number }[]; analysisTimeMs?: number }>(
      "http://localhost:8080/api/declarations/extract-plate",
      formData,
      { timeout: 180000 }
    );
    return res.data;
  };

  const handleKmPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setKmPhoto(url);
    setLoading(true);
    setError("");
    try {
      const result = await extractKmFromPhoto(f);
      setKmResult({
        success: result.success,
        kilometrage: result.kilometrage,
        confidence: result.confidence ? { kilometrage: { value: result.kilometrage, confidence: result.confidence, sources: result.sources } } : undefined,
        detections: [],
        analysisTimeMs: result.analysisTimeMs,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur extraction kilom\u00e9trage");
    } finally {
      setLoading(false);
    }
  };

  const handlePlatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPlatePhoto(url);
    setLoading(true);
    setError("");
    try {
      const result = await extractPlateFromPhoto(f);
      setPlateResult({
        success: result.success,
        immatriculation: result.immatriculation || result.plaqueDetectee,
        plaqueDetectee: result.plaqueDetectee || result.immatriculation,
        confidence: result.confidence ? { immatriculation: { value: result.immatriculation || result.plaqueDetectee, confidence: result.confidence, sources: result.sources } } : undefined,
        detections: result.detections || [],
        analysisTimeMs: result.analysisTimeMs,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur extraction matricule");
    } finally {
      setLoading(false);
    }
  };

  const handlePannePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const url = URL.createObjectURL(f);
    setPannePhoto(url);
    setLoading(true);
    setError("");
    try {
      const endpoint = isVideo
        ? "http://localhost:8080/api/declarations/auto-analyze-video"
        : "http://localhost:8080/api/declarations/auto-analyze";
      const formData = new FormData();
      formData.append("file", f);
      const headers: any = {
        "X-User-Id": String(currentUser?.id || ""),
        "X-User-Name": currentUser?.name || "",
      };
      const km = kmResult?.kilometrage;
      const immat = plateResult?.immatriculation || plateResult?.plaqueDetectee || "";
      if (immat) headers["X-Immatriculation"] = immat;
      if (km && km > 0) headers["X-Kilometrage"] = String(km);
      const res = await axios.post<DeclarationResult>(endpoint, formData, { headers, timeout: 180000 });
      setDeclResult(res.data);
      setPanneResult({
        success: true,
        immatriculation: res.data.analysis?.mapped?.immatriculation,
        plaqueDetectee: res.data.analysis?.mapped?.plaqueDetectee,
        kilometrage: res.data.analysis?.mapped?.kilometrage,
        elementVehicule: res.data.analysis?.mapped?.elementVehicule,
        detailElement: res.data.analysis?.mapped?.detailElement,
        categorie: res.data.analysis?.mapped?.categorie,
        typePanne: res.data.analysis?.mapped?.typePanne,
        criticite: res.data.analysis?.mapped?.criticite,
        description: res.data.analysis?.mapped?.description,
        detections: res.data.analysis?.detections,
        confidence: res.data.confidence,
      });
      setStep(STEP_RESULT);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur analyse panne");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(STEP_KM);
    setKmPhoto(null);
    setPlatePhoto(null);
    setPannePhoto(null);
    setKmResult(null);
    setPlateResult(null);
    setPanneResult(null);
    setDeclResult(null);
    setError("");
  };

  const immat = plateResult?.immatriculation || plateResult?.plaqueDetectee || "";
  const km = kmResult?.kilometrage || 0;
  const criticite = panneResult?.criticite || declResult?.analysis?.mapped?.criticite || "NON_BLOQUANT";
  const typePanne = panneResult?.typePanne || declResult?.analysis?.mapped?.typePanne || "";
  const element = panneResult?.elementVehicule || declResult?.analysis?.mapped?.elementVehicule || "";

  return (
    <div className="p-4 space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-2">
        {[STEP_KM, STEP_PLATE, STEP_PANNE].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {step > s ? "\u2713" : i + 1}
            </div>
            {i < 2 && <div className={`flex-1 h-1 rounded ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Kilometrage */}
      {step === STEP_KM && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🔢</div>
            <h3 className="text-lg font-bold text-gray-800">Photographier le kilométrage</h3>
            <p className="text-sm text-gray-500 mt-1">Prenez une photo du compteur / tableau de bord</p>
          </div>
          {!kmPhoto ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-5xl text-gray-600 dark:text-gray-400">📷</span>
              </div>
              <label className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow cursor-pointer">
                📸 Photo du compteur
                <input ref={kmInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleKmPhoto} />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img src={kmPhoto} alt="Kilométrage" className="w-full max-h-64 object-contain rounded-xl" />
                <button className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80"
                  onClick={() => { setKmPhoto(null); setKmResult(null); }}>✕</button>
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Extraction du kilométrage...</p>
                </div>
              )}
              {kmResult && kmResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-bold text-green-800">Kilométrage détecté</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-green-700 text-center my-2">
                    {km > 0 ? `${km.toLocaleString()} km` : "Non détecté"}
                  </div>
                  {kmResult.confidence?.kilometrage && (
                    <div className="text-center text-xs text-gray-500">
                      Confiance : <ConfidencePill confidence={kmResult.confidence.kilometrage.confidence} />
                    </div>
                  )}
                  {kmResult.detections && kmResult.detections.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {kmResult.detections.slice(0, 4).map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {d.label} ({Math.round(d.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {km > 0 && (
                      <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                        onClick={() => setStep(STEP_PLATE)}>
                        ✅ Confirmer →
                      </button>
                    )}
                    <button className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                      onClick={() => { setKmPhoto(null); setKmResult(null); }}>
                      🔄 Refaire
                    </button>
                  </div>
                </div>
              )}
              {kmResult && !kmResult.success && (
                <div className="text-center">
                  <p className="text-red-600 text-sm">Aucun kilométrage détecté. Refaites la photo.</p>
                  <button className="mt-2 px-6 py-2 bg-gray-200 rounded-xl" onClick={() => { setKmPhoto(null); setKmResult(null); }}>🔄 Refaire</button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Ou passez à l'étape suivante sans kilométrage</p>
                  <button className="mt-1 px-6 py-2 bg-blue-600 text-white rounded-xl" onClick={() => setStep(STEP_PLATE)}>Passer →</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Matricule */}
      {step === STEP_PLATE && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🚗</div>
            <h3 className="text-lg font-bold text-gray-800">Photographier la plaque d'immatriculation</h3>
            <p className="text-sm text-gray-500 mt-1">Prenez une photo de la plaque du véhicule</p>
            {km > 0 && <p className="text-xs text-green-600 font-mono mt-1">✅ Km : {km.toLocaleString()}</p>}
          </div>
          {!platePhoto ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-5xl text-gray-600 dark:text-gray-400">🪪</span>
              </div>
              <label className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow cursor-pointer">
                📸 Photo de la plaque
                <input ref={plateInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePlatePhoto} />
              </label>
              <button className="text-blue-600 text-sm hover:underline" onClick={() => setStep(STEP_KM)}>← Modifier kilométrage</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img src={platePhoto} alt="Plaque" className="w-full max-h-64 object-contain rounded-xl" />
                <button className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80"
                  onClick={() => { setPlatePhoto(null); setPlateResult(null); }}>✕</button>
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Extraction du matricule...</p>
                </div>
              )}
              {plateResult && plateResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-bold text-green-800">Matricule détecté</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-blue-700 text-center my-2 tracking-wider">
                    {immat || "Non détecté"}
                  </div>
                  {plateResult.confidence?.immatriculation && (
                    <div className="text-center text-xs text-gray-500">
                      Confiance : <ConfidencePill confidence={plateResult.confidence.immatriculation.confidence} />
                    </div>
                  )}
                  {plateResult.detections && plateResult.detections.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {plateResult.detections.slice(0, 4).map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {d.label} ({Math.round(d.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {immat && (
                      <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                        onClick={() => setStep(STEP_PANNE)}>
                        ✅ Confirmer →
                      </button>
                    )}
                    <button className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                      onClick={() => { setPlatePhoto(null); setPlateResult(null); }}>
                      🔄 Refaire
                    </button>
                  </div>
                </div>
              )}
              {plateResult && !plateResult.success && (
                <div className="text-center">
                  <p className="text-red-600 text-sm">Aucun matricule détecté. Refaites la photo.</p>
                  <button className="mt-2 px-6 py-2 bg-gray-200 rounded-xl" onClick={() => { setPlatePhoto(null); setPlateResult(null); }}>🔄 Refaire</button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Ou passez à l'étape suivante sans matricule</p>
                  <button className="mt-1 px-6 py-2 bg-blue-600 text-white rounded-xl" onClick={() => setStep(STEP_PANNE)}>Passer →</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Panne */}
      {step === STEP_PANNE && !declResult && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
            <div className="flex justify-between font-mono">
              <span className="text-green-700">✅ Km : {km > 0 ? km.toLocaleString() : "—"}</span>
              <span className="text-blue-700 font-bold">{immat || "—"}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🔧</div>
            <h3 className="text-lg font-bold text-gray-800">Photographier la panne / dommage</h3>
            <p className="text-sm text-gray-500 mt-1">Prenez une photo ou vidéo du problème</p>
          </div>
          {!pannePhoto ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-5xl text-gray-600 dark:text-gray-400">🔧</span>
              </div>
              <div className="flex gap-3">
                <label className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow cursor-pointer">
                  📸 Photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePannePhoto} />
                </label>
                <label className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow cursor-pointer">
                  🎥 Vidéo
                  <input type="file" accept="video/*" className="hidden" onChange={handlePannePhoto} />
                </label>
              </div>
              <button className="text-blue-600 text-sm hover:underline" onClick={() => setStep(STEP_PLATE)}>← Modifier matricule</button>
            </div>
          ) : (
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Analyse IA en cours...</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Détection de la panne, criticité, élément...</p>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}
        </div>
      )}

      {/* Step 4: Results */}
      {step === STEP_RESULT && declResult && declResult.success && declResult.declaration && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-5 space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-green-800">Déclaration créée</h3>
              <p className="text-sm text-green-600 font-mono mt-1">N° {declResult.declaration.numeroDeclaration}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Statut: {declResult.declaration.statut === "EN_COURS" ? "Transférée au prestataire" : declResult.declaration.statut}
              </span>
            </div>

            {/* Vehicle info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm flex justify-between">
              <span className="text-blue-800 font-mono font-bold">{declResult.declaration.vehiculeImmatriculation || immat || "—"}</span>
              <span className="text-green-800 font-mono">
                {(() => { const k = declResult.declaration.kilometrage || km; return k && k > 0 ? `${k.toLocaleString()} km` : "—"; })()}
              </span>
            </div>

            {/* Criticite banner */}
            {panneResult?.criticite && (
              <div className={`text-center py-2 px-4 rounded-full text-sm font-bold ${
                panneResult.criticite === "BLOQUANT" ? "bg-red-100 text-red-700" :
                panneResult.criticite === "URGENT" ? "bg-orange-100 text-orange-700" :
                "bg-green-100 text-green-700"
              }`}>
                {panneResult.criticite === "BLOQUANT" ? "\uD83D\uDEAB BLOQUANT \u2014 V\u00e9hicule indisponible" :
                 panneResult.criticite === "URGENT" ? "\u26A0\uFE0F URGENT \u2014 Intervention requise" :
                 "\u2705 Non bloquant"}
              </div>
            )}

            <hr className="border-green-200" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Type panne</span>
                <span className="font-medium">{TYPEPANNE_LABELS[panneResult?.typePanne || ""] || panneResult?.typePanne || "\u2014"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">\u00c9l\u00e9ment</span>
                <span className="font-medium">{FIELD_LABELS[panneResult?.elementVehicule || ""] || panneResult?.elementVehicule || "\u2014"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Cat\u00e9gorie</span>
                <span className="font-medium">{FIELD_LABELS[panneResult?.categorie || ""] || panneResult?.categorie || "\u2014"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">D\u00e9tail</span>
                <span className="font-medium">{FIELD_LABELS[panneResult?.detailElement || ""] || panneResult?.detailElement || "\u2014"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Criticit\u00e9</span>
                <span className={`font-bold ${
                  panneResult?.criticite === "BLOQUANT" ? "text-red-600" :
                  panneResult?.criticite === "URGENT" ? "text-orange-500" :
                  "text-green-600"
                }`}>
                  {FIELD_LABELS[panneResult?.criticite || ""] || panneResult?.criticite || "Non bloquant"}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Chauffeur</span>
                <span className="font-medium">{declResult.declaration.chauffeurNom}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Description</span>
              <p className="text-sm font-medium">{declResult.declaration.descriptionFrancais}</p>
            </div>
            {panneResult?.detections && panneResult.detections.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 block">D\u00e9tections IA</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {panneResult.detections.slice(0, 6).map((d, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                      {d.label} ({Math.round(d.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
            {panneResult?.confidence && Object.keys(panneResult.confidence).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Confiance IA</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {panneResult.confidence.immatriculation && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Plaque:</span>
                      <span className="font-medium">{String(panneResult.confidence.immatriculation.value)}</span>
                      <ConfidencePill confidence={panneResult.confidence.immatriculation.confidence} />
                    </div>
                  )}
                  {panneResult.confidence.kilometrage && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Km:</span>
                      <span className="font-medium">{String(panneResult.confidence.kilometrage.value)}</span>
                      <ConfidencePill confidence={panneResult.confidence.kilometrage.confidence} />
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">\u00c9l\u00e9ment:</span>
                    <ConfidencePill confidence={panneResult.confidence.elementVehicule?.confidence || 0} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Panne:</span>
                    <ConfidencePill confidence={panneResult.confidence.typePanne?.confidence || 0} />
                  </div>
                </div>
              </div>
            )}
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-bold hover:bg-blue-700 shadow active:scale-95 transition-all" onClick={reset}>
              📸 Nouvelle d\u00e9claration
            </button>
          </div>
        </div>
      )}

      {((step === STEP_RESULT && declResult && !declResult.success) || error) && step !== STEP_PANNE && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error || declResult?.error || "Analyse \u00e9chou\u00e9e"}
          <button className="ml-2 underline text-blue-600" onClick={reset}>R\u00e9essayer</button>
        </div>
      )}
    </div>
  );
};

export default PhotoCaptureIA;