import React, { useState, useEffect } from "react";
import axios from "axios";
import { DeclarationIncident } from "../types/incident";
import { FormInput, FormSelect, FormTextarea, FormSection, FormStepper } from "../lib/premium/forms";
import { TruckLifecycle } from "../lib/premium/immersive/TruckLifecycle";
import { StatusTimeline } from "../lib/premium/immersive/StatusTimeline";

const ResponsableSupportStepper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [declarations, setDeclarations] = useState<DeclarationIncident[]>([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationIncident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Exploration - View all declarations
  const [explorationFilter, setExplorationFilter] = useState({
    statut: '',
    criticite: ''
  });

  // Step 2: Analyse - Analyze anomalies
  const [analyseData, setAnalyseData] = useState({
    anomalieDetectee: '',
    typeAnomalie: '',
    impact: '',
    recommandation: ''
  });

  // Step 3: Reporting - Generate report
  const [reportData, setReportData] = useState({
    titre: '',
    resume: '',
    actionsRecommandees: '',
    priorite: 'MOYENNE'
  });

  const [lifecycleStatus, setLifecycleStatus] = useState<string>('');

  useEffect(() => {
    fetchDeclarations();
  }, [explorationFilter]);

  const fetchDeclarations = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:8080/api/declarations");
      let filtered = data as DeclarationIncident[];
      
      if (explorationFilter.statut) {
        filtered = filtered.filter((d: DeclarationIncident) => d.statut === explorationFilter.statut);
      }
      if (explorationFilter.criticite) {
        filtered = filtered.filter((d: DeclarationIncident) => d.criticite === explorationFilter.criticite);
      }
      
      setDeclarations(filtered);
      setError("");
    } catch (err) {
      setError("Erreur de chargement des déclarations");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedDeclaration) {
      setError("Veuillez sélectionner une déclaration");
      return;
    }
    if (currentStep === 2 && !analyseData.anomalieDetectee) {
      setError("Veuillez remplir l'anomalie détectée");
      return;
    }
    setError("");
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => setCurrentStep(currentStep - 1);

  const handleSelectDeclaration = (decl: DeclarationIncident) => {
    setSelectedDeclaration(decl);
    setError("");
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeclaration) return;

    try {
      // Simulate report submission
      setSuccess("Rapport généré et enregistré avec succès");
      setLifecycleStatus("VALIDE");
      setTimeout(() => {
        setSuccess("");
        setCurrentStep(1);
        setSelectedDeclaration(null);
        setAnalyseData({ anomalieDetectee: '', typeAnomalie: '', impact: '', recommandation: '' });
        setReportData({ titre: '', resume: '', actionsRecommandees: '', priorite: 'MOYENNE' });
      }, 2000);
    } catch (err) {
      setError("Erreur lors de la génération du rapport");
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const getCriticiteColor = (criticite: string) => {
    switch (criticite) {
      case 'BLOQUANT': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'NON_BLOQUANT': return 'bg-green-100 text-green-800';
      case 'MOYEN': return 'bg-yellow-100 text-yellow-800';
      case 'FAIBLE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Responsable Support - Analyse & Reporting</h1>

        <FormStepper
          steps={[{ label: "Exploration" }, { label: "Analyse" }, { label: "Reporting" }]}
          currentStep={currentStep - 1}
          accentColor="emerald"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {success && lifecycleStatus === "VALIDE" && (
          <div className="mt-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <p className="text-center text-emerald-700 font-bold mb-3">✓ Validation complète</p>
            <TruckLifecycle status="VALIDE" showLabel />
            <div className="mt-4">
              <StatusTimeline
                events={[
                  { status: "EN_ATTENTE", label: "Déclaration" },
                  { status: "PRISE_EN_CHARGE", label: "Prise en charge" },
                  { status: "EN_REPARATION", label: "Réparation" },
                  { status: "EN_VALIDATION", label: "Validation" },
                  { status: "VALIDE", label: "✓ Approuvé" },
                ]}
                currentStatus="VALIDE"
                compact
              />
            </div>
          </div>
        )}

        {/* Step 1: Exploration */}
        {currentStep === 1 && (
          <div data-step-id="responsable-exploration">
            <FormSection
              title="Exploration des données"
              description="Filtrez et sélectionnez une déclaration"
              icon={<span>🔍</span>}
              index={0}
              accentColor="emerald"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormSelect
                  label="Filtrer par statut"
                  value={explorationFilter.statut}
                  onChange={(value) => setExplorationFilter({ ...explorationFilter, statut: value })}
                  options={[
                    { value: '', label: 'Tous' },
                    { value: 'En attente', label: 'En attente' },
                    { value: 'En cours', label: 'En cours' },
                    { value: 'Transmis au prestataire', label: 'Transmis au prestataire' },
                    { value: 'Terminé', label: 'Terminé' }
                  ]}
                />
                <FormSelect
                  label="Filtrer par criticité"
                  value={explorationFilter.criticite}
                  onChange={(value) => setExplorationFilter({ ...explorationFilter, criticite: value })}
                  options={[
                    { value: '', label: 'Toutes' },
                    { value: 'BLOQUANT', label: 'Bloquant' },
                    { value: 'MOYEN', label: 'Moyen' },
                    { value: 'FAIBLE', label: 'Faible' }
                  ]}
                />
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : declarations.length === 0 ? (
                <div className="text-center py-8 text-gray-700 dark:text-gray-400">Aucune déclaration disponible</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {declarations.map((decl) => (
                    <div
                      key={decl.id}
                      onClick={() => handleSelectDeclaration(decl)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedDeclaration?.id === decl.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{decl.numeroDeclaration}</p>
                          <p className="text-sm text-gray-600">{decl.typePanneFrancais}</p>
                          <p className="text-sm text-gray-600">{decl.vehiculeImmatriculation}</p>
                          <p className="text-sm text-gray-600">{decl.chauffeurNom}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-700 dark:text-gray-400">{formatDate(decl.dateDeclaration)}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCriticiteColor(decl.criticite || '')}`}>
                            {decl.criticite}
                          </span>
                          <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">{decl.statut}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDeclaration && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
                  <p className="text-sm font-bold text-emerald-700 mb-3">Véhicule concerné</p>
                  <TruckLifecycle
                    status={selectedDeclaration.statut || 'EN_ATTENTE'}
                    vehicleInfo={{
                      immatriculation: selectedDeclaration.vehiculeImmatriculation,
                    }}
                    showLabel
                  />
                </div>
              )}

              <button
                onClick={nextStep}
                disabled={!selectedDeclaration}
                className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                Suivant
              </button>
            </FormSection>
          </div>
        )}

        {/* Step 2: Analyse */}
        {currentStep === 2 && selectedDeclaration && (
          <div data-step-id="responsable-analyse">
            <FormSection
              title="Analyse des anomalies"
              description="Identifiez et qualifiez l'anomalie"
              icon={<span>📋</span>}
              index={1}
              accentColor="emerald"
            >
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6">
                <p className="font-bold text-gray-800">{selectedDeclaration.numeroDeclaration}</p>
                <p className="text-sm text-gray-600">{selectedDeclaration.typePanneFrancais}</p>
                <p className="text-sm text-gray-600">{selectedDeclaration.descriptionFrancais}</p>
                <p className="text-sm text-gray-600">Statut: {selectedDeclaration.statut}</p>
              </div>

              <div className="mb-6">
                <TruckLifecycle
                  status="EN_VALIDATION"
                  vehicleInfo={{
                    immatriculation: selectedDeclaration?.vehiculeImmatriculation,
                  }}
                  showLabel
                />
                <div className="mt-4">
                  <StatusTimeline
                    events={[
                      { status: "EN_ATTENTE", label: "Déclaration" },
                      { status: "PRISE_EN_CHARGE", label: "Prise en charge" },
                      { status: "EN_REPARATION", label: "Réparation" },
                      { status: "EN_VALIDATION", label: "Contrôle qualité", detail: analyseData.anomalieDetectee ? `Anomalie: ${analyseData.anomalieDetectee}` : undefined },
                    ]}
                    currentStatus="EN_VALIDATION"
                    compact
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormTextarea
                  label="Anomalie détectée"
                  value={analyseData.anomalieDetectee}
                  onChange={(value) => setAnalyseData({ ...analyseData, anomalieDetectee: value })}
                  rows={3}
                  required
                />
                <FormSelect
                  label="Type d'anomalie"
                  value={analyseData.typeAnomalie}
                  onChange={(value) => setAnalyseData({ ...analyseData, typeAnomalie: value })}
                  options={[
                    { value: '', label: 'Sélectionner...' },
                    { value: 'REPETITIVE', label: 'Répétitive' },
                    { value: 'CRITIQUE', label: 'Critique' },
                    { value: 'QUALITE', label: 'Qualité' },
                    { value: 'PROCESSUS', label: 'Processus' }
                  ]}
                />
                <FormSelect
                  label="Impact"
                  value={analyseData.impact}
                  onChange={(value) => setAnalyseData({ ...analyseData, impact: value })}
                  options={[
                    { value: '', label: 'Sélectionner...' },
                    { value: 'FAIBLE', label: 'Faible' },
                    { value: 'MOYEN', label: 'Moyen' },
                    { value: 'ELEVE', label: 'Élevé' },
                    { value: 'CRITIQUE', label: 'Critique' }
                  ]}
                />
                <FormTextarea
                  label="Recommandation"
                  value={analyseData.recommandation}
                  onChange={(value) => setAnalyseData({ ...analyseData, recommandation: value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all duration-200 hover:scale-105"
                >
                  Précédent
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-105"
                >
                  Suivant
                </button>
              </div>
            </FormSection>
          </div>
        )}

        {/* Step 3: Reporting */}
        {currentStep === 3 && selectedDeclaration && (
          <div data-step-id="responsable-reporting">
            <FormSection
              title="Génération du rapport"
              description="Rédigez et soumettez le rapport final"
              icon={<span>📄</span>}
              index={2}
              accentColor="emerald"
            >
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {lifecycleStatus !== "VALIDE" && (
                  <div className="mb-6">
                    <TruckLifecycle
                      status="EN_VALIDATION"
                      vehicleInfo={{
                        immatriculation: selectedDeclaration?.vehiculeImmatriculation,
                      }}
                      showLabel
                    />
                  </div>
                )}
                {lifecycleStatus === "VALIDE" && (
                  <div className="mb-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-center">
                      <TruckLifecycle status="VALIDE" showLabel />
                    </div>
                  </div>
                )}
                <FormInput
                  label="Titre du rapport"
                  value={reportData.titre}
                  onChange={(value) => setReportData({ ...reportData, titre: value })}
                  required
                />
                <FormTextarea
                  label="Résumé"
                  value={reportData.resume}
                  onChange={(value) => setReportData({ ...reportData, resume: value })}
                  rows={4}
                  required
                />
                <FormTextarea
                  label="Actions recommandées"
                  value={reportData.actionsRecommandees}
                  onChange={(value) => setReportData({ ...reportData, actionsRecommandees: value })}
                  rows={3}
                  required
                />
                <FormSelect
                  label="Priorité"
                  value={reportData.priorite}
                  onChange={(value) => setReportData({ ...reportData, priorite: value })}
                  options={[
                    { value: 'FAIBLE', label: 'Faible' },
                    { value: 'MOYENNE', label: 'Moyenne' },
                    { value: 'HAUTE', label: 'Haute' },
                    { value: 'CRITIQUE', label: 'Critique' }
                  ]}
                />

                {/* Report Preview */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mt-4">
                  <h3 className="font-bold text-gray-800 mb-2">Aperçu du rapport</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Déclaration:</strong> {selectedDeclaration.numeroDeclaration}</p>
                    <p><strong>Anomalie:</strong> {analyseData.anomalieDetectee}</p>
                    <p><strong>Type:</strong> {analyseData.typeAnomalie}</p>
                    <p><strong>Impact:</strong> {analyseData.impact}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all duration-200 hover:scale-105"
                  >
                    Précédent
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-105"
                  >
                    Générer le rapport
                  </button>
                </div>
              </form>
            </FormSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsableSupportStepper;
