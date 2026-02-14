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
    // --- ÉTATS ---
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

    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 804287, 804285, 804283, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

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
        return styles[cat] || { icon: <AlertTriangle size={18} />, label: cat, grad: '#ccc' };
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
            let date = (r["Date"] || r["Date de pièce"] || r["Date Facture"] || "").toString();
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

                const article = { lib, fam: "AUTRE", ca };

                tMonth[v].CA += ht; g_CA += ht;
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date: date, items: [] };
                tMonth[v].tickets[ticketId].items.push(article);

                if (isTerm) { tMonth[v].Terminaux++; g_Term++; g_Counts.Terminaux++; }
                if (CODES.Broadband.includes(codeArt)) { tMonth[v].Broadband++; g_Counts.Broadband++; }
                if (CODES.Mobile.includes(codeArt)) { tMonth[v].Mobile++; g_Counts.Mobile++; }
                if (CODES.MIG.includes(codeArt)) { tMonth[v].MIG++; g_Counts.MIG++; }
                if (CODES.MEV.includes(codeArt)) { tMonth[v].MEV++; g_Counts.MEV++; }
                if (CODES.MP.includes(codeArt)) { tMonth[v].MP++; g_Counts.MP++; }
                if (CODES.Cyber.includes(codeArt)) { tMonth[v].Cyber++; g_Counts.Cyber++; }
                if (CODES.Assurance.includes(codeArt)) { tMonth[v].Assurance++; g_Counts.Assurance++; g_Assur++; }

                if (isToday) {
                    tDay[v].CA += ht;
                    if (isTerm) tDay[v].Terminaux++;
                    if (CODES.Broadband.includes(codeArt)) tDay[v].Broadband++;
                    if (CODES.Mobile.includes(codeArt)) tDay[v].Mobile++;
                    if (CODES.MIG.includes(codeArt)) tDay[v].MIG++;
                    if (CODES.MEV.includes(codeArt)) tDay[v].MEV++;
                    if (CODES.MP.includes(codeArt)) tDay[v].MP++;
                    if (CODES.Cyber.includes(codeArt)) tDay[v].Cyber++;
                    if (CODES.Assurance.includes(codeArt)) tDay[v].Assurance++;
                }
            }
        });
        setGlobalData({ ca: g_CA, counts: g_Counts, assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0 });
        setStatsMonth(tMonth); setStatsDay(tDay);
    };

    const openGlobalComparison = (category) => {
        const stats = viewMode === 'month' ? statsMonth : statsDay;
        const sellers = Object.keys(teamMap);
        const target = (category === 'TxAssur') ? 42 : Math.ceil((config.objectifs[category] || 0) / (sellers.length || 1));

        const data = sellers.map(c => {
            let val = (category === 'TxAssur') ? (stats[c]?.Terminaux > 0 ? Math.round((stats[c].Assurance / stats[c].Terminaux) * 100) : 0) : (stats[c]?.[category] || 0);
            return { name: teamMap[c], val, color: (val >= target ? '#10b981' : (val >= target / 2 ? '#f59e0b' : '#ef4444')) };
        }).sort((a, b) => b.val - a.val);

        setCompareMode({ category, data, isPercent: category === 'TxAssur', target });
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Initialisation...</p></div>;

    const mInfo = { now: new Date().getDate(), total: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() };
    const prorataTarget = Math.round((config.objectifs['CA'] || 0) * (mInfo.now / mInfo.total));
    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedCodes = Object.keys(currentStats).sort((a,b) => currentStats[b].CA - currentStats[a].CA);

    return (
        <div className="app-container loaded">
        <div className="modern-dashboard">
        {/* HEADER */}
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle" style={{fontSize: '9px', opacity: 0.6}}>ORANGE PERF</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge" onClick={() => setCaModal(true)}>
        <span className="ca-label">CA ACC. HT</span>
        <div className="ca-val"><CountUp end={Math.round(globalData.ca)} suffix="€" /></div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}><RefreshCw size={20}/></button>
        </div>

        {/* TOGGLES */}
        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}><Clock size={14}/> Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}><Calendar size={14}/> Mois</div>
        </div>

        {/* KPI BANDEAU */}
        <div className="scroll-content">
        <div className="section-label">🎯 ÉQUIPE</div>
        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openGlobalComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({pathColor:'#fff', textColor:'#fff', trailColor:'rgba(255,255,255,0.3)'})}/>
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(k => {
            const style = getCategoryStyle(k);
            const val = viewMode === 'month' ? (globalData.counts[k] || 0) : Object.values(currentStats).reduce((a, s) => a + (s[k] || 0), 0);
            return (
                <div key={k} className="stat-card" onClick={() => openGlobalComparison(k)}>
                <div className="icon-badge" style={{background: style.grad}}>{style.icon}</div>
                <div className="stat-value">{val}</div>
                <div className="card-label">{style.label}</div>
                </div>
            )
        })}
        </div>

        {/* CLASSEMENT */}
        <div className="section-label">🏆 CLASSEMENT CA ACC</div>
        <div className="team-list">
        {sortedCodes.map((c, i) => (
            <div key={c} className="seller-card" onClick={() => setSelectedSeller({ name: teamMap[c], data: currentStats[c] })}>
            <div className="rank-badge">#{i+1}</div>
            <div className="seller-avatar">{teamMap[c][0]} {i === 0 && '👑'}</div>
            <div className="seller-info">
            <div className="seller-name">{teamMap[c]}</div>
            <div className="seller-kpi-row">
            <span className="kpi-pill">📱 {currentStats[c].Terminaux}</span>
            <span className="kpi-pill">🛡️ {currentStats[c].Terminaux > 0 ? Math.round((currentStats[c].Assurance / currentStats[c].Terminaux)*100) : 0}%</span>
            </div>
            </div>
            <div className="seller-ca"><strong>{Math.round(currentStats[c].CA)}€</strong> <ChevronRight size={14}/></div>
            </div>
        ))}
        </div>
        </div>

        {/* MODALES */}
        {caModal && (
            <div className="glass-overlay" onClick={() => setCaModal(false)}>
            <div className="glass-modal pop-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Pilotage Boutique</h2><X onClick={() => setCaModal(false)}/></div>
            <div className="ro-main-stat"><div className="ro-label">Réalisé</div><div className="ro-value">{Math.round(globalData.ca)} €</div></div>
            <div className="ro-grid">
            <div className="ro-card"><div className="ro-sublabel">Obj. Prorata</div><div className="ro-subval">{prorataTarget} €</div></div>
            <div className="ro-card" style={{borderColor: globalData.ca >= prorataTarget ? '#10b981' : '#ef4444'}}><div className="ro-sublabel">Écart</div><div className="ro-subval">{Math.round(globalData.ca - prorataTarget)} €</div></div>
            </div>
            </div>
            </div>
        )}

        {compareMode && (
            <div className="glass-overlay" onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" style={{height:'auto', maxHeight:'80vh'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{compareMode.category}</h2><X onClick={() => setCompareMode(null)}/></div>
            <div style={{height:'350px', padding:'10px'}}><Bar data={{ labels: compareMode.data.map(d => d.name), datasets: [{ data: compareMode.data.map(d => d.val), backgroundColor: compareMode.data.map(d => d.color), borderRadius: 8 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { datalabels: { anchor:'end', align:'right', color:'#000', font:{weight:'bold'}, formatter: v => v + (compareMode.isPercent ? '%' : '') }, legend: {display:false} }, scales: { x: { display: false }, y: { grid: { display: false } } } }} /></div>
            </div>
            </div>
        )}

        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{selectedSeller.name}</h2><X onClick={() => setSelectedSeller(null)}/></div>
            <div className="modal-scroll" style={{overflowY:'auto', maxHeight:'60vh'}}>
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, t]) => (
                <div key={id} className="ticket-group-card" style={{background:'#f9fafb', padding:'12px', borderRadius:'12px', marginBottom:'10px'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'11px', color:'#666'}}><span>Ticket #{id}</span><span>{t.date}</span></div>
                {t.items.map((it, idx) => (
                    <div key={idx} style={{display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'2px 0'}}><span>{it.lib}</span><strong>{Math.round(it.ca)}€</strong></div>
                ))}
                </div>
            ))}
            </div>
            </div>
            </div>
        )}
        </div>
        </div>
    );
}
