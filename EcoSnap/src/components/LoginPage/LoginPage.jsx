import { useState } from 'react'
import './LoginPage.css'

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmedUser = username.trim()
    if (!trimmedUser || !password) {
      setError('Please enter both username and password.')
      return
    }
    onLogin({ username: trimmedUser, password, onError: setError })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="logo-text">EcoSnap</h1>
        <p className="subtitle">Grow a tree with every piece of trash you recycle.</p>
      </header>
      <main className="card login-card">
        <h2>Log In / Sign Up</h2>
        <p className="helper-text">If this is your first time, we will create an account for you automatically.</p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. green_hero"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-button full">
            Enter
          </button>
        </form>
      </main>
      <footer className="app-footer">
        <p>Snap your trash and grow your tree. 🌱</p>
      </footer>
    </div>
  )
}
