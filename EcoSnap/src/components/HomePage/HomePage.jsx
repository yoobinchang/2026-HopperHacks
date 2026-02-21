import { getTreeStage } from '../../utils/tree'
import './HomePage.css'

export function HomePage({ user, onGoTree, onGoUpload }) {
  const stage = getTreeStage(user.points ?? 0)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Hi, {user.username}</h2>
          <p className="page-subtitle">One more step for the planet today!</p>
        </div>
      </header>
      <section className="card highlight-card">
        <div className="points-row">
          <div>
            <p className="points-label">Total pieces of trash recycled</p>
            <p className="points-value">
              {user.points ?? 0}
              <span className="points-unit">items</span>
            </p>
          </div>
          <div className={`tree-pill tree-pill-${stage}`}>
            <span className="tree-emoji">
              {stage === 'seed' && '🌱'}
              {stage === 'sprout' && '🌿'}
              {stage === 'sapling' && '🌳'}
              {stage === 'big' && '🌳'}
            </span>
            <span className="tree-label">
              {stage === 'seed' && 'Seed (0–5 pts)'}
              {stage === 'sprout' && 'Sprout (6–10 pts)'}
              {stage === 'sapling' && 'Sapling (11–20 pts)'}
              {stage === 'big' && 'Big Tree (20+ pts)'}
            </span>
          </div>
        </div>
      </section>

      <section className="card actions-card">
        <h3>What would you like to do?</h3>
        <div className="actions-grid">
          <button type="button" className="primary-button" onClick={onGoUpload}>
            Upload a trash photo
          </button>
          <button type="button" className="secondary-button" onClick={onGoTree}>
            View my tree
          </button>
        </div>
      </section>

      <section className="card small-text">
        <h4>Point rules</h4>
        <ul>
          <li>Upload a trash photo and confirm that you recycled it to earn 1 point.</li>
          <li>0–5 pts: Seed → 6–10 pts: Sprout → 11–20 pts: Sapling → 20+ pts: Big Tree</li>
        </ul>
      </section>
    </div>
  )
}
