import React, { useState, useCallback, useMemo } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetToken, setResetToken] = useState(null)

  const headerStyle = useMemo(() => ({ margin: 0 }), [])

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value)
    setError('')
    setMessage('')
  }, [])

  const submit = useCallback(async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')
    setResetToken(null)

    try {
      const res = await api.post('/auth/reset-request/', { email })
      setMessage(res.data.message || 'Password reset email sent!')
      
      // In development, show token for testing
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token)
      }
    } catch (err) {
      const serverData = err?.response?.data
      setError(serverData?.error || err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [email])

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="helper-text" style={headerStyle}>
            Request a password reset link
          </p>
          <h2 style={headerStyle}>Forgot Password</h2>
        </div>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">Reset your password</p>
            <h3>Enter your email</h3>
            <p className="muted">
              We'll send you a link to reset your password.
            </p>
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'var(--danger)', color: 'white', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {message && (
          <div className="success-message" style={{ marginBottom: '16px', padding: '12px', background: 'var(--success)', color: 'white', borderRadius: '8px' }}>
            {message}
          </div>
        )}

        {resetToken && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--primary-soft)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
            <p className="muted small" style={{ marginBottom: '8px' }}>Development Mode: Reset Token</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>{resetToken}</p>
            <Link to={`/reset-password?token=${resetToken}`} className="button" style={{ marginTop: '8px', display: 'inline-block' }}>
              Go to Reset Password
            </Link>
          </div>
        )}

        <div className="field-grid">
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
          </label>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p className="muted">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </form>
    </section>
  )
}

