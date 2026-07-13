import React, { useState } from 'react';
import axios from 'axios';
import { AnalyseVehicule } from '../types/incident';

const ChatAnalyseVehicule: React.FC = () => {
  const [immatriculation, setImmatriculation] = useState('');
  const [analyse, setAnalyse] = useState<AnalyseVehicule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!immatriculation.trim()) return;

    setLoading(true);
    setError('');
    setAnalyse(null);

    try {
      const res = await axios.get<AnalyseVehicule>(`http://localhost:8080/api/vehicules/analyse/${immatriculation.trim()}`);
      setAnalyse(res.data);
    } catch (err) {
      setError('Véhicule non trouvé. Veuillez vérifier l\'immatriculation.');
    } finally {
      setLoading(false);
    }
  };

  const getQualiteColor = (niveau: string) => {
    switch (niveau) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800 border-green-300';
      case 'BON': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MOYEN': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FAIBLE': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'CRITIQUE': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTendanceIcon = (tendance: string) => {
    switch (tendance) {
      case 'AMELIORE': return '📈';
      case 'DEGRADE': return '📉';
      default: return '➡️';
    }
  };

  const getRecommandationIcon = (type: string) => {
    switch (type) {
      case 'MAINTENANCE_PREVENTIVE': return '🔧';
      case 'REVISION': return '⚙️';
      case 'REPLACEMENT': return '🔄';
      default: return '✅';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🤖</span> Chat Analyse Véhicule
      </h2>

      {/* Input */}
      <form onSubmit={handleAnalyse} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={immatriculation}
            onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
            placeholder="Entrez l'immatriculation (ex: AA-123-BC)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {analyse && (
        <div className="space-y-6">
          {/* Carte nationale */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
            <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <span>🗺️</span> Carte Nationale
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Site</p>
                <p className="font-bold text-gray-900">{analyse.site}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branche</p>
                <p className="font-bold text-gray-900">{analyse.branchCode}</p>
              </div>
            </div>
          </div>

          {/* Fiche synthèse */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>📋</span> Fiche Synthèse
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Immatriculation</p>
                <p className="font-bold text-gray-900">{analyse.immatriculation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marque / Modèle</p>
                <p className="font-bold text-gray-900">{analyse.marque} {analyse.modele}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-bold text-gray-900">{analyse.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kilométrage</p>
                <p className="font-bold text-gray-900">{analyse.kilometrage ? analyse.kilometrage + ' km' : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Déclarations</p>
                <p className="font-bold text-gray-900">{analyse.nombreDeclarations}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-bold text-gray-900">{analyse.statut || '-'}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-sm text-gray-600">Dernière intervention</p>
                <p className="font-bold text-gray-900">{analyse.derniereIntervention || 'Aucune'}</p>
              </div>
            </div>
          </div>

          {/* Analyse des déclarations */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
              <span>📊</span> Analyse des Déclarations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Fréquence moyenne</p>
                <p className="font-bold text-gray-900">{analyse.frequenceMoyenne ? analyse.frequenceMoyenne + ' jours' : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tendance</p>
                <p className="font-bold text-gray-900 flex items-center gap-2">
                  {getTendanceIcon(analyse.tendance)} {analyse.tendance}
                </p>
              </div>
            </div>

            {Object.keys(analyse.typesIncidents).length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Types d'incidents</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analyse.typesIncidents).map(([type, count]) => (
                    <span key={type} className="bg-white px-3 py-1 rounded-full text-sm border border-amber-300">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Indice qualité */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
            <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <span>⭐</span> Indice Qualité
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-emerald-700">{analyse.indiceQualite}/100</div>
              <div>
                <span className={`px-4 py-2 rounded-full text-lg font-bold border ${getQualiteColor(analyse.niveauQualite)}`}>
                  {analyse.niveauQualite}
                </span>
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  analyse.indiceQualite >= 80 ? 'bg-green-500' :
                  analyse.indiceQualite >= 60 ? 'bg-blue-500' :
                  analyse.indiceQualite >= 40 ? 'bg-yellow-500' :
                  analyse.indiceQualite >= 20 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: analyse.indiceQualite + '%' }}
              ></div>
            </div>
          </div>

          {/* Recommandation */}
          <div className={`rounded-xl p-5 border ${
            analyse.typeRecommandation === 'REPLACEMENT' ? 'bg-red-50 border-red-300' :
            analyse.typeRecommandation === 'REVISION' ? 'bg-orange-50 border-orange-300' :
            analyse.typeRecommandation === 'MAINTENANCE_PREVENTIVE' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>{getRecommandationIcon(analyse.typeRecommandation)}</span> Recommandation
            </h3>
            <p className="text-gray-900 font-medium">{analyse.recommandation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAnalyseVehicule;
