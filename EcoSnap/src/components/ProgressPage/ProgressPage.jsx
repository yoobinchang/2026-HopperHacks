import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import './ProgressPage.css'

const COLORS_HEX = {
  Plastic: '#3B82F6',
  'Paper & cardboard': '#F59E0B',
  Glass: '#10B981',
  Metals: '#8B5CF6',
  Waste: '#9CA3AF',
}

export function ProgressPage({ user }) {
  const stats = user?.recyclingStats || {
    Plastic: 0,
    'Paper & cardboard': 0,
    Glass: 0,
    Metals: 0,
    Waste: 0,
  }

  const data = Object.entries(stats)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  const total = Object.values(stats).reduce((sum, val) => sum + val, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{data.value} items</p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="page progress-page">
      <div className="ellipse-box">
        <p className="points-value">{total.toLocaleString()}</p>
        <p className="points-label">Total Items Recycled</p>
      </div>

      <div className="progress-section">
        {total === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No items recycled yet.</p>
            <p className="empty-state-hint">Start scanning trash to see your progress!</p>
          </div>
        ) : (
          <>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius="65%"
                    innerRadius={0}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_HEX[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="progress-info">
              <div className="legend-container">
                {Object.entries(stats)
                  .filter(([_, value]) => value > 0)
                  .map(([name, value]) => (
                    <div key={name} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: COLORS_HEX[name] }} />
                      <span className="legend-label">{name}</span>
                      <span className="legend-value">{value} items</span>
                    </div>
                  ))}
              </div>

              <div className="stats-grid">
                {Object.entries(stats)
                  .filter(([name]) => name !== 'Waste')
                  .map(([name, value]) => {
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                    return (
                      <div key={name} className="stat-card">
                        <div className="stat-header">
                          <div className="stat-color-indicator" style={{ backgroundColor: COLORS_HEX[name] }} />
                          <span className="stat-name">{name}</span>
                        </div>
                        <p className="stat-count">{value}</p>
                        <p className="stat-percentage">{percentage}%</p>
                      </div>
                    )
                  })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}