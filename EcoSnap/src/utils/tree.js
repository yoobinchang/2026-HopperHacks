export function getTreeStage(points) {
  if (points <= 5) return 'seed'
  if (points <= 10) return 'sprout'
  if (points <= 20) return 'sapling'
  return 'big'
}
