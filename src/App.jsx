import React, { useEffect, useState, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { 
  Globe, 
  TrendingUp, 
  Users, 
  Info, 
  ChevronRight,
  Zap,
  Activity,
  ShieldAlert,
  Server,
  Layers,
  Database,
  BarChart3
} from 'lucide-react';

// --- デザイン設定 ---
const PIE_COLOURS = ['#06b6d4', '#8b5cf6', '#ef4444', '#facc15', '#22c55e', '#e879f9'];
const COLOUR_LOW = { r: 6, g: 182, b: 212 };   // 低リスク: シアン
const COLOUR_MID = { r: 139, g: 92, b: 246 };  // 中リスク: パープル
const COLOUR_HIGH = { r: 239, g: 68, b: 68 };  // 高リスク: レッド

// --- ユーティリティ関数 ---
const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

const mixColours = (a, b, t) => rgbToHex({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
});

// --- UI コンポーネント ---
const MetricHUD = ({ label, value, unit = "", colorClass = "text-primary" }) => (
  <div className="p-3 bg-slate-900/60 border border-white/5 rounded flex flex-col items-start backdrop-blur-md relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${colorClass.replace('text-', 'bg-')}`}></div>
    <span className="text-[9px] text-slate-500 mb-1 uppercase tracking-[0.2em] font-bold">{label}</span>
    <span className={`font-mono text-xl ${colorClass} leading-none flex items-baseline gap-1`}>
      {value}<span className="text-[10px] opacity-40 font-sans tracking-normal">{unit}</span>
    </span>
  </div>
);

/**
 * WorldGrid: TopoJSONライブラリの依存エラーを回避するための
 * インタラクティブなリージョン・マトリックス・インターフェース。
 */
const WorldGrid = ({ data, onCountryClick, onHover, selectedIso }) => {
  const regions = data?.regions || {};

  const riskByIso = useMemo(() => {
    const map = {};
    Object.values(regions).forEach((region) => {
      region.forEach((entry) => {
        map[entry.master.iso3] = entry.canonical?.risk?.fsi_total?.value;
      });
    });
    return map;
  }, [regions]);

  const [minRisk, maxRisk] = useMemo(() => {
    const values = Object.values(riskByIso).filter(v => v != null);
    if (!values.length) return [0, 1];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  const getStatusColor = (iso3) => {
    if (iso3 === selectedIso) return '#fff';
    const risk = riskByIso[iso3];
    if (risk == null) return '#1e293b';
    const t = (risk - minRisk) / (maxRisk - minRisk);
    return t < 0.5 ? mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5) : mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar bg-slate-950/40">
      <div className="max-w-6xl mx-auto space-y-12">
        {Object.entries(regions).map(([regionName, countries]) => (
          <div key={regionName} className="animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.5em] font-black">
                {regionName}
              </h3>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {countries.map((c) => (
                <button
                  key={c.master.iso3}
                  onClick={() => onCountryClick(c.master.iso3)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onHover(c.master.iso3, { x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => onHover(null)}
                  className={`relative p-2.5 rounded border transition-all duration-200 flex flex-col items-center gap-1 group ${
                    selectedIso === c.master.iso3 
                      ? 'border-white bg-white text-slate-900 scale-105 z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                      : 'border-white/5 bg-slate-900/40 text-slate-500 hover:border-primary/40 hover:text-slate-200'
                  }`}
                >
                  <div 
                    className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full shadow-sm"
                    style={{ backgroundColor: selectedIso === c.master.iso3 ? '#000' : getStatusColor(c.master.iso3) }}
                  ></div>
                  <span className="text-[11px] font-mono font-bold">{c.master.iso3}</span>
                  <span className="text-[8px] uppercase truncate w-full text-center opacity-60 font-medium">{c.master.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * CountryDetails: 指定されたJSONデータを詳細に表示。
 * レーダーチャートで安定性と経済を比較。
 */
const CountryDetails = ({ country }) => {
  const [headline, setHeadline] = useState('');

  useEffect(() => {
    if (!country) {
      setHeadline('');
      return;
    }
    const text = country.ui_view?.headline || '';
    let i = 0;
    setHeadline('');
    const timer = setInterval(() => {
      i++;
      setHeadline(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [country]);

  if (!country) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-40">
        <Layers size={48} strokeWidth={1} className="animate-pulse" />
        <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-center">SYSTEM IDLE // AWAITING INPUT</p>
      </div>
    );
  }

  const scores = country.ui_view?.scores || {};
  const radarData = [
    { subject: 'ECON', score: scores.economy_score ?? 0 },
    { subject: 'STAB', score: scores.stability_score ?? 0 },
    { subject: 'RISK', score: 100 - (country.canonical?.risk?.fsi_total?.value || 50) },
    { subject: 'GROWTH', score: (country.canonical?.economy?.gdp_growth?.value || 0) * 10 },
  ];

  const population = country.canonical?.society?.population?.value ?? 0;
  const gdpNominal = country.canonical?.economy?.gdp_nominal?.value ?? 0;

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-4">
        <div>
          <div className="text-[9px] text-primary font-bold tracking-[0.4em] uppercase mb-1">Entity Intelligence</div>
          <h2 className="text-3xl font-black text-white flex items-baseline gap-2">
            {country.master?.name}
            <span className="text-sm font-mono text-slate-600">{country.master?.iso3}</span>
          </h2>
        </div>

        <div className="p-4 bg-primary/5 border-l-2 border-primary relative overflow-hidden rounded-r shadow-inner">
          <p className="font-mono text-[11px] text-slate-300 min-h-[3.5rem] leading-relaxed italic">
            {headline}<span className="inline-block w-1.5 h-3 bg-primary ml-1 animate-pulse align-middle"></span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricHUD label="Population" value={population ? (population/1e6).toFixed(1) : '0'} unit="M" />
        <MetricHUD label="GDP Nominal" value={gdpNominal ? (gdpNominal/1e9).toFixed(1) : '0'} unit="B$" />
        <MetricHUD label="Econ Score" value={scores.economy_score || '0'} colorClass="text-primary" />
        <MetricHUD label="Stability" value={scores.stability_score || '0'} colorClass="text-secondary" />
      </div>

      <div className="flex-1 glassmorphic p-4 bg-slate-950/60 border-white/5 flex flex-col">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
          <BarChart3 size={12} /> Strategic Matrix
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" stroke="#475569" tick={{ fontSize: 9, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Index" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
              <ChartTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {country.ui_view?.tags?.map((tag) => (
          <span key={tag} className="px-2 py-0.5 border border-white/10 text-slate-400 bg-white/5 text-[9px] font-bold uppercase tracking-widest rounded-sm hover:border-primary/40 hover:text-primary transition-colors cursor-default">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * GlobalAnalytics: 集計データの視覚化
 */
const GlobalAnalytics = ({ data }) => {
  const countries = useMemo(() => {
    const arr = [];
    Object.values(data.regions).forEach((region) => {
      region.forEach((entry) => arr.push(entry));
    });
    return arr;
  }, [data]);

  const { pieData, scatterData } = useMemo(() => {
    let totalGDP = 0;
    countries.forEach((c) => totalGDP += (c.canonical?.economy?.gdp_nominal?.value ?? 0));
    const sorted = [...countries].sort((a, b) => (b.canonical?.economy?.gdp_nominal?.value ?? 0) - (a.canonical?.economy?.gdp_nominal?.value ?? 0));
    const top5 = sorted.slice(0, 5);
    const topGDP = top5.reduce((sum, c) => sum + (c.canonical?.economy?.gdp_nominal?.value ?? 0), 0);
    const pie = top5.map((c) => ({ name: c.master.name, value: c.canonical?.economy?.gdp_nominal?.value ?? 0 }));
    if (totalGDP - topGDP > 0) pie.push({ name: 'OTHERS', value: totalGDP - topGDP });

    const scatter = [];
    countries.forEach((c) => {
      const gdp = c.canonical?.economy?.gdp_nominal?.value ?? 0;
      const pop = c.canonical?.society?.population?.value ?? 0;
      if (!gdp || !pop) return;
      const x = gdp / pop;
      let y = null;
      const vdem = c.canonical?.politics?.vdem_score;
      const fsi = c.canonical?.risk?.fsi_total?.value;
      if (vdem != null) y = vdem * 100;
      else if (fsi != null) y = 100 - fsi;
      if (y != null) scatter.push({ name: c.master.name, x, y });
    });

    return { pieData: pie, scatterData: scatter };
  }, [countries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
      <div className="h-full flex flex-col">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2 italic">
          <div className="w-1 h-1 bg-primary rotate-45"></div> Global Wealth Distribution
        </h4>
        <div className="flex-1 bg-slate-900/40 rounded border border-white/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5"><PieChart size={24} /></div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={4} isAnimationActive={false}>
                {pieData.map((_, index) => <Cell key={index} fill={PIE_COLOURS[index % PIE_COLOURS.length]} stroke="rgba(255,255,255,0.05)" />)}
              </Pie>
              <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace', paddingLeft: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="h-full flex flex-col">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2 italic">
          <div className="w-1 h-1 bg-secondary rotate-45"></div> Stability/Wealth Correlation
        </h4>
        <div className="flex-1 bg-slate-900/40 rounded border border-white/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5"><Activity size={24} /></div>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
              <CartesianGrid stroke="#ffffff05" strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" dataKey="x" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '10px' }} />
              <Scatter name="Entity" data={scatterData} fill="#8b5cf6" opacity={0.4} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---
export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    fetch('/worlddash_global_master.json')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error('Data Load Error', err));
  }, []);

  const countryByIso3 = useMemo(() => {
    const map = {};
    if (!data) return map;
    Object.values(data.regions).forEach((region) => {
      region.forEach((entry) => {
        map[entry.master.iso3] = entry;
      });
    });
    return map;
  }, [data]);

  const selectedCountry = selectedIso ? countryByIso3[selectedIso] : null;

  if (!data) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 border-[3px] border-primary/10 rounded-full"></div>
          <div className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
          <Globe size={32} className="absolute inset-0 m-auto text-primary opacity-50" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-mono text-primary text-[11px] tracking-[0.5em] font-black uppercase">Syncing Local Database</p>
          <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase animate-pulse">Establishing DataLink...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-primary/20">
      {/* HUD Header */}
      <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded border border-primary/20">
            <Globe size={22} className="text-primary shadow-glow" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none flex items-center gap-2">
              WORLD<span className="text-primary">DASHBOARD</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[8px] font-mono not-italic tracking-normal border border-white/5 uppercase">Local_OS_v2.1</span>
            </h1>
            <div className="text-[9px] font-mono text-slate-600 mt-1.5 tracking-[0.4em] uppercase font-bold">Data Driven Intelligence Matrix // Offline Mode</div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-700 uppercase font-black tracking-widest">Active Nodes</span>
            <span className="text-xs font-mono text-primary tabular-nums">{data.meta.stats.total_countries}</span>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-700 uppercase font-black tracking-widest">Master Data As Of</span>
            <span className="text-xs font-mono text-slate-400 uppercase">{new Date(data.meta.as_of).toLocaleDateString()}</span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-all text-slate-600 border border-transparent hover:border-white/10 group">
            <Database size={20} className="group-hover:text-primary transition-colors" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Center Area */}
        <main className="flex-1 relative overflow-hidden bg-[#020617]">
          {/* Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '80px 80px'}}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(6,182,212,0.05)_0%,_transparent_80%)]"></div>
          
          <WorldGrid
            data={data}
            onCountryClick={(iso) => setSelectedIso(prev => prev === iso ? null : iso)}
            onHover={(iso, pos) => setHoverInfo(iso ? { iso, ...pos } : null)}
            selectedIso={selectedIso}
          />

          {/* Floating UI HUD */}
          <div className="absolute bottom-8 left-8 flex items-center gap-5 px-5 py-3 glassmorphic border-white/5 bg-slate-900/60 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.3em]">Local Matrix Sync Active</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Ver: {data.meta.version}</span>
          </div>

          {/* Tooltip */}
          {hoverInfo && (
            <div
              className="fixed pointer-events-none z-[100] px-4 py-3 rounded-lg bg-slate-950/95 backdrop-blur-2xl border border-primary/30 shadow-2xl animate-in fade-in zoom-in duration-200"
              style={{ left: hoverInfo.x + 30, top: hoverInfo.y - 10 }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-primary/60 font-mono uppercase tracking-[0.3em] font-black italic">Targeting Node...</span>
                <span className="font-black text-sm text-white mt-1 uppercase">
                  {countryByIso3[hoverInfo.iso]?.master?.name || hoverInfo.iso}
                </span>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex justify-between items-center gap-12">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Risk Factor</span>
                  <span className="text-[10px] font-mono text-primary font-black">
                    {countryByIso3[hoverInfo.iso]?.canonical?.risk?.fsi_total?.value?.toFixed(1) || '--'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Info Sidebar */}
        <aside className="w-[420px] border-l border-white/5 bg-slate-950/80 backdrop-blur-3xl overflow-y-auto hidden xl:block relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.4)]">
          <div className="p-10 h-full">
            <CountryDetails country={selectedCountry} />
          </div>
        </aside>
      </div>

      {/* Analytics Matrix Footer */}
      <footer className="h-[320px] border-t border-white/5 bg-slate-950/95 backdrop-blur-3xl relative z-20">
        <div className="max-w-[1600px] mx-auto h-full p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ChevronRight className="text-primary shrink-0" size={20} />
              <h2 className="text-xs font-black tracking-[0.5em] uppercase text-slate-500 italic">Aggregated Intelligence Matrix // global_local_feed</h2>
            </div>
            <div className="flex items-center gap-6 text-[9px] font-mono">
              <span className="text-slate-800 tracking-widest">DATA_INTEGRITY: 100%</span>
              <span className="px-3 py-1 rounded bg-slate-900/50 text-slate-600 border border-white/5 uppercase">Source: master.json</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <GlobalAnalytics data={data} />
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.2); }
        .shadow-glow { filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4)); }
      `}</style>
    </div>
  );
}
