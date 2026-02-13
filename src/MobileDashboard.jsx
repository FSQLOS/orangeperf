import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Trophy, Flame, Rocket, Medal
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { CountUp } from './CountUp'; // Import de l'animation

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MobileDashboard({ config }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [globalData, setGlobalData] = useState({});
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [compareMode, setCompareMode] = useState(null);

    // --- CONFIG TECHNIQUE (Identique) ---
    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 805002, 805001, 805000, 804996, 804995, 804994, 804287, 804285, 804283, 804982, 804827, 804826, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };
    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO"];
    const KEY_MODELE = ["L30", "WIRE"];
    const KEY_REC = ["REC", "RECOND", "RECONDITIONN", "RENEWD", "OCCASION", "2ND VIE", "SECONDE VIE", "GRADE", "ECO", "RE-"];
    const BLACKLIST_CA = ["DORO", "HINTO", "FIXE", "DECT", "GIGASET", "PARAFOUDRE", "MULTIPRISE", "PILE", "SAC", "KRAFT", "CONFIGURATION", "ATELIER", "FLASH", "EXPERTE", "TIMBRE", "PLANCHE", "PHOTO", "IDENTITE", "MOBICARTE", "E-RECH"];
    const EXCLUDED_PRICES = [9, 24, 39];

    const getCategoryStyle = (cat) => {
        switch(cat) {
            case 'Terminaux': return { icon: <Smartphone size={18} />, color: '#1a1a1a', label: 'Terminaux', grad: 'linear-gradient(135deg, #e0e0e0, #ffffff)' };
            case 'Mobile': return { icon: <Activity size={18} />, color: '#FF7900', label: 'Mobile', grad: 'linear-gradient(135deg, #FF7900 10%, #ff9e42)' };
            case 'Broadband': return { icon: <Wifi size={18} />, color: '#527EDB', label: 'Box', grad: 'linear-gradient(135deg, #527EDB, #82aaff)' };
            case 'MIG': return { icon: <Zap size={18} />, color: '#FFCC00', label: 'MIG', grad: 'linear-gradient(135deg, #FFCC00, #ffe066)' };
            case 'MEV': return { icon: <TrendingUp size={18} />, color: '#856404', label: 'MEV', grad: 'linear-gradient(135deg, #d4a017, #f6c23e)' };
            case 'Cyber': return { icon: <Shield size={18} />, color: '#6f42c1', label: 'Cyber', grad: 'linear-gradient(135deg, #6f42c1, #a66efa)' };
            case 'MP': return { icon: <Home size={18} />, color: '#32C832', label: 'Maison P.', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' };
            case 'Assurance': return { icon: <Shield size={18} />, color: '#32C832', label: 'Assur', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' };
            default: return { icon: <AlertTriangle size={18} />, color: '#999', label: cat, grad: '#eee' };
        }
    };

    useEffect(() => {
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);

        fetch(finalUrl)
        .then(r => r.text())
        .then(csvText => {
            Papa.parse(csvText, {
                header: true, skipEmptyLines: true,
                complete: (results) => processData(results.data)
            });
        })
        .catch(err => console.error(err));
    }, []);

    const processData = (data) => {
        let teamMap = {};
        config.team.trim().split('\n').forEach(line => {
            if(line.includes(':')) { const [code, name] = line.split(':'); teamMap[code.trim()] = name.trim(); }
        });
        const teamCodes = Object.keys(teamMap);

        let tempStats = {};
        teamCodes.forEach(code => {
            tempStats[code] = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0, Cyber:0, MP:0, Assurance:0, REC:0, CA:0, details: [] };
        });

        let g_Realise = 0, g_CA = 0, g_Term = 0, g_Assur = 0;
        let globalCounts = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0 };

        data.forEach(row => {
            let cleanRow = {}; Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));

            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let rawLib = (cleanRow["Libellé Article"] || "").toString().toUpperCase();
                let libClean = rawLib.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
                let caVal = parseFloat((cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;

                if (libClean.startsWith("WP")) return;

                const addItem = (label) => tempStats[v].details.push(label);
                const inc = (cat) => { tempStats[v][cat]++; globalCounts[cat]++; };

                let hasStorage = KEY_STOCKAGE.some(k => libClean.includes(k));
                let isTerminal = (hasStorage || KEY_MODELE.some(k => libClean.includes(k)));

                if (isTerminal) {
                    inc('Terminaux'); g_Term++;
                    if (KEY_REC.some(k => libClean.includes(k))) { tempStats[v].REC++; addItem("♻️ " + libClean); }
                    else { addItem("📱 " + libClean); }
                    if ((libClean.includes("GOOGLE") || libClean.includes("PIXEL")) && hasStorage) tempStats[v].Google++;
                } else {
                    if (!BLACKLIST_CA.some(word => libClean.includes(word)) && !EXCLUDED_PRICES.includes(caVal)) {
                        let caHT = caVal / 1.2;
                        tempStats[v].CA += caHT; g_CA += caHT;
                        if (caVal > 0) addItem("🛒 " + libClean);
                    }
                }

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

        let g_ObjTotal = 0;
        ['Broadband', 'Mobile', 'MIG', 'MEV', 'Terminaux', 'Cyber', 'MP'].forEach(k => {
            g_Realise += globalCounts[k];
            g_ObjTotal += (config.objectifs[k]);
        });

        setGlobalData({
            ca: g_CA,
            pct: g_ObjTotal > 0 ? Math.round((g_Realise / g_ObjTotal) * 100) : 0,
                      assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0,
                      counts: globalCounts
        });

        setStats(tempStats);
        setLoading(false);
        if(g_ObjTotal > 0 && (g_Realise / g_ObjTotal) > 0.8) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    };

    const openComparison = (category) => {
        const sortedData = Object.keys(stats).map(code => {
            let name = "Inconnu";
            config.team.split('\n').forEach(line => { if(line.includes(code)) name = line.split(':')[1].trim(); });
            return { name, val: stats[code][category], isMe: code === selectedSeller.code };
        }).sort((a, b) => b.val - a.val);
        setCompareMode({ category, data: sortedData });
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Synchronisation...</p></div>;

    const sortedTeamCodes = Object.keys(stats).sort((a, b) => stats[b].CA - stats[a].CA);
    const nbVendeurs = sortedTeamCodes.length;

    return (
        <div className="modern-dashboard">
        {/* HEADER AVEC EFFET DE FLOU ET OMBRE */}
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle">Performance Live</div>
        <div className="title">Orange <span>Perf</span></div>
        </div>
        <div className="ca-badge">
        <span className="ca-label">CA ACC. HT</span>
        <span className="ca-val"><CountUp end={Math.round(globalData.ca)} suffix=" €" /></span>
        </div>
        </div>

        <div className="scroll-content">
        <div className="section-label">🎯 OBJECTIFS BOUTIQUE</div>
        <div className="global-scroll">
        <div className="stat-card featured pulse-effect">
        <div className="circular-wrap">
        <CircularProgressbar
        value={globalData.pct} text={`${globalData.pct}%`}
        styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.3)' })}
        />
        </div>
        <div className="card-label">Global</div>
        </div>

        <div className="stat-card" style={{background: 'linear-gradient(135deg, #ffffff, #f0f0f0)'}}>
        <div className="circular-wrap small">
        <CircularProgressbar
        value={globalData.assur} maxValue={100} text={`${globalData.assur}%`}
        styles={buildStyles({ pathColor: globalData.assur >= 42 ? '#32C832' : '#CD3C14', textColor: '#333' })}
        />
        </div>
        <div className="card-label">Taux Assur</div>
        </div>

        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const current = globalData.counts[key];
            const target = config.objectifs[key];
            const pct = Math.min(100, Math.round((current / target) * 100));

            return (
                <div key={key} className="stat-card">
                <div className="icon-badge" style={{background: style.grad, color: '#fff', boxShadow: `0 4px 10px ${style.color}40`}}>
                {style.icon}
                </div>
                <div className="stat-value">
                <CountUp end={current} /> <span className="stat-target">/ {target}</span>
                </div>
                <div className="progress-bar-mini">
                <div className="fill" style={{width: `${pct}%`, background: style.grad}}></div>
                </div>
                <div className="card-label">{style.label}</div>
                </div>
            )
        })}
        </div>

        <div className="section-label" style={{marginTop:'25px'}}>🏆 CLASSEMENT ÉQUIPE</div>
        <div className="team-list">
        {sortedTeamCodes.map((code, index) => {
            const s = stats[code];
            let name = "Inconnu";
            config.team.split('\n').forEach(line => { if(line.includes(code)) name = line.split(':')[1].trim(); });

            const isGold = index === 0;
            const isSilver = index === 1;
            const isBronze = index === 2;
            const rankClass = isGold ? 'rank-1' : isSilver ? 'rank-2' : isBronze ? 'rank-3' : '';

            const txAssur = s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux)*100) : 0;

            return (
                <div key={code} className={`seller-card ${rankClass}`} onClick={() => setSelectedSeller({code, name, data: s})}>
                <div className="rank-badge">
                {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${index + 1}`}
                </div>
                <div className="seller-avatar">
                {name[0]}
                {/* Petit badge "On fire" si bon CA ou Taux */}
                {txAssur >= 50 && <div className="fire-badge">🔥</div>}
                </div>
                <div className="seller-info">
                <div className="seller-name">{name}</div>
                <div className="seller-kpi-row">
                <div className="kpi-pill">📱 {s.Terminaux}</div>
                <div className="kpi-pill" style={{
                    background: txAssur >= 42 ? '#e8f5e9' : '#ffebee',
                    color: txAssur >= 42 ? '#2e7d32' : '#c62828'
                }}>
                🛡️ {txAssur}%
                </div>
                </div>
                </div>
                <div className="seller-ca">
                <div className="ca-val"><CountUp end={Math.round(s.CA)} suffix=" €" /></div>
                <ChevronRight size={18} color="#ccc" style={{marginLeft: 5}} />
                </div>
                </div>
            )
        })}
        </div>
        </div>

        {/* MODAL VENDEUR */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-avatar-large">{selectedSeller.name[0]}</div>
            <div className="modal-title">
            <h2>{selectedSeller.name}</h2>
            <p>Touchez une jauge pour comparer ! 👇</p>
            </div>
            <div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div>
            </div>

            <div className="modal-scroll">
            <div className="obj-grid">
            {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
                const indivTarget = Math.ceil(config.objectifs[key] / nbVendeurs);
                const current = selectedSeller.data[key];
                const done = current >= indivTarget;
                const style = getCategoryStyle(key);

                return (
                    <div key={key} className={`obj-pill ${done ? 'done-glow' : ''}`} onClick={() => openComparison(key)}>
                    <div className="pill-icon" style={{background: style.grad, color: 'white', boxShadow: `0 2px 5px ${style.color}40`}}>
                    {style.icon}
                    </div>
                    <div className="pill-info">
                    <div className="pill-label">{style.label} <BarChart2 size={12} style={{opacity:0.6}}/></div>
                    <div className="pill-val">
                    <strong>{current}</strong> <span className="target-mini">/ {indivTarget}</span>
                    </div>
                    <div className="mini-prog-track">
                    <div className="mini-prog-fill" style={{
                        width: `${Math.min(100, (current/indivTarget)*100)}%`,
                        background: done ? '#32C832' : style.grad
                    }}></div>
                    </div>
                    </div>
                    {done && <div className="check-mark-anim">🏆</div>}
                    </div>
                )
            })}
            </div>

            <h3 className="history-title">🧾 Dernières ventes</h3>
            <div className="history-list">
            {selectedSeller.data.details.map((item, i) => (
                <div key={i} className="history-item slide-in" style={{animationDelay: `${i * 0.05}s`}}>
                {item}
                </div>
            ))}
            </div>
            </div>
            </div>
            </div>
        )}

        {/* MODAL CHART */}
        {compareMode && (
            <div className="glass-overlay" style={{zIndex: 200}} onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" style={{height: 'auto', minHeight: '50vh'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-title">
            <h2>VS Le Reste</h2>
            <p>Classement {compareMode.category}</p>
            </div>
            <div className="close-btn" onClick={() => setCompareMode(null)}><X /></div>
            </div>
            <div style={{height: '300px', width: '100%'}}>
            <Bar
            data={{
                labels: compareMode.data.map(d => d.name),
                         datasets: [{
                             label: compareMode.category,
                             data: compareMode.data.map(d => d.val),
                         backgroundColor: compareMode.data.map(d => d.isMe ? '#FF7900' : '#E0E0E0'),
                         borderRadius: 8,
                         borderSkipped: false,
                         }]
            }}
            options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#333', padding: 10, cornerRadius: 8 } },
                scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } } },
                animation: { duration: 1000, easing: 'easeOutQuart' }
            }}
            />
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
