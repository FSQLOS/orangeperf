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
        MEV: { title: "Le MacGyver des Options", sub: "Il rajoute du divertissement." },
        MP: { title: "Le Domoticien Suprême", sub: "Sa maison est plus intelligente que nous." },
        Cyber: { title: "Le Videur du Web", sub: "Hacker-proof. Antivirus humain." }
    };

    const playTrophySound = () => {
        const audio = new Audio('https://www.myinstants.com/media/sounds/call-of-duty-modern-warfare-2-level-up-track-2.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
    };

    const fetchData = useCallback(() => {
        setRefreshing(true);
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl).then(r => r.text()).then(t => {
            Papa.parse(t, { header: true, skipEmptyLines: true, complete: r => {
                processData(r.data);
                setTimeout(() => setLoading(false), 800); // Petit délai pour laisser le CSS s'appliquer
                setRefreshing(false);
            }});
        }).catch(() => setRefreshing(false));
    }, [config.url]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const processData = (data) => {
        let currentTeamMap = {};
        config.team.trim().split('\n').forEach(line => { if (line.includes(':')) { const [c, n] = line.split(':'); currentTeamMap[c.trim()] = n.trim(); } });
        setTeamMap(currentTeamMap);
        // ... Logique de calcul CA et KPI identique ...
        setGlobalData(prev => ({ ...prev, ca: 1250, counts: { Terminaux: 12, Mobile: 8, Broadband: 4, MIG: 2, MEV: 5, MP: 1, Cyber: 3 } })); // Exemple de structure
    };

    const openGlobalComparison = (category) => {
        // ... Logique de comparaison identique ...
        playTrophySound();
        setActiveTrophy({ name: "Collaborateur", title: TROPHY_TITLES[category]?.title, sub: TROPHY_TITLES[category]?.sub });
        setTimeout(() => setActiveTrophy(null), 4500);
    };

    // --- RENDU ---
    if (loading) return (
        <div className="loading-screen">
        <div className="ps5-loader"></div>
        <div className="loading-text">Chargement du profil...</div>
        </div>
    );

    return (
        <div className={`app-container loaded`}>
        <div className="modern-dashboard">
        {/* NOTIFICATION TROPHÉE */}
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

        {/* HEADER */}
        <div className="header-glass">
        <div className="header-content">
        <div className="subtitle" style={{fontSize: '10px', color: '#999', textTransform: 'uppercase'}}>Orange Perf</div>
        <div className="title">Vision <span>{viewMode === 'month' ? 'Mois' : 'Jour'}</span></div>
        </div>
        <div className="ca-badge" onClick={() => setCaModal(true)}>
        <span className="ca-label">CA ACC. HT</span>
        <span className="ca-val">{globalData.ca}€</span>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchData}>
        <RefreshCw size={20} />
        </button>
        </div>

        {/* KPI SCROLLBAR */}
        <div className="scroll-content" style={{marginTop: '20px'}}>
        <div className="global-scroll">
        <div className="stat-card featured" onClick={() => openGlobalComparison('TxAssur')}>
        <div className="circular-wrap">
        <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`} styles={buildStyles({ pathColor: '#fff', textColor: '#fff', trailColor: 'rgba(255,255,255,0.3)' })} />
        </div>
        <div className="card-label">Taux Assur</div>
        </div>
        {['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'MP', 'Cyber'].map(key => (
            <div key={key} className="stat-card" onClick={() => openGlobalComparison(key)}>
            <div className="stat-value">{globalData.counts[key] || 0}</div>
            <div className="card-label">{key}</div>
            </div>
        ))}
        </div>
        </div>

        {/* CLASSEMENT (Exemple simplifié pour le rendu) */}
        <div className="section-label" style={{marginTop: '20px'}}>🏆 Classement</div>
        <div className="team-list">
        {Object.keys(teamMap).map((code, index) => (
            <div key={code} className="seller-card">
            <div className="rank-badge">#{index+1}</div>
            <div className="seller-avatar">{teamMap[code][0]}</div>
            <div className="seller-info">
            <div className="seller-name">{teamMap[code]}</div>
            <div className="kpi-pill">📱 {index + 5}</div>
            </div>
            <div className="seller-ca"><strong>{500 - (index * 50)}€</strong></div>
            </div>
        ))}
        </div>
        </div>
        </div>
    );
}
