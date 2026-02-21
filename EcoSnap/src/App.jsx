import './App.css'

import { useEffect, useMemo, useState } from 'react'

const USERS_KEY = 'ecosnap_users'
const CURRENT_USER_KEY = 'ecosnap_current_user'

function loadUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadCurrentUser() {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveCurrentUser(user) {
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY)
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

function getTreeStage(points) {
  if (points <= 5) return 'seed'
  if (points <= 10) return 'sprout'
  if (points <= 20) return 'sapling'
  return 'big'
}

function mockAnalyzeTrashImage() {
  return {
    name: 'Plastic Bottle (Example)',
    materials: ['Plastic (PET)'],
    recyclingMethod:
      'Rinse the bottle, remove the cap and label, and place it in your plastics recycling bin according to local rules.',
    reuseMethod:
      'Use as a watering bottle for plants, a DIY bird feeder, or refill with water instead of buying new bottles.',
  }
}

function LoginPage({ onLogin }) {
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

function HomePage({ user, onGoTree, onGoUpload }) {
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

function UploadPage({ user, onBackHome, onGainPoint }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [hasRecycled, setHasRecycled] = useState(false)
  const [hasRewarded, setHasRewarded] = useState(false)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setAnalysis(null)
    setHasRecycled(false)
    setHasRewarded(false)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  function handleAnalyze() {
    if (!file) return
    const result = mockAnalyzeTrashImage(file)
    setAnalysis(result)
  }

  function handleConfirmRecycle() {
    if (!analysis || hasRewarded) return
    setHasRecycled(true)
    setHasRewarded(true)
    onGainPoint()
    window.alert('You got 1 point for recycling')
  }

  return (
    <div className="page">
      <header className="page-header with-back">
        <button type="button" className="ghost-button" onClick={onBackHome}>
          ← Back to Home
        </button>
        <div>
          <h2 className="page-title">Upload a trash photo</h2>
          <p className="page-subtitle">
            Gemini will analyze the trash in your photo and suggest recycling and reuse ideas.
          </p>
        </div>
      </header>

      <section className="card upload-card">
        <label className="upload-area">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span>
            {file ? 'Choose a different photo' : 'Select or take a photo of your trash to upload'}
          </span>
        </label>
        {file && (
          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
            >
            Analyze with Gemini (demo)
          </button>
        )}
      </section>

      {previewUrl && (
        <section className="card preview-card">
          <h3>Uploaded photo</h3>
          <img src={previewUrl} alt="Uploaded trash" className="preview-image" />
        </section>
      )}

      {analysis && (
        <section className="card result-card">
          <h3>Analysis result</h3>
          <div className="result-row">
            <span className="result-label">Name</span>
            <span className="result-value">{analysis.name}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Material(s)</span>
            <span className="result-value">
              {Array.isArray(analysis.materials)
                ? analysis.materials.join(', ')
                : analysis.materials}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Recycling method</span>
            <span className="result-value">{analysis.recyclingMethod}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Reuse ideas</span>
            <span className="result-value">{analysis.reuseMethod}</span>
          </div>

          <div className="confirm-box">
            <p>Did you actually recycle this trash?</p>
            <button
              type="button"
              className="primary-button"
              onClick={handleConfirmRecycle}
              disabled={hasRewarded}
            >
              Yes, I recycled it
            </button>
            {hasRecycled && (
              <p className="success-text">
                Nice work! You earned +1 point and your tree grew a little.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="card small-text">
        <p>
          In a real service, this screen would send the image to Gemini and receive results in the JSON schema below.
        </p>
        <pre className="code-block">
          {`{
  "name": "string",
  "materials": ["string"],
  "recyclingMethod": "string",
  "reuseMethod": "string"
}`}
        </pre>
      </section>
    </div>
  )
}

function TreePage({ user, onBackHome }) {
  const points = user.points ?? 0
  const stage = getTreeStage(points)

  const stageInfo = useMemo(
    () => ({
      seed: {
        title: 'Seed stage',
        description: 'A great first step: thinking before you throw things away.',
        range: '0–5 pts',
      },
      sprout: {
        title: 'Sprout stage',
        description: 'Recycling is becoming a habit. A small sprout has appeared.',
        range: '6–10 pts',
      },
      sapling: {
        title: 'Sapling stage',
        description: 'Thanks to you, a forest is growing. Keep going!',
        range: '11–20 pts',
      },
      big: {
        title: 'Big tree stage',
        description:
          'Amazing! You are already an eco hero. Your tree is tall and lush.',
        range: '20+ pts',
      },
    }),
    [],
  )

  const info = stageInfo[stage]

  return (
    <div className="page">
      <header className="page-header with-back">
        <button type="button" className="ghost-button" onClick={onBackHome}>
          ← 홈으로
        </button>
        <div>
          <h2 className="page-title">My tree</h2>
          <p className="page-subtitle">
            Every user&apos;s actions connect to form one big forest.
          </p>
        </div>
      </header>

      <section className={`card tree-card tree-card-${stage}`}>
        <div className="tree-visual">
          {stage === 'seed' && (
            <>
              <div className="soil" />
              <div className="seed-dot" />
            </>
          )}
          {stage === 'sprout' && (
            <>
              <div className="soil" />
              <div className="stem stem-small" />
              <div className="leaf leaf-left" />
              <div className="leaf leaf-right" />
            </>
          )}
          {stage === 'sapling' && (
            <>
              <div className="soil" />
              <div className="stem stem-medium" />
              <div className="crown crown-small" />
            </>
          )}
          {stage === 'big' && (
            <>
              <div className="soil" />
              <div className="stem stem-large" />
              <div className="crown crown-large" />
            </>
          )}
        </div>
        <div className="tree-info">
          <h3>{info.title}</h3>
          <p className="tree-range">
            Stage: {info.range} / Your points: {points}
          </p>
          <p>{info.description}</p>
        </div>
      </section>

      <section className="card small-text">
        <h4>Stage thresholds</h4>
        <ul>
          <li>0–5 pts: Seed</li>
          <li>6–10 pts: Sprout</li>
          <li>11–20 pts: Sapling</li>
          <li>20+ pts: Big Tree</li>
        </ul>
        <p>The more trash you upload and recycle, the more your tree grows.</p>
      </section>
    </div>
  )
}

function App() {
  const [users, setUsers] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('login')

  useEffect(() => {
    const initialUsers = loadUsers()
    const initialCurrent = loadCurrentUser()
    setUsers(initialUsers)
    if (initialCurrent) {
      setCurrentUser(initialCurrent)
      setPage('home')
    }
  }, [])

  function handleLogin({ username, password, onError }) {
    const nextUsers = { ...users }
    const existing = nextUsers[username]

      if (existing) {
      if (existing.password !== password) {
        onError('Incorrect password.')
        return
      }
      setCurrentUser(existing)
      saveCurrentUser(existing)
    } else {
      const newUser = {
        id: Date.now().toString(),
        username,
        password,
        points: 0,
      }
      nextUsers[username] = newUser
      setUsers(nextUsers)
      saveUsers(nextUsers)
      setCurrentUser(newUser)
      saveCurrentUser(newUser)
    }
    setPage('home')
  }

  function handleLogout() {
    setCurrentUser(null)
    saveCurrentUser(null)
    setPage('login')
  }

  function updateUserPoints(delta) {
    if (!currentUser) return
    const updatedUser = {
      ...currentUser,
      points: (currentUser.points ?? 0) + delta,
    }
    const nextUsers = {
      ...users,
      [updatedUser.username]: updatedUser,
    }
    setUsers(nextUsers)
    setCurrentUser(updatedUser)
    saveUsers(nextUsers)
    saveCurrentUser(updatedUser)
  }

  if (!currentUser || page === 'login') {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-left">
          <span className="logo-text small">EcoSnap</span>
          <span className="divider">|</span>
          <span className="user-chip">{currentUser.username}</span>
        </div>
        <div className="top-right">
          <span className="points-chip">
            🌱 {currentUser.points ?? 0} pts
          </span>
          <button
            type="button"
            className="ghost-button small"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      {page === 'home' && (
        <HomePage
          user={currentUser}
          onGoTree={() => setPage('tree')}
          onGoUpload={() => setPage('upload')}
        />
      )}
      {page === 'upload' && (
        <UploadPage
          user={currentUser}
          onBackHome={() => setPage('home')}
          onGainPoint={() => updateUserPoints(1)}
        />
      )}
      {page === 'tree' && (
        <TreePage user={currentUser} onBackHome={() => setPage('home')} />
      )}

      <footer className="app-footer">
        <p>All users&apos; points combine into one big forest.</p>
      </footer>
    </div>
  )
}

export default App
