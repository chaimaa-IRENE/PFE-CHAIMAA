import {
  DashboardData, Kpis, Charts, VehicleRow, DriverRow,
  DeclarationRow, DocumentRow, AlertRow, AnomalyRow, MonthlyPoint,
  EnrichedFilters,
} from "../types";
import { RawApiData } from "../services/dashboard.service";

function safeNum(v: any, d: number = 0): number {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(v);
  return isNaN(n) ? d : n;
}

function safeStr(v: any, d: string = ""): string {
  if (v === null || v === undefined) return d;
  return String(v);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function reverseName(n: string): string {
  const parts = n.trim().split(/\s+/).filter(Boolean);
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : n;
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase() || a.toLowerCase() === reverseName(b).toLowerCase();
}

function parseIntId(v: any, d: number = 0): number {
  if (v === null || v === undefined) return d;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return isNaN(n) ? d : n;
}

// --- VEHICLES ---
function buildVehicles(raw: RawApiData): VehicleRow[] {
  const list = raw.vehicles?.vehicles || [];
  return list.map((v: any) => ({
    id: parseIntId(v.id),
    immatriculation: safeStr(v.immatriculation),
    numeroOrdre: safeStr(v.truckNumber || v.vehicleId || ""),
    marque: safeStr(v.marque),
    modele: safeStr(v.modele),
    type: safeStr(v.type),
    annee: safeNum(v.annee),
    kilometrage: safeNum(v.kilometrage),
    statut: safeStr(v.statut, "INCONNU"),
    agence: safeStr(v.agence),
    chauffeurNom: safeStr(v.chauffeurNom),
    carburant: safeStr(v.carburant),
    conforme: v.conforme === true,
    anomalies: 0,
    checkups: 0,
    tickets: 0,
    documents: 0,
    documentsValides: 0,
    scoreIVMS: 0,
  }));
}

// --- DECLARATIONS ---
function buildDeclarations(raw: RawApiData): DeclarationRow[] {
  const list: any[] = raw.declarations || [];
  return list.map((d: any) => ({
    id: parseIntId(d.id),
    numeroDemande: safeStr(d.numeroDeclaration || d.numeroDemande || ""),
    vehicule: safeStr(d.vehiculeImmatriculation || ""),
    chauffeur: safeStr(d.chauffeurNom || ""),
    typePanne: safeStr(d.typePanne),
    criticite: safeStr(d.criticite),
    statut: safeStr(d.statut),
    qualification: safeStr(d.qualification),
    element: safeStr(d.elementVehicule || d.element || ""),
    categorie: safeStr(d.categorie),
    date: safeStr(d.dateDeclaration ? String(d.dateDeclaration) : null, ""),
    cout: safeNum(d.coutProbleme),
    sla: safeNum(d.sla),
    description: safeStr(d.descriptionFrancais || ""),
  }));
}

// --- DRIVERS ---
function buildDrivers(raw: RawApiData, vehicles: VehicleRow[], declarations: DeclarationRow[], interventions: any[]): DriverRow[] {
  const users: any[] = raw.users || [];
  const chauffeurs = users.filter((u: any) =>
    u.role === "CHAUFFEUR" || u.roleCode === "CHAUFFEUR" || (u.personCode || "").startsWith("CHF")
  );
  if (chauffeurs.length === 0) return [];

  return chauffeurs.map((u: any) => {
    const userId = parseIntId(u.id);
    const nom = `${safeStr(u.name)} ${safeStr(u.firstname)}`.trim() || safeStr(u.username);
    const personCode = safeStr(u.personCode);
    const vList = vehicles.filter((v) => v.chauffeurNom === nom);
    const dList = declarations.filter((d) => {
      const dId = parseIntId((d as any).chauffeurId, -1);
      return (dId !== -1 && dId === userId) || namesMatch(d.chauffeur, nom);
    });
    const decsOuvertes = dList.filter((d) => d.statut !== "CLOTURE" && d.statut !== "RESOLU" && d.statut !== "ANNULE");
    const decsResolues = dList.filter((d) => d.statut === "CLOTURE" || d.statut === "RESOLU");
    const iList = interventions.filter((i: any) => namesMatch(i.chauffeurNom || i.chauffeur, nom));

    const totalDecs = dList.length;
    const resolved = decsResolues.length;
    const checkups = 0;
    const checkupsOK = 0;

    const tauxConf = checkups > 0 ? Math.round((checkupsOK / checkups) * 100) : 0;
    const tauxResoResolved = totalDecs > 0 ? Math.round((resolved / totalDecs) * 100) : 0;
    const conso = totalDecs > 0 ? Math.round(dList.reduce((s, d) => s + d.cout, 0) / totalDecs) : 0;

    let score = 0;
    if (totalDecs > 0 || checkups > 0) {
      const compConf = tauxConf * 0.30;
      const compAno = totalDecs > 0 ? Math.max(0, 100 - (decsOuvertes.length / totalDecs) * 100) * 0.25 : 0;
      const compInc = totalDecs > 0 ? (resolved / totalDecs) * 100 * 0.20 : 0;
      const compPont = 0;
      const compConso = conso > 0 ? Math.max(0, 100 - (conso / 1000) * 10) * 0.10 : 0;
      score = Math.round(compConf + compAno + compInc + compPont + compConso);
    }

    return {
      nom,
      matricule: personCode,
      email: safeStr(u.email),
      phone: safeStr(u.phone || u.cellularPhone),
      ville: safeStr(u.ville || u.branchCode),
      branchCode: safeStr(u.branchCode),
      anomalies: totalDecs,
      checkups,
      checkupsOK,
      tauxConformite: tauxConf,
      tauxResolution: tauxResoResolved,
      departs: 0,
      presences: 0,
      score,
      vehicules: vList.map((vv) => vv.immatriculation),
      interventions: iList.length,
      coutTotal: dList.reduce((s, d) => s + d.cout, 0),
    };
  });
}

// --- KPIs ---
function buildKPIs(
  vehicles: VehicleRow[], declarations: DeclarationRow[],
  drivers: DriverRow[], raw: RawApiData
): Kpis {
  const total = vehicles.length;
  const actifs = vehicles.filter((v) => v.statut === "ACTIF").length;
  const arrete = vehicles.filter((v) => v.statut === "BLOQUE" || v.statut === "IMMOBILISE").length;
  const enMaint = vehicles.filter((v) => v.statut === "MAINTENANCE").length;
  const totalKm = vehicles.reduce((s, v) => s + v.kilometrage, 0);

  const decsOuvertes = declarations.filter((d) => d.statut !== "CLOTURE" && d.statut !== "RESOLU" && d.statut !== "ANNULE");
  const decsCloturees = declarations.filter((d) => d.statut === "CLOTURE" || d.statut === "RESOLU");
  const decsCritiques = declarations.filter((d) => d.criticite === "CRITIQUE" || d.criticite === "BLOQUANT");

  const decCount = declarations.length;
  const resolues = decsCloturees.length;
  const txResoGlobal = decCount > 0 ? Math.round((resolues / decCount) * 100) : 0;
  const txUtil = total > 0 ? Math.round((actifs / total) * 100) : 0;
  const disponibles = total - arrete;
  const txDispo = total > 0 ? Math.round((disponibles / total) * 100) : 0;

  const interventions = raw.interventions?.interventions || [];
  const dureesTotal = interventions
    .filter((i: any) => i.duree > 0)
    .reduce((s: number, i: any) => s + safeNum(i.duree), 0);
  const dureesCount = interventions.filter((i: any) => i.duree > 0).length;
  const mttr = dureesCount > 0 ? Math.round(dureesTotal / dureesCount) : 0;
  const mtbf = decCount > 0 ? Math.round(totalKm / decCount) : 0;

  const slaCount = declarations.filter((d) => d.sla !== 0).length;
  const slaOk = declarations.filter((d) => d.sla >= 0).length;
  const slaCompliance = slaCount > 0 ? Math.round((slaOk / slaCount) * 100) : 0;

  const coutTotalDec = declarations.reduce((s, d) => s + d.cout, 0);
  const coutTotalInt = interventions.reduce((s: number, i: any) => s + safeNum(i.cout), 0);
  const coutTotalMaintenance = raw.budgetAnalysis?.reduce((s: number, b: any) => s + safeNum(b.cout), 0) || 0;
  const prestaSet = new Set(interventions.map((i: any) => i.prestataire).filter(Boolean));

  return {
    totalVehicules: total,
    enService: actifs,
    aArret: arrete,
    enMaintenance: enMaint,
    bloques: arrete,
    tauxUtilisation: txUtil,
    anomaliesOuvertes: decsOuvertes.length,
    ticketsOuverts: 0,
    totalKm,
    consoMoyenne: 0,
    vitesseMoyenne: 0,
    totalChauffeurs: drivers.length,
    txCheckupConformite: 0,
    totalCheckups30j: 0,
    mttr,
    mtbf,
    slaCompliance,
    totalDeclarations: decCount,
    totalMaintenances: 0,
    totalPrestataires: prestaSet.size,
    totalInterventions: interventions.length,
    budgetConsomme: safeNum(raw.activeBudget?.budgetUtilise),
    budgetRestant: safeNum(raw.activeBudget?.budgetRestant),
    budgetTotal: safeNum(raw.activeBudget?.budgetTotal),
    documentsExpires: raw.documentStats?.expires || 0,
    documentsBientotExpire: raw.documentStats?.bientotExpires || 0,
    coutTotalMaintenance,
    tauxDisponibilite: txDispo,
    tempsMoyenReparation: mttr,
    tempsMoyenValidation: mttr,
    declarationsAujourdhui: declarations.filter((d) => d.date && (d.date.startsWith(todayStr()) || d.date.slice(0, 10) === todayStr())).length,
    declarationsCetteSemaine: 0,
    declarationsCeMois: 0,
    interventionsAujourdhui: interventions.filter((i: any) => i.dateDebut?.startsWith(todayStr())).length,
    interventionsTerminees: interventions.filter((i: any) => i.statut === "CLOTURE" || i.statut === "RESOLU" || i.statut === "TERMINEE").length,
    interventionsEnCours: interventions.filter((i: any) => i.statut === "EN_COURS" || i.statut === "OUVERTE" || i.statut === "OUVERT").length,
    interventionsEnRetard: interventions.filter((i: any) =>
      i.statut !== "CLOTURE" && i.statut !== "RESOLU" && i.statut !== "TERMINEE" && safeNum(i.duree) > 48
    ).length,
    vehiculesDisponibles: disponibles,
    tauxResolution: txResoGlobal,
    totalAnomalies: decCount,
    checkupsNonConformes: 0,
  };
}

// --- CHARTS ---
function buildCharts(
  vehicles: VehicleRow[], declarations: DeclarationRow[],
  drivers: DriverRow[], raw: RawApiData
): Charts {
  const marqueMap: Record<string, number> = {};
  const agenceMap: Record<string, number> = {};
  const statutDecMap: Record<string, number> = {};
  const critDecMap: Record<string, number> = {};
  const typeDecMap: Record<string, number> = {};
  const qualDecMap: Record<string, number> = {};
  const catDecMap: Record<string, number> = {};
  const elemDecMap: Record<string, number> = {};
  const srcDecMap: Record<string, number> = {};

  vehicles.forEach((v) => {
    if (v.marque) marqueMap[v.marque] = (marqueMap[v.marque] || 0) + 1;
    if (v.agence) agenceMap[v.agence] = (agenceMap[v.agence] || 0) + 1;
  });

  declarations.forEach((d) => {
    if (d.statut) statutDecMap[d.statut] = (statutDecMap[d.statut] || 0) + 1;
    if (d.criticite) critDecMap[d.criticite] = (critDecMap[d.criticite] || 0) + 1;
    if (d.typePanne) typeDecMap[d.typePanne] = (typeDecMap[d.typePanne] || 0) + 1;
    if (d.qualification) qualDecMap[d.qualification] = (qualDecMap[d.qualification] || 0) + 1;
    if (d.categorie) catDecMap[d.categorie] = (catDecMap[d.categorie] || 0) + 1;
    if (d.element) elemDecMap[d.element] = (elemDecMap[d.element] || 0) + 1;
    if (d.statut === "CLOTURE" || d.statut === "RESOLU") {
      if (d.qualification === "CURATIVE") {
        srcDecMap["MAINTENANCE_CURATIVE"] = (srcDecMap["MAINTENANCE_CURATIVE"] || 0) + 1;
      } else if (d.qualification === "PREVENTIVE") {
        srcDecMap["MAINTENANCE_PREVENTIVE"] = (srcDecMap["MAINTENANCE_PREVENTIVE"] || 0) + 1;
      }
    } else if (d.statut === "EN_COURS" || d.statut === "OUVERTE") {
      srcDecMap["EN_COURS"] = (srcDecMap["EN_COURS"] || 0) + 1;
    }
  });

  const interventions = raw.interventions?.interventions || [];
  const parPresta: Record<string, number> = {};
  interventions.forEach((i: any) => {
    if (i.prestataire) parPresta[i.prestataire] = (parPresta[i.prestataire] || 0) + 1;
  });

  const coutParMois: Record<string, number> = {};
  const budgetParMois: Record<string, number> = {};
  (raw.budgetAnalysis || []).forEach((b: any) => {
    coutParMois[b.mois] = safeNum(b.cout);
    budgetParMois[b.mois] = safeNum(b.budget);
  });

  const parVille: Record<string, number> = {};
  drivers.forEach((d) => {
    const v = d.ville || "Inconnue";
    parVille[v] = (parVille[v] || 0) + 1;
  });

  return {
    anomaliesParSource: srcDecMap,
    vehiculesParStatut: {
      enService: vehicles.filter((v) => v.statut === "ACTIF").length,
      aArret: vehicles.filter((v) => v.statut === "BLOQUE" || v.statut === "IMMOBILISE").length,
      enMaintenance: vehicles.filter((v) => v.statut === "MAINTENANCE").length,
      bloques: vehicles.filter((v) => v.statut === "BLOQUE" || v.statut === "IMMOBILISE").length,
    },
    declarationsParStatut: statutDecMap,
    declarationsParCriticite: critDecMap,
    declarationsParTypePanne: typeDecMap,
    declarationsParQualification: qualDecMap,
    vehiculesParMarque: marqueMap,
    anomaliesParElement: elemDecMap,
    vehiculesParAgence: agenceMap,
    declarationsParCategorie: catDecMap,
    evolutionMensuelle: buildEvolutionMensuelle(declarations),
    declarationsParChauffeur: {},
    interventionsParPrestataire: parPresta,
    coutParMois,
    budgetParMois,
    chauffeursParVille: parVille,
    pannesParElement: elemDecMap,
  };
}

function buildEvolutionMensuelle(declarations: DeclarationRow[]): MonthlyPoint[] {
  const groups: Record<string, { anomalies: number; resolues: number; critiques: number; checkups: number; checkupsOK: number; tickets: number }> = {};
  declarations.forEach((d) => {
    if (!d.date) return;
    const mois = d.date.slice(0, 7);
    if (!groups[mois]) groups[mois] = { anomalies: 0, resolues: 0, critiques: 0, checkups: 0, checkupsOK: 0, tickets: 0 };
    groups[mois].anomalies += 1;
    if (d.statut === "CLOTURE" || d.statut === "RESOLU") groups[mois].resolues += 1;
    if (d.criticite === "CRITIQUE" || d.criticite === "BLOQUANT") groups[mois].critiques += 1;
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, vals]) => ({ mois, ...vals }));
}

