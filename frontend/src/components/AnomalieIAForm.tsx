import React, { useState } from "react";
import axios from "axios";
import { User } from "../types/incident";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

type BadgeVariant = 'en-cours' | 'cloture' | 'en-attente' | 'en-validation' | 'retourne' | 'refuse' | 'sla-depasse' | 'default';

interface AnomalieIAFormProps {
  currentUser?: User | null;
  locationCity?: string;
  onComplete?: () => void;
  onClose?: () => void;
  onAnalyse?: (result: AnomalieResult) => void;
}

export interface AnomalieResult {
  vehicule: string;
  chauffeur: string;
  localisation: string;
  element: string;
  anomalie: string;
  description: string;
  categorie: string;
  criticite: string;
  typePanne?: string;
  date: string;
  source: string;
  success: boolean;
}

const API = "http://localhost:8080/api";

const AnomalieIAForm: React.FC<AnomalieIAFormProps> = ({ currentUser, locationCity, onComplete, onClose, onAnalyse }) => {
  const [texte, setTexte] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnomalieResult | null>(null);
  const [error, setError] = useState("");

  const analyser = async () => {
    if (!texte.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post<AnomalieResult>(`${API}/anomalie-ia/analyser`, {
        texte: texte.trim(),
        chauffeur: currentUser?.name || "",
        localisation: locationCity || currentUser?.ville || "",
        date: new Date().toISOString().split("T")[0]
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.erreur || "Erreur de communication");
    } finally {
      setLoading(false);
    }
  };

  const remplirFormulaire = () => {
    if (result && onAnalyse) {
      onAnalyse(result);
    }
  };

  const badgeColor = (c: string): BadgeVariant => {
    switch (c) {
      case "Critique": return "refuse";
      case "Moyenne": return "en-attente";
      case "Faible": return "default";
      default: return "default";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2">Assistant IA - Déclaration d'anomalie</h3>
          <p className="text-sm text-gray-500 mb-4">
            Décrivez le problème en Darija ou en Français. L'IA comprend tout.
          </p>
          <textarea
            className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder='Ex: "had camion 789 frein kaydir sawt khayb" ou "batterie faible f casa"'
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              onClick={analyser}
              disabled={loading || !texte.trim()}
            >
              {loading ? "Analyse..." : "Analyser"}
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              onClick={() => { setTexte(""); setResult(null); setError(""); }}
            >
              Effacer
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <Card>
          <div className="p-4 text-red-600 text-sm">{error}</div>
        </Card>
      )}

      {result && result.success && (
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base">Fiche d'anomalie</h4>
              <Badge variant={badgeColor(result.criticite)}>{result.criticite}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Véhicule</span>
                <p className="font-medium">{result.vehicule}</p>
              </div>
              <div>
                <span className="text-gray-500">Chauffeur</span>
                <p className="font-medium">{result.chauffeur}</p>
              </div>
              <div>
                <span className="text-gray-500">Localisation</span>
                <p className="font-medium">{result.localisation}</p>
              </div>
              <div>
                <span className="text-gray-500">Date</span>
                <p className="font-medium">{result.date}</p>
              </div>
              <div>
                <span className="text-gray-500">Élément</span>
                <p className="font-medium">{result.element}</p>
              </div>
              <div>
                <span className="text-gray-500">Catégorie</span>
                <p className="font-medium">{result.categorie}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Anomalie</span>
              <p className="font-medium">{result.anomalie}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Description</span>
              <p className="font-medium">{result.description}</p>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Source: {result.source}</div>
            {onAnalyse && (
              <button
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 w-full"
                onClick={remplirFormulaire}
              >
                Remplir le formulaire de déclaration
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnomalieIAForm;
