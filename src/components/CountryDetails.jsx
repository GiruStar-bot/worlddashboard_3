import React, { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from 'recharts';

/*
 * CountryDetails renders a heads‑up display (HUD) showing detailed
 * information about the currently selected country.  A typewriter
 * effect animates the headline to draw the viewer's attention.  Key
 * metrics are displayed using a monospace font to evoke a digital
 * instrumentation panel, and a radar chart visualises the economy
 * versus stability scores provided in the dataset.  Tags are rendered
 * as glowing neon badges.
 */
function Metric({ label, value }) {
  return (
    <div className="p-2 glassmorphic flex flex-col items-start">
      <span className="text-xs text-slate-400 mb-1">{label}</span>
      <span className="font-mono text-lg text-primary whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

export default function CountryDetails({ country }) {
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
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [country]);

  if (!country) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-500">
        Click on a country to see details
      </div>
    );
  }

  // Build data for the radar chart.  If scores are missing, default to zero.
  const scores = country.ui_view?.scores || {};
  const radarData = [
    { subject: 'Economy', score: scores.economy_score ?? 0 },
    { subject: 'Stability', score: scores.stability_score ?? 0 },
  ];

  // Compute metrics: population, GDP, GDP per capita.  Protect against
  // missing values by defaulting to zero.
  const population = country.canonical?.society?.population?.value ?? 0;
  const gdpNominal = country.canonical?.economy?.gdp_nominal?.value ?? 0;
  const perCapita = population ? gdpNominal / population : 0;

  return (
    <div className="flex flex-col h-full gap-4 text-sm">
      <div>
        <h2 className="text-xl font-bold text-secondary mb-1">
          {country.master?.name}
        </h2>
        <p className="font-mono text-xs text-purple-400 min-h-[3rem]">
          {headline}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Population" value={population.toLocaleString()} />
        <Metric
          label="GDP (Nominal)"
          value={`$${(gdpNominal / 1e9).toFixed(1)}B`}
        />
        <Metric
          label="GDP per Capita"
          value={`$${Math.round(perCapita).toLocaleString()}`}
        />
      </div>
      {/* 修正ポイント: flex-1 に min-h-[200px] を追加して高さを安定させます */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="80%">
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              stroke="#cbd5e1"
              tick={{ fontSize: 10 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.3}
            />
            <ChartTooltip
              contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', color: '#cbd5e1', fontSize: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        {country.ui_view?.tags?.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider border border-secondary text-secondary bg-secondary/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
