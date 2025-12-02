import React, { useState, useEffect } from 'react'

export default function AssistantWelcomeBanner({ onDismiss }) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasSeen, setHasSeen] = useState(() => {
    return localStorage.getItem('assistantWelcomeSeen') === 'true'
  })

  useEffect(() => {
    // Show banner after a short delay if not seen before
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasSeen])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('assistantWelcomeSeen', 'true')
    setHasSeen(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (hasSeen || !isVisible) return null

  return (
    <div className="assistant-welcome-banner">
      <div className="assistant-welcome-content">
        <span className="assistant-welcome-icon">✨</span>
        <span className="assistant-welcome-text">
          You now have an AI assistant to help with tasks. Tap the cloud icon.
        </span>
      </div>
      <button
        className="assistant-welcome-close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

