import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle, BarChart2,
    Trophy, Calendar, Clock, Receipt
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

    // --- CONFIGURATION DES FAMILLES ---
    const FAMILIES = {
        BOX: { label: "🌐 LIVEBOX", color: "#527EDB" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        DORO: { label: "👴 DORO", color: "#E6007E" },
        XIAOMI: { label: "📱 XIAOMI / AUTRES", color: "#FF6700" },
        PROT: { label: "🛡️ PROTECTION", color: "#059669" },
        ACC: { label: "🎧 ACCESSOIRES", color: "#4b5563" },
        SERV: { label: "✨ SERVICES / ASSUR", color: "#FF7900" },
        AUTRE: { label: "📦 DIVERS", color: "#9ca3af" }
    };

    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 805002, 805001, 805000, 804996, 804995, 804994, 804287, 804285, 804283, 804982, 804827, 804826, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    const KEY_STOCKAGE = ["128 GO", "128GO", "256 GO", "256GO", "512 GO", "512GO", "1 TO", "1TO", "64 GO", "64GO", "32 GO", "32GO"];
    const KEY_MODELE = ["L30", "WIRE", "15C", "REDMI", "X5C", "A15", "A25", "A35", "A55", "CROSSCALL STELLAR", "REDMI NOTE"];
    const KEY_NOT_TERM = ["COQUE", "ETUI", "VERRE", "FILM", "PROT", "CHARGEUR", "CABLE", "ADAPTATEUR", "PRISE", "ECOUTEUR", "KIT", "AUDIO", "BUDS", "AIRPODS", "FREEBUDS", "ENCEINTE", "SPEAKER", "SOUND", "MONTRE", "BRACELET", "WATCH", "BAND", "GALAXY FIT", "SUPPORT", "PACK", "LANIERE", "TAG", "TRACKER", "CLE", "USB", "CARTE", "MEMOIRE", "DISQUE", "HDD", "SSD", "SDXC", "MICROSD", "DRIVE"];
    const KEY_REC = ["REC", "RECOND", "RECONDITIONN", "RENEWD", "OCCASION", "2ND VIE", "SECONDE VIE", "GRADE", "ECO", "RE-"];
    const BLACKLIST_CA = ["FIXE", "DECT", "GIGASET", "PARAFOUDRE", "MULTIPRISE", "PILE", "SAC", "KRAFT", "CONFIGURATION", "ATELIER", "FLASH", "EXPERTE", "TIMBRE", "PLANCHE", "PHOTO", "IDENTITE", "MOBICARTE", "E-RECH"];
    const EXCLUDED_PRICES = [9, 24, 39];

    // --- LOGIQUE DE TRI PAR FAMILLE ---
    const getFamily = (libelle, code) => {
        const l = libelle.toUpperCase();
        if (CODES.Broadband.includes(code)) return "BOX";
        if (l.includes("IPHONE") || l.includes("APPLE") || l.includes("AIRPOD")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("DORO")) return "DORO";
        if (l.includes("XIAOMI") || l.includes("REDMI") || l.includes("POCO") || l.includes("HONOR")) return "XIAOMI";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("VERRE") || l.includes("FILM") || l.includes("PROT")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("AUDIO") || l.includes("BUDS") || l.includes("MONTRE") || l.includes("USB")) return "ACC";
        if (l.includes("ASSURANCE") || l.includes("CYBER") || l.includes("SERVICE") || CODES.Assurance.includes(code)) return "SERV";
        return "AUTRE";
    };

    const getTodayStr = () => {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    };

    const calculateLanding = (currentValue) => {
        const d = new Date().getDate();
        const t = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        if(d === 0) return 0;
        return Math.round((currentValue / d) * t);
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

    useEffect(() => {
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl).then(r => r.text()).then(t => Papa.parse(t, {header:true, skipEmptyLines:true, complete:r=>processData(r.data)}));
    }, [config.url]);

    const processData = (data) => {
        let teamMap = {};
        config.team.trim().split('\n').forEach(line => { if(line.includes(':')) { const [c, n] = line.split(':'); teamMap[c.trim()] = n.trim(); }});
        const teamCodes = Object.keys(teamMap);

        let tempStatsMonth = {}, tempStatsDay = {};
        teamCodes.forEach(code => {
            const empty = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Google:0, Cyber:0, MP:0, Assurance:0, CA:0, tickets: {} };
            tempStatsMonth[code] = JSON.parse(JSON.stringify(empty));
            tempStatsDay[code] = JSON.parse(JSON.stringify(empty));
        });

        let g_CA=0, g_Term=0, g_Assur=0, globalCounts = { Broadband:0, Mobile:0, MIG:0, MEV:0, Terminaux:0, Cyber:0, MP:0, Assurance:0 };
        let highestSale = { amount: 0, seller: "", item: "" };
        const todayStr = getTodayStr();

        data.forEach(row => {
            let cleanRow = {}; Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
            let rowDate = cleanRow["Date"] || cleanRow["Date de pièce"] || cleanRow["Date Facture"];
            let ticketId = cleanRow["Ticket"] || "SANS_TICKET";
            let isToday = rowDate && rowDate.includes(todayStr);

            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));

            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let lib = (cleanRow["Libellé Article"] || "").toString().toUpperCase().trim();
                let caVal = parseFloat((cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;

                if (lib.startsWith("WP")) return;

                // Fonction d'ajout au ticket
                const addToTicket = (target, isDay) => {
                    if (!target[v].tickets[ticketId]) {
                        target[v].tickets[ticketId] = { date: rowDate, items: [] };
                    }
                    target[v].tickets[ticketId].items.push({
                        lib,
                        fam: getFamily(lib, codeArt),
                                                           ca: caVal
                    });
                };

                // Logic KPI
                let isTerm = (KEY_STOCKAGE.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k))) && !KEY_NOT_TERM.some(k => lib.includes(k));

                const updateKPI = (target, isDay) => {
                    if (isTerm) { target[v].Terminaux++; if(!isDay) g_Term++; }
                    if (CODES.Broadband.includes(codeArt)) { target[v].Broadband++; if(!isDay) globalCounts.Broadband++; }
                    if (CODES.Mobile.includes(codeArt)) { target[v].Mobile++; if(!isDay) globalCounts.Mobile++; }
                    if (CODES.MIG.includes(codeArt)) { target[v].MIG++; if(!isDay) globalCounts.MIG++; }
                    if (CODES.MEV.includes(codeArt)) { target[v].MEV++; if(!isDay) globalCounts.MEV++; }
                    if (CODES.MP.includes(codeArt)) { target[v].MP++; if(!isDay) globalCounts.MP++; }
                    if (CODES.Cyber.includes(codeArt)) { target[v].Cyber++; if(!isDay) globalCounts.Cyber++; }
                    if (CODES.Assurance.includes(codeArt)) { target[v].Assurance++; if(!isDay) { globalCounts.Assurance++; g_Assur++; } }

                    if (!BLACKLIST_CA.some(w => lib.includes(w)) && !EXCLUDED_PRICES.includes(caVal)) {
                        let ht = caVal / 1.2;
                        target[v].CA += ht;
                        if(!isDay) g_CA += ht;
                    }
                    addToTicket(target, isDay);
                };

                updateKPI(tempStatsMonth, false);
                if(isToday) updateKPI(tempStatsDay, true);

                if (isToday && caVal > highestSale.amount && !EXCLUDED_PRICES.includes(caVal)) {
                    highestSale = { amount: caVal, seller: teamMap[v], item: lib };
                }
            }
        });

        setGlobalData({ ca: g_CA, assur: g_Term > 0 ? Math.round((g_Assur/g_Term)*100) : 0, counts: globalCounts });
        setStatsMonth(tempStatsMonth);
        setStatsDay(tempStatsDay);
        if(highestSale.amount > 0) setBigWin(highestSale);
        setLoading(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    const openComparison = (category) => {
        const activeStats = viewMode === 'month' ? statsMonth : statsDay;
        const sortedData = Object.keys(activeStats).map(code => {
            let name = "Inconnu";
            config.team.split('\n').forEach(line => { if(line.includes(code)) name = line.split(':')[1].trim(); });
            let val = category === 'TxAssur' ? (activeStats[code].Terminaux > 0 ? Math.round((activeStats[code].Assurance / activeStats[code].Terminaux) * 100) : 0) : activeStats[code][category];
            return { name, val, isMe: selectedSeller ? code === selectedSeller.code : false };
        }).sort((a, b) => b.val - a.val);
        setCompareMode({ category: category === 'TxAssur' ? 'Taux Assurance' : category, data: sortedData, isPercent: category === 'TxAssur' });
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Rangement par tickets...</p></div>;

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedTeamCodes = Object.keys(currentStats).sort((a, b) => currentStats[b].CA - currentStats[a].CA);

    return (
        <div className="modern-dashboard">
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle">Orange Perf</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge">
        <span className="ca-label">CA ACC. HT</span>
        <span className="ca-val">{Math.round(globalData.ca)}€</span>
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
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}><Clock size={14} /> Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}><Calendar size={14} /> Mois</div>
        </div>

        <div className="scroll-content">
        <div className="section-label">🎯 INDICATEURS ÉQUIPE</div>
        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.3)' })} />
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => {
            const style = getCategoryStyle(key);
            const count = viewMode === 'month' ? globalData.counts[key] : Object.values(currentStats).reduce((acc, s) => acc + s[key], 0);
            return (
                <div key={key} className="stat-card" onClick={() => openComparison(key)}>
                <div className="icon-badge" style={{background: style.grad}}>{style.icon}</div>
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
            let name = "Inconnu";
            config.team.split('\n').forEach(line => { if(line.includes(code)) name = line.split(':')[1].trim(); });
            const tx = s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux)*100) : 0;
            return (
                <div key={code} className={`seller-card rank-${index+1}`} onClick={() => setSelectedSeller({code, name, data: s})}>
                <div className="rank-badge">{index+1}</div>
                <div className="seller-avatar">{name[0]}</div>
                <div className="seller-info">
                <div className="seller-name">{name}</div>
                <div className="seller-kpi-row">
                <span className="kpi-pill">📱 {s.Terminaux}</span>
                <span className="kpi-pill">🛡️ {tx}%</span>
                </div>
                </div>
                <div className="seller-ca"><strong>{Math.round(s.CA)}€</strong> <ChevronRight size={14}/></div>
                </div>
            )
        })}
        </div>
        </div>

        {/* MODAL DÉTAILLÉ AVEC RANGEMENT PAR TICKET ET FAMILLE */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal bounce-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h2>{selectedSeller.name}</h2>
            <div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div>
            </div>
            <div className="modal-scroll">
            {/* On boucle sur les tickets du vendeur */}
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-group-card" style={{background: '#fff', borderRadius: '15px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                <div className="ticket-header" style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '10px'}}>
                <span style={{fontWeight: 'bold', fontSize: '13px', color: '#666'}}><Receipt size={14} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Ticket #{id}</span>
                <span style={{fontSize: '11px', color: '#999'}}>{ticket.date}</span>
                </div>

                {/* On boucle sur nos familles prédéfinies pour ranger les articles du ticket */}
                {Object.entries(FAMILIES).map(([famKey, famInfo]) => {
                    const itemsInFam = ticket.items.filter(i => i.fam === famKey);
                    if (itemsInFam.length === 0) return null;
                    return (
                        <div key={famKey} style={{marginBottom: '10px'}}>
                        <div style={{fontSize: '10px', fontWeight: 'bold', color: famInfo.color, marginBottom: '4px', opacity: 0.8}}>{famInfo.label}</div>
                        {itemsInFam.map((item, idx) => (
                            <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0'}}>
                            <span style={{color: '#333'}}>{item.lib}</span>
                            <span style={{fontWeight: 'bold', color: '#666'}}>{item.ca > 0 ? Math.round(item.ca)+'€' : ''}</span>
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

        {/* MODAL COMPARAISON */}
        {compareMode && (
            <div className="glass-overlay" onClick={() => setCompareMode(null)}>
            <div className="glass-modal pop-in" style={{height: 'auto', maxHeight:'60vh'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h3>Classement {compareMode.category}</h3>
            <div className="close-btn" onClick={() => setCompareMode(null)}><X /></div>
            </div>
            <div style={{height: '300px'}}>
            <Bar
            data={{
                labels: compareMode.data.map(d => d.name),
                         datasets: [{
                             data: compareMode.data.map(d => d.val),
                         backgroundColor: compareMode.data.map(d => d.isMe ? '#FF7900' : '#E0E0E0'),
                         borderRadius: 5
                         }]
            }}
            options={{ indexAxis: 'y', plugins: { legend: { display: false } }, maintainAspectRatio: false }}
            />
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
