import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
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
    const [activeTrophy, setActiveTrophy] = useState(null);

    const [globalData, setGlobalData] = useState({
        ca: 0, assur: 0,
        counts: { Terminaux:0, Mobile:0, Broadband:0, MIG:0, MEV:0, MP:0, Cyber:0 }
    });

    const TROPHY_TITLES = {
        TxAssur: { title: "L'Ange Gardien du Stock", sub: "Personne ne sort sans filet ici !" },
        Terminaux: { title: "Le Magnat du Silicium", sub: "Il vend plus de dalles que Saint-Gobain." },
        Mobile: { title: "Le Dealer de Gigas", sub: "La SIM coule dans ses veines." },
        Broadband: { title: "L'Amiral du Wi-Fi", sub: "Il capte la fibre même au fond de la cave." },
        MIG: { title: "L'Éclair de la Fibre", sub: "Migration plus rapide que son ombre." },
        MEV: { title: "Le MacGyver des Options", sub: "Il rajoute du contenu sans que tu clignes." },
        MP: { title: "Le Domoticien Suprême", sub: "Même son grille-pain est connecté." },
        Cyber: { title: "Le Videur du Web", sub: "Hacker-proof. Antivirus humain." }
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

    // --- SON PERSONNALISÉ (MW2 LEVEL UP) ---
    const playTrophySound = () => {
        const audio = new Audio('https://www.myinstants.com/media/sounds/call-of-duty-modern-warfare-2-level-up-track-2.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    };

    const getMonthInfo = () => {
        const d = new Date();
        const now = d.getDate();
        const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return { now, total, pct: now / total };
    };

    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (l.includes("FLASH") || l.includes("EXPERTE") || l.includes("ATELIER")) return "TRANSFERTS";
        if (l.includes("FORCE GLASS") || l.includes("FORCE CASE") || l.includes("SPRAY")) return "ACC";
        // ... reste de la logique simplifiée
        return "AUTRE";
    };

    const fetchData = useCallback(() => {
        setRefreshing(true);
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl).then(r => r.text()).then(t => {
            Papa.parse(t, { header: true, skipEmptyLines: true, complete: r => { processData(r.data); setRefreshing(false); }});
        }).catch(() => setRefreshing(false));
    }, [config.url]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const processData = (data) => {
        let currentTeamMap = {};
        config.team.trim().split('\n').forEach(line => { if (line.includes(':')) { const [c, n] = line.split(':'); currentTeamMap[c.trim()] = n.trim(); } });
        setTeamMap(currentTeamMap);

        // Initialisation des compteurs (logique précédente identique)
        // ...
        setLoading(false);
    };

    const openGlobalComparison = (category) => {
        const stats = viewMode === 'month' ? statsMonth : statsDay;
        const nbVendeurs = Object.keys(teamMap).length || 1;

        let target = (category === 'TxAssur') ? 42 : Math.ceil((config.objectifs[category] || 0) / nbVendeurs);
        const data = Object.keys(stats).map(code => {
            const s = stats[code];
            let val = (category === 'TxAssur') ? (s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0) : s[category];
            let color = (val >= target) ? '#10b981' : (val >= target/2 ? '#f59e0b' : '#ef4444');
            return { name: teamMap[code] || code, val, color };
        }).sort((a, b) => b.val - a.val);

        setCompareMode({ category, data, isPercent: category === 'TxAssur', target });

        if (data[0] && data[0].val > 0) {
            playTrophySound();
            setActiveTrophy({ name: data[0].name, title: TROPHY_TITLES[category]?.title, sub: TROPHY_TITLES[category]?.sub });
            setTimeout(() => setActiveTrophy(null), 4500);
        }
    };

    // Rendu UI (Header, Grille, Classement, Modales)
    // ... identique à la version validée précédente
    return (
        <div className="modern-dashboard">
        {activeTrophy && (
            <div className="ps-trophy-container">
            <div className="ps-trophy-card">
            <div className="ps-trophy-icon"><div className="ps-gold-circle"><Trophy size={26} color="white" /></div></div>
            <div className="ps-trophy-text">
            <div className="ps-trophy-user">{activeTrophy.name} A PASSÉ UN NIVEAU !</div>
            <div className="ps-trophy-title">{activeTrophy.title}</div>
            <div className="ps-trophy-sub">{activeTrophy.sub}</div>
            </div>
            </div>
            </div>
        )}
        {/* Reste du code du Dashboard (Header, Content, Modals) */}
        </div>
    );
}
