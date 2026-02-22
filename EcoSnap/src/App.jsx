import './App.css'
import { useEffect, useState, useRef } from 'react'
import { loadUsers, saveUsers, loadCurrentUser, saveCurrentUser } from './utils/storage'
import { LoginPage, UploadPage, TopBar, StatsPage } from './components'
import { HomePage } from './components/HomePage/HomePage'
import { FloatingCat } from './components/FloatingCat/FloatingCat'

const DEFAULT_TREE = { id: 0, x: 0, z: 0, paletteId: 'sakura', displayStage: 1 }

const RECYCLED_CATEGORIES = ['paper and cardboard', 'plastics', 'metal', 'glass', 'waste']

function defaultRecycledByCategory() {
  return Object.fromEntries(RECYCLED_CATEGORIES.map((c) => [c, 0]))
}

function ensureTreeState(user) {
  if (!user) return user
  const points = user.points ?? 0
  const recycledByCategory = user.recycledByCategory && typeof user.recycledByCategory === 'object'
    ? { ...defaultRecycledByCategory(), ...user.recycledByCategory }
    : defaultRecycledByCategory()
  return {
    ...user,
    treeBank: user.treeBank ?? points,
    trees: Array.isArray(user.trees) && user.trees.length > 0 ? user.trees : [DEFAULT_TREE],
    recycledByCategory,
  }
}

function App() {
  const [users, setUsers] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('login')
  const [activeTab, setActiveTab] = useState('tree')
  const prevTabRef = useRef(null)

  useEffect(() => {
    const initialUsers = loadUsers()
    const initialCurrent = loadCurrentUser()
    setUsers(initialUsers)
    if (initialCurrent) {
      setCurrentUser(ensureTreeState(initialCurrent))
      setPage('home')
    }
  }, [])

  useEffect(() => {
    prevTabRef.current = activeTab
  }, [activeTab])

  function handleLogin({ username, password, onError }) {
    const nextUsers = { ...users }
    const existing = nextUsers[username]

    if (existing) {
      if (existing.password !== password) {
        onError('Incorrect password.')
        return
      }
      const withTree = ensureTreeState(existing)
      setCurrentUser(withTree)
      saveCurrentUser(withTree)
    } else {
      const newUser = ensureTreeState({
        id: Date.now().toString(),
        username,
        password,
        points: 0,
        treeBank: 0,
        trees: [DEFAULT_TREE],
        recycledByCategory: defaultRecycledByCategory(),
      })
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

  function updateUserPoints(delta, category) {
    if (!currentUser) return
    const recycledByCategory = { ...(currentUser.recycledByCategory ?? defaultRecycledByCategory()) }
    if (category && RECYCLED_CATEGORIES.includes(category)) {
      recycledByCategory[category] = (recycledByCategory[category] ?? 0) + 1
    }
    const updatedUser = {
      ...currentUser,
      points: (currentUser.points ?? 0) + delta,
      treeBank: (currentUser.treeBank ?? currentUser.points ?? 0) + delta,
      recycledByCategory,
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

  function updateUserTreeState(bank, trees) {
    if (!currentUser) return
    const updatedUser = {
      ...currentUser,
      treeBank: bank,
      trees: trees ?? currentUser.trees,
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
      <FloatingCat />
      <TopBar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <div
        className="content-block"
        data-tab={activeTab}
      >
        <div
          className="content-block-inner"
          key={activeTab}
          data-tab={activeTab}
          data-from-tab={prevTabRef.current !== null ? prevTabRef.current : undefined}
        >
          {activeTab === 'tree' && (
            <HomePage
              user={currentUser}
              onGoUpload={() => setActiveTab('scanner')}
              onTreeStateChange={updateUserTreeState}
            />
          )}
          {activeTab === 'scanner' && (
            <UploadPage
              user={currentUser}
              onGainPoint={updateUserPoints}
            />
          )}
          {activeTab === 'stats' && (
            <StatsPage user={currentUser} />
          )}
        </div>
      </div>
      <footer className="app-footer">
        <p>Keep your virtual -- and real -- forest alive!</p>
      </footer>
    </div>
  )
}

export default App