import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx'; // Lecture directe Excel
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

    // --- CONFIGURATION METIER ---
    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 805002, 805001, 805000, 804996, 804995, 804994, 804287, 804285, 804283, 804982, 804827, 804826, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO", "64 GO", "64GO", "32 GO", "32GO"];
    const KEY_MODELE = ["L30", "WIRE", "15C", "REDMI", "NOTE", "XIAOMI", "POCO", "X5C", "HONOR", "A15", "A25", "A35", "A55", "S23", "S24", "S25", "IPHONE", "PIXEL"];
    const KEY_NOT_TERM = ["COQUE", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "ADAPTATEUR", "PRISE", "ECOUTEUR", "KIT", "AUDIO", "BUDS", "AIRPODS", "FREEBUDS", "ENCEINTE", "SPEAKER", "SOUND", "MONTRE", "BRACELET", "WATCH", "BAND", "GALAXY FIT", "SUPPORT", "PACK", "LANIERE", "TAG", "TRACKER", "CLE", "USB", "CARTE", "MEMOIRE", "DISQUE", "HDD", "SSD", "SDXC", "MICROSD"];
    const KEY_REC = ["REC", "RECOND", "RECONDITIONN", "RENEWD", "OCCASION", "2ND VIE", "SECONDE VIE", "GRADE", "ECO", "RE-"];
    const BLACKLIST_CA = ["FIXE", "DECT", "GIGASET", "PARAFOUDRE", "MULTIPRISE", "PILE", "SAC", "KRAFT", "CONFIGURATION", "ATELIER", "FLASH", "EXPERTE", "TIMBRE", "PLANCHE", "PHOTO", "IDENTITE", "MOBICARTE", "E-RECH"];
    const EXCLUDED_PRICES = [9, 24, 39];

    // Helper Date (Format 13/2/2026)
    const getTodayStr = () => {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    };

    const calculateLanding = (val) => {
        const d = new Date().getDate();
        const t = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        return d > 0 ? Math.round((val / d) * t) : 0;
    };

    useEffect(() => {
        const fetchExcel = async () => {
            try {
                // Utilise ton lien direct OneDrive ici
                const response = await fetch(config.url);
                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                processData(json);
            } catch (err) {
                console.error("Erreur chargement Excel :", err);
                setLoading(false);
            }
        };
        fetchExcel();
    }, [config.url]);

    const processData = (data) => {
        let teamMap = {};
        config.team.trim().split('\n').forEach(line => {
            if(line.includes(':')) {
                const [c, n] = line.split(':');
                teamMap[c.trim()] = n.trim();
            }
        });

        const teamCodes = Object.keys(teamMap);
        let tMonth = {}, tDay = {};
        teamCodes.forEach(code => {
            const empty = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0, Cyber:0, MP:0, Assurance:0, REC:0, CA:0, details: [] };
            tMonth[code] = JSON.parse(JSON.stringify(empty));
            tDay[code] = JSON.parse(JSON.stringify(empty));
        });

        let g_CA = 0, g_Term = 0, g_Assur = 0, highestSale = { amount:0, seller:'', item:'' };
        let g_Counts = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0 };
        const todayStr = getTodayStr();

        data.forEach(row => {
            const vRaw = (row["Vendeur Doc."] || "").toString().toUpperCase();
            const v = teamCodes.find(code => vRaw.includes(code));
            if (!v) return;

            const rowDate = (row["Date"] || row["Date de pièce"] || "").toString();
            const isToday = rowDate.includes(todayStr);
            const libClean = (row["Libellé Article"] || "").toString().toUpperCase().trim();
            const codeArt = parseInt(row["Code Article"]);
            const caVal = parseFloat(row["Montant TTC"]) || 0;

            if (libClean.startsWith("WP")) return;

            // Fonction de mise à jour unique (évite le double comptage)
            const update = (cat, label, isCA = false, val = 0) => {
                if (isCA) {
                    tMonth[v].CA += val;
                    g_CA += val;
                    if (isToday) tDay[v].CA += val;
                } else {
                    tMonth[v][cat]++;
                    g_Counts[cat]++;
                    if (isToday) tDay[v][cat]++;
                }
                if (label) {
                    tMonth[v].details.push(label);
                    if (isToday) tDay[v].details.push(label);
                }
            };

            // BIG WIN
            if (isToday && caVal > highestSale.amount && !EXCLUDED_PRICES.includes(caVal)) {
                highestSale = { amount: caVal, seller: teamMap[v], item: libClean };
            }

            // DETECTION LOGIQUE
            const hasStockage = KEY_STOCKAGE.some(k => libClean.includes(k));
            const hasModele = KEY_MODELE.some(k => libClean.includes(k));
            const isAccessory = KEY_NOT_TERM.some(k => libClean.includes(k));
            const isTerm = (hasStockage || hasModele) && !isAccessory;

            if (isTerm) {
                update('Terminaux', (KEY_REC.some(k => libClean.includes(k)) ? "♻️ " : "📱 ") + libClean);
                g_Term++;
                if (libClean.includes("GOOGLE") || libClean.includes("PIXEL")) {
                    tMonth[v].Google++;
                    if (isToday) tDay[v].Google++;
                }
            } else {
                if (!BLACKLIST_CA.some(w => libClean.includes(w)) && !EXCLUDED_PRICES.includes(caVal)) {
                    const caHT = caVal / 1.2;
                    if (caVal !== 0) update(null, `${caVal > 0 ? "🛒" : "↩️"} ${libClean} (${Math.round(caHT)}€)`, true, caHT);
                }
            }

            // CODES ARTICLES
            if (CODES.Broadband.includes(codeArt)) update('Broadband', "🌐 " + libClean);
            else if (CODES.Mobile.includes(codeArt)) update('Mobile', "Sim " + libClean);
            else if (CODES.MIG.includes(codeArt)) update('MIG', "⚡ " + libClean);
            else if (CODES.MEV.includes(codeArt)) update('MEV', "🔧 " + libClean);
            else if (CODES.MP.includes(codeArt)) update('MP', "🏠 " + libClean);
            else if (CODES.Cyber.includes(codeArt)) update('Cyber', "🛡️ " + libClean);
            else if (CODES.Assurance.includes(codeArt)) {
                update('Assurance', "🛡️ Assur: " + libClean);
                g_Assur++;
            }
        });

        setGlobalData({
            ca: g_CA,
            assur: g_Term > 0 ? Math.round((g_Assur/g_Term)*100) : 0,
                      counts: g_Counts,
                      totalTerm: g_Term
        });
        setStatsMonth(tMonth);
        setStatsDay(tDay);
        if (highestSale.amount > 0) setBigWin(highestSale);
        setLoading(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    const getCategoryStyle = (cat) => {
        const styles = {
            'Terminaux': { icon: <Smartphone size={16} />, color: '#1a1a1a', label: 'Terminaux', grad: 'linear-gradient(135deg, #e0e0e0, #ffffff)' },
            'Mobile': { icon: <Activity size={16} />, color: '#FF7900', label: 'Mobile', grad: 'linear-gradient(135deg, #FF7900, #ff9e42)' },
            'Broadband': { icon: <Wifi size={16} />, color: '#527EDB', label: 'Box', grad: 'linear-gradient(135deg, #527EDB, #82aaff)' },
            'MIG': { icon: <Zap size={16} />, color: '#FFCC00', label: 'MIG', grad: 'linear-gradient(135deg, #FFCC00, #ffe066)' },
            'MEV': { icon: <TrendingUp size={16} />, color: '#856404', label: 'MEV', grad: 'linear-gradient(135deg, #d4a017, #f6c23e)' },
            'Cyber': { icon: <Shield size={16} />, color: '#6f42c1', label: 'Cyber', grad: 'linear-gradient(135deg, #6f42c1, #a66efa)' },
            'MP': { icon: <Home size={16} />, color: '#32C832', label: 'Maison P.', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' }
        };
        return styles[cat] || { icon: <AlertTriangle size={16} />, color: '#999', label: cat, grad: '#eee' };
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Synchronisation Excel...</p></div>;

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedCodes = Object.keys(currentStats).sort((a,b) => currentStats[b].CA - currentStats[a].CA);

    return (
        <div className="modern-dashboard">
        {/* HEADER */}
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

        {/* BIG WIN */}
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

        {/* TOGGLE */}
        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>
        <Clock size={14} /> Aujourd'hui
        </div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>
        <Calendar size={14} /> Ce Mois
        </div>
        </div>

        <div className="scroll-content">
        <div className="section-label">🎯 INDICATEURS</div>
        <div className="global-scroll">
        <div className="stat-card featured pulse-effect">
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.3)' })} />
        </div>
        <div className="card-label" style={{color:'#fff'}}>Taux Assur</div>
        </div>

        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const count = viewMode === 'month' ? globalData.counts[key] : Object.values(statsDay).reduce((acc, s) => acc + s[key], 0);
            const target = config.objectifs[key] || 0;
            const pct = target > 0 ? Math.min(100, Math.round((count/target)*100)) : 0;
            return (
                <div key={key} className="stat-card">
                <div className="icon-badge" style={{background: style.grad, color:'#fff'}}>{style.icon}</div>
                <div className="stat-value">{count} <span className="stat-target">{viewMode === 'month' ? `/ ${target}` : ''}</span></div>
                <div className="progress-bar-mini"><div className="fill" style={{width:`${pct}%`, background:style.grad}}></div></div>
                <div className="card-label">{style.label}</div>
                </div>
            );
        })}
        </div>

        <div className="section-label">🏆 CLASSEMENT</div>
        <div className="team-list">
        {sortedCodes.map((code, index) => {
            const s = currentStats[code];
            if (viewMode === 'day' && s.CA === 0 && s.Terminaux === 0) return null;
            const name = teamMap[code] || "Inconnu";
            const tx = s.Terminaux > 0 ? Math.round((s.Assurance/s.Terminaux)*100) : 0;
            return (
                <div key={code} className={`seller-card rank-${index+1}`} onClick={() => setSelectedSeller({code, name, data: s})}>
                <div className="rank-badge">{index+1}</div>
                <div className="seller-avatar">{name[0]} {tx >= 50 && <span className="fire-badge">🔥</span>}</div>
                <div className="seller-info">
                <div className="seller-name">{name}</div>
                <div className="seller-kpi-row">
                <span className="kpi-pill">📱 {s.Terminaux}</span>
                <span className="kpi-pill" style={{background: tx >= 42 ? '#e8f5e9' : '#ffebee'}}>🛡️ {tx}%</span>
                </div>
                </div>
                <div className="seller-ca"><strong>{Math.round(s.CA)}€</strong> <ChevronRight size={14}/></div>
                </div>
            );
        })}
        </div>
        </div>

        {/* MODAL VENDEUR */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-avatar-large">{selectedSeller.name[0]}</div>
            <div className="modal-title"><h2>{selectedSeller.name}</h2><p>Détail Performance</p></div>
            <div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div>
            </div>

            <div className="modal-scroll">
            {viewMode === 'month' && (
                <div className="projection-banner">
                🔮 Atterrissage estimé : <strong>{calculateLanding(selectedSeller.data.CA)}€</strong>
                <div className="proj-sub">Basé sur le rythme de vente actuel</div>
                </div>
            )}

            <div className="obj-grid">
            {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
                const style = getCategoryStyle(key);
                const val = selectedSeller.data[key];
                const target = Math.ceil((config.objectifs[key] || 0) / sortedCodes.length);
                const landing = calculateLanding(val);
                return (
                    <div key={key} className={`obj-pill ${val >= target ? 'done-glow' : ''}`}>
                    <div className="pill-icon" style={{background:style.grad}}>{style.icon}</div>
                    <div className="pill-info">
                    <div className="pill-label">{style.label}</div>
                    <div className="pill-val"><strong>{val}</strong> / {target}</div>
                    <div className="mini-prog-track"><div className="mini-prog-fill" style={{width:`${Math.min(100, (val/target)*100)}%`, background:style.grad}}></div></div>
                    {viewMode === 'month' && <div className="landing-mini">Att: {landing}</div>}
                    </div>
                    </div>
                );
            })}
            </div>

            <h3 className="history-title">Dernières ventes</h3>
            <div className="history-list">
            {selectedSeller.data.details.map((d, i) => <div key={i} className="history-item slide-in">{d}</div>)}
            </div>
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
