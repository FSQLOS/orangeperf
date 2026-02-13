import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Smartphone, Wifi, Shield, Zap, Home, Activity, ChevronRight, X, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MobileDashboard({ config }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [globalData, setGlobalData] = useState({});
    const [selectedSeller, setSelectedSeller] = useState(null);

    // --- 1. LA LOGIQUE EXACTE DU FICHIER HTML ORIGINEL ---
    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 805002, 805001, 805000, 804996, 804995, 804994, 804287, 804285, 804283, 804982, 804827, 804826, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692],
        MP: [804411, 804410],
        Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };
    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO"];
    const KEY_MODELE = ["L30", "WIRE"];
    const KEY_REC = ["REC", "RECOND", "RECONDITIONN", "RENEWD", "OCCASION", "2ND VIE", "SECONDE VIE", "GRADE", "ECO", "RE-"];
    const EXCLUDED_CA = [9, 24, 39];

    // --- 2. STYLE VISUEL (MODERNE) ---
    const getCategoryStyle = (cat) => {
        switch(cat) {
            case 'Terminaux': return { icon: <Smartphone size={18} />, color: '#000', label: 'Terminaux' };
            case 'Mobile': return { icon: <Activity size={18} />, color: '#FF7900', label: 'Mobile' };
            case 'Broadband': return { icon: <Wifi size={18} />, color: '#527EDB', label: 'Broadband' };
            case 'MIG': return { icon: <Zap size={18} />, color: '#FFCC00', label: 'MIG' };
            case 'MEV': return { icon: <TrendingUp size={18} />, color: '#856404', label: 'MEV' };
            case 'Cyber': return { icon: <Shield size={18} />, color: '#6f42c1', label: 'Cyber' };
            case 'MP': return { icon: <Home size={18} />, color: '#32C832', label: 'Maison P.' };
            case 'Assurance': return { icon: <Shield size={18} />, color: '#32C832', label: 'Assur' };
            default: return { icon: <AlertTriangle size={18} />, color: '#999', label: cat };
        }
    };

    useEffect(() => {
        const t = new Date().getTime();
        // Utilisation de corsproxy pour éviter les erreurs Google Sheet
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);

        fetch(finalUrl)
        .then(r => r.text())
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => processData(results.data)
            });
        })
        .catch(err => console.error("Erreur Fetch:", err));
    }, []);

    const processData = (data) => {
        // Préparation de la liste vendeurs
        let teamMap = {};
        const teamLines = config.team.trim().split('\n');
        teamLines.forEach(line => {
            if(line.includes(':')) {
                const [code, name] = line.split(':');
                teamMap[code.trim()] = name.trim();
            }
        });
        const teamCodes = Object.keys(teamMap);

        // Init Stats Vendeurs
        let tempStats = {};
        teamCodes.forEach(code => {
            tempStats[code] = {
                Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0,
                Cyber:0, MP:0, Assurance:0, REC:0, CA:0, details: []
            };
        });

        // Variables Globales
        let g_Realise = 0, g_CA = 0, g_Term = 0, g_Assur = 0;
        let globalCounts = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0 };

        // --- BOUCLE DE TRAITEMENT (IDENTIQUE HTML) ---
        data.forEach(row => {
            // Nettoyage ligne
            let cleanRow = {}; Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);

            // Recherche Vendeur
            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));

            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let rawLib = (cleanRow["Libellé Article"] || "").toString().toUpperCase();
                let libClean = rawLib.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

                // Nettoyage Montant
                let caStr = (cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.');
                let caVal = parseFloat(caStr) || 0;

                if (libClean.startsWith("WP")) return;

                const addItem = (label) => tempStats[v].details.push(label);
                const inc = (cat) => { tempStats[v][cat]++; globalCounts[cat]++; };

                // LOGIQUE DETECTION PRODUIT
                let hasStorage = KEY_STOCKAGE.some(k => libClean.includes(k));
                let isTerminal = (hasStorage || KEY_MODELE.some(k => libClean.includes(k)));

                if (isTerminal) {
                    inc('Terminaux'); g_Term++;
                    let isRec = KEY_REC.some(k => libClean.includes(k));
                    if (isRec) { tempStats[v].REC++; addItem("♻️ " + libClean); }
                    else { addItem("📱 " + libClean); }

                    if ((libClean.includes("GOOGLE") || libClean.includes("PIXEL")) && hasStorage) {
                        tempStats[v].Google++;
                    }
                } else {
                    if (!EXCLUDED_CA.includes(caVal)) {
                        tempStats[v].CA += caVal; g_CA += caVal;
                        if (caVal > 0) addItem("🛒 " + libClean);
                    }
                }

                // CHECK CODES EXACTS
                if (CODES.Broadband.includes(codeArt)) { inc('Broadband'); addItem("🌐 " + libClean); }
                else if (CODES.Mobile.includes(codeArt)) { inc('Mobile'); addItem("Sim " + libClean); }
                else if (CODES.MIG.includes(codeArt)) { inc('MIG'); addItem("⚡ " + libClean); }
                else if (CODES.MEV.includes(codeArt)) { inc('MEV'); addItem("🔧 " + libClean); }
                else if (CODES.MP.includes(codeArt)) { inc('MP'); addItem("🏠 " + libClean); }
                else if (CODES.Cyber.includes(codeArt)) { inc('Cyber'); addItem("🛡️ " + libClean); }
                else if (CODES.Assurance.includes(codeArt)) {
                    tempStats[v].Assurance++; globalCounts.Assurance++; g_Assur++;
                    addItem("🛡️ Assur: " + libClean);
                }
            }
        });

        // CALCUL DES OBJECTIFS
        let g_ObjTotal = 0;
        const nbVendeurs = teamCodes.length;

        // Calcul du réalisé global pour le % d'avancement
        // On exclut Assurance et MP du calcul de volume global si besoin, ici on additionne tout ce qui est volume
        ['Broadband', 'Mobile', 'MIG', 'MEV', 'Terminaux', 'Cyber', 'MP'].forEach(k => {
            g_Realise += globalCounts[k];
            g_ObjTotal += (config.objectifs[k]); // Total boutique direct depuis config
        });

        setGlobalData({
            ca: g_CA,
            pct: g_ObjTotal > 0 ? Math.round((g_Realise / g_ObjTotal) * 100) : 0,
                      assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0,
                      counts: globalCounts,
                      term: g_Term,
                      termObj: config.objectifs.Terminaux
        });

        setStats(tempStats);
        setLoading(false);
        if(g_ObjTotal > 0 && (g_Realise / g_ObjTotal) > 0.8) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    if (loading) return <div className="loading-screen">🍊 Chargement...</div>;

    // Tri des vendeurs par CA
    const sortedTeamCodes = Object.keys(stats).sort((a, b) => stats[b].CA - stats[a].CA);
    const nbVendeurs = sortedTeamCodes.length;

    return (
        <div className="modern-dashboard">
        {/* HEADER */}
        <div className="header-glass">
        <div>
        <div className="subtitle">Suivi Mensuel</div>
        <div className="title">Orange <span>Perf</span></div>
        </div>
        <div className="ca-badge">{Math.round(globalData.ca).toLocaleString()} €</div>
        </div>

        <div className="scroll-content">

        {/* GLOBAL SCROLL */}
        <div className="section-label">GLOBAL BOUTIQUE</div>
        <div className="global-scroll">
        <div className="stat-card featured">
        <div className="circular-wrap">
        <CircularProgressbar
        value={globalData.pct} text={`${globalData.pct}%`}
        styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.2)' })}
        />
        </div>
        <div className="card-label">Avancement</div>
        </div>

        <div className="stat-card">
        <div className="circular-wrap small">
        <CircularProgressbar
        value={globalData.assur} maxValue={100} text={`${globalData.assur}%`}
        styles={buildStyles({ pathColor: globalData.assur >= 42 ? '#32C832' : '#CD3C14', textColor: '#333' })}
        />
        </div>
        <div className="card-label">Taux Assur</div>
        </div>

        {/* BOUCLE SUR LES CLES DE CONFIG (Sauf Assurance qui est déjà affichée) */}
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const current = globalData.counts[key];
            const target = config.objectifs[key];
            const pct = Math.min(100, Math.round((current / target) * 100));

            return (
                <div key={key} className="stat-card">
                <div className="icon-badge" style={{color: style.color, background: `${style.color}20`}}>
                {style.icon}
                </div>
                <div className="stat-value">{current} <span className="stat-target">/ {target}</span></div>
                <div className="progress-bar-mini">
                <div className="fill" style={{width: `${pct}%`, background: style.color}}></div>
                </div>
                <div className="card-label">{style.label}</div>
                </div>
            )
        })}
        </div>

        {/* LEADERBOARD */}
        <div className="section-label" style={{marginTop:'20px'}}>CLASSEMENT ÉQUIPE</div>
        <div className="team-list">
        {sortedTeamCodes.map((code, index) => {
            const s = stats[code];
            // Récupération du Nom via le config.team parsé
            let name = "Inconnu";
            config.team.split('\n').forEach(line => {
                if(line.includes(code)) name = line.split(':')[1].trim();
            });

                const isTop3 = index < 3;
                const txAssur = s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux)*100) : 0;

                return (
                    <div key={code} className="seller-card" onClick={() => setSelectedSeller({code, name, data: s})}>
                    <div className="seller-rank">{index + 1}</div>
                    <div className={`seller-avatar ${isTop3 ? 'glow' : ''}`}>
                    {isTop3 && <div className="crown">👑</div>}
                    {name[0]}
                    </div>
                    <div className="seller-info">
                    <div className="seller-name">{name}</div>
                    <div className="seller-kpi-row">
                    <span className="tag-kpi">📱 {s.Terminaux}</span>
                    <span className="tag-kpi" style={{color: txAssur >= 42 ? 'green' : 'red'}}>🛡️ {txAssur}%</span>
                    </div>
                    </div>
                    <div className="seller-ca">
                    {Math.round(s.CA).toLocaleString()} €
                    <ChevronRight size={16} color="#ccc" />
                    </div>
                    </div>
                )
        })}
        </div>
        </div>

        {/* MODAL DETAIL */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-avatar">{selectedSeller.name[0]}</div>
            <div className="modal-title">
            <h2>{selectedSeller.name}</h2>
            <p>Objectifs Individuels</p>
            </div>
            <div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div>
            </div>

            <div className="modal-scroll">
            <div className="obj-grid">
            {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
                // CALCUL OBJECTIF INDIVIDUEL (Global / Nb Vendeurs)
                const indivTarget = Math.ceil(config.objectifs[key] / nbVendeurs);
                const current = selectedSeller.data[key];
                const done = current >= indivTarget;
                const style = getCategoryStyle(key);

                return (
                    <div key={key} className={`obj-pill ${done ? 'done' : ''}`}>
                    <div className="pill-icon" style={{color: style.color}}>{style.icon}</div>
                    <div className="pill-info">
                    <div className="pill-label">{style.label}</div>
                    <div className="pill-val">
                    <strong>{current}</strong> / {indivTarget}
                    </div>
                    </div>
                    {done && <div className="check-mark">✔</div>}
                    </div>
                )
            })}
            </div>

            <h3>Détails Ventes</h3>
            <div className="history-list">
            {selectedSeller.data.details.map((item, i) => (
                <div key={i} className="history-item">{item}</div>
            ))}
            </div>
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
