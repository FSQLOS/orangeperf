import { useState } from 'react'
import './App.css'

export default function App() {
  // 1. Déclaration des States (remplace les value="" en dur)
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/e/2PACX-1vRQhU0168lFGtFdLX0oqNU6r9Dy87d_mW7zeSJ2LVrf_I87RxC4SbLFZiXSJcaQa8rRvuxDN8kmH0iF/pub?output=csv");
  const [teamList, setTeamList] = useState(
    `00017561 : Johan
    00015162 : Emre
    00016295 : Irvan
    00040258 : Amaury
    00009572 : Jean-Maxime
    00040373 : Yannis
    00017785 : Lucas
    00014065 : Nicolas
    00015199 : Elliot
    00016661 : Mathieu
    00014897 : Ludovyk
    00014896 : Steeve`
  );
  const [globTerm, setGlobTerm] = useState(306);
  const [globMob, setGlobMob] = useState(200);
  const [globBroad, setGlobBroad] = useState(100);
  const [globMig, setGlobMig] = useState(110);
  const [globMev, setGlobMev] = useState(90);
  const [globCyber, setGlobCyber] = useState(33);
  const [globMp, setGlobMp] = useState(22);

  // 2. Calcul dynamique du nombre de vendeurs
  const teamCount = teamList.trim().split('\n').filter(l => l.includes(':')).length;

  // 3. Fonction de génération des fichiers
  const generate = (version) => {
    const url = sheetUrl.trim();
    const teamRaw = teamList.trim().split('\n');
    let teamJson = {};
    let teamSize = 0;

    teamRaw.forEach(line => {
      if(line.includes(':')) {
        let parts = line.split(':');
        let key = parts[0].trim();
        let val = parts[1].trim();
        if(key && val) { teamJson[key] = val; teamSize++; }
      }
    });

    if(teamSize === 0) { alert("Erreur : Aucun vendeur !"); return; }

    const objIndiv = {
      Broadband: Math.ceil(globBroad / teamSize),
      Mobile: Math.ceil(globMob / teamSize),
      MIG: Math.ceil(globMig / teamSize),
      MEV: Math.ceil(globMev / teamSize),
      Terminaux: Math.ceil(globTerm / teamSize),
      Cyber: Math.ceil(globCyber / teamSize),
      MP: Math.ceil(globMp / teamSize)
    };

    let finalCode = "";
    let fileName = version === 'mobile' ? "index.html" : "dashboard.html";

    // NOTE POUR BAD MONKEY : J'ai gardé ta logique exacte ici.
    // Remplace les "..." ci-dessous par les immenses blocs de texte (template literals) de ton code d'origine
    // pour garder ton composant lisible.
    const commonJSLogic = `
    const RAW_URL = "${url}";
    const OBJ_GLOBAL_TERM = ${globTerm};
    const OBJ_INDIV = ${JSON.stringify(objIndiv)};
    const NAME_MAPPING = ${JSON.stringify(teamJson)};
    // ... (Copie-colle le reste de ton commonJSLogic ici) ...
    `;

    if(version === 'mobile') {
      finalCode = `<!DOCTYPE html>
      <html lang="fr"><head>...
      <script>
      ${commonJSLogic}
      // ... reste du script mobile
      </script></body></html>`;
    } else {
      finalCode = `<!DOCTYPE html>
      <html lang="fr"><head>...
      <script>
      ${commonJSLogic}
      // ... reste du script ordi
      </script></body></html>`;
    }

    // Déclenchement du téléchargement
    const blob = new Blob([finalCode], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  // 4. L'interface React (JSX)
  return (
    <div className="container">
    <h1>🍊 Orange Perf • Centrale V65</h1>
    <p>Système par <strong>CODES VENDEURS</strong> (Plus fiable pour les homonymes).</p>

    <div className="card">
    <h3>1. Source des Données</h3>
    <label>Lien Google Sheet (Format CSV)</label>
    <input
    type="text"
    value={sheetUrl}
    onChange={(e) => setSheetUrl(e.target.value)}
    />
    </div>

    <div className="card">
    <h3>2. Équipe <span className="badge-count">{teamCount} Vendeurs</span></h3>
    <div className="warning-box">⚠️ <strong>ACTION REQUISE :</strong> Remplacez les "000000" ci-dessous par les vrais codes vendeurs trouvés dans votre fichier Excel.</div>
    <div className="help">Format : CODE_VENDEUR : Prénom</div>
    <textarea
    value={teamList}
    onChange={(e) => setTeamList(e.target.value)}
    rows={12}
    />
    </div>

    <div className="card">
    <h3>3. Objectifs Boutique GLOBAUX (Mois)</h3>
    <div className="row">
    <div className="col"><label>Terminaux (Total)</label><input type="number" value={globTerm} onChange={(e) => setGlobTerm(Number(e.target.value))} /></div>
    <div className="col"><label>Mobile (Total)</label><input type="number" value={globMob} onChange={(e) => setGlobMob(Number(e.target.value))} /></div>
    </div>
    <div className="row">
    <div className="col"><label>Broadband (Box)</label><input type="number" value={globBroad} onChange={(e) => setGlobBroad(Number(e.target.value))} /></div>
    <div className="col"><label>MIG</label><input type="number" value={globMig} onChange={(e) => setGlobMig(Number(e.target.value))} /></div>
    <div className="col"><label>MEV</label><input type="number" value={globMev} onChange={(e) => setGlobMev(Number(e.target.value))} /></div>
    </div>
    <div className="row">
    <div className="col"><label>Cyber</label><input type="number" value={globCyber} onChange={(e) => setGlobCyber(Number(e.target.value))} /></div>
    <div className="col"><label>Maison Prot. (MP)</label><input type="number" value={globMp} onChange={(e) => setGlobMp(Number(e.target.value))} /></div>
    </div>
    </div>

    <div className="btn-group">
    <button className="btn-mobile" onClick={() => generate('mobile')}>📱 Générer Mobile<br/>(Scan & Score)</button>
    <button className="btn-desktop" onClick={() => generate('desktop')}>💻 Générer Ordi<br/>(PC)</button>
    </div>
    </div>
  );
}
