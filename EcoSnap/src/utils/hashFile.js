/**
 * Returns a SHA-256 hash of the file contents as a hex string.
 * Used to detect duplicate uploads (same image = same hash) without storing full images.
 */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
