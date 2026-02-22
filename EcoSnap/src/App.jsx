import './App.css'
import { useEffect, useState } from 'react'
import { loadUsers, saveUsers, loadCurrentUser, saveCurrentUser } from './utils/storage'
import { LoginPage, UploadPage, TopBar } from './components'
import { HomePage } from './components/HomePage/HomePage'

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
        />
      )}
      {activeTab === 'scanner' && (
        <UploadPage
          user={currentUser}
          onGainPoint={() => updateUserPoints(1)}
        />
      )}
      <footer className="app-footer">
        <p>All users&apos; points combine into one big forest.</p>
      </footer>
    </div>
  )
}

export default App