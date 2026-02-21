import { useMemo } from 'react'
import { getTreeStage } from '../../utils/tree'
import './TreePage.css'

export function TreePage({ user, onBackHome }) {
  const points = user.points ?? 0
  const stage = getTreeStage(points)

  const stageInfo = useMemo(
    () => ({
      seed: {
        title: 'Seed stage',
        description: 'A great first step: thinking before you throw things away.',
        range: '0–5 pts',
      },
      sprout: {
        title: 'Sprout stage',
        description: 'Recycling is becoming a habit. A small sprout has appeared.',
        range: '6–10 pts',
      },
      sapling: {
        title: 'Sapling stage',
        description: 'Thanks to you, a forest is growing. Keep going!',
        range: '11–20 pts',
      },
      big: {
        title: 'Big tree stage',
        description:
          'Amazing! You are already an eco hero. Your tree is tall and lush.',
        range: '20+ pts',
      },
    }),
    [],
  )

  const info = stageInfo[stage]

  return (
    <div className="page">
      <header className="page-header with-back">
        <button type="button" className="ghost-button" onClick={onBackHome}>
          ← 홈으로
        </button>
        <div>
          <h2 className="page-title">My tree</h2>
          <p className="page-subtitle">
            Every user&apos;s actions connect to form one big forest.
          </p>
        </div>
      </header>

      <section className={`card tree-card tree-card-${stage}`}>
        <div className="tree-visual">
          {stage === 'seed' && (
            <>
              <div className="soil" />
              <div className="seed-dot" />
            </>
          )}
          {stage === 'sprout' && (
            <>
              <div className="soil" />
              <div className="stem stem-small" />
              <div className="leaf leaf-left" />
              <div className="leaf leaf-right" />
            </>
          )}
          {stage === 'sapling' && (
            <>
              <div className="soil" />
              <div className="stem stem-medium" />
              <div className="crown crown-small" />
            </>
          )}
          {stage === 'big' && (
            <>
              <div className="soil" />
              <div className="stem stem-large" />
              <div className="crown crown-large" />
            </>
          )}
        </div>
        <div className="tree-info">
          <h3>{info.title}</h3>
          <p className="tree-range">
            Stage: {info.range} / Your points: {points}
          </p>
          <p>{info.description}</p>
        </div>
      </section>

      <section className="card small-text">
        <h4>Stage thresholds</h4>
        <ul>
          <li>0–5 pts: Seed</li>
          <li>6–10 pts: Sprout</li>
          <li>11–20 pts: Sapling</li>
          <li>20+ pts: Big Tree</li>
        </ul>
        <p>The more trash you upload and recycle, the more your tree grows.</p>
      </section>
    </div>
  )
}