// --- FILTERING ---
export function filterDashboardData(data: DashboardData, filters: EnrichedFilters): DashboardData {
  const f = filters;
  const hasAnyFilter = f.site || f.vehicle || f.driver || f.status || f.criticite || f.typePanne || f.prestataire || f.ville || f.annee || f.mois || f.period;
  if (!hasAnyFilter) return data;

  // 1. Filter vehicles
  let filteredVehicles = data.vehicles;
  if (f.site) filteredVehicles = filteredVehicles.filter(v => v.agence === f.site);
  if (f.vehicle) filteredVehicles = filteredVehicles.filter(v => v.immatriculation === f.vehicle);
  if (f.status) filteredVehicles = filteredVehicles.filter(v => v.statut === f.status);
  if (f.driver) filteredVehicles = filteredVehicles.filter(v => namesMatch(v.chauffeurNom, f.driver));

  const vImmatSet = new Set(filteredVehicles.map(v => v.immatriculation));

  // 2. Filter declarations
  let filteredDeclarations = data.declarations;
  if (f.site) filteredDeclarations = filteredDeclarations.filter(d => vImmatSet.has(d.vehicule));
  if (f.vehicle) filteredDeclarations = filteredDeclarations.filter(d => d.vehicule === f.vehicle);
  if (f.driver) filteredDeclarations = filteredDeclarations.filter(d => namesMatch(d.chauffeur, f.driver));
  if (f.criticite) filteredDeclarations = filteredDeclarations.filter(d => d.criticite === f.criticite);
  if (f.typePanne) filteredDeclarations = filteredDeclarations.filter(d => d.typePanne === f.typePanne);
  if (f.annee) filteredDeclarations = filteredDeclarations.filter(d => d.date.startsWith(f.annee));
  if (f.mois) filteredDeclarations = filteredDeclarations.filter(d => d.date ? d.date.slice(5, 7) === f.mois : false);
  if (f.period && f.period !== "1a") {
    const days = f.period === "7j" ? 7 : f.period === "30j" ? 30 : f.period === "90j" ? 90 : 0;
    if (days > 0) {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      filteredDeclarations = filteredDeclarations.filter(d => {
        if (!d.date) return false;
        const dd = new Date(d.date);
        return !isNaN(dd.getTime()) && dd >= cutoff;
      });
    }
  }

  // 3. Filter interventions
  let filteredInterventions = data.interventions || [];
  if (f.site) filteredInterventions = filteredInterventions.filter((i: any) => vImmatSet.has(i.vehiculeImmatriculation));
  if (f.vehicle) filteredInterventions = filteredInterventions.filter((i: any) => i.vehiculeImmatriculation === f.vehicle);
  if (f.prestataire) filteredInterventions = filteredInterventions.filter((i: any) => i.prestataire === f.prestataire);

  // 4. Recompute drivers from filtered data
  const vChauffeurs = [...new Set(filteredVehicles.map(v => v.chauffeurNom).filter(Boolean))];
  const dChauffeurs = [...new Set(filteredDeclarations.map(d => d.chauffeur).filter(Boolean))];
  const allDriverNames = [...new Set([...vChauffeurs, ...dChauffeurs])];
  let filteredDrivers = data.drivers.filter(d => allDriverNames.some(n => namesMatch(d.nom, n)));
  if (f.ville) filteredDrivers = filteredDrivers.filter(d => d.ville === f.ville);
  if (f.driver) filteredDrivers = filteredDrivers.filter(d => namesMatch(d.nom, f.driver));

  // 5. Recompute KPIs from filtered data
  const total = filteredVehicles.length;
  const actifs = filteredVehicles.filter(v => v.statut === "ACTIF").length;
  const arrete = filteredVehicles.filter(v => v.statut === "BLOQUE" || v.statut === "IMMOBILISE").length;
  const enMaint = filteredVehicles.filter(v => v.statut === "MAINTENANCE").length;
  const totalKm = filteredVehicles.reduce((s, v) => s + v.kilometrage, 0);
  const decCount = filteredDeclarations.length;
  const decsOuvertes = filteredDeclarations.filter(d => d.statut !== "CLOTURE" && d.statut !== "RESOLU" && d.statut !== "ANNULE");
  const decsCloturees = filteredDeclarations.filter(d => d.statut === "CLOTURE" || d.statut === "RESOLU");
  const decsCritiques = filteredDeclarations.filter(d => d.criticite === "CRITIQUE" || d.criticite === "BLOQUANT");
  const resolues = decsCloturees.length;
  const txReso = decCount > 0 ? Math.round((resolues / decCount) * 100) : 0;
  const txUtil = total > 0 ? Math.round((actifs / total) * 100) : 0;
  const txDispo = total > 0 ? Math.round(((total - arrete) / total) * 100) : 0;
  const dureesTotal = filteredInterventions.filter((i: any) => i.duree > 0).reduce((s: number, i: any) => s + safeNum(i.duree), 0);
  const dureesCount = filteredInterventions.filter((i: any) => i.duree > 0).length;
  const mttr = dureesCount > 0 ? Math.round(dureesTotal / dureesCount) : 0;
  const mtbf = decCount > 0 ? Math.round(totalKm / decCount) : 0;
  const slaPos = filteredDeclarations.filter(d => d.sla !== 0).length;
  const slaOk = filteredDeclarations.filter(d => d.sla >= 0).length;

  const filteredKpis: Kpis = {
    ...data.kpis,
    totalVehicules: total, enService: actifs, aArret: arrete, enMaintenance: enMaint,
    bloques: arrete, tauxUtilisation: txUtil, anomaliesOuvertes: decsOuvertes.length,
    totalKm, totalChauffeurs: filteredDrivers.length,
    mttr, mtbf, slaCompliance: slaPos > 0 ? Math.round((slaOk / slaPos) * 100) : 0,
    totalDeclarations: decCount, totalInterventions: filteredInterventions.length,
    coutTotalMaintenance: (data.budgetAnalysis || []).reduce((s, b) => s + b.cout, 0),
    tauxDisponibilite: txDispo, tempsMoyenReparation: mttr, tempsMoyenValidation: mttr,
    tauxResolution: txReso, totalAnomalies: decCount,
    declarationsCetteSemaine: 0, declarationsCeMois: 0, checkupsNonConformes: 0,
  };

  // 6. Recompute chart data
  const marqueMap: Record<string, number> = {};
  const agenceMap: Record<string, number> = {};
  filteredVehicles.forEach(v => {
    if (v.marque) marqueMap[v.marque] = (marqueMap[v.marque] || 0) + 1;
    if (v.agence) agenceMap[v.agence] = (agenceMap[v.agence] || 0) + 1;
  });
  const statutDecMap: Record<string, number> = {};
  const critDecMap: Record<string, number> = {};
  const typeDecMap: Record<string, number> = {};
  const qualDecMap: Record<string, number> = {};
  const catDecMap: Record<string, number> = {};
  const elemDecMap: Record<string, number> = {};
  const srcDecMap: Record<string, number> = {};
  filteredDeclarations.forEach(d => {
    if (d.statut) statutDecMap[d.statut] = (statutDecMap[d.statut] || 0) + 1;
    if (d.criticite) critDecMap[d.criticite] = (critDecMap[d.criticite] || 0) + 1;
    if (d.typePanne) typeDecMap[d.typePanne] = (typeDecMap[d.typePanne] || 0) + 1;
    if (d.qualification) qualDecMap[d.qualification] = (qualDecMap[d.qualification] || 0) + 1;
    if (d.categorie) catDecMap[d.categorie] = (catDecMap[d.categorie] || 0) + 1;
    if (d.element) elemDecMap[d.element] = (elemDecMap[d.element] || 0) + 1;
  });

  const evoGroups: Record<string, { anomalies: number; resolues: number; critiques: number; checkups: number; checkupsOK: number; tickets: number }> = {};
  filteredDeclarations.forEach(d => {
    if (!d.date) return;
    const m = d.date.slice(0, 7);
    if (!evoGroups[m]) evoGroups[m] = { anomalies: 0, resolues: 0, critiques: 0, checkups: 0, checkupsOK: 0, tickets: 0 };
    evoGroups[m].anomalies += 1;
    if (d.statut === "CLOTURE" || d.statut === "RESOLU") evoGroups[m].resolues += 1;
    if (d.criticite === "CRITIQUE" || d.criticite === "BLOQUANT") evoGroups[m].critiques += 1;
  });

  const coutParMois: Record<string, number> = {};
  (data.budgetAnalysis || []).forEach(b => {
    coutParMois[b.mois] = safeNum(b.cout);
  });

  const filteredCharts: Charts = {
    ...data.charts,
    anomaliesParSource: srcDecMap,
    vehiculesParStatut: {
      enService: actifs, aArret: arrete, enMaintenance: enMaint, bloques: arrete,
    },
    declarationsParStatut: statutDecMap,
    declarationsParCriticite: critDecMap,
    declarationsParTypePanne: typeDecMap,
    declarationsParQualification: qualDecMap,
    vehiculesParMarque: marqueMap,
    anomaliesParElement: elemDecMap,
    vehiculesParAgence: agenceMap,
    declarationsParCategorie: catDecMap,
    evolutionMensuelle: Object.entries(evoGroups).sort(([a], [b]) => a.localeCompare(b)).map(([mois, vals]) => ({ mois, ...vals })),
    pannesParElement: elemDecMap,
    coutParMois,
  };

  // 7. Build filtered filterOptions
  return {
    ...data,
    kpis: filteredKpis,
    charts: filteredCharts,
    vehicles: filteredVehicles,
    declarations: filteredDeclarations,
    drivers: filteredDrivers,
    interventions: filteredInterventions,
  };
}

