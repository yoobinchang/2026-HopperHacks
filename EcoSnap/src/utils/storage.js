const USERS_KEY = 'ecosnap_users'
const CURRENT_USER_KEY = 'ecosnap_current_user'

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
