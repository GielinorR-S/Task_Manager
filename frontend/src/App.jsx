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
        <h1>Task Manager</h1>
        <nav>
          <Link to="/">Tasks</Link> | <Link to="/tasks/new">New Task</Link> | <Link to="/login">Login</Link>
          {isAuthenticated() && (
            <>
              {' '}| <button onClick={handleLogout} style={{background:'none',border:'none',color:'blue',cursor:'pointer',textDecoration:'underline'}}>Logout</button>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
