import { useState } from 'react';
import './App.css';
import MobileDashboard from './MobileDashboard';

export default function App() {
  const [view, setView] = useState('config'); // 'config' ou 'dashboard'
  const [configData, setConfigData] = useState(null);

  // States du formulaire
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/e/2PACX-1vRQhU0168lFGtFdLX0oqNU6r9Dy87d_mW7zeSJ2LVrf_I87RxC4SbLFZiXSJcaQa8rRvuxDN8kmH0iF/pub?output=csv");
  const [teamList, setTeamList] = useState(`00017561 : Johan\n00015162 : Emre\n00016295 : Irvan\n00040258 : Amaury\n00009572 : Jean-Maxime\n00040373 : Yannis\n00017785 : Lucas\n00014065 : Nicolas\n00015199 : Elliot\n00016661 : Mathieu\n00014897 : Ludovyk\n00014896 : Steeve`);

  // Objectifs globaux
  const [globTerm, setGlobTerm] = useState(306);
  const [globMob, setGlobMob] = useState(200);
  const [globBroad, setGlobBroad] = useState(100);
  const [globMig, setGlobMig] = useState(110);
  const [globMev, setGlobMev] = useState(90);
  const [globCyber, setGlobCyber] = useState(33);
  const [globMp, setGlobMp] = useState(22);

  const teamCount = teamList.trim().split('\n').filter(l => l.includes(':')).length;

  const handleLaunch = () => {
    // 1. Parser l'équipe
    const teamRaw = teamList.trim().split('\n');
    let teamJson = {};
    let teamSize = 0;
    teamRaw.forEach(line => {
      if(line.includes(':')) {
        let parts = line.split(':');
        teamJson[parts[0].trim()] = parts[1].trim();
        teamSize++;
      }
    });

    if(teamSize === 0) { alert("Aucun vendeur trouvé !"); return; }

    // 2. Calculer les obj individuels
    const objIndiv = {
      Broadband: Math.ceil(globBroad / teamSize),
      Mobile: Math.ceil(globMob / teamSize),
      MIG: Math.ceil(globMig / teamSize),
      MEV: Math.ceil(globMev / teamSize),
      Terminaux: Math.ceil(globTerm / teamSize),
      Cyber: Math.ceil(globCyber / teamSize),
      MP: Math.ceil(globMp / teamSize)
    };

    // 3. Sauvegarder la config et changer de vue
    setConfigData({
      url: sheetUrl.trim(),
                  team: teamJson,
                  objectifs: objIndiv,
                  globalTerm: globTerm
    });
    setView('dashboard');
  };

  // --- RENDU ---

  if (view === 'dashboard') {
    return <MobileDashboard config={configData} onBack={() => setView('config')} />;
  }

  return (
    <div className="container">
    <h1>🍊 Orange Perf • Config</h1>

    <div className="card">
    <h3>1. Lien Google Sheet (CSV)</h3>
    <input type="text" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
    </div>

    <div className="card">
    <h3>2. Équipe <span className="badge-count">{teamCount}</span></h3>
    <textarea value={teamList} onChange={(e) => setTeamList(e.target.value)} rows={8} />
    </div>

    <div className="card">
    <h3>3. Objectifs Globaux</h3>
    <div className="row">
    <div className="col"><label>Terminaux</label><input type="number" value={globTerm} onChange={(e) => setGlobTerm(Number(e.target.value))} /></div>
    <div className="col"><label>Mobile</label><input type="number" value={globMob} onChange={(e) => setGlobMob(Number(e.target.value))} /></div>
    </div>
    {/* Tu peux ajouter les autres inputs ici comme avant */}
    </div>

    <button className="btn-mobile" onClick={handleLaunch} style={{width:'100%', marginTop:'20px'}}>
    🚀 LANCER LE DASHBOARD
    </button>
    </div>
  );
}
