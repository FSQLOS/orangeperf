import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Trophy, Calendar, Clock, Receipt, RefreshCw, Target, TrendingDown
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
    const [activeTrophy, setActiveTrophy] = useState(null);

    // STRUCTURE INITIALE SÉCURISÉE
    const [globalData, setGlobalData] = useState({
        ca: 0, assur: 0,
        counts: { Terminaux:0, Mobile:0, Broadband:0, MIG:0, MEV:0, MP:0, Cyber:0 }
    });

    const FAMILIES = {
        BOX: { label: "🌐 LIVEBOX", color: "#527EDB" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        PROT: { label: "🛡️ PROTECTION", color: "#059669" },
        ACC: { label: "🎧 ACCESSOIRES", color: "#4b5563" },
        SERV: { label: "✨ SERVICES", color: "#FF7900" },
        AUTRE: { label: "📦 DIVERS", color: "#9ca3af" }
    };

    const TROPHY_TITLES = {
        TxAssur: { title: "L'Ange Gardien du Stock", sub: "Personne ne sort sans filet ici !" },
        Terminaux: { title: "Le Magnat du Silicium", sub: "Il vend plus de dalles que Saint-Gobain." },
        Mobile: { title: "Le Dealer de Gigas", sub: "La SIM coule dans ses veines." },
        Broadband: { title: "L'Amiral du Wi-Fi", sub: "Il capte la fibre même au fond de la cave." },
        MIG: { title: "L'Éclair de la Fibre", sub: "Migration plus rapide que son ombre." },
        MEV: { title: "Le MacGyver des Options", sub: "Il rajoute du divertissement." },
        Cyber: { title: "Le Videur du Web", sub: "Hacker-proof. Antivirus humain." }
    };

    // --- SON MW2 ---
    const playTrophySound = () => {
        const audio = new Audio('https://www.myinstants.com/media/sounds/call-of-duty-modern-warfare-2-level-up-track-2.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    };

    // --- LOGIQUE CALCUL ---
    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (l.includes("IPHONE") || l.includes("APPLE")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("COQUE") || l.includes("VERRE") || l.includes("FILM")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("BUDS")) return "ACC";
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
            let vRaw = (r["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(c => vRaw.includes(c));

            if (v) {
                let codeArt = parseInt(r["Code Article"]);
                let lib = (r["Libellé Article"] || "").toString().toUpperCase().trim();
                let ca = parseFloat((r["Montant TTC"] || "0").replace(',', '.')) || 0;

                // --- LOGIQUE CALCUL CA (Exclure Terminaux) ---
                const isTerm = (lib.includes("GO") || lib.includes("A15") || lib.includes("S24")) && !lib.includes("COQUE");
                const isBlack = ["SAC", "PILE", "FLASH"].some(k => lib.includes(k)) || [9, 24, 39].includes(ca);
                let ht = (!isTerm && !isBlack) ? ca / 1.2 : 0;

                tMonth[v].CA += ht; g_CA += ht;
                if (isTerm) { tMonth[v].Terminaux++; g_Term++; g_Counts.Terminaux++; }
                // ... (Reste de la logique CODES identique ici)

                if (!tMonth[v].tickets[r["Ticket"]]) tMonth[v].tickets[r["Ticket"]] = { date, items: [] };
                tMonth[v].tickets[r["Ticket"]].items.push({ lib, fam: getFamily(lib, codeArt), ca });
            }
        });
        setGlobalData({ ca: g_CA, counts: g_Counts, assur: g_Term > 0 ? Math.round((g_Assur/g_Term)*100) : 0 });
        setStatsMonth(tMonth); setStatsDay(tDay);
    };

    const openGlobalComparison = (category) => {
        const stats = viewMode === 'month' ? statsMonth : statsDay;
        const target = (category === 'TxAssur') ? 42 : Math.ceil((config.objectifs[category] || 0) / Object.keys(teamMap).length);

        const data = Object.keys(stats).map(c => {
            let val = (category === 'TxAssur') ? (stats[c].Terminaux > 0 ? Math.round((stats[c].Assurance / stats[c].Terminaux)*100) : 0) : stats[c][category];
            return { name: teamMap[c], val, color: (val >= target ? '#10b981' : '#ef4444') };
        }).sort((a,b) => b.val - a.val);

        setCompareMode({ category, data, isPercent: category === 'TxAssur', target });

        if (data[0] && data[0].val > 0) {
            playTrophySound();
            setActiveTrophy({ name: data[0].name, title: TROPHY_TITLES[category]?.title, sub: TROPHY_TITLES[category]?.sub });
            setTimeout(() => setActiveTrophy(null), 4500);
        }
    };

    const getCategoryStyle = (cat) => {
        const styles = {
            'Terminaux': { icon: <Smartphone size={18} />, label: 'Terminaux', grad: 'linear-gradient(135deg, #2c3e50, #000000)' },
            'Mobile': { icon: <Activity size={18} />, label: 'Mobile', grad: 'linear-gradient(135deg, #FF7900, #ff9e42)' },
            'Broadband': { icon: <Wifi size={18} />, label: 'Box', grad: 'linear-gradient(135deg, #527EDB, #82aaff)' },
            'Cyber': { icon: <Shield size={18} />, label: 'Cyber', grad: 'linear-gradient(135deg, #6f42c1, #a66efa)' }
        };
        return styles[cat] || { icon: <Zap size={18} />, label: cat, grad: '#ccc' };
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Lancement de la session...</p></div>;

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;

    return (
        <div className={`app-container loaded`}>
        <div className="modern-dashboard">
        {/* HEADER */}
        <div className="header-glass">
        <div className="title">Orange <span>Perf</span></div>
        <div className="ca-badge" onClick={() => setCaModal(true)}>
        <div className="ca-val">{Math.round(globalData.ca)}€</div>
        </div>
        </div>

        {/* KPI SCROLL */}
        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openGlobalComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({pathColor:'#fff', textColor:'#fff', trailColor:'rgba(255,255,255,0.3)'})}/>
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'Cyber'].map(k => {
            const style = getCategoryStyle(k);
            return (
                <div key={k} className="stat-card" onClick={() => openGlobalComparison(k)}>
                <div className="icon-badge" style={{background: style.grad}}>{style.icon}</div>
                <div className="stat-value">{globalData.counts[k]}</div>
                <div className="card-label">{style.label}</div>
                </div>
            )
        })}
        </div>

        {/* CLASSEMENT */}
        <div className="team-list">
        {Object.keys(currentStats).sort((a,b) => currentStats[b].CA - currentStats[a].CA).map((c, i) => (
            <div key={c} className="seller-card" onClick={() => setSelectedSeller({ name: teamMap[c], data: currentStats[c] })}>
            <div className="seller-avatar">{teamMap[c][0]} {i === 0 && <span className="king-crown">👑</span>}</div>
            <div className="seller-info">
            <div className="seller-name">{teamMap[c]}</div>
            <div className="kpi-pill">📱 {currentStats[c].Terminaux}</div>
            </div>
            <div className="seller-ca"><strong>{Math.round(currentStats[c].CA)}€</strong></div>
            </div>
        ))}
        </div>

        {/* MODALES GRAPHES */}
        {compareMode && (
            <div className="glass-overlay" onClick={() => setCompareMode(null)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Performance {compareMode.category}</h2><X onClick={() => setCompareMode(null)}/></div>
            <div style={{height:'350px'}}><Bar data={{ labels: compareMode.data.map(d => d.name), datasets: [{ data: compareMode.data.map(d => d.val), backgroundColor: compareMode.data.map(d => d.color), borderRadius: 8 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { datalabels: { anchor:'end', align:'right', color:'#000', font:{weight:'bold'}, formatter: v => v + (compareMode.isPercent ? '%' : '') } }, scales: { x: { display: false }, y: { grid: { display: false } } } }} /></div>
            </div>
            </div>
        )}

        {/* MODALE DÉTAILS VENDEUR (LISIBLE) */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Ventes de {selectedSeller.name}</h2><X onClick={() => setSelectedSeller(null)}/></div>
            <div className="modal-scroll" style={{maxHeight:'65vh', overflowY:'auto'}}>
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-group-card">
                <div className="ticket-header"><span className="ticket-id"><Receipt size={16} color="#FF7900" /> Ticket #{id}</span><span className="ticket-date">{ticket.date}</span></div>
                {Object.entries(FAMILIES).map(([famKey, famInfo]) => {
                    const items = ticket.items.filter(i => i.fam === famKey);
                    if (items.length === 0) return null;
                    return (
                        <div key={famKey} className="family-section">
                        <div className="family-label" style={{color:famInfo.color}}>{famInfo.label}</div>
                        {items.map((it, idx) => (
                            <div key={idx} className="item-row"><span>{it.lib}</span><strong>{Math.round(it.ca)}€</strong></div>
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

        {/* LE TROPHÉE : RENDU EN DERNIER POUR ÊTRE SUR LE DESSUS */}
        {activeTrophy && (
            <div className="ps-trophy-container">
            <div className="ps-trophy-card">
            <div className="ps-gold-circle"><Trophy size={28} color="white" fill="white" /></div>
            <div className="ps-trophy-text">
            <div style={{fontSize:'10px', color:'#ffd700', fontWeight:'800'}}>{activeTrophy.name} A PASSÉ UN NIVEAU !</div>
            <div className="ps-trophy-title">{activeTrophy.title}</div>
            <div className="ps-trophy-sub">{activeTrophy.sub}</div>
            </div>
            </div>
            </div>
        )}
        </div>
        </div>
    );
}
