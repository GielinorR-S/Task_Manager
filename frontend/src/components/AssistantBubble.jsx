import React, { useState, useEffect, useRef } from 'react'

export default function AssistantBubble({ onClick, hasNewMessage = false }) {
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

  const handleMouseEnter = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 500) // Delay before showing tooltip
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
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      className={`assistant-bubble ${hasPulsed ? 'assistant-bubble--pulsed' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label="Open AI assistant"
      style={{ animation: hasPulsed ? 'none' : 'fadeIn 0.5s ease-in' }}
    >
      <div className="assistant-bubble-icon">☁️</div>
      {hasNewMessage && (
        <div className="assistant-bubble-badge">1</div>
      )}
      {showTooltip && (
        <div className="assistant-bubble-tooltip">
          ☁️ I'm your AI assistant — click me anytime!
        </div>
      )}
    </div>
  )
}

