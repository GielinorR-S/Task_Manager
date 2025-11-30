import React, { useState } from 'react'
import api from '../api'
import { saveTokens } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      const res = await api.post('/token/', { username, password })
      console.log('Login response:', res)
      saveTokens(res.data)
      alert('Login successful!')
      navigate('/')
    } catch (err) {
      console.error('Login error (raw):', err)
      const serverData = err?.response?.data
      console.error('Login error (response data):', serverData)
      const message = serverData ? JSON.stringify(serverData) : err.message || 'Login failed'
      alert('Login failed: ' + message)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h3>Sign in to continue</h3>
          <p className="muted">Enter your credentials to access tasks and schedules.</p>
        </div>
        <button type="submit" className="button">
          Login
        </button>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Your username" />
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
  )
}
