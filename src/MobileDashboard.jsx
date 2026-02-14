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
    const [globalData, setGlobalData] = useState({
        ca: 0, assur: 0,
        counts: { Terminaux:0, Mobile:0, Broadband:0, MIG:0, MEV:0, MP:0, Cyber:0 }
    });

    // --- CONFIG DES TROPHÉES ---
    const TROPHY_TITLES = {
        TxAssur: { title: "L'Ange Gardien du Stock", sub: "Personne ne sort sans filet ici !" },
        Terminaux: { title: "Le Magnat du Silicium", sub: "Il vend plus de dalles que Saint-Gobain." },
        Mobile: { title: "Le Dealer de Gigas", sub: "La SIM coule dans ses veines." },
        Broadband: { title: "L'Amiral du Wi-Fi", sub: "Il capte la fibre même au fond de la cave." },
        MIG: { title: "L'Éclair de la Fibre", sub: "Migration plus rapide que son ombre." },
        MEV: { title: "Le MacGyver des Options", sub: "Il te rajoute du contenu sans que tu clignes." },
        MP: { title: "Le Domoticien Suprême", sub: "Même son grille-pain est connecté." },
        Cyber: { title: "Le Videur du Web", sub: "Antivirus humain." }
    };

    const FAMILIES = {
        BOX: { label: "🌐 LIVEBOX", color: "#527EDB" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        DORO: { label: "👴 DORO", color: "#E6007E" },
        XIAOMI: { label: "📱 XIAOMI / AUTRES", color: "#FF6700" },
        PROT: { label: "🛡️ PROTECTION", color: "#059669" },
        ACC: { label: "🎧 ACCESSOIRES", color: "#4b5563" },
        TRANSFERTS: { label: "📲 TRANSFERTS", color: "#4F46E5" },
        SERV: { label: "✨ SERVICES / ASSUR", color: "#FF7900" },
        AUTRE: { label: "📦 DIVERS", color: "#9ca3af" }
    };

    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 804287, 804285, 804283, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO", "64 GO", "64GO", "32 GO", "32GO"];
    const KEY_MODELE = ["L30", "WIRE", "15C", "REDMI", "X5C", "A15", "A25", "A35", "A55", "REDMI NOTE", "CROSSCALL STELLAR"];
    const KEY_NOT_TERM = ["COQUE", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "ADAPTATEUR", "PRISE", "ECOUTEUR", "KIT", "AUDIO", "BUDS", "AIRPODS", "FREEBUDS", "ENCEINTE", "SPEAKER", "SOUND", "MONTRE", "BRACELET", "WATCH", "BAND", "GALAXY FIT", "SUPPORT", "PACK", "LANIERE", "TAG", "TRACKER", "CLE", "USB", "CARTE", "MEMOIRE", "DISQUE", "HDD", "SSD", "SDXC", "MICROSD", "DRIVE"];
    const BLACKLIST_CA = ["FIXE", "DECT", "GIGASET", "PARAFOUDRE", "MULTIPRISE", "PILE", "SAC", "KRAFT", "CONFIGURATION", "ATELIER", "FLASH", "EXPERTE", "TIMBRE", "PLANCHE", "PHOTO", "IDENTITE", "MOBICARTE", "E-RECH"];
    const EXCLUDED_PRICES = [9, 24, 39];

    // --- LOGIQUE CORE ---
    const playTrophySound = () => {
        const audio = new Audio('https://www.myinstants.com/media/sounds/call-of-duty-modern-warfare-2-level-up-track-2.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
    };

    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (CODES.Broadband.includes(code)) return "BOX";
        if (l.includes("FLASH") || l.includes("EXPERTE") || l.includes("ATELIER")) return "TRANSFERTS";
        if (l.includes("FORCE GLASS") || l.includes("FORCE CASE") || l.includes("SPRAY")) return "ACC";
        if (l.includes("IPHONE") || l.includes("APPLE") || l.includes("AIRPOD")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("DORO")) return "DORO";
        if (l.includes("XIAOMI") || l.includes("REDMI") || l.includes("POCO") || l.includes("HONOR")) return "XIAOMI";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("VERRE") || l.includes("FILM") || l.includes("PROT")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("AUDIO") || l.includes("BUDS") || l.includes("MONTRE") || l.includes("USB") || l.includes("SUPPORT")) return "ACC";
        if (l.includes("ASSURANCE") || l.includes("CYBER") || l.includes("SERVICE") || CODES.Assurance.includes(code)) return "SERV";
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
            const empty = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Cyber: 0, MP: 0, Assurance: 0, CA: 0, tickets: {} };
            tMonth[code] = JSON.parse(JSON.stringify(empty));
            tDay[code] = JSON.parse(JSON.stringify(empty));
        });

        let g_CA = 0, g_Term = 0, g_Assur = 0, g_Counts = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Cyber: 0, MP: 0, Assurance: 0 };
        const d = new Date();
        const todayFormats = [`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`, `${d.getDate()}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`];

        data.forEach(row => {
            let cleanRow = {}; Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
            let rowDate = (cleanRow["Date"] || cleanRow["Date de pièce"] || cleanRow["Date Facture"] || "").toString();
            if (!rowDate) return;
            let ticketId = cleanRow["Ticket"] || cleanRow["N° Ticket"] || "SANS_TICKET";
            let isToday = todayFormats.some(f => rowDate.includes(f));
            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));

            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let lib = (cleanRow["Libellé Article"] || "").toString().toUpperCase().trim();
                let caVal = parseFloat((cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
                if (lib.startsWith("WP")) return;

                let isTerm = (KEY_STOCKAGE.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k))) && !KEY_NOT_TERM.some(k => lib.includes(k));
                let isBlacklisted = BLACKLIST_CA.some(w => lib.includes(w)) || EXCLUDED_PRICES.includes(caVal);
                let ht = (!isTerm && !isBlacklisted) ? caVal / 1.2 : 0;
                const article = { lib, fam: getFamily(lib, codeArt), ca: caVal };

                tMonth[v].CA += ht; g_CA += ht;
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date: rowDate, items: [] };
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
                    if (!tDay[v].tickets[ticketId]) tDay[v].tickets[ticketId] = { date: rowDate, items: [] };
                    tDay[v].tickets[ticketId].items.push(article);
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

        setGlobalData({ ca: g_CA, assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0, counts: g_Counts });
        setStatsMonth(tMonth); setStatsDay(tDay);
    };

    const openGlobalComparison = (category) => {
        const stats = viewMode === 'month' ? statsMonth : statsDay;
        const nbVendeurs = Object.keys(teamMap).length || 1;
        let target = (category === 'TxAssur') ? 42 : (viewMode === 'month' ? Math.ceil((config.objectifs[category] || 0) / nbVendeurs) : Math.ceil(((config.objectifs[category] || 0) / 25) / nbVendeurs) || 1);

        const data = Object.keys(stats).map(code => {
            const s = stats[code];
            let val = (category === 'TxAssur') ? (s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0) : s[category];
            let color = (val >= target) ? '#10b981' : (val >= target / 2 ? '#f59e0b' : '#ef4444');
            return { name: teamMap[code] || code, val, color };
        }).sort((a, b) => b.val - a.val);

        setCompareMode({ category, data, isPercent: category === 'TxAssur', target });

        if (data[0] && data[0].val > 0) {
            playTrophySound();
            setActiveTrophy({ name: data[0].name, title: TROPHY_TITLES[category]?.title, sub: TROPHY_TITLES[category]?.sub });
            setTimeout(() => setActiveTrophy(null), 4500);
        }
    };

    const mInfo = { now: new Date().getDate(), total: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() };
    const prorataTarget = Math.round((config.objectifs['CA'] || 0) * (mInfo.now / mInfo.total));
    const isAhead = globalData.ca >= prorataTarget;

    if (loading) return (
        <div className="loading-screen">
        <div className="ps5-loader"></div>
        <div className="loading-text">Initialisation des scores...</div>
        </div>
    );

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedTeamCodes = Object.keys(currentStats).sort((a, b) => currentStats[b].CA - currentStats[a].CA);

    return (
        <div className={`app-container loaded`}>
        <div className="modern-dashboard">
        {activeTrophy && (
            <div className="ps-trophy-container">
            <div className="ps-trophy-card">
            <div className="ps-gold-circle"><Trophy size={26} color="white" /></div>
            <div className="ps-trophy-text">
            <div className="ps-trophy-user">{activeTrophy.name} A PASSÉ UN NIVEAU !</div>
            <div className="ps-trophy-title">{activeTrophy.title}</div>
            <div className="ps-trophy-sub">{activeTrophy.sub}</div>
            </div>
            </div>
            </div>
        )}

        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle" style={{fontSize: '10px', color: '#999', textTransform: 'uppercase'}}>Orange Perf</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge" onClick={() => setCaModal(true)} style={{cursor: 'pointer'}}>
        <span className="ca-label">CA ACC. HT</span>
        <span className="ca-val"><CountUp end={Math.round(globalData.ca)} suffix="€" /></span>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}>
        <RefreshCw size={20} />
        </button>
        </div>

        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}><Clock size={14} /> Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}><Calendar size={14} /> Mois</div>
        </div>

        <div className="scroll-content">
        <div className="section-label">🎯 ÉQUIPE</div>
        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openGlobalComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.3)' })} />
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => (
            <div key={key} className="stat-card" onClick={() => openGlobalComparison(key)}>
            <div className="stat-value">{viewMode === 'month' ? (globalData.counts[key] || 0) : Object.values(currentStats).reduce((acc, s) => acc + (s[key] || 0), 0)}</div>
            <div className="card-label">{key === 'Broadband' ? 'Box' : key === 'MP' ? 'Maison P.' : key}</div>
            </div>
        ))}
        </div>

        <div className="section-label">🏆 CLASSEMENT CA ACC</div>
        <div className="team-list">
        {sortedTeamCodes.map((code, index) => {
            const s = currentStats[code];
            if (s.CA === 0 && s.Terminaux === 0) return null;
            const name = teamMap[code] || code;
            return (
                <div key={code} className={`seller-card rank-${index + 1}`} onClick={() => setSelectedSeller({ code, name, data: s })}>
                <div className="rank-badge">{index + 1}</div>
                <div className="seller-avatar">{name[0]} {index === 0 && <span className="king-crown">👑</span>}</div>
                <div className="seller-info">
                <div className="seller-name">{name}</div>
                <div className="seller-kpi-row">
                <span className="kpi-pill">📱 {s.Terminaux}</span>
                <span className="kpi-pill">🛡️ {s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0}%</span>
                </div>
                </div>
                <div className="seller-ca"><strong>{Math.round(s.CA)}€</strong> <ChevronRight size={14} /></div>
                </div>
            )
        })}
        </div>
        </div>

        {/* MODALES RE-DÉVELOPPÉES */}
        {caModal && (
            <div className="glass-overlay" onClick={() => setCaModal(false)}>
            <div className="glass-modal pop-in" onClick={e => e.stopPropagation()} style={{padding: '25px'}}>
            <div className="modal-header"><h2>Performance CA HT</h2><div className="close-btn" onClick={() => setCaModal(false)}><X /></div></div>
            <div className="ro-container">
            <div className="ro-main-stat"><div className="ro-label">Réalisé au {mInfo.now}</div><div className="ro-value">{Math.round(globalData.ca)} €</div></div>
            <div className="ro-grid">
            <div className="ro-card"><div className="ro-sublabel">Obj. Prorata</div><div className="ro-subval">{prorataTarget} €</div></div>
            <div className="ro-card" style={{borderColor: isAhead ? '#10b981' : '#ef4444'}}><div className="ro-sublabel">Écart</div><div className="ro-subval" style={{color: isAhead ? '#10b981' : '#ef4444'}}>{isAhead ? '+' : ''}{Math.round(globalData.ca - prorataTarget)}€</div></div>
            </div>
            </div>
            </div>
            </div>
        )}

        {compareMode && (
            <div className="glass-overlay" onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" style={{height: 'auto', maxHeight:'80vh'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{compareMode.category}</h2><div className="close-btn" onClick={() => setCompareMode(null)}><X /></div></div>
            <div style={{height: '380px', padding: '10px'}}><Bar data={{ labels: compareMode.data.map(d => d.name), datasets: [{ data: compareMode.data.map(d => d.val), backgroundColor: compareMode.data.map(d => d.color), borderRadius: 8, barThickness: 28 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, layout: { padding: { right: 40 } }, plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'right', offset: 4, color: '#1a1a1a', font: { weight: 'bold', size: 13 }, formatter: (v) => v + (compareMode.isPercent ? '%' : '') } }, scales: { x: { display: false, beginAtZero: true }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' } } } } }} /></div>
            </div>
            </div>
        )}

        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{selectedSeller.name}</h2><div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div></div>
            <div className="modal-scroll">
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-group-card" style={{background: '#fff', borderRadius: '15px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                <div className="ticket-header" style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '10px'}}><span style={{fontWeight: 'bold', fontSize: '13px'}}><Receipt size={14}/> Ticket #{id}</span><span style={{fontSize: '11px'}}>{ticket.date}</span></div>
                {Object.entries(FAMILIES).map(([famKey, famInfo]) => {
                    const itemsInFam = ticket.items.filter(i => i.fam === famKey);
                    if (itemsInFam.length === 0) return null;
                    return (
                        <div key={famKey} style={{marginBottom: '10px'}}>
                        <div style={{fontSize: '10px', fontWeight: 'bold', color: famInfo.color}}>{famInfo.label}</div>
                        {itemsInFam.map((item, idx) => (
                            <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px dashed #f0f0f0'}}><span style={{flex: 1, paddingRight: '10px'}}>{item.lib}</span><span style={{fontWeight: 'bold'}}>{item.ca > 0 ? Math.round(item.ca)+'€' : ''}</span></div>
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
        </div>
        </div>
    );
}
