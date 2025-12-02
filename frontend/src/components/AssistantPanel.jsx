import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import api from '../api'
import { useTasks } from '../contexts/TaskContext'
import { TaskDomainEngine } from '../utils/taskDomainEngine'
import { parseCommandType } from '../utils/commandParser'

const AGENT_NAME = 'Aurora'
const MAX_MESSAGES = 50 // Limit message history to prevent memory bloat
const INITIAL_MESSAGE = {
  from: 'agent',
  text: `Hi, I'm ${AGENT_NAME}, your intelligent productivity assistant. I can help you manage tasks, plan your day, analyze your workload, and much more. What would you like to do?`,
}

// Memoized message component
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

export default function AssistantPanel() {
  const taskContext = useTasks()
  const { tasks, fetchTasks } = taskContext
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const engineRef = useRef(null)
  const taskContextRef = useRef(taskContext)

  // Update ref when context changes (stable reference)
  useEffect(() => {
    taskContextRef.current = taskContext
    if (engineRef.current) {
      engineRef.current.contextRef = taskContextRef
    }
  }, [taskContext])

  // Create engine instance only once, update tasks property when needed
  const engine = useMemo(() => {
    if (!engineRef.current) {
      // Pass ref object so engine can access current context
      engineRef.current = new TaskDomainEngine(tasks || [], taskContextRef)
    }
    // Update tasks without recreating engine
    engineRef.current.tasks = tasks || []
    return engineRef.current
  }, [tasks]) // Only recreate if tasks array reference changes

  // Auto-scroll to bottom when new messages arrive (throttled)
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length]) // Only depend on length, not full array

  // Refresh tasks when panel opens to ensure we have latest data
  useEffect(() => {
    if (isOpen && tasks.length === 0) {
      fetchTasks()
    }
  }, [isOpen, tasks.length, fetchTasks])

  // Limit message history to prevent memory bloat
  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      const updated = [...prev, newMessage]
      // Keep only last MAX_MESSAGES
      return updated.slice(-MAX_MESSAGES)
    })
  }, [])

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
  }, [])

  // Memoize task summary creation (moved before send to fix dependency)
  const taskSummary = useMemo(() => tasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    due_at: t.due_at,
  })), [tasks])

  const send = useCallback(async (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    
    const userMsg = { from: 'user', text: trimmed }
    addMessage(userMsg)
    setInput('')
    setIsSending(true)
    
    try {
      // Always try local engine first - it now handles everything comprehensively
      if (!engine || typeof engine.processCommand !== 'function') {
        throw new Error('Engine not initialized properly')
      }
      const reply = await engine.processCommand(trimmed)
      addMessage({ from: 'agent', text: reply })
      
      // Check if action was taken (refresh tasks if needed)
      const commandType = parseCommandType(trimmed)
      const actionTaken = reply.includes('✓') || 
                         reply.includes('Created') || 
                         reply.includes('Deleted') || 
                         reply.includes('Updated') ||
                         reply.includes('Completed') ||
                         reply.includes('Marked')
      
      if (actionTaken && commandType !== 'info' && commandType !== 'filter' && commandType !== 'plan') {
        // Small delay to ensure backend has processed
        setTimeout(() => {
          fetchTasks()
        }, 300)
      }
      
      // Fallback to backend AI only for truly complex natural language that local engine couldn't handle
      // This is now rare since local engine is comprehensive
      if (reply.includes("I'm not entirely sure") || reply.includes("Could you be more specific")) {
        try {
          const res = await api.post('/assistant/command/', { 
            message: trimmed,
            tasks: taskSummary
          })
          const backendReply = res.data?.reply
          if (backendReply && backendReply !== reply) {
            // Replace with backend response if it's different
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { from: 'agent', text: backendReply }
              return updated.slice(-MAX_MESSAGES)
            })
            if (backendReply.includes('✓') || backendReply.includes('Created') || backendReply.includes('Deleted')) {
              setTimeout(() => fetchTasks(), 500)
            }
          }
        } catch (backendErr) {
          // Backend failed, keep local response
          console.log('Backend fallback unavailable, using local response')
        }
      }
    } catch (err) {
      console.error('Assistant error:', err)
      let errorMessage = "I encountered an error processing that command. Please try again."
      
      if (err.response) {
        const status = err.response.status
        const data = err.response.data
        if (status === 500) {
          errorMessage = "The server encountered an error. Please check the backend logs or try again."
        } else if (status === 401) {
          errorMessage = "You need to log in again. Please refresh the page and log in."
        } else if (data?.reply) {
          errorMessage = data.reply
        } else {
          errorMessage = `Server error (${status}). Please try again.`
        }
      } else if (err.request) {
        // Network error - try local engine
        try {
          const reply = await engine.processCommand(trimmed)
          errorMessage = reply
        } catch (localErr) {
          errorMessage = "I couldn't process that command. Please try again."
        }
      } else {
        errorMessage = err.message || "I couldn't process that command. Please try again."
      }
      
      addMessage({ from: 'agent', text: errorMessage })
    } finally {
      setIsSending(false)
    }
  }, [input, isSending, engine, fetchTasks, addMessage, taskSummary])

  // Memoize header to prevent re-renders
  const headerContent = useMemo(() => (
    <header className="assistant-header">
      <div>
        <p className="eyebrow">Productivity AI</p>
        <h3>{AGENT_NAME}</h3>
        <p className="muted small">
          Your intelligent productivity AI. I understand natural language, answer questions, plan your day, and manage tasks with deep reasoning.
        </p>
      </div>
    </header>
  ), [])

  return (
    <div className="assistant-shell">
      <button
        type="button"
        className="assistant-toggle"
        onClick={handleToggle}
      >
        {isOpen ? '×' : '💬'}
      </button>

      {isOpen && (
        <div className="assistant-panel">
          {headerContent}

          <div className="assistant-messages">
            {messages.map((m, idx) => (
              <MessageItem key={`${m.from}-${idx}-${m.text.slice(0, 20)}`} message={m} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="assistant-input" onSubmit={send}>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about your tasks, or tell me what to do. I understand natural language!"
              disabled={isSending}
            />
            <button type="submit" className="button" disabled={isSending}>
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
