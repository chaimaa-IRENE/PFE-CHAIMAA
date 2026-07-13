import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { User } from "../types/incident";
import { Navigation, MapPin, Truck, RefreshCw, Play, Square, Clock, Signal } from "lucide-react";
import Toast from "./ui/Toast";

interface ChauffeurTrackingProps {
  currentUser?: User | null;
}

const TRACKING_API = "http://localhost:8080/api/tracking/update";
const VEHICULE_API = "http://localhost:8080/api/vehicules/chauffeur";

const ChauffeurTracking: React.FC<ChauffeurTrackingProps> = ({ currentUser }) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [lastSync, setLastSync] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [selectedVehicule, setSelectedVehicule] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [intervalSec, setIntervalSec] = useState(30);
  const [sentCount, setSentCount] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionRef = useRef(position);
  const speedRef = useRef(speed);
  const vehiculeRef = useRef(selectedVehicule);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    axios.get(`${VEHICULE_API}/${currentUser.id}`).then((res: any) => {
      setVehicules(res.data || []);
      if (res.data?.length > 0) {
        setSelectedVehicule(res.data[0]);
        vehiculeRef.current = res.data[0];
      }
    }).catch(() => addLog("Erreur chargement vehicules"));
  }, [currentUser, addLog]);

  // Keep refs in sync
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { vehiculeRef.current = selectedVehicule; }, [selectedVehicule]);

  const sendPosition = useCallback(async () => {
    const v = vehiculeRef.current;
    const pos = positionRef.current;
    if (!v || !pos) return;
    try {
      await axios.post(TRACKING_API, {
        immatriculation: v.immatriculation,
        latitude: pos.lat,
        longitude: pos.lng,
        vitesse: Math.round(speedRef.current * 3.6),
        moteurAllume: true,
      });
      setLastSync(new Date().toLocaleTimeString());
      setSentCount(c => c + 1);
    } catch {
      addLog("Erreur envoi position");
    }
  }, [addLog]);

  const startTracking = useCallback(() => {
    if (!selectedVehicule) {
      showToast("Selectionnez un vehicule d'abord", "error");
      return;
    }
    if (!navigator.geolocation) {
      showToast("Geolocalisation non supportee", "error");
      return;
    }

    setActive(true);
    addLog(`Demarrage suivi: ${selectedVehicule.immatriculation}`);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setSpeed(pos.coords.speed || 0);
      },
      (err) => { addLog(`Erreur GPS (${err.code}): ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    sendPosition();
    intervalRef.current = setInterval(sendPosition, intervalSec * 1000);
    addLog(`Envoi toutes les ${intervalSec}s`);
  }, [selectedVehicule, sendPosition, intervalSec, showToast, addLog]);

  const stopTracking = useCallback(() => {
    setActive(false);
    if (watchIdRef.current != null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
    addLog("Suivi arrete");
  }, [addLog]);

  useEffect(() => {
    return () => { stopTracking(); };
  }, [stopTracking]);

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Vehicule selector */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Vehicule</label>
        <select
          value={selectedVehicule?.id || ""}
          onChange={e => {
            const v = vehicules.find(x => x.id === Number(e.target.value));
            setSelectedVehicule(v);
            vehiculeRef.current = v;
          }}
          disabled={active}
          className="w-full px-4 py-3 border border-slate-300 dark:border-dark-border dark:bg-dark-border rounded-xl text-sm"
        >
          {vehicules.map((v: any) => (
            <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
          ))}
        </select>
      </div>

      {/* Main control card */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-6 text-center">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
          active ? "bg-green-500 shadow-lg shadow-green-500/50 scale-110" : "bg-slate-200 dark:bg-dark-border"
        }`}>
          <Navigation className={`w-10 h-10 text-white transition-all ${active ? "animate-pulse" : "text-slate-600 dark:text-slate-400"}`} />
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
          {active ? "Suivi en cours" : "Suivi GPS"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {active
            ? `Envoi position toutes les ${intervalSec}s`
            : "Demarrez pour partager votre position en direct"}
        </p>

        {/* Quick stats */}
        {active && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-dark-border rounded-xl p-3">
              <Signal className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Precision</p>
              <p className="text-sm font-bold">{position ? `${Math.round(position.accuracy)}m` : "-"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-dark-border rounded-xl p-3">
              <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Dernier envoi</p>
              <p className="text-sm font-bold">{lastSync || "-"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-dark-border rounded-xl p-3">
              <RefreshCw className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Envoyes</p>
              <p className="text-sm font-bold">{sentCount}</p>
            </div>
          </div>
        )}

        <button
          onClick={active ? stopTracking : startTracking}
          className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-all active:scale-95 ${
            active ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {active ? <Square className="w-5 h-5 inline mr-2" /> : <Play className="w-5 h-5 inline mr-2" />}
          {active ? " ARRETER LE SUIVI" : " DEMARRER LE SUIVI"}
        </button>
      </div>

      {/* Position info */}
      {position && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow border border-slate-200/50 dark:border-dark-border p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Position actuelle
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 dark:bg-dark-border rounded-lg p-2">
              <span className="text-slate-600 dark:text-slate-400 text-xs block">Latitude</span>
              <span className="font-mono font-bold">{position.lat.toFixed(6)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-dark-border rounded-lg p-2">
              <span className="text-slate-600 dark:text-slate-400 text-xs block">Longitude</span>
              <span className="font-mono font-bold">{position.lng.toFixed(6)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-dark-border rounded-lg p-2">
              <span className="text-slate-600 dark:text-slate-400 text-xs block">Vitesse</span>
              <span className="font-bold">{Math.round(speed * 3.6)} km/h</span>
            </div>
            <div className="bg-slate-50 dark:bg-dark-border rounded-lg p-2">
              <span className="text-slate-600 dark:text-slate-400 text-xs block">Precision</span>
              <span className="font-bold">{Math.round(position.accuracy)} m</span>
            </div>
          </div>
        </div>
      )}

      {/* Deja vu link */}
      <div className="text-center">
        <a
          href={`https://www.google.com/maps?q=${position?.lat || 0},${position?.lng || 0}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline"
        >
          Ouvrir dans Google Maps
        </a>
      </div>

      {/* Logs */}
      <div className="bg-slate-900 text-green-400 rounded-2xl p-4 font-mono text-[10px] leading-relaxed max-h-48 overflow-y-auto">
        {logs.length === 0 ? (
          <span className="text-slate-500">Aucun log. Demarrez le suivi...</span>
        ) : logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
};

export default ChauffeurTracking;

