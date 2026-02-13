import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Trophy, Calendar, Clock
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { CountUp } from './CountUp';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MobileDashboard({ config }) {
    const [loading, setLoading] = useState(true);
    const [statsMonth, setStatsMonth] = useState({});
    const [statsDay, setStatsDay] = useState({});
    const [globalData, setGlobalData] = useState({});
    const [viewMode, setViewMode] = useState('month');
    const [bigWin, setBigWin] = useState(null);

    const [selectedSeller, setSelectedSeller] = useState(null);
    const [compareMode, setCompareMode] = useState(null);

    // --- CONFIG ---
    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 805002, 805001, 805000, 804996, 804995, 804994, 804287, 804285, 804283, 804982, 804827, 804826, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    // 1. Détection Stockage
    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO", "64 GO", "64GO", "32 GO", "32GO"];

    // 2. Détection Modèles SPÉCIFIQUES (J'ai ajouté NOTE, REDMI, XIAOMI ici)
    const KEY_MODELE = [
        "L30", "WIRE", "15C", "REDMI", "NOTE", "XIAOMI", "POCO",
        "X5C", "HONOR", "A15", "A25", "A35", "A55", "S23", "S24", "S25", "IPHONE"
    ];

    // 3. ⛔ MOTS INTERDITS (LISTE BLINDÉE)
    const KEY_NOT_TERM = [
        "COQUE", "ETUI", "VERRE", "FILM", "PROT",              // Protection
        "CHARGEUR", "CABLE", "ADAPTATEUR", "PRISE",            // Énergie
        "ECOUTEUR", "KIT", "AUDIO", "BUDS", "AIRPODS", "FREEBUDS", // Audio
        "ENCEINTE", "SPEAKER", "SOUND",                        // Son
        "MONTRE", "BRACELET", "WATCH", "BAND", "GALAXY FIT",   // Wearables
        "SUPPORT", "PACK", "LANIERE", "TAG", "TRACKER",        // Access
        "CLE", "USB", "CARTE", "MEMOIRE", "DISQUE", "HDD", "SSD", "SDXC", "MICROSD", "DRIVE" // ⛔ Stockage externe
    ];

    const KEY_REC = ["REC", "RECOND", "RECONDITIONN", "RENEWD", "OCCASION", "2ND VIE", "SECONDE VIE", "GRADE", "ECO", "RE-"];
    const BLACKLIST_CA = ["FIXE", "DECT", "GIGASET", "PARAFOUDRE", "MULTIPRISE", "PILE", "SAC", "KRAFT", "CONFIGURATION", "ATELIER", "FLASH", "EXPERTE", "TIMBRE", "PLANCHE", "PHOTO", "IDENTITE", "MOBICARTE", "E-RECH"];
    const EXCLUDED_PRICES = [9, 24, 39];

    // Helpers Date (Format Excel 13/2/2026)
    const getTodayStr = () => {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    };

    const daysInMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = () => new Date().getDate();
    const calculateLanding = (currentValue) => {
        const d = currentDay();
        const t = daysInMonth();
        if(d === 0) return 0;
        return Math.round((currentValue / d) * t);
    };

    const getCategoryStyle = (cat) => {
        switch(cat) {
            case 'Terminaux': return { icon: <Smartphone size={16} />, color: '#1a1a1a', label: 'Terminaux', grad: 'linear-gradient(135deg, #e0e0e0, #ffffff)' };
            case 'Mobile': return { icon: <Activity size={16} />, color: '#FF7900', label: 'Mobile', grad: 'linear-gradient(135deg, #FF7900 10%, #ff9e42)' };
            case 'Broadband': return { icon: <Wifi size={16} />, color: '#527EDB', label: 'Box', grad: 'linear-gradient(135deg, #527EDB, #82aaff)' };
            case 'MIG': return { icon: <Zap size={16} />, color: '#FFCC00', label: 'MIG', grad: 'linear-gradient(135deg, #FFCC00, #ffe066)' };
            case 'MEV': return { icon: <TrendingUp size={16} />, color: '#856404', label: 'MEV', grad: 'linear-gradient(135deg, #d4a017, #f6c23e)' };
            case 'Cyber': return { icon: <Shield size={16} />, color: '#6f42c1', label: 'Cyber', grad: 'linear-gradient(135deg, #6f42c1, #a66efa)' };
            case 'MP': return { icon: <Home size={16} />, color: '#32C832', label: 'Maison P.', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' };
            case 'Assurance': return { icon: <Shield size={16} />, color: '#32C832', label: 'Assur', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' };
            default: return { icon: <AlertTriangle size={16} />, color: '#999', label: cat, grad: '#eee' };
        }
    };

    useEffect(() => {
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl).then(r => r.text()).then(t => Papa.parse(t, {header:true, skipEmptyLines:true, complete:r=>processData(r.data)}));
    }, []);

    const processData = (data) => {
        let teamMap = {};
        config.team.trim().split('\n').forEach(line => { if(line.includes(':')) { const [c, n] = line.split(':'); teamMap[c.trim()] = n.trim(); }});
        const teamCodes = Object.keys(teamMap);

        let tempStatsMonth = {}, tempStatsDay = {};
        teamCodes.forEach(code => {
            tempStatsMonth[code] = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0, Cyber:0, MP:0, Assurance:0, REC:0, CA:0, details: [] };
            tempStatsDay[code] = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0, Cyber:0, MP:0, Assurance:0, REC:0, CA:0, details: [] };
        });

        let g_Realise=0, g_CA=0, g_Term=0, g_Assur=0;
        let globalCounts = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0 };

        let highestSale = { amount: 0, seller: "", item: "" };
        const todayStr = getTodayStr();

        data.forEach(row => {
            let cleanRow = {}; Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
            let rowDate = cleanRow["Date"] || cleanRow["Date de pièce"] || cleanRow["Date Facture"];
            let isToday = rowDate && rowDate.includes(todayStr);

            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));

            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let rawLib = (cleanRow["Libellé Article"] || "").toString().toUpperCase();
                let libClean = rawLib.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
                let caVal = parseFloat((cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;

                if (libClean.startsWith("WP")) return;

                const updateStats = (cat, label, isCa = false, amount = 0) => {
                    if(isCa) { tempStatsMonth[v].CA += amount; } else { tempStatsMonth[v][cat]++; }
                    if(label) tempStatsMonth[v].details.push(label);

                    if(isToday) {
                        if(isCa) { tempStatsDay[v].CA += amount; } else { tempStatsDay[v][cat]++; }
                        if(label) tempStatsDay[v].details.push(label);
                    }

                    if(!isCa) { globalCounts[cat]++; } else { g_CA += amount; }
                };

                if (isToday && caVal > highestSale.amount && !EXCLUDED_PRICES.includes(caVal)) {
                    highestSale = { amount: caVal, seller: teamMap[v], item: libClean };
                }

                // --- LOGIQUE DETECTION ---
                let hasStorage = KEY_STOCKAGE.some(k => libClean.includes(k));
                let hasSpecificModel = KEY_MODELE.some(k => libClean.includes(k));
                let isAccessoryKeyword = KEY_NOT_TERM.some(k => libClean.includes(k));

                let isTerm = (hasStorage || hasSpecificModel) && !isAccessoryKeyword;

                if (isTerm) {
                    g_Term++;
                    if (KEY_REC.some(k => libClean.includes(k))) {
                        tempStatsMonth[v].REC++;
                        if(isToday) tempStatsDay[v].REC++;
                        updateStats('Terminaux', "♻️ " + libClean);
                    } else {
                        updateStats('Terminaux', "📱 " + libClean);
                    }
                    if ((libClean.includes("GOOGLE") || libClean.includes("PIXEL"))) {
                        tempStatsMonth[v].Google++;
                        if(isToday) tempStatsDay[v].Google++;
                    }
                } else {
                    // ACCESSORIES
                    if (!BLACKLIST_CA.some(w => libClean.includes(w)) && !EXCLUDED_PRICES.includes(caVal)) {
                        let caHT = caVal / 1.2;
                        if (caVal !== 0) {
                            const icon = caVal > 0 ? "🛒" : "↩️";
                            updateStats('null', `${icon} ${libClean} (${Math.round(caHT)}€)`, true, caHT);
                        }
                    }
                }

                if (CODES.Broadband.includes(codeArt)) updateStats('Broadband', "🌐 " + libClean);
                else if (CODES.Mobile.includes(codeArt)) updateStats('Mobile', "Sim " + libClean);
                else if (CODES.MIG.includes(codeArt)) updateStats('MIG', "⚡ " + libClean);
                else if (CODES.MEV.includes(codeArt)) updateStats('MEV', "🔧 " + libClean);
                else if (CODES.MP.includes(codeArt)) updateStats('MP', "🏠 " + libClean);
                else if (CODES.Cyber.includes(codeArt)) updateStats('Cyber', "🛡️ " + libClean);
                else if (CODES.Assurance.includes(codeArt)) {
                    updateStats('Assurance', "🛡️ Assur: " + libClean);
                    g_Assur++;
                }
            }
        });

        let g_ObjTotal = 0;
        ['Broadband', 'Mobile', 'MIG', 'MEV', 'Terminaux', 'Cyber', 'MP'].forEach(k => { g_Realise += globalCounts[k]; g_ObjTotal += (config.objectifs[k]); });

        setGlobalData({ ca: g_CA, pct: g_ObjTotal > 0 ? Math.round((g_Realise/g_ObjTotal)*100) : 0, assur: g_Term > 0 ? Math.round((g_Assur/g_Term)*100) : 0, counts: globalCounts });

        setStatsMonth(tempStatsMonth);
        setStatsDay(tempStatsDay);
        if(highestSale.amount > 0) setBigWin(highestSale);

        setLoading(false);
        if(g_ObjTotal > 0 && (g_Realise/g_ObjTotal) > 0.8) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    };

    const openComparison = (category) => {
        const activeStats = viewMode === 'month' ? statsMonth : statsDay;
        const sortedData = Object.keys(activeStats).map(code => {
            let name = "Inconnu";
            config.team.split('\n').forEach(line => { if(line.includes(code)) name = line.split(':')[1].trim(); });
            let val = 0;
            if (category === 'TxAssur') {
                const s = activeStats[code];
                val = s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0;
            } else { val = activeStats[code][category]; }
            return { name, val, isMe: selectedSeller ? code === selectedSeller.code : false };
        }).sort((a, b) => b.val - a.val);
        setCompareMode({ category: category === 'TxAssur' ? 'Taux Assurance' : category, data: sortedData, isPercent: category === 'TxAssur' });
    };

    const getGroupedSales = (details) => {
        const groups = { '📱 Mobiles & Terminaux': [], '🛡️ Services & Offres': [], '🔌 Accessoires & Divers': [] };
        details.forEach(item => {
            if (item.includes('📱') || item.includes('♻️')) groups['📱 Mobiles & Terminaux'].push(item);
            else if (item.includes('🛒') || item.includes('↩️')) groups['🔌 Accessoires & Divers'].push(item);
            else groups['🛡️ Services & Offres'].push(item);
        });
            return groups;
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Analyse...</p></div>;

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedTeamCodes = Object.keys(currentStats).sort((a, b) => currentStats[b].CA - currentStats[a].CA);
    const nbVendeurs = sortedTeamCodes.length;

    return (
        <div className="modern-dashboard">
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle">Orange Perf</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge">
        <span className="ca-label">CA ACC. HT (Mois)</span>
        <span className="ca-val"><CountUp end={Math.round(globalData.ca)} suffix="€" /></span>
        </div>
        </div>

        {bigWin && viewMode === 'day' && (
            <div className="big-win-card slide-in">
            <div className="bw-icon">🏆</div>
            <div className="bw-info">
            <div className="bw-label">RECORD DU JOUR</div>
            <div className="bw-seller">{bigWin.seller} <span className="bw-amount">{Math.round(bigWin.amount)}€</span></div>
            <div className="bw-item">{bigWin.item}</div>
            </div>
            </div>
        )}

        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>
        <Clock size={14} /> Aujourd'hui
        </div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>
        <Calendar size={14} /> Ce Mois
        </div>
        </div>

        <div className="scroll-content">
        <div className="section-label">🎯 {viewMode === 'month' ? 'OBJECTIFS MENSUELS' : 'VENTES DU JOUR'}</div>
        <div className="global-scroll">

        <div className="stat-card featured pulse-effect" style={{cursor: 'pointer'}} onClick={() => openComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} maxValue={100} text={`${globalData.assur}%`} styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.3)' })} />
        </div>
        <div className="card-label" style={{color:'rgba(255,255,255,0.9)'}}>
        Taux Assur <BarChart2 size={12} style={{opacity:0.8, marginLeft:5}}/>
        </div>
        </div>

        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const current = viewMode === 'month' ? globalData.counts[key] : Object.values(statsDay).reduce((acc, s) => acc + s[key], 0);
            const target = config.objectifs[key];
            const dayTarget = Math.round(target / 25) || 1;
            const pct = Math.min(100, Math.round((current / (viewMode === 'month' ? target : dayTarget)) * 100));

            return (
                <div key={key} className="stat-card">
                <div className="icon-badge" style={{background: style.grad, color: '#fff', boxShadow: `0 3px 8px ${style.color}40`}}>
                {style.icon}
                </div>
                <div className="stat-value">
                <CountUp end={current} /> <span className="stat-target">{viewMode === 'month' ? `/ ${target}` : ''}</span>
                </div>
                <div className="progress-bar-mini">
                <div className="fill" style={{width: `${pct}%`, background: style.grad}}></div>
                </div>
                <div className="card-label">{style.label}</div>
                </div>
            )
        })}
        </div>

        <div className="section-label" style={{marginTop:'20px'}}>🏆 CLASSEMENT {viewMode === 'month' ? 'GÉNÉRAL' : 'DU JOUR'}</div>
        <div className="team-list">
        {sortedTeamCodes.map((code, index) => {
            const s = currentStats[code];
            if (viewMode === 'day' && s.CA === 0 && s.Terminaux === 0 && s.Mobile === 0) return null;

            let name = "Inconnu";
            config.team.split('\n').forEach(line => { if(line.includes(code)) name = line.split(':')[1].trim(); });
            const isTop = index < 3;
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            const txAssur = s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux)*100) : 0;
            return (
                <div key={code} className={`seller-card ${rankClass}`} onClick={() => setSelectedSeller({code, name, data: s})}>
                <div className="rank-badge">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</div>
                <div className="seller-avatar">
                {name[0]}
                {txAssur >= 50 && <div className="fire-badge">🔥</div>}
                </div>
                <div className="seller-info">
                <div className="seller-name">{name}</div>
                <div className="seller-kpi-row">
                <div className="kpi-pill">📱 {s.Terminaux}</div>
                <div className="kpi-pill" style={{background: txAssur >= 42 ? '#e8f5e9' : '#ffebee', color: txAssur >= 42 ? '#2e7d32' : '#c62828'}}>🛡️ {txAssur}%</div>
                </div>
                </div>
                <div className="seller-ca">
                <div className="ca-val"><CountUp end={Math.round(s.CA)} suffix="€" /></div>
                <ChevronRight size={16} color="#ccc" style={{marginLeft: 3}} />
                </div>
                </div>
            )
        })}
        {viewMode === 'day' && sortedTeamCodes.every(c => currentStats[c].CA === 0) && (
            <div style={{textAlign:'center', padding:'20px', color:'#999'}}>La journée commence ! ☀️</div>
        )}
        </div>
        </div>

        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-avatar-large">{selectedSeller.name[0]}</div>
            <div className="modal-title">
            <h2>{selectedSeller.name}</h2>
            <p>Détail {viewMode === 'month' ? 'Mensuel' : 'Journalier'}</p>
            </div>
            <div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div>
            </div>
            <div className="modal-scroll">
            {viewMode === 'month' && (
                <div className="projection-banner">
                🔮 Atterrissage estimé :
                <strong> {calculateLanding(selectedSeller.data.CA).toLocaleString()} €</strong>
                <div className="proj-sub">Basé sur le rythme actuel</div>
                </div>
            )}

            <div className="obj-grid">
            {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
                const indivTarget = Math.ceil(config.objectifs[key] / nbVendeurs);
                const current = selectedSeller.data[key];
                const landing = calculateLanding(current);
                const done = current >= indivTarget;
                const style = getCategoryStyle(key);

                return (
                    <div key={key} className={`obj-pill ${done ? 'done-glow' : ''}`} onClick={() => openComparison(key)}>
                    <div className="pill-icon" style={{background: style.grad, color: 'white', boxShadow: `0 2px 5px ${style.color}40`}}>
                    {style.icon}
                    </div>
                    <div className="pill-info">
                    <div className="pill-label">{style.label} <BarChart2 size={10} style={{opacity:0.6}}/></div>
                    <div className="pill-val">
                    <strong>{current}</strong>
                    {viewMode === 'month' && <span className="target-mini"> / {indivTarget}</span>}
                    </div>
                    <div className="mini-prog-track">
                    <div className="mini-prog-fill" style={{width: `${Math.min(100, (current/indivTarget)*100)}%`, background: done ? '#32C832' : style.grad}}></div>
                    </div>
                    {viewMode === 'month' && current < indivTarget && (
                        <div className="landing-mini" style={{color: landing >= indivTarget ? '#32C832' : '#FF7900'}}>
                        Att: {landing}
                        </div>
                    )}
                    </div>
                    {done && <div className="check-mark-anim">🏆</div>}
                    </div>
                )
            })}
            </div>

            <h3 className="history-title">Historique des ventes</h3>
            <div className="history-list">
            {selectedSeller.data.details.length === 0 ? <div style={{textAlign:'center', color:'#ccc'}}>Aucune vente sur cette période</div> :
            Object.entries(getGroupedSales(selectedSeller.data.details)).map(([groupName, items]) => (
                items.length > 0 && (
                    <div key={groupName} className="history-group">
                    <div className="history-cat-title">{groupName}</div>
                    {items.map((item, i) => (
                        <div key={i} className="history-item slide-in">{item}</div>
                    ))}
                    </div>
                )
            ))
            }
            </div>
            </div>
            </div>
            </div>
        )}

        {compareMode && (
            <div className="glass-overlay" style={{zIndex: 200}} onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" style={{height: 'auto', maxHeight:'60vh'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-title">
            <h2>VS L'Équipe</h2>
            <p>Classement {compareMode.category}</p>
            </div>
            <div className="close-btn" onClick={() => setCompareMode(null)}><X /></div>
            </div>
            <div style={{height: '300px', width: '100%'}}>
            <Bar
            data={{
                labels: compareMode.data.map(d => `${d.name} (${d.val}${compareMode.isPercent ? '%' : ''})`),
                         datasets: [{
                             data: compareMode.data.map(d => d.val),
                         backgroundColor: compareMode.data.map(d => d.isMe ? '#FF7900' : '#E0E0E0'),
                         borderRadius: 6,
                         barThickness: 20,
                         }]
            }}
            options={{
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display:false } }, y: { grid: { display:false }, ticks: { font: { size: 11, weight:'bold' } } } }
            }}
            />
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
