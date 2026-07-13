// Rôles disponibles
export enum Role {
  ADMIN = 'ADMIN',
  CHAUFFEUR = 'CHAUFFEUR',
  SL = 'SL',
  PRESTATAIRE = 'PRESTATAIRE',
  RS = 'RS',
  RPF = 'RPF',
  ASM = 'ASM',
  CPL = 'CPL',
  DRL = 'DRL',
  RFL = 'RFL',
  MAINTENANCE = 'MAINTENANCE',
  POWERBI = 'POWERBI',
  RESPONSABLE_SUPPORT = 'RS',
  ADMINISTRATION_CENTRALE = 'ADMIN',
  CHEF_PARC_LOGISTIC = 'CPL',
  DIRECTEUR_REGIONAL_LOGISTIC = 'DRL',
  RESPONSABLE_FLOTTE = 'RFL'
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  CHAUFFEUR: 'Conducteur',
  SL: 'Superviseur Livraison',
  PRESTATAIRE: 'Prestataire',
  RS: 'Responsable Support',
  RPF: 'Responsable Plateforme',
  ASM: 'Agent Sécurité & Méthodes',
  CPL: 'Chef de Parc Logistique',
  DRL: 'Directeur Régional Logistique',
  RFL: 'Responsable de Flotte',
  MAINTENANCE: 'Équipe Maintenance',
};

// Villes disponibles au Maroc
export enum Ville {
  CASABLANCA = 'CASABLANCA',
  RABAT = 'RABAT',
  MARRAKECH = 'MARRAKECH',
  TANGER = 'TANGER',
  FES = 'FES',
  AGADIR = 'AGADIR',
  OUJDA = 'OUJDA',
  LAAYOUNE = 'LAAYOUNE'
}

// Utilisateur
export interface User {
  id: number;
  personCode: string;
  matricule?: string;
  username: string;
  password?: string;
  passwordDigest?: string;
  email: string;
  firstname: string;
  name: string;
  branchCode: string;
  role: Role;
  ville: Ville;
  typeVehicule?: Vehicule;
  lastConnectionDate?: string;
  creationDate?: string;
  lastUpdate?: string;
  phone?: string;
  cellularPhone?: string;
  profileCode?: string;
  status?: UserStatus;
  // HOLD attributes (soft delete)
  holdPerson?: boolean;
  holdReason?: string;
  holdRoleBranch?: boolean;
  holdRelatedRole?: boolean;
  // Face ID
  faceImage?: string;
  faceRegistered?: boolean;
  // Optional security & tracing
  passwordExpiryDate?: string;
  createdByRoleId?: number;
  roleCode?: string;
  roleDepartement?: string;
  roleBranch?: string;
}

// Création utilisateur
export interface CreateUser {
  personCode: string;
  username: string;
  password: string;
  email: string;
  firstname: string;
  name: string;
  branchCode: string;
  role: Role;
  ville?: Ville;
  phone?: string;
  cellularPhone?: string;
  profileCode?: string;
  typeVehiculeId?: number;
}

// Véhicule
export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  type: string;
  branchCode: string;
  kilometrage?: number;
  annee?: number;
  carburant?: string;
  statut?: string;
}

// Rapport véhicule
export interface RapportVehicule {
  vehiculeId: number;
  immatriculation: string;
  marque: string;
  modele: string;
  type: string;
  agence: string;
  kilometrage?: number;
  annee?: number;
  carburant?: string;
  statut?: string;
  declarations: DeclarationIncident[];
}

// Analyse véhicule
export interface AnalyseVehicule {
  site: string;
  branchCode: string;
  immatriculation: string;
  marque: string;
  modele: string;
  type: string;
  kilometrage?: number;
  nombreDeclarations: number;
  statut?: string;
  derniereIntervention: string;
  typesIncidents: { [key: string]: number };
  frequenceMoyenne?: number;
  tendance: string;
  indiceQualite: number;
  niveauQualite: string;
  recommandation: string;
  typeRecommandation: string;
}

// Types de panne
export enum TypePanne {
  MECANIQUE = 'MECANIQUE',
  ELECTRIQUE = 'ELECTRIQUE',
  CAISSE = 'CAISSE',
  CABINE = 'CABINE',
  SECURITE = 'SECURITE',
  AUTRES = 'AUTRES'
}

