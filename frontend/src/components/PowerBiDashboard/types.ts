export interface DashboardData {
  kpis: Kpis;
  charts: Charts;
  vehicles: VehicleRow[];
  anomalies: AnomalyRow[];
  declarations: DeclarationRow[];
  drivers: DriverRow[];
  documents: DocumentRow[];
  alerts: AlertRow[];
  filterOptions: FilterOptions;
  indicateurs?: Indicateurs;
  budgetAnalysis?: BudgetPoint[];
  activeBudget?: BudgetInfo;
  interventions?: InterventionRow[];
  prestataires?: PrestataireRow[];
  documentStats?: DocumentStats;
  vehicleScores?: any[];
  driverPerformances?: any[];
  aiInsights?: AiInsight[];
}

export interface Kpis {
  totalVehicules: number;
  enService: number;
  aArret: number;
  enMaintenance: number;
  bloques: number;
  tauxUtilisation: number;
  anomaliesOuvertes: number;
  ticketsOuverts: number;
  totalKm: number;
  consoMoyenne: number;
  vitesseMoyenne: number;
  totalChauffeurs: number;
  txCheckupConformite: number;
  totalCheckups30j: number;
  mttr: number;
  mtbf: number;
  slaCompliance: number;
  totalDeclarations: number;
  totalMaintenances: number;
  totalPrestataires?: number;
  totalInterventions?: number;
  budgetConsomme?: number;
  budgetRestant?: number;
  budgetTotal?: number;
  documentsExpires?: number;
  documentsBientotExpire?: number;
  coutTotalMaintenance?: number;
  tauxDisponibilite?: number;
  tempsMoyenReparation?: number;
  tempsMoyenValidation?: number;
  declarationsAujourdhui?: number;
  declarationsCetteSemaine?: number;
  declarationsCeMois?: number;
  interventionsAujourdhui?: number;
  interventionsTerminees?: number;
  interventionsEnCours?: number;
  interventionsEnRetard?: number;
  vehiculesDisponibles?: number;
  tauxResolution?: number;
  totalAnomalies?: number;
  checkupsNonConformes?: number;
}

export interface Charts {
  anomaliesParSource: Record<string, number>;
  vehiculesParStatut: Record<string, number>;
  declarationsParStatut: Record<string, number>;
  declarationsParCriticite: Record<string, number>;
  declarationsParTypePanne: Record<string, number>;
  declarationsParQualification: Record<string, number>;
  vehiculesParMarque: Record<string, number>;
  anomaliesParElement: Record<string, number>;
  vehiculesParAgence: Record<string, number>;
  declarationsParCategorie: Record<string, number>;
  evolutionMensuelle: MonthlyPoint[];
  declarationsParChauffeur?: Record<string, number>;
  interventionsParPrestataire?: Record<string, number>;
  coutParMois?: Record<string, number>;
  budgetParMois?: Record<string, number>;
  interventionsParStatut?: Record<string, number>;
  chauffeursParVille?: Record<string, number>;
  documentsParType?: Record<string, number>;
  pannesParElement?: Record<string, number>;
}

export interface MonthlyPoint {
  mois: string;
  anomalies: number;
  resolues: number;
  critiques: number;
  checkups: number;
  checkupsOK: number;
  tickets: number;
}

export interface VehicleRow {
  id: number;
  immatriculation: string;
  numeroOrdre: string;
  marque: string;
  modele: string;
  type: string;
  annee: number;
  kilometrage: number;
  statut: string;
  agence: string;
  chauffeurNom: string;
  carburant: string;
  conforme: boolean;
  anomalies: number;
  checkups: number;
  tickets: number;
  documents: number;
  documentsValides: number;
  scoreIVMS: number;
}

export interface AnomalyRow {
  id: number;
  code: string;
  vehicule: string;
  chauffeur: string;
  element: string;
  categorie: string;
  criticite: string;
  statut: string;
  dateDetection: string;
  dateReparation: string;
  source: string;
}

export interface DeclarationRow {
  id: number;
  numeroDemande: string;
  vehicule: string;
  chauffeur: string;
  typePanne: string;
  criticite: string;
  statut: string;
  qualification: string;
  element: string;
  categorie: string;
  date: string;
  cout: number;
  sla: number;
  description: string;
}

export interface DriverRow {
  nom: string;
  matricule: string;
  email: string;
  phone: string;
  ville: string;
  branchCode: string;
  anomalies: number;
  checkups: number;
  checkupsOK: number;
  tauxConformite: number;
  tauxResolution: number;
  departs: number;
  presences: number;
  score: number;
  vehicules?: string[];
  interventions?: number;
  coutTotal?: number;
}

export interface User {
  id: number;
  personCode: string;
  username: string;
  email: string;
  firstname: string;
  name: string;
  branchCode: string;
  phone: string;
  cellularPhone: string;
  profileCode: string;
  role: string;
  roleCode: string;
  roleDepartement: string;
  roleBranch: string;
  ville: string;
  status: string;
  holdPerson: boolean;
  holdReason: string;
  holdRoleBranch: boolean;
  holdRelatedRole: boolean;
  lastConnectionDate: [number, number, number, number, number, number, number] | null;
  creationDate: [number, number, number] | null;
  lastUpdate: [number, number, number, number, number, number, number] | null;
  passwordExpiryDate: [number, number, number] | null;
  createdByRoleId: number | null;
  faceDescriptor: string | null;
  faceRegistered: boolean;
  validationCode: string | null;
  emailValidated: boolean;
  validationCodeExpiresAt: string | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiresAt: string | null;
}

