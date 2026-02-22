export function getTreeStage(points) {
  if (points <= 5) return 'seed'
  if (points <= 10) return 'sprout'
  if (points <= 20) return 'sapling'
  return 'big'
}

/** For "points until next stage" display: current points and next threshold. */
export function getStageProgress(points) {
  const p = points ?? 0
  if (p <= 5) return { current: p, next: 6, label: 'Seed' }
  if (p <= 10) return { current: p, next: 11, label: 'Sprout' }
  if (p <= 20) return { current: p, next: 21, label: 'Sapling' }
  return { current: p, next: null, label: 'Big Tree' }
}
