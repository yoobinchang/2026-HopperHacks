import './TopBar.css'

export function TopBar({ user, onLogout }) {
  return (
    <header className="top-bar">
      <div className="top-left">
        <span className="logo-text small">EcoSnap</span>
        <span className="divider">|</span>
        <span className="user-chip">{user.username}</span>
      </div>
      <div className="top-right">
        <span className="points-chip">
          🌱 {user.points ?? 0} pts
        </span>
        <button
          type="button"
          className="ghost-button small"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
    </header>
  )
}
