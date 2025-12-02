import React, { useState, useCallback, useMemo } from 'react'
import api from '../api'
import { saveTokens } from '../auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleUsernameChange = useCallback((e) => {
    setUsername(e.target.value)
    if (errors.username) setErrors(prev => ({ ...prev, username: null }))
  }, [errors.username])

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value)
    if (errors.email) setErrors(prev => ({ ...prev, email: null }))
  }, [errors.email])

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value)
    if (errors.password) setErrors(prev => ({ ...prev, password: null }))
  }, [errors.password])

  const handlePasswordConfirmChange = useCallback((e) => {
    setPasswordConfirm(e.target.value)
    if (errors.password_confirm) setErrors(prev => ({ ...prev, password_confirm: null }))
  }, [errors.password_confirm])

  const headerStyle = useMemo(() => ({ margin: 0 }), [])

  const submit = useCallback(async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const res = await api.post('/auth/signup/', {
        username,
        email,
        password,
        password_confirm: passwordConfirm,
      })

      if (res.data.tokens) {
        saveTokens(res.data.tokens)
        navigate('/')
      } else {
        setErrors({ general: 'Signup successful but no tokens received. Please login.' })
      }
    } catch (err) {
      const serverData = err?.response?.data
      if (serverData?.errors) {
        setErrors(serverData.errors)
      } else {
        setErrors({ general: serverData?.error || err.message || 'Signup failed. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [username, email, password, passwordConfirm, navigate])

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="helper-text" style={headerStyle}>
            Create a new account to get started
          </p>
          <h2 style={headerStyle}>Sign Up</h2>
        </div>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">Get started</p>
            <h3>Create your account</h3>
            <p className="muted">
              Join us to start managing your tasks and boosting productivity.
            </p>
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </div>

        {errors.general && (
          <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'var(--danger)', color: 'white', borderRadius: '8px' }}>
            {errors.general}
          </div>
        )}

        <div className="field-grid">
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={handleUsernameChange}
              required
              placeholder="Choose a username"
              disabled={isSubmitting}
            />
            {errors.username && <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.username}</span>}
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />
            {errors.email && <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.email}</span>}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              placeholder="••••••••"
              minLength={8}
              disabled={isSubmitting}
            />
            {errors.password && <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.password}</span>}
            <p className="muted small">Must be at least 8 characters</p>
          </label>

          <label className="field">
            <span>Confirm Password</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={handlePasswordConfirmChange}
              required
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            {errors.password_confirm && <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.password_confirm}</span>}
          </label>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p className="muted">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </form>
    </section>
  )
}

