import { useState, useRef, useEffect } from 'react'
import './TopBar.css'

export function TopBar({ user, activeTab, onTabChange, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="top-bar theme-bar">
      <div className="top-bar-row top-bar-row-main">
        <span className="logo-text">EcoSnap</span>
        <div className="top-bar-right" ref={menuRef}>
        <button
          type="button"
          className="user-menu-trigger"
          onClick={() => setMenuOpen((o) => !o)}
          onMouseEnter={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <span className="user-menu-username">{user.username}</span>
          <span className="user-menu-points">Points: {user.points ?? 0}</span>
        </button>
        {menuOpen && (
          <div
            className="user-menu-dropdown"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                onLogout()
                setMenuOpen(false)
              }}
            >
              Log out
            </button>
          </div>
        )}
        </div>
      </div>
      <nav className="nav-tabs-row" aria-label="Main">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'tree' ? 'nav-tab-active' : ''}`}
          onClick={() => onTabChange('tree')}
        >
          My Tree
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'scanner' ? 'nav-tab-active' : ''}`}
          onClick={() => onTabChange('scanner')}
        >
          Scanner
        </button>
      </nav>
    </header>
  )
}
