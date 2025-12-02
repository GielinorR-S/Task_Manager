import React, { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const headerStyle = useMemo(() => ({ margin: 0 }), [])

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    }
  }, [searchParams])

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value)
    if (errors.password) setErrors(prev => ({ ...prev, password: null }))
  }, [errors.password])

  const handlePasswordConfirmChange = useCallback((e) => {
    setPasswordConfirm(e.target.value)
    if (errors.password_confirm) setErrors(prev => ({ ...prev, password_confirm: null }))
  }, [errors.password_confirm])

  const submit = useCallback(async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setMessage('')

    if (!token) {
      setErrors({ token: 'Reset token is required' })
      setIsSubmitting(false)
      return
    }

    try {
      const res = await api.post('/auth/reset-password/', {
        token,
        password,
        password_confirm: passwordConfirm,
      })

      setMessage(res.data.message || 'Password reset successfully!')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const serverData = err?.response?.data
      if (serverData?.errors) {
        setErrors(serverData.errors)
      } else {
        setErrors({ general: serverData?.error || err.message || 'Failed to reset password. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [token, password, passwordConfirm, navigate])

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="helper-text" style={headerStyle}>
            Set a new password for your account
          </p>
          <h2 style={headerStyle}>Reset Password</h2>
        </div>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">Create new password</p>
            <h3>Reset your password</h3>
            <p className="muted">
              Enter your new password below.
            </p>
          </div>

          <button type="submit" className="button" disabled={isSubmitting || !token}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>

        {errors.general && (
          <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'var(--danger)', color: 'white', borderRadius: '8px' }}>
            {errors.general}
          </div>
        )}

        {message && (
          <div className="success-message" style={{ marginBottom: '16px', padding: '12px', background: 'var(--success)', color: 'white', borderRadius: '8px' }}>
            {message}
          </div>
        )}

        <div className="field-grid">
          {!token && (
            <label className="field">
              <span>Reset Token</span>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="Enter reset token from email"
                disabled={isSubmitting}
              />
              {errors.token && <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.token}</span>}
            </label>
          )}

          <label className="field">
            <span>New Password</span>
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
            <span>Confirm New Password</span>
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
            <Link to="/login">Back to login</Link> | <Link to="/forgot-password">Request new reset link</Link>
          </p>
        </div>
      </form>
    </section>
  )
}

