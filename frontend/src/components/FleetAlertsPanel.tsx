import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertTriangle, Bell, CheckCircle, XCircle, AlertCircle,
  Truck, RefreshCw, Filter, Clock, Shield, Wrench, User
} from "lucide-react";

export default function FleetAlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actorMode, setActorMode] = useState<"RS" | "MAINTENANCE" | "ADMIN">("ADMIN");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await axios.get<any[]>("http://localhost:8080/api/fleet/alerts/all");
      setAlerts(res.data || []);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  };

  const resolveAlert = async (id: number) => {
    try {
      await axios.put(`http://localhost:8080/api/fleet/alerts/resolve/${id}`, { resoluPar: actorMode });
      loadAlerts();
    } catch {}
  };

  const getAlertIcon = (criticite: string) => {
    switch (criticite) {
      case "BLOQUANT": return <XCircle className="w-5 h-5 text-red-600" />;
      case "URGENT": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "CRITIQUE": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertBg = (criticite: string) => {
    switch (criticite) {
      case "BLOQUANT": return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "URGENT": return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "CRITIQUE": return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50";
      case "WARNING": return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      default: return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getAlertLabel = (criticite: string) => {
    switch (criticite) {
      case "BLOQUANT": return "Bloquant";
      case "URGENT": return "Urgent";
      case "CRITIQUE": return "Critique";
      case "WARNING": return "Alerte";
      default: return "Info";
    }
  };

  const filteredAlerts = filter === "all" ? alerts : filter === "active" ? alerts.filter(a => !a.resolu) : alerts.filter(a => a.criticite === filter.toUpperCase());
  const activeCount = alerts.filter(a => !a.resolu).length;

  const cardClass = "bg-white dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-dark-border p-5";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold bg-blue-600">
          {toastMsg}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-danone-blue" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Système — Alertes</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{activeCount} alerte{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={loadAlerts} className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-border hover:bg-slate-200 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Filters */}
      <div className={cardClass}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-danone-blue" />
          <span className="text-sm font-bold text-danone-blue">Filtrer</span>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[
            { value: "all", label: "Toutes", color: "bg-slate-100 text-slate-700" },
            { value: "active", label: "Actives", color: "bg-blue-100 text-blue-700" },
            { value: "BLOQUANT", label: "Bloquantes", color: "bg-red-100 text-red-700" },
            { value: "CRITIQUE", label: "Critiques", color: "bg-red-100 text-red-700" },
            { value: "WARNING", label: "Alertes", color: "bg-amber-100 text-amber-700" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === f.value ? 'ring-2 ring-danone-blue ' + f.color : f.color + ' opacity-60 hover:opacity-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actor Mode Switch */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-danone-blue" />
          <span className="text-sm font-bold text-danone-blue">Agir en tant que :</span>
        </div>
        <div className="flex gap-2">
          {[
            { value: "RS", label: "Responsable Support", icon: <Shield className="w-3 h-3" /> },
            { value: "MAINTENANCE", label: "Maintenance", icon: <Wrench className="w-3 h-3" /> },
            { value: "ADMIN", label: "Admin/Direction", icon: <User className="w-3 h-3" /> },
          ].map(a => (
            <button key={a.value} onClick={() => setActorMode(a.value as any)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                actorMode === a.value ? 'bg-danone-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-dark-border rounded-2xl animate-pulse" />)}</div>
      ) : filteredAlerts.length === 0 ? (
        <div className={`${cardClass} text-center py-8`}>
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Aucune alerte à afficher</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert: any) => (
            <div key={alert.id} className={`${cardClass} border-l-4 ${getAlertBg(alert.criticite)}`}>
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.criticite)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      alert.criticite === 'BLOQUANT' ? 'bg-red-200 text-red-800' :
                      alert.criticite === 'CRITIQUE' ? 'bg-red-100 text-red-700' :
                      alert.criticite === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{getAlertLabel(alert.criticite)}</span>
                    <span className="text-xs font-mono font-bold text-slate-500">{alert.typeAlerte}</span>
                    {alert.vehiculeImmatriculation && (
                      <span className="text-xs font-bold text-danone-blue flex items-center gap-1">
                        <Truck className="w-3 h-3" /> {alert.vehiculeImmatriculation}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-white mt-1">{alert.description}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {alert.dateCreation ? new Date(alert.dateCreation).toLocaleString("fr-FR") : "—"}
                  </p>
                  {alert.chauffeurNom && <p className="text-xs text-slate-600 dark:text-slate-400">Chauffeur: {alert.chauffeurNom}</p>}
                </div>
                <div className="flex-shrink-0 flex gap-1">
                  {!alert.resolu ? (
                    <>
                      {actorMode === "RS" && (
                        <>
                          <button onClick={() => resolveAlert(alert.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Valider
                          </button>
                          <button onClick={() => { setToastMsg("Maintenance assignée"); setTimeout(() => setToastMsg(null), 2000); resolveAlert(alert.id); }}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Assigner
                          </button>
                        </>
                      )}
                      {actorMode === "MAINTENANCE" && (
                        <button onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Réparé
                        </button>
                      )}
                      {actorMode === "ADMIN" && (
                        <button onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                          Résoudre
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg">✅ Résolue</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-200 dark:border-dark-border">
        <img src="/logo-danone.svg" alt="Danone" className="h-8 opacity-50" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wider">ONE PLANET. ONE HEALTH</p>
      </div>
    </div>
  );
}