export interface VehiculeApi {
  total: number;
  success: boolean;
  vehicles: any[];
}

export interface DeclarationIncident {
  idIncident: number;
  numeroDemande: string;
  dateHeure: string | null;
  descriptionFrancais: string;
  criticite: string;
  statut: string;
  typePanne: string;
  chauffeurNom: string;
  chauffeurMatricule: string;
  chauffeurId: number;
  vehiculeImmatriculation: string;
  vehiculeId: number;
  elementVehicule: string;
  categorie: string;
  source: string;
  qualification: string;
  coutProbleme: number;
  sla: number;
  dateDebutIntervention: string | null;
  dateReparation: string | null;
  actionsRealisees: string;
  piecesNecessaires: string;
  mois: string;
  vehiculeMarque: string;
}

export interface DocumentRow {
  id: number;
  vehicule: string;
  type: string;
  numero: string;
  dateExpiration: string;
  statut: string;
  joursRestants: number;
}

export interface AlertRow {
  type: string;
  severite: string;
  vehicule?: string;
  document?: string;
  ticket?: string;
  count?: number;
  message: string;
}

export interface FilterOptions {
  sites: string[];
  regions: string[];
  vehicles: { immatriculation: string; marque: string }[];
  status: string[];
  drivers: string[];
  villes?: string[];
  prestataires?: string[];
  typesPanne?: string[];
  criticites?: string[];
  annees?: string[];
  mois?: string[];
}

export type PageKey = "executive" | "vehicles" | "anomalies" | "drivers";

export interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
}

export interface Indicateurs {
  totalVehicules: number;
  totalDeclarations: number;
  declarationsResolues: number;
  declarationsBloquantes: number;
  tauxResolution: number;
  coutTotalProblemes: number;
  coutMoyenProbleme: number;
  totalCheckups: number;
  checkupsConformes: number;
  checkupsNonConformes: number;
  checkupsEnAttente: number;
  tauxConformite: number;
  topPannes: Record<string, number>;
  defautsCheckupFrequents: Record<string, number>;
}

export interface BudgetPoint {
  mois: string;
  cout: number;
  budget: number;
  ecart: number;
  tauxUtilisation: number;
}

export interface BudgetInfo {
  budgetTotal: number;
  budgetUtilise: number;
  budgetRestant: number;
  annee: number;
  trimestre: number;
  dateDebut: string;
  dateFin: string;
}

export interface InterventionRow {
  id: number;
  vehiculeImmatriculation: string;
  typePanne: string;
  criticite: string;
  dateDebut: string;
  dateReparation: string;
  duree: number;
  cout: number;
  statut: string;
  chauffeurNom: string;
  prestataire?: string;
}

export interface PrestataireRow {
  nom: string;
  totalInterventions: number;
  interventionsTerminees: number;
  interventionsEnAttente: number;
  interventionsEnRetard: number;
  tempsMoyen: number;
  slaRespecte: number;
  coutTotal: number;
  vehiculesRepares: number;
  tauxResolution: number;
  typesPanne: Record<string, number>;
}

export interface DocumentStats {
  total: number;
  valides: number;
  expires: number;
  bientotExpires: number;
  parType: Record<string, { total: number; valides: number; expires: number }>;
}

export interface AiInsight {
  type: string;
  message: string;
  impact: string;
  recommandation: string;
  tendance: string;
  valeur: number;
  variation: number;
}

export interface EnrichedFilters {
  period: string;
  vehicle: string;
  site: string;
  region: string;
  driver: string;
  status: string;
  prestataire: string;
  ville: string;
  typePanne: string;
  criticite: string;
  annee: string;
  mois: string;
}

export const COLORS = {
  blue: "#3B82F6",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#EF4444",
  cyan: "#06B6D4",
  pink: "#EC4899",
  slate: "#64748B",
  white: "#FFFFFF",
};

export const CHART_COLORS = [
  COLORS.blue, COLORS.emerald, COLORS.amber, COLORS.rose,
  COLORS.violet, COLORS.cyan, COLORS.pink, COLORS.indigo,
];

export const STATUS_COLORS: Record<string, string> = {
  ACTIF: COLORS.emerald,
  BLOQUE: COLORS.rose,
  IMMOBILISE: COLORS.rose,
  MAINTENANCE: COLORS.amber,
  EN_SERVICE: COLORS.blue,
  A_ARRET: COLORS.rose,
  CLOTURE: COLORS.emerald,
  RESOLU: COLORS.emerald,
  OUVERT: COLORS.amber,
  EN_COURS: COLORS.blue,
  EN_ATTENTE: COLORS.amber,
  ANNULE: COLORS.slate,
  CRITIQUE: COLORS.rose,
  BLOQUANT: COLORS.rose,
  MAJEURE: COLORS.amber,
  MINEURE: COLORS.blue,
  PREVENTIVE: COLORS.blue,
  CURATIVE: COLORS.amber,
};
