import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const REGIONS = [
  {
    id: 'us-west',
    lines: ['US-', 'WEST'],
    latency: '1.2s',
    coordinates: [-122.4, 37.8],
    color: '#22c55e',
  },
  {
    id: 'eu-central',
    lines: ['EU-', 'CENTRAL'],
    latency: '3.8s',
    coordinates: [8.7, 50.1],
    color: '#facc15',
  },
  {
    id: 'ap-southeast',
    lines: ['AP-', 'SOUTHEAST'],
    latency: '1.9s',
    coordinates: [103.8, 1.35],
    color: '#22c55e',
  },
];

// 15 global network arcs — no antimeridian crossings
const ARCS = [
  [[-122.4, 37.8], [8.7, 50.1]],
  [[8.7, 50.1], [103.8, 1.35]],
  [[-122.4, 37.8], [72.8, 18.9]],
  [[-122.4, 37.8], [-43.2, -22.9]],
  [[-122.4, 37.8], [-96.8, 32.8]],
  [[-96.8, 32.8], [8.7, 50.1]],
  [[8.7, 50.1], [37.6, 55.7]],
  [[8.7, 50.1], [151.2, -33.8]],
  [[8.7, 50.1], [-43.2, -22.9]],
  [[8.7, 50.1], [55.3, 25.2]],
  [[103.8, 1.35], [72.8, 18.9]],
  [[103.8, 1.35], [151.2, -33.8]],
  [[72.8, 18.9], [37.6, 55.7]],
  [[72.8, 18.9], [55.3, 25.2]],
  [[-43.2, -22.9], [-96.8, 32.8]],
];

export default function RegionalBuildLatency() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      <style>{`
        @keyframes rblArcGlow {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.5;  }
        }
        .rbl-wrap { height: 380px; }
        @media (max-width: 1024px) { .rbl-wrap { height: 320px; } }
        @media (max-width: 640px)  { .rbl-wrap { height: 260px; } }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              fontFamily: 'Google Sans, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2563eb',
              margin: 0,
            }}
          >
            Regional Build Latency
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {[['Optimal', '#22c55e'], ['Congested', '#facc15']].map(([label, color]) => (
              <span
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: '500',
                  fontFamily: 'Google Sans, sans-serif',
                  color: '#4b5563',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Map ── */}
        <div
          className="rbl-wrap"
          style={{
            marginTop: '16px',
            background: '#d8d8d8',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [10, 15], scale: 175 }}
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <filter id="rbl-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.08)" />
              </filter>
            </defs>

            {/* Countries */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#cfcfcf"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: '#cfcfcf' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Network arcs — staggered glow animation */}
            {ARCS.map(([from, to], i) => (
              <Line
                key={`arc-${i}`}
                from={from}
                to={to}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1.2}
                fill="none"
                style={{
                  animation: `rblArcGlow ${2.5 + (i % 5) * 0.3}s ease-in-out ${((i * 0.2) % 2).toFixed(1)}s infinite`,
                }}
              />
            ))}

            {/* Latency markers */}
            {REGIONS.map((r) => (
              <Marker
                key={r.id}
                coordinates={r.coordinates}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <g
                  style={{
                    transform: hoveredId === r.id ? 'translateY(-3px)' : 'translateY(0px)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer',
                  }}
                >
                  <g transform="scale(1.6)">
                    {/* Card background — wide enough for longest label */}
                    <rect
                      x={-48} y={-68} width={96} height={58} rx={8}
                      fill="white"
                      filter="url(#rbl-shadow)"
                    />

                    {/* Status dot — animated pulse via SMIL */}
                    <circle cx={-30} cy={-48} r={6} fill={r.color}>
                      <animate
                        attributeName="r"
                        values="5;8;5"
                        dur="2s"
                        repeatCount="indefinite"
                        calcMode="ease-in-out"
                      />
                      <animate
                        attributeName="opacity"
                        values="1;0.6;1"
                        dur="2s"
                        repeatCount="indefinite"
                        calcMode="ease-in-out"
                      />
                    </circle>

                    {/* Region name — line 1 */}
                    <text
                      x={-14} y={-52}
                      fontSize={9.5}
                      fontWeight="700"
                      fill="#1e293b"
                      fontFamily="Google Sans, sans-serif"
                    >
                      {r.lines[0]}
                    </text>

                    {/* Region name — line 2 */}
                    <text
                      x={-14} y={-39}
                      fontSize={9.5}
                      fontWeight="700"
                      fill="#1e293b"
                      fontFamily="Google Sans, sans-serif"
                    >
                      {r.lines[1]}
                    </text>

                    {/* Latency value */}
                    <text
                      x={0} y={-22}
                      fontSize={9}
                      fill="#6b7280"
                      fontFamily="Google Sans, sans-serif"
                      textAnchor="middle"
                    >
                      {r.latency}
                    </text>
                  </g>
                </g>
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </div>
    </>
  );
}
