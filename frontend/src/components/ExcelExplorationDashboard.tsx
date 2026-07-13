import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DeclarationIncident, ExcelDashboard, FilterOptions } from '../types/excel';

const ExcelExplorationDashboard: React.FC = () => {
  const [declarations, setDeclarations] = useState<DeclarationIncident[]>([]);
  const [dashboard, setDashboard] = useState<ExcelDashboard | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    typePanne: '',
    criticite: '',
    statut: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadDeclarations();
  }, []);

  useEffect(() => {
    loadDeclarations();
  }, [filters]);

  const loadDashboard = async () => {
    try {
      const res = await axios.get<ExcelDashboard>('http://localhost:8080/api/excel/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.typePanne) params.append('typePanne', filters.typePanne);
      if (filters.criticite) params.append('criticite', filters.criticite);
      if (filters.statut) params.append('statut', filters.statut);

      const url = params.toString() 
        ? `http://localhost:8080/api/excel/declarations/filter?${params.toString()}`
        : 'http://localhost:8080/api/excel/declarations';

      const res = await axios.get<DeclarationIncident[]>(url);
      setDeclarations(res.data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      typePanne: '',
      criticite: '',
      statut: ''
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.typePanne) params.append('typePanne', filters.typePanne);
      if (filters.criticite) params.append('criticite', filters.criticite);
      if (filters.statut) params.append('statut', filters.statut);

      const url = params.toString() 
        ? `http://localhost:8080/api/excel/export?${params.toString()}`
        : 'http://localhost:8080/api/excel/export';

      const res = await axios.get(url, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'declarations_export.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Exploration Déclarations</h1>

        {/* KPI Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-500 text-sm">Total Déclarations</p>
              <p className="text-3xl font-bold text-blue-600">{dashboard.totalDeclarations}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-500 text-sm">Types de Panne</p>
              <p className="text-3xl font-bold text-purple-600">{Object.keys(dashboard.byTypePanne).length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-500 text-sm">Véhicules</p>
              <p className="text-3xl font-bold text-orange-600">{Object.keys(dashboard.byImmatriculation).length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-500 text-sm">Critiques</p>
              <p className="text-3xl font-bold text-red-600">{dashboard.byCriticite['BLOQUANT'] || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Filtres</h2>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center gap-2"
            >
              {exporting ? 'Exportation...' : '📥 Exporter Excel'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de Panne</label>
              <select
                value={filters.typePanne}
                onChange={(e) => handleFilterChange('typePanne', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.keys(dashboard?.byTypePanne || {}).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criticité</label>
              <select
                value={filters.criticite}
                onChange={(e) => handleFilterChange('criticite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                {Object.keys(dashboard?.byCriticite || {}).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.keys(dashboard?.byStatut || {}).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Réinitialiser les filtres
          </button>
        </div>

        {/* Charts Section */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Declarations by Type Panne */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition par Type de Panne</h3>
              <div className="space-y-2">
                {Object.entries(dashboard.byTypePanne).map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <span className="w-32 text-sm text-gray-600">{type}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${(Number(count) / dashboard.totalDeclarations) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{Number(count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Declarations by Statut */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition par Statut</h3>
              <div className="space-y-2">
                {Object.entries(dashboard.byStatut).map(([statut, count]) => (
                  <div key={statut} className="flex items-center">
                    <span className="w-32 text-sm text-gray-600">{statut}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                      <div
                        className={`h-4 rounded-full ${
                          statut === 'Terminé' ? 'bg-green-500' :
                          statut === 'En cours' ? 'bg-yellow-500' :
                          statut === 'En attente' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(Number(count) / dashboard.totalDeclarations) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{Number(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Déclarations ({declarations.length})</h2>
          </div>
          {error && (
            <div className="p-4 bg-red-50 text-red-700">{error}</div>
          )}
          {loading ? (
            <div className="p-6 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Déclaration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type Panne</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criticité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chauffeur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Immatriculation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kilométrage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lieu</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Réparation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée Réparation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {declarations.map((decl) => (
                    <tr key={decl.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.numeroDeclaration || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(decl.dateDeclaration || '')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.typePanneFrancais || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          decl.criticite === 'BLOQUANT' ? 'bg-red-100 text-red-800' :
                          decl.criticite === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                          decl.criticite === 'NON_BLOQUANT' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {decl.criticite || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          decl.statut === 'Terminé' ? 'bg-green-100 text-green-800' :
                          decl.statut === 'En cours' ? 'bg-yellow-100 text-yellow-800' :
                          decl.statut === 'En attente' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {decl.statut || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{decl.descriptionFrancais || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.chauffeurNom || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.vehiculeImmatriculation || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.kilometrage || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(decl.dateReparation || '')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{decl.dureeReparation || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          decl.etat === 'Réparé' ? 'bg-green-100 text-green-800' :
                          decl.etat === 'En cours' ? 'bg-yellow-100 text-yellow-800' :
                          decl.etat === 'Non réparé' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {decl.etat || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {declarations.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  {Object.values(filters).some(v => v !== '') 
                    ? 'Aucune déclaration disponible avec les filtres sélectionnés. Veuillez réinitialiser les filtres.'
                    : 'Aucune déclaration disponible. Les déclarations créées par les chauffeurs apparaîtront ici.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelExplorationDashboard;
