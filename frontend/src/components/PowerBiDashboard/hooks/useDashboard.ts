import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardData, EnrichedFilters } from "../types";
import { fetchAllDashboardData } from "../services/dashboard.service";
import { buildDashboardData } from "../utils/dashboardCalculations";

const DEFAULT_FILTERS: EnrichedFilters = {
  period: "30j", vehicle: "", site: "", region: "", driver: "", status: "",
  prestataire: "", ville: "", typePanne: "", criticite: "", annee: "", mois: "",
};

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  filters: EnrichedFilters;
  updateFilter: (key: keyof EnrichedFilters, value: string) => void;
  refresh: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EnrichedFilters>(DEFAULT_FILTERS);
  const refreshCountRef = useRef(0);
  const mountedRef = useRef(true);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    const count = ++refreshCountRef.current;

    try {
      const raw = await fetchAllDashboardData();
      if (count !== refreshCountRef.current || !mountedRef.current) return;

      if (!raw.vehicles && !raw.declarations && !raw.users) {
        setError("Impossible de charger les données");
        setLoading(false);
        return;
      }

      const built = buildDashboardData(raw);
      if (count !== refreshCountRef.current || !mountedRef.current) return;

      setData(built);
    } catch {
      if (count === refreshCountRef.current) {
        setError("Erreur de connexion au serveur");
      }
    }
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(false), 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onFocus = () => load(false);
    const onVisibility = () => { if (document.visibilityState === "visible") load(false); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const updateFilter = useCallback((key: keyof EnrichedFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, error, filters, updateFilter, refresh };
}
