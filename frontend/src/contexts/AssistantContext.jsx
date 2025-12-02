/**
 * Assistant Context
 * Global state for assistant to prevent remounting/resetting
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const AssistantContext = createContext(null)

const STORAGE_KEY = 'auroraAssistantState'
const STORAGE_MESSAGES_KEY = 'auroraAssistantMessages'
const STORAGE_INTRO_SHOWN_KEY = 'auroraIntroShown'
const STORAGE_HINT_DISMISSED_KEY = 'auroraHintDismissed'

export function AssistantProvider({ children }) {
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingStep, setPendingStep] = useState(null)
  const [pendingData, setPendingData] = useState({
    title: '',
    description: '',
    date: null,
    time: null,
    priority: null,
    category: null,
  })
  const [messages, setMessages] = useState([])
  const [introShown, setIntroShown] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const initializedRef = useRef(false)
  const introAddedRef = useRef(false) // Prevent multiple intro messages

  // Load state from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      const savedMessages = localStorage.getItem(STORAGE_MESSAGES_KEY)
      const savedIntroShown = localStorage.getItem(STORAGE_INTRO_SHOWN_KEY)
      const savedHintDismissed = localStorage.getItem(STORAGE_HINT_DISMISSED_KEY)

      if (savedState) {
        const state = JSON.parse(savedState)
        setPendingAction(state.pendingAction)
        setPendingStep(state.pendingStep)
        setPendingData(state.pendingData || {
          title: '',
          description: '',
          date: null,
          time: null,
          priority: null,
          category: null,
        })
      }

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages)
          // If messages exist, intro was already shown
          introAddedRef.current = true
        }
      }

      if (savedIntroShown === 'true') {
        setIntroShown(true)
        introAddedRef.current = true
      }

      if (savedHintDismissed === 'true') {
        setHintDismissed(true)
      }
    } catch (err) {
      console.error('Error loading assistant state:', err)
    }
  }, [])

  // Persist state to localStorage
  useEffect(() => {
    if (!initializedRef.current) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pendingAction,
        pendingStep,
        pendingData,
      }))
    } catch (err) {
      console.error('Error saving assistant state:', err)
    }
  }, [pendingAction, pendingStep, pendingData])

  // Persist messages to localStorage
  useEffect(() => {
    if (!initializedRef.current) return
    if (messages.length === 0) return

    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages))
    } catch (err) {
      console.error('Error saving messages:', err)
    }
  }, [messages])

  // Persist intro shown
  useEffect(() => {
    if (introShown) {
      localStorage.setItem(STORAGE_INTRO_SHOWN_KEY, 'true')
    }
  }, [introShown])

  // Persist hint dismissed
  useEffect(() => {
    if (hintDismissed) {
      localStorage.setItem(STORAGE_HINT_DISMISSED_KEY, 'true')
    }
  }, [hintDismissed])

  const updatePendingAction = useCallback((action) => {
    setPendingAction(action)
  }, [])

  const updatePendingStep = useCallback((step) => {
    setPendingStep(step)
  }, [])

  const updatePendingData = useCallback((data) => {
    setPendingData(prev => ({ ...prev, ...data }))
  }, [])

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const updated = [...prev, message]
      // Limit to last 50 messages
      return updated.slice(-50)
    })
  }, [])

  const resetState = useCallback(() => {
    setPendingAction(null)
    setPendingStep(null)
    setPendingData({
      title: '',
      description: '',
      date: null,
      time: null,
      priority: null,
      category: null,
    })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const markIntroShown = useCallback(() => {
    setIntroShown(true)
    introAddedRef.current = true
  }, [])

  const dismissHint = useCallback(() => {
    setHintDismissed(true)
  }, [])

  const shouldShowIntro = useCallback(() => {
    return !introAddedRef.current && messages.length === 0 && !introShown
  }, [messages.length, introShown])

  const clearChat = useCallback(() => {
    // Clear all messages
    setMessages([])
    // Reset intro state so it can be shown again
    setIntroShown(false)
    introAddedRef.current = false
    // Clear localStorage
    localStorage.removeItem(STORAGE_MESSAGES_KEY)
    localStorage.removeItem(STORAGE_INTRO_SHOWN_KEY)
    // Reset pending state
    resetState()
  }, [resetState])

  const value = {
    pendingAction,
    pendingStep,
    pendingData,
    messages,
    introShown,
    hintDismissed,
    introAddedRef,
    updatePendingAction,
    updatePendingStep,
    updatePendingData,
    addMessage,
    resetState,
    markIntroShown,
    dismissHint,
    shouldShowIntro,
    clearChat,
  }

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error('useAssistant must be used within AssistantProvider')
  }
  return context
}

