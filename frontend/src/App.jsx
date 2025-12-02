import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { clearTokens, isAuthenticated } from './auth'
import AssistantPanel from './components/AssistantPanel'
import AssistantWelcomeBanner from './components/AssistantWelcomeBanner'
import { TaskProvider } from './contexts/TaskContext'
import { AssistantProvider } from './contexts/AssistantContext'

export default function App() {
  const navigate = useNavigate()
  const authed = useMemo(() => isAuthenticated(), []) // Only check once
  const [now, setNow] = useState(() => new Date()) // Initialize once

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date())
    }, 1000 * 30) // Update every 30 seconds
    return () => clearInterval(id)
  }, [])

  const handleLogout = useCallback(() => {
    clearTokens()
    navigate('/login')
  }, [navigate])

  // Memoize clock display
  const clockDisplay = useMemo(() => {
    return now.toLocaleString()
  }, [now])

  return (
    <TaskProvider>
      <AssistantProvider>
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">TM</div>
              <div>
                <p className="eyebrow">Productivity Suite</p>
                <h1>Task Manager</h1>
              </div>
            </div>
            <nav className="nav-links">
              <Link to="/">Tasks</Link>
              <Link to="/tasks/new">New Task</Link>
              {!authed && <Link to="/login">Login</Link>}
              {authed && (
                <button className="ghost" onClick={handleLogout}>
                  Logout
                </button>
              )}
              <span className="topbar-clock">
                {clockDisplay}
              </span>
            </nav>
          </header>

          <div className="page-hero">
            <div>
              <p className="eyebrow">Stay ahead</p>
              <h2>Plan, focus, and track your work beautifully.</h2>
              <p className="muted">
                Organize tasks, monitor due dates, and keep momentum with an interface
                built for clarity.
              </p>
            </div>
            <div className="hero-pill">
              <p>Live sync</p>
              <p>JWT-secured API</p>
              <p>Smart scheduling</p>
            </div>
          </div>

          <main className="content">
            <div className="panel">
              <Outlet />
            </div>
          </main>

          {/* Assistant components - rendered outside router, never interfere with navigation */}
          <AssistantWelcomeBanner />
          <AssistantPanel />
        </div>
      </AssistantProvider>
    </TaskProvider>
    <div className="container">

      {/* Top navigation */}
      <header>
        <div>
          <p style={{ margin: 0, color: '#9ca3af', fontWeight: 600 }}>Task Manager</p>
          <h1 style={{ margin: 0 }}>Workboard</h1>
        </div>

        <nav>
          <Link to="/" className="ghost-btn">Tasks</Link>
          <Link to="/tasks/new" className="ghost-btn">New Task</Link>
          <Link to="/login" className="ghost-btn">Login</Link>

          {authed && (
            <button onClick={handleLogout} className="ghost-btn">Logout</button>
          )}
        </nav>
      </header>

      {/* Main app shell */}
      <div className="app-shell">

        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">TM</div>
            <div>
              <p className="eyebrow">Productivity Suite</p>
              <h1>Task Manager</h1>
            </div>
          </div>

          <nav className="nav-links">
            <Link to="/">Tasks</Link>
            <Link to="/tasks/new">New Task</Link>
            <Link to="/login">Login</Link>

            {authed && (
              <button className="ghost" onClick={handleLogout}>Logout</button>
            )}
          </nav>
        </header>

        {/* Hero section */}
        <div className="page-hero">
          <div>
            <p className="eyebrow">Stay ahead</p>
            <h2>Plan, focus, and track your work beautifully.</h2>
            <p className="muted">
              Organize tasks, monitor due dates, and keep momentum with a refreshed
              interface built for clarity.
            </p>
          </div>

          <div className="hero-pill">
            <p>Live sync</p>
            <p>JWT-secured API</p>
            <p>Smart scheduling</p>
          </div>
        </div>

        {/* Content panel */}
        <main className="content">
          <div className="panel">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
