import { useState, useMemo } from 'react'
import './StatsPage.css'

const PAL = {
  cardboard: '#CB997E',
  plastic:   '#DDBEA9',
  metals:    '#A86A65',
  glass:     '#D8A694',
  waste:     '#8B8F7A',
  bg:        '#FFE8D6',
}

const CATEGORIES = [
  { key: 'Paper & cardboard', dataKey: 'paper and cardboard', label: 'Waste Paper & Cardboard', color: PAL.cardboard },
  { key: 'Plastic',           dataKey: 'plastics',           label: 'Plastic',                 color: PAL.plastic   },
  { key: 'Metals',            dataKey: 'metal',              label: 'Metals',                  color: PAL.metals    },
  { key: 'Glass',             dataKey: 'glass',              label: 'Glass',                    color: PAL.glass     },
  { key: 'Waste',             dataKey: 'waste',              label: 'Waste (non-recyclable)',   color: PAL.waste     },
]

// SVG donut chart helpers
const CX = 160, CY = 160, R = 140, IR = 55

function pt(angle, r) {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function wedge(a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x1, y1] = pt(a0, R);  const [x2, y2] = pt(a1, R)
  const [x3, y3] = pt(a1, IR); const [x4, y4] = pt(a0, IR)
  return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${IR} ${IR} 0 ${large} 0 ${x4} ${y4}Z`
}

export function StatsPage({ user }) {
  const [hovered, setHovered] = useState(null)

  const recycledByCategory = user?.recycledByCategory && typeof user.recycledByCategory === 'object'
    ? user.recycledByCategory
    : {}
  const values = useMemo(() => CATEGORIES.map(c => Math.max(0, Number(recycledByCategory[c.dataKey]) || 0)), [recycledByCategory])
  const total = values.reduce((s, v) => s + v, 0)
  const dt = total || 1

  const active = CATEGORIES
    .map((cat, i) => ({ ...cat, value: values[i], index: i }))
    .filter(item => item.value > 0)

  let cursor = -Math.PI / 2
  const slices = active.map(item => {
    const sweep = (item.value / total) * Math.PI * 2
    const a0 = cursor
    const a1 = cursor + sweep
    cursor = a1
    return { ...item, a0, a1, mid: (a0 + a1) / 2 }
  })

  return (
    <div className="stats-page page progress-page">

      {/* Stat chips */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12,
        justifyContent: 'center', padding: '20px 20px 0',
      }}>
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.key}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              minWidth: 120, padding: '14px 16px 12px',
              borderRadius: 16, textAlign: 'center',
              border: `2px solid ${cat.color}`,
              background: `${cat.color}18`,
              boxShadow: `4px 4px 0 ${cat.color}44`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              cursor: 'pointer', transition: 'transform 0.18s',
              fontFamily: "'Alice', Georgia, serif",
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, color: '#4a3228', lineHeight: 1 }}>{values[i]}</span>
            <span style={{ fontSize: 11, color: '#6B705C', marginTop: 2, lineHeight: 1.3 }}>{cat.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>
              {((values[i] / dt) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <div className="stats-body">
        {total === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No items counted yet.</p>
            <p className="empty-state-hint">In the Scanner tab, after each photo is analyzed, tap &quot;Yes, I recycled it&quot; to add it here.</p>
          </div>
        ) : (
          <>
            {/* Donut chart */}
            <div className="pg-chart-wrap">
              <svg viewBox="0 0 320 320" width="100%" style={{ maxWidth: 320, overflow: 'visible' }} aria-hidden="false">
                <defs>
                  <filter id="pg-drop" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#a08070" floodOpacity="0.2" />
                  </filter>
                </defs>

                {slices.map((sl, i) => {
                  const isHov = hovered === sl.index
                  const explode = isHov ? 10 : 0
                  return (
                    <g
                      key={sl.key}
                      transform={`translate(${Math.cos(sl.mid) * explode}, ${Math.sin(sl.mid) * explode})`}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                      onMouseEnter={() => setHovered(sl.index)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <path
                        d={wedge(sl.a0, sl.a1)}
                        fill={sl.color}
                        stroke="#e8e0d8"
                        strokeWidth={isHov ? 2 : 2.5}
                        filter="url(#pg-drop)"
                        opacity={hovered !== null && !isHov ? 0.7 : 1}
                        style={{ transition: 'opacity 0.18s' }}
                      />
                    </g>
                  )
                })}

                <text x={CX} y={CY - 10} textAnchor="middle" fontSize="13" fill="#7a5a50" fontFamily="'Alice',Georgia,serif">Total</text>
                <text x={CX} y={CY + 14} textAnchor="middle" fontSize="24" fontWeight="700" fill="#4a3228" fontFamily="'Alice',Georgia,serif">{total}</text>
                <text x={CX} y={CY + 32} textAnchor="middle" fontSize="11" fill="#a86a65" fontFamily="'Alice',Georgia,serif">items</text>
              </svg>
            </div>

            {/* Legend */}
            <div className="pg-legend">
              {slices.map(sl => {
                const isHov = hovered === sl.index
                const pct = ((sl.value / total) * 100).toFixed(1)
                return (
                  <div
                    key={sl.key}
                    className="pg-legend-item"
                    style={{
                      background: isHov ? `${sl.color}22` : 'rgba(255,252,239,0.6)',
                      border: `1.5px solid ${isHov ? sl.color : '#DDBEA9'}`,
                    }}
                    onMouseEnter={() => setHovered(sl.index)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="pg-legend-dot" style={{ background: sl.color }} />
                    <span className="pg-legend-label">{sl.label}</span>
                    <span className="pg-legend-count">{sl.value} items</span>
                    <span className="pg-legend-pct" style={{ color: sl.color }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
