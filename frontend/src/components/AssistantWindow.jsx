import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'

const MessageItem = React.memo(({ message }) => {
  const messageStyle = useMemo(() => ({ whiteSpace: 'pre-wrap' }), [])
  return (
    <div
      className={
        'assistant-message ' +
        (message.from === 'agent'
          ? 'assistant-message--agent'
          : 'assistant-message--user')
      }
    >
      <p style={messageStyle}>{message.text}</p>
    </div>
  )
})

MessageItem.displayName = 'MessageItem'

export default function AssistantWindow({
  isOpen,
  onClose,
  messages,
  input,
  onInputChange,
  onSend,
  isSending,
  position,
  onPositionChange,
  onDragStart,
  isDragging,
  windowRef: externalWindowRef,
}) {
  const messagesEndRef = useRef(null)
  const internalWindowRef = useRef(null)
  const windowRef = externalWindowRef || internalWindowRef

  const handleClose = useCallback((e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const handleDragStartInternal = useCallback((e) => {
    if (onDragStart) {
      onDragStart(e)
    }
  }, [onDragStart])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length])

  const windowStyle = useMemo(() => ({
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    cursor: isDragging ? 'grabbing' : 'default',
    zIndex: 1000,
  }), [position, isDragging])

  if (!isOpen) return null

  return (
    <div
      className="assistant-window"
      style={windowStyle}
      ref={windowRef}
      onClick={(e) => e.stopPropagation()}
    >
      <header
        className="assistant-header"
        onPointerDown={handleDragStartInternal}
        onTouchStart={handleDragStartInternal}
      >
        <div className="assistant-drag-handle">
          <span>☁️</span>
          <div>
            <p className="eyebrow">Productivity AI</p>
            <h3>Aurora</h3>
          </div>
        </div>
        <button
          type="button"
          className="assistant-close"
          onClick={handleClose}
          aria-label="Close assistant"
        >
          ×
        </button>
      </header>

      <div className="assistant-messages">
        {messages.map((m, idx) => (
          <MessageItem key={`${m.from}-${idx}-${m.text.slice(0, 20)}`} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="assistant-input" onSubmit={onSend}>
        <input
          value={input}
          onChange={onInputChange}
          placeholder="Ask me anything about your tasks, or tell me what to do. I understand natural language!"
          disabled={isSending}
        />
        <button type="submit" className="button" disabled={isSending}>
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

