import React, { useState, useCallback, useMemo } from 'react'
import api from '../api'
import { saveTokens } from '../auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const headerStyle = useMemo(() => ({ margin: 0 }), [])

  const handleUsernameChange = useCallback((e) => {
    setUsername(e.target.value)
    setError('')
  }, [])

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value)
    setError('')
  }, [])

  const submit = useCallback(async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await api.post('/token/', { username, password })
      saveTokens(res.data)
      navigate('/')
    } catch (err) {
      const serverData = err?.response?.data
      const message = serverData?.detail || serverData?.error || err.message || 'Login failed'
      setError(message)
    } finally {
      setIsSubmitting(false)
      const message = serverData ? JSON.stringify(serverData) : err.message || 'Login failed'
      alert('Login failed: ' + message)
    }
  }, [username, password, navigate])

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="helper-text" style={headerStyle}>
            Sign in to access your tasks
          </p>
          <h2 style={headerStyle}>Login</h2>
          <p className="helper-text" style={{ margin: 0 }}>
            Sign in to request a JWT access token
          </p>
          <h2 style={{ margin: 0 }}>Login</h2>
        </div>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h3>Sign in to continue</h3>
            <p className="muted">
              Enter your credentials to access tasks and schedules.
            </p>
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'var(--danger)', color: 'white', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <div className="field-grid">
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={handleUsernameChange}
              required
              placeholder="Your username"
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p className="muted">
            <Link to="/forgot-password">Forgot password?</Link> | <Link to="/signup">Create account</Link>
          </p>
          <button type="submit" className="button">
            Login
          </button>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Your username"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>
        </div>
      </form>
    </section>
  )
}
