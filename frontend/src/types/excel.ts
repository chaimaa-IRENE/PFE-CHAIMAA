export interface DeclarationIncident {
  id: number;
  numeroDeclaration?: string;
  dateDeclaration?: string;
  typePanne?: string;
  typePanneFrancais?: string;
  criticite?: string;
  statut?: string;
  descriptionFrancais?: string;
  chauffeurNom?: string;
  vehiculeImmatriculation?: string;
  kilometrage?: number;
  location?: string;
  dateReparation?: string;
  dureeReparation?: string;
  etat?: string;
}

export interface ExcelDashboard {
  totalDeclarations: number;
  byTypePanne: Record<string, number>;
  byCriticite: Record<string, number>;
  byStatut: Record<string, number>;
  byImmatriculation: Record<string, number>;
}

export interface FilterOptions {
  typePanne: string;
  criticite: string;
  statut: string;
}
