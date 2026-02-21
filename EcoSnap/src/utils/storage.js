const USERS_KEY = 'ecosnap_users'
const CURRENT_USER_KEY = 'ecosnap_current_user'

const UPLOAD_HASHES_PREFIX = 'ecosnap_upload_hashes_'
const MAX_STORED_HASHES = 500

export function loadUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function saveUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function loadCurrentUser() {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveCurrentUser(user) {
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY)
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

/** Image hashes (hex strings) to prevent re-using the same photo for points. Capped at MAX_STORED_HASHES. */
export function getUploadHashes(username) {
  if (!username) return []
  try {
    const raw = window.localStorage.getItem(UPLOAD_HASHES_PREFIX + username)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function hasUploadHash(username, hash) {
  return getUploadHashes(username).includes(hash)
}

export function addUploadHash(username, hash) {
  if (!username || !hash) return
  const hashes = getUploadHashes(username)
  if (hashes.includes(hash)) return
  const next = [...hashes, hash].slice(-MAX_STORED_HASHES)
  window.localStorage.setItem(UPLOAD_HASHES_PREFIX + username, JSON.stringify(next))
}
