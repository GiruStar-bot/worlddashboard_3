import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

/*
 * WorldMap component renders an interactive map coloured by the Fragile
 * States Index (FSI) value of each country.  It fetches a world
 * TopoJSON file directly from a CDN and uses a simple colour interpolation
 * to convey risk levels: safe countries appear cyan/green while higher
 * risk countries shift towards purple and red.  Hovering over a
 * geography triggers a callback with both the ISO code and the mouse
 * coordinates, allowing a tooltip to be positioned in the parent.  A
 * click notifies the parent of the selected country.
 */

// URL for a low‑resolution world map in TopoJSON format.  Using a CDN
// avoids having to bundle large GeoJSON assets in the repository.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

// Convert a hex colour to an RGB object.
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Convert an RGB object back to a hex string.
function rgbToHex({ r, g, b }) {
  return (
    '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  );
}

// Linearly interpolate between two colours.  t should be in the range [0,1].
function mixColours(a, b, t) {
  return rgbToHex({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  });
}

// Primary (low risk), mid and danger colours as RGB objects.
const COLOUR_LOW = hexToRgb('#06b6d4');
const COLOUR_MID = hexToRgb('#8b5cf6');
const COLOUR_HIGH = hexToRgb('#ef4444');

export default function WorldMap({ data, onCountryClick, onHover, selectedIso }) {
  // Build a lookup of FSI risk values keyed by ISO3 code.  Missing
  // values remain undefined.
  const riskByIso = useMemo(() => {
    const map = {};
    Object.values(data.regions).forEach((region) => {
      region.forEach((entry) => {
        const iso = entry.master.iso3;
        const risk = entry.canonical?.risk?.fsi_total?.value;
        map[iso] = risk;
      });
    });
    return map;
  }, [data]);

  // Determine the range of risk values to normalise colours.  Filter out
  // undefined or null entries first.
  const [minRisk, maxRisk] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 1];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  // Compute a colour based on the risk value.  A value in the lower
  // third of the range interpolates between low and mid colours, while
  // values in the upper third interpolate between mid and high colours.
  const getColour = (risk) => {
    if (risk == null) return '#1e293b'; // fallback grey for missing data
    if (minRisk === maxRisk) return rgbToHex(COLOUR_LOW);
    const t = (risk - minRisk) / (maxRisk - minRisk);
    if (t < 0.5) {
      // from safe to mid
      return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    }
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  };

  return (
    <ComposableMap projectionConfig={{ scale: 140 }} className="w-full h-full">
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const iso = geo.id;
            const risk = riskByIso[iso];
            const fill = getColour(risk);
            const isSelected = iso === selectedIso;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fill}
                stroke="#334155"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#f472b6', cursor: 'pointer' },
                  pressed: { outline: 'none' },
                }}
                onMouseEnter={(evt) => {
                  const { clientX: x, clientY: y } = evt;
                  onHover(iso, { x, y });
                }}
                onMouseLeave={() => onHover(null)}
                onClick={() => onCountryClick(iso)}
                // Add a subtle glow to the selected country.
                filter={isSelected ? 'url(#country-glow)' : undefined}
              />
            );
          })
        }
      </Geographies>
      {/* Define an SVG filter for selected country glow */}
      <defs>
        <filter id="country-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </ComposableMap>
  );
}