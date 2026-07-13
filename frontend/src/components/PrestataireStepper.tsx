import React, { useState, useEffect } from "react";
import axios from "axios";
import { DeclarationIncident } from "../types/incident";
import { FormInput, FormSelect, FormTextarea, FormSection, FormStepper } from "../lib/premium/forms";
import { TruckLifecycle } from "../lib/premium/immersive/TruckLifecycle";
import { StatusTimeline } from "../lib/premium/immersive/StatusTimeline";

const PrestataireStepper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [declarations, setDeclarations] = useState<DeclarationIncident[]>([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationIncident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [repairStatus, setRepairStatus] = useState<string>('');

  // Step 1: Réception - Filter declarations
  const [receptionFilter, setReceptionFilter] = useState({
    statut: 'EN_ATTENTE'
  });

  // Step 2: Analyse - Analyze selected declaration
  const [analyseData, setAnalyseData] = useState({
    diagnostic: '',
    gravite: '',
    piecesNecessaires: '',
    estimationTemps: ''
  });

  // Step 3: Action - Corrective action
  const [actionData, setActionData] = useState({
    dateDebut: new Date().toISOString().slice(0, 16),
    actionsRealisees: '',
    qualification: 'REPARATION',
    nomIntervenant: '',
    duree: ''
  });

  useEffect(() => {
    fetchDeclarations();
  }, [receptionFilter]);

  const fetchDeclarations = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:8080/api/declarations");
      const filtered = (data as DeclarationIncident[]).filter(
        (d: DeclarationIncident) => d.statut === receptionFilter.statut
      );
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
    if (currentStep === 2 && !analyseData.diagnostic) {
      setError("Veuillez remplir le diagnostic");
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

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeclaration) return;

    try {
      const formData = new FormData();
      formData.append('dateDebutIntervention', actionData.dateDebut);
      formData.append('actionsRealisees', actionData.actionsRealisees);
      formData.append('qualification', actionData.qualification);
      formData.append('cout', '0');
      if (actionData.duree) formData.append('dureeReparation', actionData.duree);

      await axios.put(`http://localhost:8080/api/declarations/${selectedDeclaration.id}/update`, formData);
      setSuccess("Action corrective enregistrée avec succès");
      setRepairStatus("REPARE");
      setTimeout(() => {
        setSuccess("");
        setCurrentStep(1);
        setSelectedDeclaration(null);
        setAnalyseData({ diagnostic: '', gravite: '', piecesNecessaires: '', estimationTemps: '' });
        setActionData({ dateDebut: new Date().toISOString().slice(0, 16), actionsRealisees: '', qualification: 'REPARATION', nomIntervenant: '', duree: '' });
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Erreur lors de l'enregistrement de l'action";
      setError(msg);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Prestataire - Gestion Réparations</h1>

        <FormStepper
          steps={[{ label: "Réception" }, { label: "Analyse" }, { label: "Action" }]}
          currentStep={currentStep - 1}
          accentColor="amber"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
            {repairStatus === "REPARE" && (
              <div className="mt-3">
                <TruckLifecycle status="REPARE" showLabel />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Réception */}
        {currentStep === 1 && (
          <div data-step-id="prestataire-reception">
            <FormSection
              title="Réception des demandes"
              description="Sélectionnez une déclaration à traiter"
              icon={<span>📥</span>}
              index={0}
              accentColor="amber"
            >
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : declarations.length === 0 ? (
                <div className="text-center py-8 text-gray-700 dark:text-gray-400">Aucune déclaration à traiter</div>
              ) : (
                <div className="space-y-3">
                  {declarations.map((decl) => (
                    <div
                      key={decl.id}
                      onClick={() => handleSelectDeclaration(decl)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedDeclaration?.id === decl.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{decl.numeroDeclaration}</p>
                          <p className="text-sm text-gray-600">{decl.typePanneFrancais}</p>
                          <p className="text-sm text-gray-600">{decl.vehiculeImmatriculation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-700 dark:text-gray-400">{formatDate(decl.dateDeclaration)}</p>
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            {decl.statut}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedDeclaration && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                  <p className="text-sm font-bold text-amber-700 mb-3">Véhicule concerné</p>
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
                className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                Suivant
              </button>
            </FormSection>
          </div>
        )}

        {/* Step 2: Analyse */}
        {currentStep === 2 && selectedDeclaration && (
          <div data-step-id="prestataire-analyse">
            <FormSection
              title="Analyse de la panne"
              description="Diagnostiquez la déclaration sélectionnée"
              icon={<span>🔍</span>}
              index={1}
              accentColor="amber"
            >
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                <p className="font-bold text-gray-800">{selectedDeclaration.numeroDeclaration}</p>
                <p className="text-sm text-gray-600">{selectedDeclaration.typePanneFrancais}</p>
                <p className="text-sm text-gray-600">{selectedDeclaration.descriptionFrancais}</p>
              </div>

              <div className="mb-6">
                <TruckLifecycle
                  status="PRISE_EN_CHARGE"
                  vehicleInfo={{
                    immatriculation: selectedDeclaration.vehiculeImmatriculation,
                  }}
                  showLabel
                />
                <div className="mt-4">
                  <StatusTimeline
                    events={[
                      { status: "EN_ATTENTE", label: "Déclaration", date: selectedDeclaration.dateDeclaration ? new Date(selectedDeclaration.dateDeclaration).toLocaleDateString('fr-FR') : undefined },
                      { status: "PRISE_EN_CHARGE", label: "Prise en charge", detail: "Diagnostic en cours" },
                    ]}
                    currentStatus="PRISE_EN_CHARGE"
                    compact
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormTextarea
                  label="Diagnostic"
                  value={analyseData.diagnostic}
                  onChange={(value) => setAnalyseData({ ...analyseData, diagnostic: value })}
                  rows={3}
                  required
                />
                <FormSelect
                  label="Gravité"
                  value={analyseData.gravite}
                  onChange={(value) => setAnalyseData({ ...analyseData, gravite: value })}
                  options={[
                    { value: '', label: 'Sélectionner...' },
                    { value: 'FAIBLE', label: 'Faible' },
                    { value: 'MOYEN', label: 'Moyen' },
                    { value: 'CRITIQUE', label: 'Critique' }
                  ]}
                />
                <FormInput
                  label="Pièces nécessaires"
                  value={analyseData.piecesNecessaires}
                  onChange={(value) => setAnalyseData({ ...analyseData, piecesNecessaires: value })}
                />
                <FormInput
                  label="Estimation temps"
                  value={analyseData.estimationTemps}
                  onChange={(value) => setAnalyseData({ ...analyseData, estimationTemps: value })}
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
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105"
                >
                  Suivant
                </button>
              </div>
            </FormSection>
          </div>
        )}

        {/* Step 3: Action */}
        {currentStep === 3 && selectedDeclaration && (
          <div data-step-id="prestataire-action">
            <FormSection
              title="Action corrective"
              description="Enregistrez l'intervention réalisée"
              icon={<span>⚙️</span>}
              index={2}
              accentColor="amber"
            >
              <div className="mb-6">
                <TruckLifecycle
                  status={repairStatus || "EN_REPARATION"}
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
                      { status: "EN_REPARATION", label: "Réparation en cours", detail: "Actions correctives enregistrées" },
                    ]}
                    currentStatus="EN_REPARATION"
                    compact
                  />
                </div>
              </div>
              <form onSubmit={handleSubmitAction} className="space-y-4">
                <FormInput
                  label="Date de début"
                  type="datetime-local"
                  value={actionData.dateDebut}
                  onChange={(value) => setActionData({ ...actionData, dateDebut: value })}
                />
                <FormTextarea
                  label="Actions réalisées"
                  value={actionData.actionsRealisees}
                  onChange={(value) => setActionData({ ...actionData, actionsRealisees: value })}
                  rows={3}
                  required
                />
                <FormSelect
                  label="Qualification"
                  value={actionData.qualification}
                  onChange={(value) => setActionData({ ...actionData, qualification: value })}
                  options={[
                    { value: 'REPARATION', label: 'Réparation' },
                    { value: 'REMPLACEMENT', label: 'Remplacement' },
                    { value: 'MAINTENANCE', label: 'Maintenance' }
                  ]}
                />
                <FormInput
                  label="Nom de l'intervenant"
                  value={actionData.nomIntervenant}
                  onChange={(value) => setActionData({ ...actionData, nomIntervenant: value })}
                  required
                />
                <FormInput
                  label="Durée"
                  value={actionData.duree}
                  onChange={(value) => setActionData({ ...actionData, duree: value })}
                />
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
                    Enregistrer l'action
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

export default PrestataireStepper;
