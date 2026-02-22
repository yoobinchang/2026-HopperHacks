import './App.css'
import { useEffect, useState } from 'react'
import { loadUsers, saveUsers, loadCurrentUser, saveCurrentUser } from './utils/storage'
import { LoginPage, UploadPage, TopBar } from './components'
import { HomePage } from './components/HomePage/HomePage'

const DEFAULT_TREE = { id: 0, x: 0, z: 0, paletteId: 'sakura', displayStage: 1 }

function ensureTreeState(user) {
  if (!user) return user
  const points = user.points ?? 0
  return {
    ...user,
    treeBank: user.treeBank ?? points,
    trees: Array.isArray(user.trees) && user.trees.length > 0 ? user.trees : [DEFAULT_TREE],
  }
}

function App() {
  const [users, setUsers] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('login')
  const [activeTab, setActiveTab] = useState('tree')

  useEffect(() => {
    const initialUsers = loadUsers()
    const initialCurrent = loadCurrentUser()
    setUsers(initialUsers)
    if (initialCurrent) {
      setCurrentUser(ensureTreeState(initialCurrent))
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

  function updateUserPoints(delta) {
    if (!currentUser) return
    const updatedUser = {
      ...currentUser,
      points: (currentUser.points ?? 0) + delta,
      treeBank: (currentUser.treeBank ?? currentUser.points ?? 0) + delta,
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
      <TopBar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
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
          onGainPoint={() => updateUserPoints(5)}
        />
      )}
      <footer className="app-footer">
        <p>All users&apos; points combine into one big forest.</p>
      </footer>
    </div>
  )
}

export default App