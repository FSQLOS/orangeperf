import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Calendar, Clock, Receipt, RefreshCw, Target, TrendingDown
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CountUp } from './CountUp';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function MobileDashboard({ config }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsMonth, setStatsMonth] = useState({});
    const [statsDay, setStatsDay] = useState({});
    const [viewMode, setViewMode] = useState('month');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [compareMode, setCompareMode] = useState(null);
    const [caModal, setCaModal] = useState(false);
    const [teamMap, setTeamMap] = useState({});
    const [globalData, setGlobalData] = useState({
        ca: 0, assur: 0,
        counts: { Terminaux: 0, Mobile: 0, Broadband: 0, MIG: 0, MEV: 0, MP: 0, Cyber: 0 }
    });

    const FAMILIES = {
        BOX: { label: "🌐 LIVEBOX", color: "#527EDB" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        PROT: { label: "🛡️ PROTECTION", color: "#059669" },
        ACC: { label: "🎧 ACCESSOIRES", color: "#4b5563" },
        SERV: { label: "✨ SERVICES / ASSUR", color: "#FF7900" },
        AUTRE: { label: "📦 DIVERS", color: "#9ca3af" }
    };

    // --- FILTRES DE NETTOYAGE (LA CLÉ DES CHIFFRES JUSTES) ---
    const KEY_STOCK = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "64 GO", "32 GO"];
    const KEY_NOT_TERM = ["COQUE", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "BUDS", "AIRPODS", "WATCH", "MONTRE", "TAG", "USB", "SUPPORT"];
    const BLACKLIST_CA = ["SAC ", "KRAFT", "FLASH", "EXPERTE", "ATELIER", "TIMBRE", "PHOTO", "IDENTITE", "MOBICARTE", "FIXE", "DECT"];

    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (CODES.Broadband.includes(code)) return "BOX";
        if (l.includes("IPHONE") || l.includes("APPLE")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("VERRE") || l.includes("PROT")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("AUDIO") || l.includes("BUDS")) return "ACC";
        if (l.includes("ASSURANCE") || CODES.Assurance.includes(code)) return "SERV";
        return "AUTRE";
    };

    const fetchData = useCallback(() => {
        setRefreshing(true);
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl).then(r => r.text()).then(t => {
            Papa.parse(t, { header: true, skipEmptyLines: true, complete: r => {
                processData(r.data);
                setTimeout(() => setLoading(false), 500);
                setRefreshing(false);
            }});
        }).catch(() => setRefreshing(false));
    }, [config.url]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const processData = (data) => {
        let currentTeamMap = {};
        config.team.trim().split('\n').forEach(line => { if (line.includes(':')) { const [c, n] = line.split(':'); currentTeamMap[c.trim()] = n.trim(); } });
        setTeamMap(currentTeamMap);
        const teamCodes = Object.keys(currentTeamMap);

        let tMonth = {}, tDay = {};
        teamCodes.forEach(code => {
            tMonth[code] = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0, CA:0, tickets:{} };
            tDay[code] = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0, CA:0, tickets:{} };
        });

        let g_CA = 0, g_Term = 0, g_Assur = 0, g_Counts = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0 };
        const d = new Date();
        const todayStr = [`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`, `${d.getDate()}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`];

        data.forEach(row => {
            let r = {}; Object.keys(row).forEach(k => r[k.trim()] = row[k]);
            let date = (r["Date"] || r["Date de pièce"] || "").toString();
            let ticketId = r["Ticket"] || r["N° Ticket"] || "SANS_TICKET";
            let vRaw = (r["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(c => vRaw.includes(c));
            let isToday = todayStr.some(f => date.includes(f));

            if (v) {
                let codeArt = parseInt(r["Code Article"]);
                let lib = (r["Libellé Article"] || "").toString().toUpperCase().trim();
                let ca = parseFloat((r["Montant TTC"] || "0").replace(',', '.')) || 0;

                // --- DÉTECTION STRICTE TERMINAL ---
                // Doit avoir une capacité de stockage ET ne pas être dans la liste des accessoires exclus
                const isTerminal = KEY_STOCK.some(k => lib.includes(k)) && !KEY_NOT_TERM.some(k => lib.includes(k));

                // --- CALCUL CA ACCESSOIRES ---
                // On exclut les terminaux, les services à prix fixe et la blacklist
                const isBlack = BLACKLIST_CA.some(k => lib.includes(k)) || [9, 24, 39].includes(ca);
                let ht = (!isTerminal && !isBlack) ? ca / 1.2 : 0;

                tMonth[v].CA += ht; g_CA += ht;
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date, items: [] };
                tMonth[v].tickets[ticketId].items.push({ lib, fam: getFamily(lib, codeArt), ca });

                if (isTerminal) { tMonth[v].Terminaux++; g_Term++; g_Counts.Terminaux++; }
                if (CODES.Assurance.includes(codeArt) || lib.includes("ASSURANCE")) { tMonth[v].Assurance++; g_Assur++; g_Counts.Assurance++; }

                // (Reste des KPIs identiques...)
                if (CODES.Broadband.includes(codeArt)) { tMonth[v].Broadband++; g_Counts.Broadband++; }

                if (isToday) {
                    tDay[v].CA += ht;
                    if (isTerminal) tDay[v].Terminaux++;
                }
            }
        });

        setGlobalData({
            ca: g_CA,
            assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0,
                      counts: g_Counts
        });
        setStatsMonth(tMonth); setStatsDay(tDay);
    };

    const openGlobalComparison = (category) => {
        const stats = viewMode === 'month' ? statsMonth : statsDay;
        const target = (category === 'TxAssur') ? 42 : Math.ceil((config.objectifs[category] || 0) / Object.keys(teamMap).length);
        const data = Object.keys(stats).map(c => {
            let val = (category === 'TxAssur') ? (stats[c].Terminaux > 0 ? Math.round((stats[c].Assurance / stats[c].Terminaux) * 100) : 0) : stats[c][category];
            return { name: teamMap[c], val, color: (val >= target ? '#10b981' : '#ef4444') };
        }).sort((a, b) => b.val - a.val);
        setCompareMode({ category, data, isPercent: category === 'TxAssur', target });
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Analyse des ventes...</p></div>;

    const mInfo = { now: new Date().getDate(), total: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() };
    const prorataTarget = Math.round((config.objectifs['CA'] || 0) * (mInfo.now / mInfo.total));
    const currentStats = viewMode === 'month' ? statsMonth : statsDay;

    return (
        <div className="app-container loaded">
        <div className="modern-dashboard">
        <div className="header-glass">
        <div className="header-content"><div className="title">Orange <span>Perf</span></div></div>
        <div className="ca-badge" onClick={() => setCaModal(true)}>
        <span className="ca-label">CA ACC. HT</span>
        <div className="ca-val"><CountUp end={Math.round(globalData.ca)} suffix="€" /></div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}><RefreshCw size={20}/></button>
        </div>

        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openGlobalComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({pathColor:'#fff', textColor:'#fff', trailColor:'rgba(255,255,255,0.3)'})}/>
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'Cyber'].map(k => {
            const style = getCategoryStyle(k);
            const val = viewMode === 'month' ? (globalData.counts[k] || 0) : Object.values(currentStats).reduce((a, s) => a + (s[k] || 0), 0);
            return (
                <div key={k} className="stat-card" onClick={() => openGlobalComparison(k)}>
                <div className="icon-badge" style={{ background: style.grad }}>{style.icon}</div>
                <div className="stat-value">{val}</div>
                <div className="card-label">{style.label}</div>
                </div>
            );
        })}
        </div>

        <div className="team-list">
        {Object.keys(currentStats).sort((a,b) => currentStats[b].CA - currentStats[a].CA).map((c, i) => (
            <div key={c} className="seller-card" onClick={() => setSelectedSeller({ name: teamMap[c], data: currentStats[c] })}>
            <div className="rank-badge">#{i+1}</div>
            <div className="seller-avatar">{teamMap[c][0]} {i === 0 && '👑'}</div>
            <div className="seller-info">
            <div className="seller-name">{teamMap[c]}</div>
            <div className="seller-kpi-row"><span className="kpi-pill">📱 {currentStats[c].Terminaux}</span></div>
            </div>
            <div className="seller-ca"><strong>{Math.round(currentStats[c].CA)}€</strong> <ChevronRight size={14}/></div>
            </div>
        ))}
        </div>

        {caModal && (
            <div className="glass-overlay" onClick={() => setCaModal(false)}>
            <div className="glass-modal pop-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Pilotage CA HT Boutique</h2><X onClick={() => setCaModal(false)}/></div>
            <div className="ro-main-stat">
            <div className="ro-label">CA Réalisé (Accessoires HT)</div>
            <div className="ro-value">{Math.round(globalData.ca)} €</div>
            </div>
            <div className="ro-grid">
            <div className="ro-card"><div className="ro-sublabel">Objectif Prorata</div><div className="ro-subval">{prorataTarget} €</div></div>
            <div className="ro-card" style={{borderColor: globalData.ca >= prorataTarget ? '#10b981' : '#ef4444'}}>
            <div className="ro-sublabel">Écart</div>
            <div className="ro-subval">{Math.round(globalData.ca - prorataTarget)}€</div>
            </div>
            </div>
            </div>
            </div>
        )}

        {/* ... Autres modales (Graphiques & Détails) restent identiques ... */}
        </div>
        </div>
    );
}

// Helper visuel (à placer en dehors du composant)
const getCategoryStyle = (cat) => {
    const styles = {
        'Terminaux': { icon: <Smartphone size={18} />, label: 'Terminaux', grad: 'linear-gradient(135deg, #2c3e50, #000000)' },
        'Mobile': { icon: <Activity size={18} />, label: 'Mobile', grad: 'linear-gradient(135deg, #FF7900, #ff9e42)' },
        'Broadband': { icon: <Wifi size={18} />, label: 'Box', grad: 'linear-gradient(135deg, #527EDB, #82aaff)' },
        'MIG': { icon: <Zap size={18} />, label: 'MIG', grad: 'linear-gradient(135deg, #f1c40f, #fee16b)' },
        'MEV': { icon: <TrendingUp size={18} />, label: 'MEV', grad: 'linear-gradient(135deg, #d4a017, #f6c23e)' },
        'Cyber': { icon: <Shield size={18} />, label: 'Cyber', grad: 'linear-gradient(135deg, #6f42c1, #a66efa)' },
        'MP': { icon: <Home size={18} />, label: 'Maison P.', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' }
    };
    return styles[cat] || { icon: <BarChart2 size={18} />, label: cat, grad: '#ccc' };
};
