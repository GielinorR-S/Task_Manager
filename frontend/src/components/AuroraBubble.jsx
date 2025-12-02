import React, { useState, useEffect, useRef } from 'react'

const STORAGE_HINT_DISMISSED_KEY = 'auroraHintDismissed'

export default function AuroraBubble({ onClick, hasNewMessage = false, showHint = true }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [hasPulsed, setHasPulsed] = useState(false)
  const tooltipTimeoutRef = useRef(null)

  useEffect(() => {
    // Pulse animation on first load
    const pulseTimer = setTimeout(() => {
      setHasPulsed(true)
    }, 1000)

    return () => clearTimeout(pulseTimer)
  }, [])

  // Show hint on every page refresh if showHint is true
  useEffect(() => {
    if (showHint) {
      const hintTimer = setTimeout(() => {
        setShowTooltip(true)
      }, 1500)
      return () => clearTimeout(hintTimer)
    } else {
      setShowTooltip(false)
    }
  }, [showHint])

  const handleMouseEnter = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 500)
  }

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    setShowTooltip(false)
  }

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowTooltip(false)
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      className={`assistant-bubble aurora-bubble ${hasPulsed ? 'assistant-bubble--pulsed' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label="Open Aurora AI assistant"
      style={{ animation: hasPulsed ? 'none' : 'fadeIn 0.5s ease-in' }}
    >
      <div className="assistant-bubble-icon">☁️</div>
      {hasNewMessage && (
        <div className="assistant-bubble-badge">1</div>
      )}
      {showTooltip && (
        <div className="assistant-bubble-tooltip">
          ☁️ I'm Aurora, your AI assistant — click me anytime!
        </div>
      )}
    </div>
  )
}

