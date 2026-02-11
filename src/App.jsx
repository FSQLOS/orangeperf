import React, { useState, useEffect } from 'react';
import './App.css';
import MobileDashboard from './MobileDashboard';
import { config } from './config'; // On importe tes réglages

export default function App() {
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Au chargement, on prépare les données automatiquement
    try {
      // 1. On transforme la liste de texte (équipe) en un objet utilisable
      const teamRaw = config.equipe.trim().split('\n');
      let teamJson = {};
      let teamSize = 0;

      teamRaw.forEach(line => {
        if(line.includes(':')) {
          let parts = line.split(':');
          let code = parts[0].trim();
          let name = parts[1].trim();
          if(code && name) {
            teamJson[code] = name;
            teamSize++;
          }
        }
      });

      if (teamSize === 0) throw new Error("Aucun vendeur trouvé dans config.js");

      // 2. On calcule les objectifs individuels (Global / Nombre de vendeurs)
      const objIndiv = {
        Broadband: Math.ceil(config.objectifs.Broadband / teamSize),
            Mobile: Math.ceil(config.objectifs.Mobile / teamSize),
            MIG: Math.ceil(config.objectifs.MIG / teamSize),
            MEV: Math.ceil(config.objectifs.MEV / teamSize),
            Terminaux: Math.ceil(config.objectifs.Terminaux / teamSize),
            Cyber: Math.ceil(config.objectifs.Cyber / teamSize),
            MP: Math.ceil(config.objectifs.MP / teamSize)
      };

      // 3. On envoie tout ça au Dashboard
      setAppData({
        url: config.url,
        team: teamJson,
        objectifs: objIndiv,
        globalTerm: config.objectifs.Terminaux
      });

    } catch (err) {
      setError(err.message);
    }
  }, []);

  // --- RENDU ---

  if (error) return <div className="error-screen">⚠️ Erreur Config : {error}</div>;
  if (!appData) return <div className="loading-screen">🍊 Initialisation...</div>;

  // On affiche DIRECTEMENT le dashboard, sans passer par le menu
  return <MobileDashboard config={appData} onBack={() => alert("Modification possible uniquement sur PC (config.js)")} />;
}
