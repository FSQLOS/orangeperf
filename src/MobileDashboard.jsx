import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Calendar, Clock, Receipt, RefreshCw, Target, TrendingDown,
    Medal, Star, Award, Leaf, Info
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const CountUp = ({ end, suffix = "" }) => <span>{end}{suffix}</span>;

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function MobileDashboard({ config }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsMonth, setStatsMonth] = useState({});
    const [statsDay, setStatsDay] = useState({});
    const [globalData, setGlobalData] = useState({ ca: 0, assur: 0, counts: {} });
    const [viewMode, setViewMode] = useState('month');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [compareMode, setCompareMode] = useState(null);
    const [caModal, setCaModal] = useState(false);
    const [teamMap, setTeamMap] = useState({});

    const FAMILIES = {
        BOX: { label: "🌐 LIVEBOX", color: "#527EDB" },
        FORFAIT: { label: "📱 FORFAIT MOBILE", color: "#FF7900" },
        PRET: { label: "🔄 PRÊT MOBILE", color: "#9ca3af" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        DORO: { label: "👴 DORO", color: "#E6007E" },
        XIAOMI: { label: "📱 XIAOMI", color: "#FF6700" },
        HONOR: { label: "📱 HONOR", color: "#FF6800" },
        CROSSCALL: { label: "📱 CROSSCALL", color: "#FF6900" },
        GOOGLE: { label: "📱 GOOGLE", color: "#FF7000" },
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
    const KEY_NOT_TERM = ["COQUE", "VT", "QDOS", "PROTECTION", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "ADAPTATEUR", "PRISE", "ECOUTEUR", "KIT", "AUDIO", "BUDS", "AIRPODS", "FREEBUDS", "ENCEINTE", "SPEAKER", "SOUND", "MONTRE", "BRACELET", "WATCH", "BAND", "GALAXY FIT", "SUPPORT", "PACK", "LANIERE", "TAG", "TRACKER", "CLE", "USB", "CARTE", "MEMOIRE", "DISQUE", "HDD", "SSD", "SDXC", "MICROSD", "DRIVE"];
    const BLACKLIST_CA = ["FIXE", "DECT", "GIGASET", "PARAFOUDRE", "MULTIPRISE", "PILE", "SAC", "KRAFT", "CONFIGURATION", "ATELIER", "FLASH", "EXPERTE", "TIMBRE", "PLANCHE", "PHOTO", "IDENTITE", "MOBICARTE", "E-RECH"];
    const EXCLUDED_PRICES = [9, 24, 39];

    const getMonthInfo = () => {
        const d = new Date();
        const now = d.getDate();
        const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return { now, total, pct: now / total };
    };

    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (l.includes("PARAFOUDRE") || l.includes("MULTIPRISE")) return "AUTRE";
        if (l.includes("PRET")) return "PRET";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("VERRE") || l.includes("FILM") || l.includes("PROT") || l.includes("CAMERA LENS") || l.includes("FORCE GLASS") || l.includes("VT") || l.includes("QDOS") || l.includes("FORCE CASE")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("BRACELET") || l.includes("POWERBANK") || l.includes("AUDIO") || l.includes("ENCEINTE") || l.includes("AIRPODS") || l.includes("BANDOULIERE") || l.includes("BUDS") || l.includes("MONTRE") || l.includes("WATCH") || l.includes("M/L") || l.includes("USB") || l.includes("SUPPORT") || l.includes("SPRAY") || l.includes("RECHARGE FORCE")) return "ACC";
        if (l.includes("ASSURANCE") || CODES.Assurance.includes(code)) return "SERV";
        if (l.includes("CYBER")) return "HOME";
        if (l.includes("FLASH") || l.includes("EXPERTE") || l.includes("ATELIER")) return "TRANSFERTS";
        if (CODES.Broadband.includes(code)) return "BOX";
        if (CODES.Mobile.includes(code)) return "FORFAIT";

        if (l.includes("IPHONE") || l.includes("APPLE")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("DORO")) return "DORO";
        if (l.includes("XIAOMI") || l.includes("REDMI") || l.includes("POCO")) return "XIAOMI";
        if (l.includes("HONOR")) return "HONOR";
        if (l.includes("CROSSCALL") || l.includes("STELLAR")) return "CROSSCALL";
        if (l.includes("GOOGLE PIXEL")) return "GOOGLE";

        return "AUTRE";
    };

    const fetchData = () => {
        if (!config?.url) return;
        setRefreshing(true);
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl)
        .then(r => r.text())
        .then(t => {
            Papa.parse(t, { header: true, skipEmptyLines: true, complete: r => { processData(r.data); setRefreshing(false); } });
        })
        .catch(() => setRefreshing(false));
    };

    useEffect(() => { fetchData(); }, [config?.url]);

    const processData = (data) => {
        let currentTeamMap = {};
        if (config?.team) {
            config.team.trim().split('\n').forEach(line => { if (line.includes(':')) { const [c, n] = line.split(':'); currentTeamMap[c.trim()] = n.trim(); } });
        }
        setTeamMap(currentTeamMap);
        const teamCodes = Object.keys(currentTeamMap);
        let tMonth = {}, tDay = {};
        teamCodes.forEach(code => {
            const empty = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Reco: 0, Cyber: 0, MP: 0, Assurance: 0, CA: 0, nbAcc: 0, tickets: {} };
            tMonth[code] = JSON.parse(JSON.stringify(empty)); tDay[code] = JSON.parse(JSON.stringify(empty));
        });

        let g_CA = 0, g_Term = 0, g_Assur = 0, g_Counts = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Reco: 0, Cyber: 0, MP: 0, Assurance: 0 };
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

                // 1. DÉTECTION DES REMBOURSEMENTS
                const isRefund = caVal < 0;
                // On utilise la valeur absolue pour les tests de prix (ex: -500€ devient 500€ pour le test)
                const absVal = Math.abs(caVal);

                // 2. DÉFINITION DES CATÉGORIES
                const isWatch = lib.includes("WATCH") || lib.includes("MONTRE") || lib.includes("GALAXY FIT") || lib.includes("APPLE WATCH");
                const isForfait = lib.includes("FORFAIT") || lib.includes("OPEN") || lib.includes("SERIE") || lib.includes("INIT");
                const isPret = lib.includes("PRET");
                const isTransfert = lib.includes("FLASH") || lib.includes("EXPERTE") || lib.includes("ATELIER") || lib.includes("TRANSFERT") || lib.includes("CONFIGURATION");
                const isBlacklisted = BLACKLIST_CA.some(w => lib.includes(w)) || EXCLUDED_PRICES.includes(absVal);

                // 3. LOGIQUE TERMINAUX (On utilise absVal pour que les remboursements de tel soient reconnus)
                let isTerm = (KEY_STOCKAGE.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k)))
                && !KEY_NOT_TERM.some(k => lib.includes(k))
                && !isWatch
                && !lib.includes("COQUE")
                && !lib.includes("ETUI")
                && !lib.includes("PROTECTION")
                && absVal > 15 // On utilise absVal ici
                && !isPret;

                let isReco = isTerm && (lib.includes("RECO") || lib.includes("RECONDITIONNE") || lib.includes("OFFRE 2ND") || lib.includes("REC") || lib.includes("RENEWD") || lib.includes("RECOMMERCE"));

                // 4. CALCUL DU CA HT (On ignore les remboursements si tu veux un CA "Ventes Brutes")
                let ht = 0;

                if (isRefund) {
                    // Option A : Tu veux que les remboursements ne comptent pas du tout
                    ht = 0;
                } else {
                    if (isWatch) {
                        ht = caVal / 1.2;
                    } else if (!isTerm && !isBlacklisted && !isTransfert && !isPret && !isForfait) {
                        ht = caVal / 1.2;
                    }
                }

                let fam = getFamily(lib, codeArt);
                const article = { lib, fam, ca: caVal };

                // 5. MISE À JOUR DES COMPTEURS (On décrémente si c'est un remboursement)
                const modifier = isRefund ? -1 : 1;

                tMonth[v].CA += ht;
                g_CA += ht;

                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date: rowDate, items: [] };
                tMonth[v].tickets[ticketId].items.push(article);

                if (isTerm) {
                    tMonth[v].Terminaux += modifier;
                    g_Counts.Terminaux += modifier;
                    g_Term += modifier;
                    if(isReco){ tMonth[v].Reco += modifier; g_Counts.Reco += modifier; }
                }

                // Pour les accessoires, on ne décrémente que si tu veux le taux d'attache "Net"
                if ((fam === "ACC" || fam === "PROT" || isWatch) && absVal > 1) {
                    tMonth[v].nbAcc += modifier;
                }

                if (CODES.Broadband.includes(codeArt)) { tMonth[v].Broadband++; g_Counts.Broadband++; }
                if (CODES.Mobile.includes(codeArt)) { tMonth[v].Mobile++; g_Counts.Mobile++; }
                if (CODES.MIG.includes(codeArt)) { tMonth[v].MIG++; g_Counts.MIG++; }
                if (CODES.MEV.includes(codeArt)) { tMonth[v].MEV++; g_Counts.MEV++; }
                if (CODES.Cyber.includes(codeArt)) { tMonth[v].Cyber++; g_Counts.Cyber++; }
                if (CODES.MP.includes(codeArt)) { tMonth[v].MP++; g_Counts.MP++; }
                if (CODES.Assurance.includes(codeArt)) { tMonth[v].Assurance++; g_Counts.Assurance++; g_Assur++; }

                if (isToday) {
                    tDay[v].CA += ht;
                    if (!tDay[v].tickets[ticketId]) tDay[v].tickets[ticketId] = { date: rowDate, items: [] };
                    tDay[v].tickets[ticketId].items.push(article);
                    if (isTerm) { tDay[v].Terminaux++; if(isReco) tDay[v].Reco++; }
                    if ((fam === "ACC" || fam === "PROT" || isWatch) && !isParafoudre) tDay[v].nbAcc++;
                    if (CODES.Cyber.includes(codeArt)) tDay[v].Cyber++;
                }
            }
        });

        setGlobalData({ ca: g_CA, assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0, counts: g_Counts });
        setStatsMonth(tMonth); setStatsDay(tDay);
        setLoading(false);
    };

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedTeamCodes = Object.keys(currentStats).sort((a, b) => currentStats[b].CA - currentStats[a].CA);

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

    const openGlobalComparison = (category) => {
        const nbVendeurs = Object.keys(teamMap).length || 1;
        const objectives = config?.objectifs || {};
        let indivTarget = (category === 'TxAssur') ? 42 : (viewMode === 'month' ? Math.ceil((objectives[category] || 0) / nbVendeurs) : Math.ceil(((objectives[category] || 0) / 25) / nbVendeurs) || 1);
        const data = Object.keys(currentStats).map(code => {
            const s = currentStats[code];
            let val = (category === 'TxAssur') ? (s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0) : s[category];
            let color = (val >= indivTarget) ? '#10b981' : (val >= indivTarget / 2 ? '#f59e0b' : '#ef4444');
            return { name: teamMap[code] || code, val, color };
        }).sort((a, b) => b.val - a.val);
        setCompareMode({ category, data, isPercent: category === 'TxAssur', target: indivTarget });
    };

    const mInfo = getMonthInfo();
    const objTotalCA = config?.objectifs?.CA || 0;
    const prorataTarget = Math.round(objTotalCA * mInfo.pct);
    const diffCA = Math.round(globalData.ca - prorataTarget);
    const isAhead = diffCA >= 0;
    const landingCA = mInfo.now > 0 ? Math.round(globalData.ca / mInfo.now * mInfo.total) : 0;

    if (loading) return <div className="loader-screen">Chargement...</div>;

    return (
        <div className="modern-dashboard">
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle">Orange Boutique</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className={`ca-badge ${isAhead ? 'is-ahead' : 'is-behind'}`} onClick={() => setCaModal(true)} style={{cursor:'pointer'}}>
        <div className="ca-trend-dot"></div>
        <div className="ca-val">{Math.round(globalData.ca)}€</div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}><RefreshCw size={20} /></button>
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
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const count = viewMode === 'month' ? (globalData.counts[key] || 0) : Object.values(currentStats).reduce((acc, s) => acc + (s[key] || 0), 0);
            return (
                <div key={key} className="stat-card" onClick={() => openGlobalComparison(key)}>
                <div className="icon-badge" style={{ background: style.grad }}>{style.icon}</div>
                <div className="stat-value">{count}</div>
                <div className="card-label">{style.label}</div>
                </div>
            )
        })}
        </div>

        <div className="section-label">🏆 CLASSEMENT</div>
        <div className="team-list">
        {sortedTeamCodes.map((code, index) => {
            const s = currentStats[code];
            if (s.CA === 0 && s.Terminaux === 0) return null;
            const name = teamMap[code] || code;
            const attachRate = s.Terminaux > 0 ? (s.nbAcc / s.Terminaux).toFixed(1) : 0;
            const tauxReco = s.Terminaux > 0 ? Math.round((s.Reco / s.Terminaux) * 100) : 0;
            const baseCyber = (s.Broadband + s.MIG + s.MEV + s.Mobile);
            const tauxCyber = baseCyber > 0 ? Math.round((s.Cyber / baseCyber) * 100) : 0;

            return (
                <div key={code} className="seller-card-v2" onClick={() => setSelectedSeller({ code, name, data: s })}>
                <div className="seller-main-info">
                <div className="rank-badge">{index + 1}</div>
                <div className="name-box">
                <div className="name">{name}</div>
                <div className="basic-kpis">📱 {s.Terminaux} <span className="sep">|</span> 🛡️ {s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0}%</div>
                </div>
                </div>
                <div className="seller-metrics">
                <div className="metric-pill acc">ACC {attachRate}</div>
                <div className="metric-pill reco"><Leaf size={10}/> {tauxReco}%</div>
                <div className="metric-pill cyber"><Shield size={10}/> {tauxCyber}%</div>
                <div className="ca-box"><strong>{Math.round(s.CA)}€</strong> <ChevronRight size={14} color="#FF7900" /></div>
                </div>
                </div>
            )
        })}
        </div>

        <div className="section-label">📖 LÉGENDE DES INDICATEURS</div>
        <div className="legend-container">
        <div className="legend-group">
        <h3>Volumes (Totaux)</h3>
        <div className="legend-grid">
        <div className="legend-item"><Smartphone size={14}/> <span>Terminaux (Neufs + Reco)</span></div>
        <div className="legend-item"><Activity size={14} color="#FF7900"/> <span>Actes Mobiles (Ventes/Exclu)</span></div>
        <div className="legend-item"><Wifi size={14} color="#527EDB"/> <span>Livebox (Fibre/ADSL)</span></div>
        <div className="legend-item"><Shield size={14} color="#666"/> <span>Nombre d'Assurances</span></div>
        <div className="legend-item"><Zap size={14} color="#FFCC00"/> <span>MIG (Migrations vers Fibre)</span></div>
        <div className="legend-item"><TrendingUp size={14} color="#856404"/> <span>MEV (Montées en Version)</span></div>
        <div className="legend-item"><Home size={14} color="#32C832"/> <span>Maison Protégée</span></div>
        </div>
        </div>
        <div className="legend-group">
        <h3>Taux de performance (%)</h3>
        <div className="legend-grid">
        <div className="legend-item"><div className="pill-mini acc">ACC</div> <span>Nb Accessoires / Nb Terminaux</span></div>
        <div className="legend-item"><div className="pill-mini reco"><Leaf size={10}/></div> <span>Taux de Reconditionné / Terminaux</span></div>
        <div className="legend-item"><div className="pill-mini cyber"><Shield size={10}/></div> <span>Pénétration Cyber / (Box+Mig+Mev+Mob)</span></div>
        <div className="legend-item">🛡️ <span>Taux d'Assurance / Terminaux</span></div>
        </div>
        </div>
        </div>
        </div>

        {compareMode && (
            <div className="glass-overlay" onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" style={{height: 'auto', maxHeight:'80vh'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{compareMode.category}</h2><X onClick={() => setCompareMode(null)} /></div>
            <div style={{height: '380px', padding: '10px'}}>
            <Bar
            data={{ labels: compareMode.data.map(d => d.name), datasets: [{ data: compareMode.data.map(d => d.val), backgroundColor: compareMode.data.map(d => d.color), borderRadius: 8, barThickness: 28 }] }}
            options={{
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                layout: { padding: { right: 45, left: 10 } },
                plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'right', offset: 8, color: '#1a1a1a', font: { weight: 'bold', size: 13 }, formatter: (v) => v + (compareMode.isPercent ? '%' : '') } },
                         scales: { x: { display: false, beginAtZero: true, suggestedMax: Math.max(...compareMode.data.map(d => d.val)) * 1.2 }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' } } } }
            }}
            />
            </div>
            </div>
            </div>
        )}

        {caModal && (
            <div className="glass-overlay" onClick={() => setCaModal(false)}>
            <div className="glass-modal pop-in" onClick={e => e.stopPropagation()} style={{padding: '25px'}}>
            <div className="modal-header"><h2>Performance Boutique</h2><X onClick={() => setCaModal(false)} /></div>
            <div className="ro-container">
            <div className="ro-main-stat">
            <div className="ro-label">Réalisé au {mInfo.now} du mois</div>
            <div className="ro-value">{Math.round(globalData.ca)} €</div>
            </div>
            <div className="ro-grid">
            <div className="ro-card">
            <div className="ro-icon"><Target size={18} color="#666"/></div>
            <div className="ro-sublabel">Objectif Prorata</div>
            <div className="ro-subval">{prorataTarget} €</div>
            </div>
            <div className="ro-card" style={{borderColor: isAhead ? '#10b981' : '#ef4444'}}>
            <div className="ro-icon">{isAhead ? <TrendingUp size={18} color="#10b981"/> : <TrendingDown size={18} color="#ef4444"/>}</div>
            <div className="ro-sublabel">Écart R/O</div>
            <div className="ro-subval" style={{color: isAhead ? '#10b981' : '#ef4444'}}>{isAhead ? '+' : ''}{diffCA} €</div>
            </div>
            </div>
            <div className="ro-footer-card">
            <div className="ro-footer-item"><span>Objectif Total Mois</span><strong>{objTotalCA} €</strong></div>
            <div className="ro-footer-item"><span>Atterrissage estimé</span><strong style={{color: landingCA >= objTotalCA ? '#10b981' : '#f59e0b'}}>{landingCA} €</strong></div>
            </div>
            </div>
            </div>
            </div>
        )}

        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{selectedSeller.name}</h2><X onClick={() => setSelectedSeller(null)} /></div>
            <div className="modal-scroll">
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-group-card">
                <div className="ticket-header"><span><Receipt size={14}/> #{id}</span><span>{ticket.date}</span></div>
                {Object.entries(FAMILIES).map(([famKey, famInfo]) => {
                    const itemsInFam = ticket.items.filter(i => i.fam === famKey);
                    if (itemsInFam.length === 0) return null;
                    return (
                        <div key={famKey} style={{marginBottom: '10px'}}>
                        <div style={{fontSize: '10px', fontWeight: 'bold', color: famInfo.color, marginBottom: '4px'}}>{famInfo.label}</div>
                        {itemsInFam.map((item, idx) => (
                            <div key={idx} className="ticket-line"><span>{item.lib}</span><strong>{item.ca > 0 ? Math.round(item.ca)+'€' : ''}</strong></div>
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

        <style jsx>{`
            .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
            .global-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 10px 15px; scrollbar-width: none; }
            .stat-card { min-width: 100px; background: white; border-radius: 20px; padding: 15px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .stat-card.featured { background: #FF7900; color: white; }
            .circular-wrap { width: 50px; height: 50px; margin-bottom: 8px; }
            .icon-badge { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; color: white; }
            .stat-value { font-size: 18px; font-weight: 900; }
            .card-label { font-size: 10px; font-weight: bold; opacity: 0.8; margin-top: 4px; }
            .ca-badge { background: #1a1a1a; color: white; border-radius: 14px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; }
            .ca-val { font-weight: 900; font-size: 15px; }
            .ca-trend-dot { width: 8px; height: 8px; border-radius: 50%; }
            .ca-badge.is-ahead .ca-trend-dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
            .ca-badge.is-behind .ca-trend-dot { background: #ff4d4f; box-shadow: 0 0 8px #ff4d4f; }
            .seller-card-v2 { background: white; margin: 10px 15px; border-radius: 18px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .seller-main-info { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
            .rank-badge { width: 22px; height: 22px; background: #1a1a1a; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
            .name { font-weight: 800; font-size: 14px; }
            .basic-kpis { font-size: 11px; color: #666; }
            .seller-metrics { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
            .metric-pill { background: #f5f5f5; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: bold; display: flex; align-items: center; gap: 3px; }
            .ca-box { margin-left: auto; color: #FF7900; display: flex; align-items: center; gap: 4px; }
            .ticket-group-card { background: white; border-radius: 15px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .ticket-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 8px; font-size: 11px; color: #999; }
            .ticket-line { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px dashed #f0f0f0; }
            .ticket-line span { color: #333; flex: 1; padding-right: 10px; }
            .legend-container { background: white; margin: 0 15px 30px 15px; border-radius: 20px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
            .legend-group { margin-bottom: 15px; }
            .legend-group h3 { font-size: 12px; color: #FF7900; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #fff5eb; padding-bottom: 5px; }
            .legend-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
            .legend-item { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #444; }
            .legend-item span { color: #666; }
            .pill-mini { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; display: flex; align-items: center; }
            .pill-mini.acc { background: #f0f4ff; color: #527EDB; }
            .pill-mini.reco { background: #e6f7ed; color: #10b981; }
            .pill-mini.cyber { background: #f5f0ff; color: #6f42c1; }
            .ro-main-stat { text-align: center; margin-bottom: 20px; }
            .ro-label { font-size: 14px; color: #666; }
            .ro-value { font-size: 32px; font-weight: 900; color: #1a1a1a; }
            .ro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .ro-card { border: 1px solid #eee; padding: 12px; border-radius: 15px; text-align: center; }
            .ro-sublabel { font-size: 11px; color: #999; margin: 5px 0; }
            .ro-subval { font-size: 16px; font-weight: bold; }
            .ro-footer-card { background: #f9fafb; border-radius: 15px; padding: 15px; }
            .ro-footer-item { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; }
            `}</style>
            </div>
    );
}