// --- COMPUTE VEHICLE METRICS ---
function computeVehicleMetrics(vehicles: VehicleRow[], declarations: DeclarationRow[]): VehicleRow[] {
  const decByVeh: Record<string, DeclarationRow[]> = {};
  declarations.forEach(d => {
    const key = d.vehicule;
    if (!key) return;
    if (!decByVeh[key]) decByVeh[key] = [];
    decByVeh[key].push(d);
  });

  return vehicles.map(v => {
    const vDecs = decByVeh[v.immatriculation] || [];
    const totalDecs = vDecs.length;
    const ouvertes = vDecs.filter(d => d.statut !== "CLOTURE" && d.statut !== "RESOLU" && d.statut !== "ANNULE").length;
    const resolues = vDecs.filter(d => d.statut === "CLOTURE" || d.statut === "RESOLU").length;
    const coutTotal = vDecs.reduce((s, d) => s + d.cout, 0);
    const txReso = totalDecs > 0 ? resolues / totalDecs : 0;
    const kbKm = v.kilometrage > 0 ? Math.min(1, totalDecs * 1000 / v.kilometrage) : 0.5;

    // IVMS score: based on resolution rate, anomaly density, and cost efficiency
    let ivms = 100;
    ivms -= (1 - txReso) * 40;               // -40% if 0% resolved
    ivms -= Math.min(30, kbKm * 30);          // -30% if high anomaly density (>300 decs/1000km)
    const costPerDec = totalDecs > 0 ? coutTotal / totalDecs : 0;
    ivms -= Math.min(20, (costPerDec / 5000) * 20); // -20% if high avg cost (>5000 DH)
    ivms -= ouvertes * 5;                      // -5% per open declaration
    ivms = Math.max(0, Math.min(100, Math.round(ivms)));

    return {
      ...v,
      anomalies: totalDecs,
      scoreIVMS: ivms,
    };
  });
}

