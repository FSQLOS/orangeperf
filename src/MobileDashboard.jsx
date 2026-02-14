import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity,
    ChevronRight, X, TrendingUp, AlertTriangle,
    Trophy, Calendar, Clock, Receipt, Tag
} from 'lucide-react';
import { CountUp } from './CountUp';

export default function MobileDashboard({ config }) {
    const [loading, setLoading] = useState(true);
    const [statsMonth, setStatsMonth] = useState({});
    const [statsDay, setStatsDay] = useState({});
    const [globalData, setGlobalData] = useState({});
    const [viewMode, setViewMode] = useState('month');
    const [selectedSeller, setSelectedSeller] = useState(null);

    // --- CONFIGURATION FAMILLES ---
    const FAMILIES = {
        BOX: { label: "🌐 Livebox", color: "#527EDB" },
        SAMSUNG: { label: "🪐 Samsung", color: "#034EA2" },
        APPLE: { label: "🍎 Apple", color: "#1a1a1a" },
        DORO: { label: "👴 Doro", color: "#E6007E" },
        XIAOMI: { label: "🇨🇳 Xiaomi / Autres", color: "#FF6700" },
        ACC: { label: "🎧 Accessoires", color: "#4b5563" },
        PROT: { label: "🛡️ Protections", color: "#059669" },
        SERV: { label: "✨ Services / Assur", color: "#FF7900" },
        AUTRE: { label: "📦 Autre", color: "#9ca3af" }
    };

    // Helper pour classer un article dans une famille
    const getFamily = (libelle, code) => {
        const l = libelle.toUpperCase();
        if (l.includes("IPHONE") || l.includes("APPLE") || l.includes("AIRPOD")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("DORO")) return "DORO";
        if (l.includes("XIAOMI") || l.includes("REDMI") || l.includes("POCO") || l.includes("HONOR")) return "XIAOMI";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("VERRE") || l.includes("FILM") || l.includes("PROT")) return "PROT";
        if (l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("AUDIO") || l.includes("BUDS") || l.includes("MONTRE")) return "ACC";
        if (l.includes("ASSURANCE") || l.includes("CYBER") || l.includes("SERVICE")) return "SERV";
        const boxCodes = [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230];
        if (boxCodes.includes(code)) return "BOX";
        return "AUTRE";
    };

    const getTodayStr = () => {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    };

    useEffect(() => {
        const fetchExcel = async () => {
            try {
                const response = await fetch(config.url);
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                processData(json);
            } catch (err) {
                console.error("Erreur :", err);
                setLoading(false);
            }
        };
        fetchExcel();
    }, [config.url]);

    const processData = (data) => {
        let teamMap = {};
        config.team.split('\n').forEach(line => {
            if(line.includes(':')) {
                const [c, n] = line.split(':');
                teamMap[c.trim()] = n.trim();
            }
        });

        const teamCodes = Object.keys(teamMap);
        let tMonth = {}, tDay = {};
        teamCodes.forEach(code => {
            const empty = { Terminaux:0, CA:0, tickets: {} }; // tickets: { "123": { items: [], date: "" } }
            tMonth[code] = JSON.parse(JSON.stringify(empty));
            tDay[code] = JSON.parse(JSON.stringify(empty));
        });

        const todayStr = getTodayStr();
        let g_CA = 0;

        data.forEach(row => {
            const vRaw = (row["Vendeur Doc."] || "").toString().toUpperCase();
            const v = teamCodes.find(code => vRaw.includes(code));
            if (!v) return;

            const rowDate = (row["Date"] || "").toString();
            const ticketID = (row["Ticket"] || "Sans Ticket").toString();
            const isToday = rowDate.includes(todayStr);
            const lib = (row["Libellé Article"] || "").toString().trim();
            const codeArt = parseInt(row["Code Article"]);
            const caVal = parseFloat(row["Montant TTC"]) || 0;

            if (lib.toUpperCase().startsWith("WP")) return;

            // Logique de stockage par ticket
            const addItemToTicket = (target) => {
                if (!target[v].tickets[ticketID]) {
                    target[v].tickets[ticketID] = { items: [], date: rowDate };
                }
                const famKey = getFamily(lib, codeArt);
                target[v].tickets[ticketID].items.push({
                    lib,
                    fam: famKey,
                    ca: caVal
                });
            };

            // Mise à jour CA et Terminaux
            const isTerm = lib.toUpperCase().includes("GO") || lib.toUpperCase().includes("IPHONE");
            if (isTerm) tMonth[v].Terminaux++;

            const caHT = caVal / 1.2;
            tMonth[v].CA += caHT;
            g_CA += caHT;

            addItemToTicket(tMonth);
            if (isToday) {
                addItemToTicket(tDay);
                tDay[v].CA += caHT;
                if (isTerm) tDay[v].Terminaux++;
            }
        });

        setGlobalData({ ca: g_CA });
        setStatsMonth(tMonth);
        setStatsDay(tDay);
        setLoading(false);
    };

    if (loading) return <div className="loading-screen"><div className="loader"></div><p>Tri des tickets...</p></div>;

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedSellers = Object.keys(currentStats).sort((a,b) => currentStats[b].CA - currentStats[a].CA);

    return (
        <div className="modern-dashboard">
        {/* HEADER SIMPLIFIÉ */}
        <div className="header-glass">
        <div className="header-content">
        <div className="title">Orange Perf <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge">
        <span className="ca-label">CA ACC. HT</span>
        <span className="ca-val">{Math.round(globalData.ca)}€</span>
        </div>
        </div>

        {/* TOGGLE */}
        <div className="toggle-container">
        <div className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Jour</div>
        <div className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Mois</div>
        </div>

        {/* LISTE VENDEURS */}
        <div className="scroll-content">
        <div className="team-list">
        {sortedSellers.map((code, index) => {
            const s = currentStats[code];
            const name = code; // ou teamMap[code]
            if (s.CA === 0 && s.Terminaux === 0) return null;
            return (
                <div key={code} className="seller-card" onClick={() => setSelectedSeller({code, name, data: s})}>
                <div className="rank-badge">{index+1}</div>
                <div className="seller-info">
                <div className="seller-name">{name}</div>
                <div className="seller-kpi-row">
                <span className="kpi-pill">📱 {s.Terminaux}</span>
                <span className="kpi-pill">🛒 {Object.keys(s.tickets).length} Tickets</span>
                </div>
                </div>
                <div className="seller-ca"><strong>{Math.round(s.CA)}€</strong> <ChevronRight size={14}/></div>
                </div>
            );
        })}
        </div>
        </div>

        {/* MODAL DÉTAILLÉ (C'EST ICI QUE LE RANGEMENT SE FAIT) */}
        {selectedSeller && (
            <div className="glass-overlay" onClick={() => setSelectedSeller(null)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h2>{selectedSeller.name}</h2>
            <div className="close-btn" onClick={() => setSelectedSeller(null)}><X /></div>
            </div>

            <div className="modal-scroll">
            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                <div key={id} className="ticket-group-card">
                <div className="ticket-id-header">
                <Receipt size={14} /> Ticket #{id} <span className="ticket-date">{ticket.date}</span>
                </div>
                <div className="ticket-items">
                {/* On groupe les items par famille à l'intérieur du ticket */}
                {Object.keys(FAMILIES).map(famKey => {
                    const itemsInFam = ticket.items.filter(i => i.fam === famKey);
                    if (itemsInFam.length === 0) return null;
                    return (
                        <div key={famKey} className="fam-subgroup">
                        <div className="fam-tag" style={{color: FAMILIES[famKey].color}}>
                        {FAMILIES[famKey].label}
                        </div>
                        {itemsInFam.map((item, idx) => (
                            <div key={idx} className="item-row">
                            <span className="item-name">{item.lib}</span>
                            {item.ca > 0 && <span className="item-price">{Math.round(item.ca)}€</span>}
                            </div>
                        ))}
                        </div>
                    );
                })}
                </div>
                </div>
            ))}
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
