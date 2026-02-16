import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Calendar, Clock, Receipt, RefreshCw, Target, TrendingDown,
    Medal, Star, Award, Leaf
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
    const [caModal, setCaModal] = useState(false);
    const [teamMap, setTeamMap] = useState({});

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

    const getMonthInfo = () => {
        const d = new Date();
        const now = d.getDate();
        const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return { now, total, pct: now / total };
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

    const fetchData = () => {
        if (!config?.url) return;
        setRefreshing(true);
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl)
        .then(r => r.text())
        .then(t => {
            Papa.parse(t, {
                header: true,
                skipEmptyLines: true,
                complete: r => { processData(r.data); setRefreshing(false); }
            });
        })
        .catch(() => setRefreshing(false));
    };

    useEffect(() => { fetchData(); }, [config?.url]);

    const processData = (data) => {
        let currentTeamMap = {};
        if (config?.team) {
            config.team.trim().split('\n').forEach(line => {
                if (line.includes(':')) {
                    const [c, n] = line.split(':'); currentTeamMap[c.trim()] = n.trim();
                }
            });
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

                let isTerm = (KEY_STOCKAGE.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k))) && !KEY_NOT_TERM.some(k => lib.includes(k));
                let isReco = isTerm && (lib.includes("RECO") || lib.includes("RECONDITIONNE") || lib.includes("OFFRE 2ND"));
                let isBlacklisted = BLACKLIST_CA.some(w => lib.includes(w)) || EXCLUDED_PRICES.includes(caVal);
                let fam = getFamily(lib, codeArt);

                let ht = (!isTerm && !isBlacklisted) ? caVal / 1.2 : 0;
                const article = { lib, fam, ca: caVal };

                tMonth[v].CA += ht; g_CA += ht;
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date: rowDate, items: [] };
                tMonth[v].tickets[ticketId].items.push(article);

                // Comptage KPI
                if (isTerm) { tMonth[v].Terminaux++; g_Counts.Terminaux++; g_Term++; if(isReco){ tMonth[v].Reco++; g_Counts.Reco++; } }
                if (fam === "ACC" || fam === "PROT") { tMonth[v].nbAcc++; }
                if (CODES.Broadband.includes(codeArt)) { tMonth[v].Broadband++; g_Counts.Broadband++; }
                if (CODES.Mobile.includes(codeArt)) { tMonth[v].Mobile++; g_Counts.Mobile++; }
                if (CODES.MIG.includes(codeArt)) { tMonth[v].MIG++; g_Counts.MIG++; }
                if (CODES.MEV.includes(codeArt)) { tMonth[v].MEV++; g_Counts.MEV++; }
                if (CODES.Cyber.includes(codeArt)) { tMonth[v].Cyber++; g_Counts.Cyber++; }
                if (CODES.Assurance.includes(codeArt)) { tMonth[v].Assurance++; g_Counts.Assurance++; g_Assur++; }

                if (isToday) {
                    tDay[v].CA += ht;
                    if (!tDay[v].tickets[ticketId]) tDay[v].tickets[ticketId] = { date: rowDate, items: [] };
                    tDay[v].tickets[ticketId].items.push(article);
                    if (isTerm) { tDay[v].Terminaux++; if(isReco) tDay[v].Reco++; }
                    if (fam === "ACC" || fam === "PROT") tDay[v].nbAcc++;
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

    const mInfo = getMonthInfo();
    const objTotalCA = config?.objectifs?.CA || 0;
    const prorataTarget = Math.round(objTotalCA * mInfo.pct);
    const diffCA = Math.round(globalData.ca - prorataTarget);
    const isAhead = diffCA >= 0;

    if (loading) return <div className="loader-screen">Initialisation du Dashboard...</div>;

    return (
        <div className="modern-dashboard">
        {/* HEADER */}
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle">Orange Boutique</div>
        <div className="title">Performance <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className={`ca-badge ${isAhead ? 'trending-up' : 'trending-down'}`} onClick={() => setCaModal(true)}>
        <div className="ca-data">
        <span className="ca-label">CA ACC. HT</span>
        <span className="ca-val">{Math.round(globalData.ca)}€</span>
        </div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}><RefreshCw size={20} /></button>
        </div>

        <div className="quick-actions">
        <div className="toggle-container mini">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Mois</div>
        </div>
        <button className="celebrate-btn" onClick={() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })}><Star size={14} /> Bravo</button>
        </div>

        <div className="scroll-content">
        <div className="section-label">🏆 CLASSEMENT & TAUX</div>
        <div className="team-list">
        {sortedTeamCodes.map((code, index) => {
            const s = currentStats[code];
            if (s.CA === 0 && s.Terminaux === 0) return null;
            const name = teamMap[code] || code;

            // CALCUL DES TAUX SPECIFIQUES
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
                <div className="metric-pill acc" title="Attach Rate Accessoires">
                <span className="label">ACC</span>
                <span className="val">{attachRate}</span>
                </div>
                <div className="metric-pill reco" title="Taux Reconditionné">
                <Leaf size={10} />
                <span className="val">{tauxReco}%</span>
                </div>
                <div className="metric-pill cyber" title="Pénétration Cybersecure">
                <Shield size={10} />
                <span className="val">{tauxCyber}%</span>
                </div>
                <div className="ca-box">
                <div className="amount">{Math.round(s.CA)}€</div>
                <ChevronRight size={14} color="#FF7900" />
                </div>
                </div>
                </div>
            )
        })}
        </div>
        </div>

        {/* MODAL CA */}
        {caModal && (
            <div className="glass-overlay" onClick={() => setCaModal(false)}>
            <div className="glass-modal pop-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Performance Boutique</h2><X onClick={() => setCaModal(false)} /></div>
            <div className="ro-body">
            <div className="ro-row"><span>Réalisé</span><strong>{Math.round(globalData.ca)} €</strong></div>
            <div className="ro-row"><span>Objectif Prorata</span><strong>{prorataTarget} €</strong></div>
            <div className={`ro-status-box ${isAhead ? 'success' : 'warning'}`}>
            {isAhead ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
            <span>{isAhead ? 'Avance' : 'Retard'} de <strong>{Math.abs(diffCA)} €</strong></span>
            </div>
            </div>
            </div>
            </div>
        )}

        {/* MODAL VENDEUR */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{selectedSeller.name}</h2><X onClick={() => setSelectedSeller(null)} /></div>
            <div className="modal-scroll">
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-card">
                <div className="ticket-meta"><span>#{id}</span><span>{ticket.date}</span></div>
                {ticket.items.map((item, i) => (
                    <div key={i} className="ticket-item">
                    <span className="lib">{item.lib}</span>
                    <span className="val">{item.ca > 0 ? Math.round(item.ca)+'€' : ''}</span>
                    </div>
                ))}
                </div>
            ))}
            </div>
            </div>
            </div>
        )}

        <style jsx>{`
            .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f9fa; font-family: sans-serif; font-weight: bold; }
            .seller-card-v2 { background: white; margin: 10px 15px; border-radius: 18px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
            .seller-main-info { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
            .rank-badge { width: 22px; height: 22px; background: #1a1a1a; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
            .name { font-weight: 800; font-size: 14px; color: #1a1a1a; }
            .basic-kpis { font-size: 11px; color: #666; margin-top: 2px; }
            .sep { color: #eee; margin: 0 4px; }

            .seller-metrics { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
            .metric-pill { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: bold; }
            .metric-pill.acc { background: #f0f4ff; color: #527EDB; border: 1px solid #d9e2ff; }
            .metric-pill.reco { background: #e6f7ed; color: #10b981; border: 1px solid #b7ebc6; }
            .metric-pill.cyber { background: #f5f0ff; color: #6f42c1; border: 1px solid #e3d3ff; }
            .metric-pill .label { opacity: 0.6; font-size: 8px; }

            .ca-box { margin-left: auto; display: flex; align-items: center; gap: 5px; background: #fff8f0; padding: 4px 8px; border-radius: 10px; }
            .ca-box .amount { font-weight: 900; font-size: 13px; color: #FF7900; }

            .ro-status-box { display: flex; align-items: center; gap: 10px; padding: 15px; border-radius: 12px; margin-top: 15px; }
            .ro-status-box.success { background: #e6f7ed; color: #10b981; }
            .ro-status-box.warning { background: #fff7e6; color: #FF7900; }

            .ticket-card { background: #f9fafb; padding: 10px; border-radius: 12px; margin-bottom: 8px; }
            .ticket-meta { display: flex; justify-content: space-between; font-size: 10px; color: #999; margin-bottom: 5px; }
            .ticket-item { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
            .ticket-item .lib { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%; }
            `}</style>
            </div>
    );
}
