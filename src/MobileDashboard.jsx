import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MobileDashboard({ config, onBack }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({});
    const [globalData, setGlobalData] = useState({});
    const [selectedSeller, setSelectedSeller] = useState(null); // Pour la modale détail
    const [chartData, setChartData] = useState(null); // Pour la modale graphique

    // Codes articles (Ta logique métier)
    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 805002, 805001, 805000, 804996, 804995, 804994, 804287, 804285, 804283, 804982, 804827, 804826, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        const t = new Date().getTime();
        const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);

        fetch(proxyUrl)
        .then(r => {
            if (!r.ok) throw new Error("Erreur Proxy");
            return r.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => processData(results.data),
                       error: (err) => setError("Erreur Parsing CSV")
            });
        })
        .catch(err => {
            console.error(err);
            setError("Erreur Réseau : Vérifiez le lien Google Sheet");
            setLoading(false);
        });
    };

    const processData = (data) => {
        let tempStats = {};
        const teamCodes = Object.keys(config.team);

        // Init stats
        teamCodes.forEach(code => {
            tempStats[code] = {
                Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0,
                Cyber:0, MP:0, Assurance:0, REC:0, CA:0, details: []
            };
        });

        let g_Realise = 0, g_CA = 0, g_Term = 0, g_Assur = 0;

        data.forEach(row => {
            // Nettoyage des clés (parfois des espaces traînent dans le CSV)
            let cleanRow = {};
            Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);

            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));

            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let lib = (cleanRow["Libellé Article"] || "").toString().toUpperCase();
                // Nettoyage montant (1 200,00 € -> 1200.00)
                let caStr = (cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.');
                let caVal = parseFloat(caStr) || 0;

                // Logique Métier
                if (lib.startsWith("WP")) return;

                const addItem = (label) => tempStats[v].details.push(label);

                // Détection Terminaux
                const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO"];
                let hasStorage = KEY_STOCKAGE.some(k => lib.includes(k));
                let isTerminal = (hasStorage || ["L30", "WIRE"].some(k => lib.includes(k)));

                if (isTerminal) {
                    tempStats[v].Terminaux++;
                    g_Term++;
                    if (["REC", "RECOND", "RENEWD", "OCCASION"].some(k => lib.includes(k))) {
                        tempStats[v].REC++;
                        addItem("♻️ " + lib);
                    } else {
                        addItem("📱 " + lib);
                    }
                    if ((lib.includes("GOOGLE") || lib.includes("PIXEL")) && hasStorage) tempStats[v].Google++;
                } else {
                    // Accessoires & Services
                    if (![9, 24, 39].includes(caVal)) { // Exclusions CA
                        tempStats[v].CA += caVal;
                        g_CA += caVal;
                        if (caVal > 0) addItem("🛒 " + lib);
                    }
                }

                // Catégories par codes
                if (CODES.Broadband.includes(codeArt)) { tempStats[v].Broadband++; addItem("🌐 Box: " + lib); }
                else if (CODES.Mobile.includes(codeArt)) { tempStats[v].Mobile++; addItem("SIM: " + lib); }
                else if (CODES.MIG.includes(codeArt)) { tempStats[v].MIG++; addItem("MIG: " + lib); }
                else if (CODES.MEV.includes(codeArt)) { tempStats[v].MEV++; addItem("MEV: " + lib); }
                else if (CODES.MP.includes(codeArt)) { tempStats[v].MP++; addItem("🏠 MP: " + lib); }
                else if (CODES.Cyber.includes(codeArt)) { tempStats[v].Cyber++; addItem("🛡️ Cyber: " + lib); }
                else if (CODES.Assurance.includes(codeArt)) {
                    tempStats[v].Assurance++;
                    g_Assur++;
                    addItem("🛡️ Assur: " + lib);
                }
            }
        });

        // Calcul Global
        let totalObj = 0;
        Object.values(config.objectifs).forEach(val => totalObj += (val * teamCodes.length));

        teamCodes.forEach(c => {
            Object.keys(config.objectifs).forEach(k => {
                if(k !== 'MP' && k !== 'Cyber') g_Realise += tempStats[c][k];
            });
        });

        const pct = totalObj > 0 ? Math.round((g_Realise / totalObj) * 100) : 0;

        setGlobalData({
            ca: g_CA,
            pct: pct,
            assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0,
                      term: g_Term,
                      termObj: config.globalTerm
        });

        setStats(tempStats);
        setLoading(false);

        if (pct >= 80) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    // --- UI HELPERS ---
    const getSortedTeam = () => {
        return Object.keys(stats).sort((a, b) => stats[b].CA - stats[a].CA);
    };

    if (loading) return <div className="loading-screen">🍊 Chargement des données...</div>;
    if (error) return <div className="error-screen">⚠️ {error} <button onClick={onBack}>Retour</button></div>;

    return (
        <div className="mobile-dashboard">
        {/* HEADER */}
        <header className="dash-header">
        <div className="brand">Orange <span>Perf</span></div>
        <button onClick={onBack} className="btn-back">⚙️ Config</button>
        </header>

        {/* KPI GRID */}
        <div className="kpi-grid">
        <div className="kpi-card">
        <div className="kpi-title">CA ACCESSOIRES</div>
        <div className="kpi-value">{Math.round(globalData.ca).toLocaleString()} €</div>
        </div>
        <div className="kpi-card">
        <div className="kpi-title">AVANCEMENT</div>
        <div className="kpi-value" style={{color: globalData.pct >= 80 ? '#32C832' : '#000'}}>
        {globalData.pct}%
        </div>
        </div>
        <div className="kpi-card">
        <div className="kpi-title">TAUX ASSUR</div>
        <div className="kpi-value">{globalData.assur}%</div>
        <div className="kpi-sub" style={{color: globalData.assur >= 42 ? 'green' : 'red'}}>Obj {'>'} 42%</div>
        </div>
        <div className="kpi-card">
        <div className="kpi-title">TERMINAUX</div>
        <div className="kpi-value">{globalData.term}</div>
        <div className="kpi-sub">/ {globalData.termObj}</div>
        </div>
        </div>

        {/* LISTE VENDEURS */}
        <div className="team-section">
        <div className="section-title">CLASSEMENT ÉQUIPE (CA ACC.)</div>
        {getSortedTeam().map((code, index) => {
            const s = stats[code];
            const name = config.team[code];
            return (
                <div key={code} className="collab-row" onClick={() => setSelectedSeller({code, name, data: s})}>
                <div className="collab-left">
                <div className="rank">#{index + 1}</div>
                <div className="avatar">{name[0]}</div>
                <div className="collab-name">{name}</div>
                </div>
                <div className="collab-right">
                <div className="collab-val">{Math.round(s.CA).toLocaleString()} €</div>
                <div className="chevron">›</div>
                </div>
                </div>
            )
        })}
        </div>

        {/* MODAL DETAIL (Si un vendeur est cliqué) */}
        {selectedSeller && (
            <div className="modal-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
            <h2>{selectedSeller.name}</h2>
            <button className="close-icon" onClick={() => setSelectedSeller(null)}>×</button>
            </div>

            {/* OBJECTIFS INDIVIDUELS */}
            <div className="objectives-list">
            <h3>🎯 Objectifs Restants</h3>
            {Object.keys(config.objectifs).map(key => {
                const reste = config.objectifs[key] - selectedSeller.data[key];
                if (reste <= 0) return null;
                return (
                    <div key={key} className="obj-item">
                    <span>{key}</span>
                    <strong>{reste}</strong>
                    </div>
                )
            })}
            {Object.keys(config.objectifs).every(k => config.objectifs[k] - selectedSeller.data[k] <= 0) &&
                <div className="success-msg">✨ Tous les objectifs sont atteints !</div>
            }
            </div>

            {/* INVENTAIRE / DETAILS */}
            <div className="inventory-list">
            <h3>📦 Détail des ventes</h3>
            {selectedSeller.data.details.length === 0 ? <p>Aucune vente.</p> :
                selectedSeller.data.details.map((item, i) => (
                    <div key={i} className="inv-item">{item}</div>
                ))
            }
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
