import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import TreeScene from './TreeScene.jsx'

export default function App() {
  const [count, setCount] = useState(0)
  const [points, setPoints] = useState(0)

  return (
    <>
      {/* 🔹 Original Vite Header */}
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>EcoSnap 🌱</h1>

      {/* 🔹 Original Counter */}
      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </button>

        <button
          style={{ marginLeft: '10px' }}
          onClick={() => setPoints((p) => p + 5)}
        >
          add 5 points 🌿
        </button>

        <p>Current points: {points}</p>
      </div>

      {/* 🔹 TreeScene Component */}
      <TreeScene points={points} onPointsChange={setPoints} />

      <p className="read-the-docs">
        Click logos to learn more
      </p>
    </>
  )
}