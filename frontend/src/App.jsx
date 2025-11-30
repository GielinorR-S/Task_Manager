import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { clearTokens, isAuthenticated } from './auth'

export default function App(){
  const navigate = useNavigate()
  function handleLogout(){
    clearTokens()
    navigate('/login')
  }
  return (
    <div className="container">
      <header>
        <div>
          <p style={{margin: 0, color: '#9ca3af', fontWeight: 600}}>Task Manager</p>
          <h1 style={{margin: 0}}>Workboard</h1>
        </div>
        <nav>
          <Link to="/" className="ghost-btn">Tasks</Link>
          <Link to="/tasks/new" className="ghost-btn">New Task</Link>
          <Link to="/login" className="ghost-btn">Login</Link>
          {isAuthenticated() && (
            <button onClick={handleLogout} className="ghost-btn">Logout</button>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