// --- MAIN EXPORT ---
export function buildDashboardData(raw: RawApiData): DashboardData {
  let vehicles = buildVehicles(raw);
  const declarations = buildDeclarations(raw);
  const interventions = raw.interventions?.interventions || [];
  vehicles = computeVehicleMetrics(vehicles, declarations);
  const drivers = buildDrivers(raw, vehicles, declarations, interventions);
  const kpis = buildKPIs(vehicles, declarations, drivers, raw);
  const charts = buildCharts(vehicles, declarations, drivers, raw);

  const dList = raw.vehicles?.vehicles || [];

  function uniq<T>(arr: T[]): T[] {
    const m: Record<string, T> = {};
    arr.forEach((x) => { m[String(x)] = x; });
    return Object.values(m).sort();
  }

  return {
    kpis,
    charts,
    vehicles,
    anomalies: [],
    declarations,
    drivers,
    documents: [],
    alerts: [],
    indicateurs: raw.indicateurs || undefined,
    budgetAnalysis: raw.budgetAnalysis || undefined,
    activeBudget: raw.activeBudget || undefined,
    interventions: raw.interventions?.interventions || [],
    documentStats: raw.documentStats || undefined,
    aiInsights: raw.aiInsights || undefined,
    filterOptions: {
      sites: uniq(dList.map((v: any) => String(v.agence)).filter(Boolean)),
      regions: [],
      vehicles: dList.map((v: any) => ({ immatriculation: v.immatriculation, marque: v.marque })).filter((o: any) => o.immatriculation),
      status: uniq(dList.map((v: any) => String(v.statut)).filter(Boolean)),
      drivers: drivers.map((d) => d.nom).filter(Boolean),
      villes: uniq(drivers.map((d) => d.ville).filter(Boolean)),
      prestataires: uniq(interventions.map((i: any) => i.prestataire).filter(Boolean)),
      typesPanne: uniq(declarations.map((d) => d.typePanne).filter(Boolean)),
      criticites: uniq(declarations.map((d) => d.criticite).filter(Boolean)),
      annees: uniq(declarations.map((d) => d.date.slice(0, 4)).filter(Boolean)),
      mois: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    },
  };
}
