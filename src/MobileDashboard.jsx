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
        counts: { Terminaux: 0, Mobile: 0, Broadband: 0, MIG: 0, MEV: 0, MP: 0, Cyber: 0, Assurance: 0 }
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

    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 804287, 804285, 804283, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105, 803104]
    };

    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO", "64 GO", "64GO", "32 GO", "32GO"];
    const KEY_MODELE = ["L30", "WIRE", "15C", "REDMI", "X5C", "A15", "A25", "A35", "A55", "S24", "IPHONE", "PIXEL"];
    const KEY_NOT_TERM = ["COQUE", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "BUDS", "AIRPODS", "MONTRE"];
    const BLACKLIST_CA = ["FIXE", "DECT", "GIGASET", "PILE", "SAC", "KRAFT", "FLASH", "EXPERTE", "ATELIER", "TIMBRE", "PHOTO"];
    const EXCLUDED_PRICES = [9, 24, 39];

    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (CODES.Broadband.includes(code)) return "BOX";
        if (l.includes("IPHONE") || l.includes("APPLE")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("VERRE") || l.includes("PROT")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("AUDIO") || l.includes("BUDS")) return "ACC";
        if (l.includes("ASSURANCE") || l.includes("CYBER") || CODES.Assurance.includes(code)) return "SERV";
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

                const isAssur = CODES.Assurance.includes(codeArt) || lib.includes("ASSURANCE") || lib.includes("ASSUR ");
                const isTerminal = (KEY_STOCKAGE.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k))) && !KEY_NOT_TERM.some(k => lib.includes(k));
                const isBlack = BLACKLIST_CA.some(k => lib.includes(k)) || EXCLUDED_PRICES.includes(ca);

                let ht = (!isTerminal && !isBlack) ? ca / 1.2 : 0;

                // Cumul CA HT Accessoires
                tMonth[v].CA += ht; g_CA += ht;

                // Rangement par ticket pour le détail
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date, items: [] };
                tMonth[v].tickets[ticketId].items.push({ lib, fam: getFamily(lib, codeArt), ca });

                // KPIs
                if (isTerminal) { tMonth[v].Terminaux++; g_Term++; g_Counts.Terminaux++; }
                if (isAssur) { tMonth[v].Assurance++; g_Assur++; g_Counts.Assurance++; }
                if (CODES.Broadband.includes(codeArt)) { tMonth[v].Broadband++; g_Counts.Broadband++; }
                if (CODES.Mobile.includes(codeArt)) { tMonth[v].Mobile++; g_Counts.Mobile++; }
                if (CODES.MIG.includes(codeArt)) { tMonth[v].MIG++; g_Counts.MIG++; }
                if (CODES.MEV.includes(codeArt)) { tMonth[v].MEV++; g_Counts.MEV++; }
                if (CODES.MP.includes(codeArt)) { tMonth[v].MP++; g_Counts.MP++; }
                if (CODES.Cyber.includes(codeArt)) { tMonth[v].Cyber++; g_Counts.Cyber++; }

                if (isToday) {
                    tDay[v].CA += ht;
                    if (isTerminal) tDay[v].Terminaux++;
                    if (isAssur) tDay[v].Assurance++;
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

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Calcul des performances...</p></div>;

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

        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}><Clock size={14}/> Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}><Calendar size={14}/> Mois</div>
        </div>

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
            <div className="seller-kpi-row">
            <span className="kpi-pill">📱 {currentStats[c].Terminaux}</span>
            <span className="kpi-pill">🛡️ {currentStats[c].Terminaux > 0 ? Math.round((currentStats[c].Assurance / currentStats[c].Terminaux)*100) : 0}%</span>
            </div>
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
            <div className="ro-sublabel">Écart R/O</div>
            <div className="ro-subval" style={{color: globalData.ca >= prorataTarget ? '#10b981' : '#ef4444'}}>
            {globalData.ca >= prorataTarget ? '+' : ''}{Math.round(globalData.ca - prorataTarget)}€
            </div>
            </div>
            </div>
            </div>
            </div>
        )}

        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{selectedSeller.name}</h2><X onClick={() => setSelectedSeller(null)}/></div>
            <div className="modal-scroll" style={{maxHeight: '65vh', overflowY: 'auto'}}>
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-group-card" style={{border: '1px solid #eee', padding: '15px', borderRadius: '15px', marginBottom: '15px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px', marginBottom: '10px'}}>
                <span style={{fontWeight: '800', fontSize: '13px'}}><Receipt size={14} style={{marginRight: '5px'}}/> Ticket #{id}</span>
                <span style={{fontSize: '11px', color: '#999'}}>{ticket.date}</span>
                </div>
                {Object.entries(FAMILIES).map(([famKey, famInfo]) => {
                    const items = ticket.items.filter(i => i.fam === famKey);
                    if (items.length === 0) return null;
                    return (
                        <div key={famKey} style={{marginBottom: '10px'}}>
                        <div style={{fontSize: '10px', fontWeight: '800', color: famInfo.color, textTransform: 'uppercase'}}>{famInfo.label}</div>
                        {items.map((it, idx) => (
                            <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0'}}>
                            <span style={{flex: 1, paddingRight: '10px'}}>{it.lib}</span>
                            <strong>{it.ca > 0 ? Math.round(it.ca)+'€' : ''}</strong>
                            </div>
                        ))}
                        </div>
                    )
                })}
                </div>
            ))}
            </div>
            </div>
            </div>
        )}

        {compareMode && (
            <div className="glass-overlay" onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{compareMode.category}</h2><X onClick={() => setCompareMode(null)}/></div>
            <div style={{height:'350px', padding:'10px'}}>
            <Bar data={{ labels: compareMode.data.map(d => d.name), datasets: [{ data: compareMode.data.map(d => d.val), backgroundColor: compareMode.data.map(d => d.color), borderRadius: 8 }] }}
            options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'right', color: '#000', font: { weight: 'bold' }, formatter: v => v + (compareMode.isPercent ? '%' : '') } }, scales: { x: { display: false }, y: { grid: { display: false } } } }} />
            </div>
            </div>
            </div>
        )}
        </div>
        </div>
    );
}