// Criticité
export enum Criticite {
  BLOQUANT = 'BLOQUANT',
  URGENT = 'URGENT',
  NON_BLOQUANT = 'NON_BLOQUANT',
  SECURITE = 'SECURITE'
}

// Statut déclaration
export enum StatutDeclaration {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_VALIDATION = 'EN_VALIDATION',
  CLOTURE = 'CLOTURE',
  RETOURNEE = 'RETOURNEE'
}

// État réparation
export enum EtatReparation {
  TRAITE = 'TRAITE',
  NON_TRAITE = 'NON_TRAITE',
  EN_ATTENTE = 'EN_ATTENTE',
  REPARE = 'REPARE'
}

// Qualification
export enum Qualification {
  CONTRAT = 'CONTRAT',
  DEVIS = 'DEVIS'
}

// Statut utilisateur
export enum UserStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF'
}

// Déclaration d'incident
export interface DeclarationIncident {
  id: number;
  numeroDeclaration?: string;
  chauffeur?: User;
  chauffeurNom?: string;
  chauffeurMatricule?: string;
  chauffeurId?: number;
  vehicule?: Vehicule;
  vehiculeId?: number;
  typePanne?: TypePanne;
  typePanneArabe?: string;
  typePanneFrancais?: string;
  description?: string;
  descriptionArabe?: string;
  descriptionFrancais?: string;
  photo?: string; // Base64
  video?: string; // Base64
  photoUrl?: string;
  videoUrl?: string;
  criticite?: string;
  statut?: string;
  dateDeclaration?: string;
  dateTransmission?: string;
  rapportIntervention?: RapportIntervention;
  motifRetour?: string;
  responsableSupport?: string;
  location?: string;
  lieuIncidentArabe?: string;
  lieuIncidentFrancais?: string;
  kilometrage?: number;
  vehiculeImmatriculation?: string;
  vehiculeMarque?: string;
  vehiculeModele?: string;
  vehiculeType?: string;
  dateDebutIntervention?: string;
  dateReparation?: string;
  dureeReparation?: number;
  etat?: string;
  // New fields for complete incident management
  numeroOrdreCamion?: string;
  mois?: string;
  tournee?: string;
  dateReclamation?: string;
  source?: string;
  elementVehicule?: string;
  detailElement?: string;
  categorie?: string;
  sla?: number;
  motifRefus?: string;
  coutProbleme?: number;
  budgetMensuel?: number;
  actionsRealisees?: string;
  piecesNecessaires?: string;
  qualification?: string;
  contratBonCommande?: string;
  lieu?: string;
}

export interface Intervention {
  id: number;
  numeroDemande: string;
  vehicule: string;
  site: string;
  typeIncident: string;
  statut: string;
  sla: number;
  actionsRealisees?: string;
  piecesNecessaires?: string;
  piecesUtilisees?: string;
  dateDebutIntervention?: string;
  dateReparation?: string;
  dureeReparation?: number;
  etatReparation?: EtatReparation;
  qualification?: Qualification;
  rapportPDF?: string;
  motifRefus?: string;
}

// Rapport d’intervention
export interface RapportIntervention {
  id: number;
  declaration: DeclarationIncident;
  actionsRealisees: string;
  piecesNecessaires: string;
  qualification: string; // "Contrat" ou "Bon de commande"
  documentPdf?: string; // Base64
  dateIntervention: string;
  nomIntervenant: string;
  contratBonCommande?: string;
  dureeReparation?: string;
  cout?: string;
}

// Formulaire de déclaration
export interface DeclarationFormData {
  vehiculeId: number;
  matricule?: string;
  vehiculeMatricule?: string;
  kilometrage?: number;
  typePanne: TypePanne;
  description: string;
  criticite: Criticite;
  photo?: File;
  video?: File;
  lieu: string;
}

// Statistiques
export interface StatsResponse {
  totalEnCours: number;
  totalCloturees: number;
  totalEnAttente: number;
  totalRetournees: number;
  mesEnCours?: number;
  mesCloturees?: number;
  mesEnAttente?: number;
  mesRetournees?: number;
}
