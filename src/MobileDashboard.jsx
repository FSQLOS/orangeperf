import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Trophy, Calendar, Clock, Receipt, RefreshCw, Target, TrendingDown, Tag
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
        BOX: { label: "🌐 LIVEBOX", color: "#FF7900" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        PROT: { label: "🛡️ PROTECTION", color: "#059669" },
        ACC: { label: "🎧 ACCESSOIRES", color: "#4b5563" },
        SERV: { label: "✨ SERVICES", color: "#9333EA" },
        AUTRE: { label: "📦 DIVERS", color: "#9ca3af" }
    };

    // --- LE STYLE VISUEL DES TUILES (RETOUR AUX DÉGRADÉS) ---
    const getCategoryStyle = (cat) => {
        const styles = {
            'Terminaux': { icon: <Smartphone size={18} />, color: '#1a1a1a', label: 'Terminaux', grad: 'linear-gradient(135deg, #2c3e50, #000000)' },
            'Mobile': { icon: <Activity size={18} />, color: '#FF7900', label: 'Mobile', grad: 'linear-gradient(135deg, #FF7900, #ff9e42)' },
            'Broadband': { icon: <Wifi size={18} />, color: '#527EDB', label: 'Box', grad: 'linear-gradient(135deg, #527EDB, #82aaff)' },
            'MIG': { icon: <Zap size={18} />, color: '#FFCC00', label: 'MIG', grad: 'linear-gradient(135deg, #f1c40f, #fee16b)' },
            'MEV': { icon: <TrendingUp size={18} />, color: '#d4a017', label: 'MEV', grad: 'linear-gradient(135deg, #d4a017, #f6c23e)' },
            'Cyber': { icon: <Shield size={18} />, color: '#6f42c1', label: 'Cyber', grad: 'linear-gradient(135deg, #6f42c1, #a66efa)' },
            'MP': { icon: <Home size={18} />, color: '#32C832', label: 'Maison P.', grad: 'linear-gradient(135deg, #32C832, #6cdf6c)' }
        };
        return styles[cat] || { icon: <AlertTriangle size={18} />, color: '#999', label: cat, grad: '#eee' };
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
            tMonth[code] = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Cyber: 0, MP: 0, Assurance: 0, CA: 0, tickets: {} };
            tDay[code] = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Cyber: 0, MP: 0, Assurance: 0, CA: 0, tickets: {} };
        });

        let g_CA = 0, g_Term = 0, g_Assur = 0, g_Counts = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Cyber: 0, MP: 0, Assurance: 0 };
        const d = new Date();
        const todayStr = [`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`, `${d.getDate()}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`];

        data.forEach(row => {
            let r = {}; Object.keys(row).forEach(k => r[k.trim()] = row[k]);
            let date = (r["Date"] || r["Date de pièce"] || "").toString();
            if (!date) return;
            let ticketId = r["Ticket"] || r["N° Ticket"] || "SANS_TICKET";
            let vRaw = (r["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(c => vRaw.includes(c));
            let isToday = todayStr.some(f => date.includes(f));

            if (v) {
                let codeArt = parseInt(r["Code Article"]);
                let lib = (r["Libellé Article"] || "").toString().toUpperCase().trim();
                let ca = parseFloat((r["Montant TTC"] || "0").replace(',', '.')) || 0;
                if (lib.startsWith("WP")) return;

                const KEY_MODELE = ["L30", "WIRE", "15C", "REDMI", "X5C", "A15", "A25", "A35", "A55", "REDMI NOTE", "CROSSCALL STELLAR"];
                const KEY_STOCK = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "64 GO", "32 GO"];
                const KEY_NOT_TERM = ["COQUE", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "BUDS", "MONTRE", "WATCH", "ENCEINTE", "AUDIO", "CLE"];
                const BLACKLIST = ["FIXE", "DECT", "GIGASET", "PILE", "SAC", "KRAFT", "FLASH", "EXPERTE", "ATELIER", "TIMBRE", "PHOTO", "IDENTITE", "MOBICARTE"];

                let isTerm = (KEY_STOCK.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k))) && !KEY_NOT_TERM.some(k => lib.includes(k));
                let isBlack = BLACKLIST.some(k => lib.includes(k)) || [9, 24, 39].includes(ca);
                let ht = (!isTerm && !isBlack) ? ca / 1.2 : 0;

                const article = { lib, fam: "AUTRE", ca }; // Simplifié pour le détail

                tMonth[v].CA += ht; g_CA += ht;
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date: date, items: [] };
                tMonth[v].tickets[ticketId].items.push(article);

                const CODES = {
                    Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
                     Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
                };

                if (isTerm) { tMonth[v].Terminaux++; g_Term++; g_Counts.Terminaux++; }
                if (CODES.Broadband.includes(codeArt)) { tMonth[v].Broadband++; g_Counts.Broadband++; }
                // ... (Reste de la logique simplifiée pour la démo, garde ta logique CODES complète ici)

                if (isToday) {
                    tDay[v].CA += ht;
                    if (isTerm) tDay[v].Terminaux++;
                }
            }
        });
        setGlobalData({ ca: g_CA, counts: g_Counts, assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0 });
        setStatsMonth(tMonth); setStatsDay(tDay);
    };

    const openGlobalComparison = (category) => {
        const stats = viewMode === 'month' ? statsMonth : statsDay;
        const target = (category === 'TxAssur') ? 42 : Math.ceil((config.objectifs[category] || 0) / Object.keys(teamMap).length);
        const data = Object.keys(stats).map(c => {
            let val = (category === 'TxAssur') ? (stats[c].Terminaux > 0 ? Math.round((stats[c].Assurance / stats[c].Terminaux) * 100) : 0) : stats[c][category];
            return { name: teamMap[c], val, color: (val >= target ? '#10b981' : (val >= target / 2 ? '#f59e0b' : '#ef4444')) };
        }).sort((a, b) => b.val - a.val);
        setCompareMode({ category, data, isPercent: category === 'TxAssur', target });
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Chargement du Dashboard...</p></div>;

    const mInfo = { now: new Date().getDate(), total: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() };
    const currentStats = viewMode === 'month' ? statsMonth : statsDay;

    return (
        <div className="app-container loaded">
        <div className="modern-dashboard">
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle" style={{fontSize: '10px', color: '#999', textTransform: 'uppercase'}}>Orange Perf</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge" onClick={() => setCaModal(true)}>
        <span className="ca-label">CA ACC. HT</span>
        <div className="ca-val">{Math.round(globalData.ca)}€</div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}><RefreshCw size={20}/></button>
        </div>

        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}><Clock size={14}/> Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}><Calendar size={14}/> Mois</div>
        </div>

        <div className="scroll-content">
        <div className="section-label">🎯 ÉQUIPE (Cliquer pour comparer)</div>
        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openGlobalComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({pathColor:'#fff', textColor:'#fff', trailColor:'rgba(255,255,255,0.3)'})}/>
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const count = viewMode === 'month' ? (globalData.counts[key] || 0) : Object.values(currentStats).reduce((acc, s) => acc + (s[key] || 0), 0);
            return (
                <div key={key} className="stat-card" onClick={() => openGlobalComparison(key)}>
                <div className="icon-badge" style={{ background: style.grad }}>{style.icon}</div>
                <div className="stat-value">{count}</div>
                <div className="card-label">{style.label}</div>
                </div>
            );
        })}
        </div>

        <div className="section-label">🏆 CLASSEMENT CA ACC</div>
        <div className="team-list">
        {Object.keys(currentStats).sort((a,b) => currentStats[b].CA - currentStats[a].CA).map((c, i) => (
            <div key={c} className="seller-card" onClick={() => setSelectedSeller({ name: teamMap[c], data: currentStats[c] })}>
            <div className="rank-badge">#{i+1}</div>
            <div className="seller-avatar">{teamMap[c][0]} {i === 0 && '👑'}</div>
            <div className="seller-info">
            <div className="seller-name">{teamMap[c]}</div>
            <div className="seller-kpi-row">
            <span className="kpi-pill">📱 {currentStats[c].Terminaux}</span>
            <span className="kpi-pill">🛡️ {currentStats[c].Terminaux > 0 ? Math.round((currentStats[c].Assurance / currentStats[c].Terminaux) * 100) : 0}%</span>
            </div>
            </div>
            <div className="seller-ca"><strong>{Math.round(currentStats[c].CA)}€</strong> <ChevronRight size={14}/></div>
            </div>
        ))}
        </div>
        </div>

        {/* MODALES CA MODAL & COMPARE MODE ... (Garder le code précédent) */}
        </div>
        </div>
    );
}
