import axios from "axios";
import {
  Indicateurs, BudgetPoint, BudgetInfo,
  InterventionRow, DocumentStats, AiInsight, User, VehiculeApi,
  DeclarationIncident,
} from "../types";

const DEFAULT_TIMEOUT = 15000;

async function apiGet<T>(url: string): Promise<T | null> {
  try {
    const r = await axios.get<T>(url, { timeout: DEFAULT_TIMEOUT });
    return r.data;
  } catch {
    return null;
  }
}

export interface RawApiData {
  users: User[] | null;
  vehicles: VehiculeApi | null;
  declarations: DeclarationIncident[] | null;
  indicateurs: Indicateurs | null;
  interventions: { interventions: InterventionRow[] } | null;
  budgetAnalysis: BudgetPoint[] | null;
  activeBudget: BudgetInfo | null;
  documentStats: DocumentStats | null;
  aiInsights: AiInsight[] | null;
}

export async function fetchAllDashboardData(): Promise<RawApiData> {
  const [
    users,
    vehicles,
    declarations,
    indicateurs,
    interventions,
    budgetAnalysis,
    activeBudget,
    documentStats,
    aiInsights,
  ] = await Promise.all([
    apiGet<User[]>("/users"),
    apiGet<VehiculeApi>("/api/vehicles"),
    apiGet<DeclarationIncident[]>("/api/declarations"),
    apiGet<Indicateurs>("/api/powerbi/indicateurs"),
    apiGet<{ interventions: InterventionRow[] }>("/api/powerbi/stats-interventions"),
    apiGet<BudgetPoint[]>("/api/powerbi/budget-analysis"),
    apiGet<BudgetInfo>("/api/budget/active"),
    apiGet<DocumentStats>("/api/fleet/kpi/documents-stats"),
    apiGet<AiInsight[]>("/api/powerbi/v2/ai-insights"),
  ]);

  return {
    users, vehicles, declarations, indicateurs,
    interventions, budgetAnalysis, activeBudget,
    documentStats, aiInsights,
  };
}
