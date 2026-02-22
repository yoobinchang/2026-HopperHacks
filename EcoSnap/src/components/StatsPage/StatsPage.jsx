import { useMemo } from 'react'
import './StatsPage.css'

const CATEGORY_LABELS = {
  'paper and cardboard': 'Paper & cardboard',
  'plastics': 'Plastics',
  'metal': 'Metal',
  'glass': 'Glass',
  'waste': 'Waste (non-recyclable)',
}

export function StatsPage({ user }) {
  const recycledByCategory = user?.recycledByCategory ?? {}
  const data = useMemo(() => {
    const entries = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      key,
      label,
      count: Number(recycledByCategory[key]) || 0,
    }))
    return entries
  }, [recycledByCategory])

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="stats-page page">
      <header className="page-header">
        <h1 className="page-title">My Stats</h1>
        <p className="page-subtitle">Summary of what you&apos;ve scanned by type</p>
      </header>

      <div className="stats-summary-card">
        <div className="stats-total">
          <span className="stats-total-value">{total}</span>
          <span className="stats-total-label">Total items scanned</span>
        </div>
      </div>

      <section className="stats-chart-section" aria-label="Recycling by category">
        <h2 className="stats-chart-title">By category</h2>
        <div className="stats-bar-chart">
          {data.map(({ key, label, count }) => (
            <div key={key} className="stats-bar-row">
              <div className="stats-bar-label">{label}</div>
              <div className="stats-bar-track">
                <div
                  className={`stats-bar-fill ${key === 'waste' ? 'stats-bar-fill-waste' : ''}`}
                  style={{ width: maxCount ? `${(count / maxCount) * 100}%` : 0 }}
                />
              </div>
              <div className="stats-bar-value">{count}</div>
            </div>
          ))}
        </div>
      </section>

      {total === 0 && (
        <p className="stats-empty">Scan trash in the Scanner tab to see your stats here.</p>
      )}
    </div>
  )
}
