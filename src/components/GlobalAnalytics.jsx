import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';

/*
 * GlobalAnalytics compiles aggregated insights across all countries.  It
 * displays a pie chart illustrating the share of global GDP by the
 * largest economies and a scatter plot showing the relationship
 * between wealth (GDP per capita) and political stability.  Colours
 * are chosen from the project's neon palette to maintain thematic
 * coherence.
 */

// Colour palette for the pie segments.  Additional entries fall back to
// repeated colours via modulo indexing.
const PIE_COLOURS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ef4444', // red
  '#facc15', // yellow (for variety)
  '#22c55e', // green
  '#e879f9', // pink
];

export default function GlobalAnalytics({ data }) {
  // Flatten the dataset into a single array of country objects.
  const countries = useMemo(() => {
    const arr = [];
    Object.values(data.regions).forEach((region) => {
      region.forEach((entry) => arr.push(entry));
    });
    return arr;
  }, [data]);

  // Compute values for the pie chart and scatter plot.  We memoise
  // calculations because they only need to run when the data changes.
  const { pieData, scatterData, xDomain, yDomain } = useMemo(() => {
    let totalGDP = 0;
    // accumulate total GDP
    countries.forEach((c) => {
      const gdp = c.canonical?.economy?.gdp_nominal?.value ?? 0;
      totalGDP += gdp;
    });
    // sort by GDP descending
    const sorted = [...countries].sort((a, b) => (
      (b.canonical?.economy?.gdp_nominal?.value ?? 0) - (a.canonical?.economy?.gdp_nominal?.value ?? 0)
    ));
    const top5 = sorted.slice(0, 5);
    const topGDP = top5.reduce((sum, c) => sum + (c.canonical?.economy?.gdp_nominal?.value ?? 0), 0);
    const pie = top5.map((c) => ({
      name: c.master.name,
      value: c.canonical?.economy?.gdp_nominal?.value ?? 0,
    }));
    const rest = totalGDP - topGDP;
    if (rest > 0) {
      pie.push({ name: 'Rest of World', value: rest });
    }
    // build scatter dataset
    const scatter = [];
    countries.forEach((c) => {
      const gdp = c.canonical?.economy?.gdp_nominal?.value ?? 0;
      const pop = c.canonical?.society?.population?.value ?? 0;
      if (!gdp || !pop) return;
      const x = gdp / pop;
      let y = null;
      const vdem = c.canonical?.politics?.vdem_score;
      const fsi = c.canonical?.risk?.fsi_total?.value;
      if (vdem != null) {
        // scale VDEM (0–1) to a 0–100 stability score
        y = vdem * 100;
      } else if (fsi != null) {
        // invert the FSI (higher risk -> lower stability).  FSI ranges up to ~120.
        y = 100 - fsi;
      }
      if (y != null) {
        scatter.push({ name: c.master.name, x, y });
      }
    });
    const xVals = scatter.map((d) => d.x);
    const yVals = scatter.map((d) => d.y);
    const xDomain = [Math.min(...xVals), Math.max(...xVals)];
    const yDomain = [Math.min(...yVals), Math.max(...yVals)];
    return { pieData: pie, scatterData: scatter, xDomain, yDomain };
  }, [countries]);

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-secondary">Global Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GDP Share Pie Chart */}
        {/* 修正ポイント: コンテナを flex flex-col にし、グラフ部分を flex-1 min-h-0 で囲みます */}
        <div className="h-72 glassmorphic p-4 flex flex-col">
          <h4 className="text-sm font-medium mb-2">Global GDP Share</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={3}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLOURS[index % PIE_COLOURS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '10px', color: '#cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Scatter Chart for Correlation */}
        {/* 修正ポイント: 同様にコンテナとグラフ部分のレイアウトを安定させます */}
        <div className="h-72 glassmorphic p-4 flex flex-col">
          <h4 className="text-sm font-medium mb-2">Economic Wealth vs Stability</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="GDP per Capita"
                  domain={xDomain}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                  tick={{ fill: '#cbd5e1', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Stability Score"
                  domain={yDomain}
                  tick={{ fill: '#cbd5e1', fontSize: 10 }}
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  wrapperStyle={{ backgroundColor: '#020617', border: '1px solid #334155', color: '#cbd5e1', fontSize: '10px' }}
                  formatter={(value, name) => [value.toFixed(2), name]}
                />
                <Scatter
                  name="Country"
                  data={scatterData}
                  fill="#8b5cf6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
