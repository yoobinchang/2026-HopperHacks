import { getTreeStage, getStageProgress } from '../../utils/tree'
import './TreePage.css'

export function TreePage({ user, onGoScan }) {
  const points = user.points ?? 0
  const stage = getTreeStage(points)
  const progress = getStageProgress(points)

  const stageLabel =
    stage === 'seed'
      ? 'Seed'
      : stage === 'sprout'
        ? 'Sprout'
        : stage === 'sapling'
          ? 'Sapling'
          : 'Sakura Tree'

  return (
    <div className="page">
      <section className="points-capsule">
        <p className="points-capsule-value">{points.toLocaleString()}</p>
        <p className="points-capsule-label">Your Points</p>
      </section>

      <section className="tree-placeholder-card card">
        <div className="tree-placeholder-wrapper">
          <div className="tree-placeholder-frame">
            {/* Placeholder for 3D-modeled tree – replace this div with your image or component */}
            <div className="tree-placeholder-fallback">
              Tree placeholder — add your 3D tree image here
            </div>
          </div>
          <button
            type="button"
            className="primary-button scan-cta-button"
            onClick={onGoScan}
          >
            Click to Scan Trash!
          </button>
        </div>
        <p className="tree-placeholder-title">{stageLabel}</p>
        <p className="tree-placeholder-progress">
          points until next stage: {progress.next != null ? `${progress.current}/${progress.next}` : `${progress.current}/20+`}
        </p>
        <p className="tree-placeholder-cta">Scan and recycle trash to earn more points!</p>
      </section>
    </div>
  )
}
