import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import api from '../api'
import { useTasks } from '../contexts/TaskContext'
import { useAssistant } from '../contexts/AssistantContext'
import { TaskDomainEngine } from '../utils/taskDomainEngine'
import { parseCommandType } from '../utils/commandParser'
import { ConversationEngine } from '../utils/conversationEngine'
import { StateMachine, PENDING_ACTIONS, PENDING_STEPS } from '../utils/stateMachine'
import { processSmallTalk } from '../utils/smallTalkEngine'
import {
  detectSmallTalk,
  detectCreateTaskIntent,
  detectBulkDeleteAll,
  detectClearChat,
} from '../utils/intentParser'
import { generateCommandList, isCommandListRequest } from '../utils/commandList'
import { getMemoryManager } from '../utils/memoryManager'
import { getToneEngine } from '../utils/toneEngine'
import { EnhancedDateTimeParser } from '../utils/enhancedDateTimeParser'
import { setEnhancedParser } from '../utils/nlpExtractor'
import { getAuroraResponseEngine } from '../utils/auroraResponseEngine'
import { applyAuroraPersona } from '../utils/auroraPersona'
import AuroraBubble from './AuroraBubble'
import AuroraWindow from './AuroraWindow'

const AGENT_NAME = 'Aurora'
const MAX_MESSAGES = 50

// Min/max sizes
const MIN_WIDTH = 280
const MAX_WIDTH = 580
const MIN_HEIGHT = 380
const MAX_HEIGHT = () => Math.min(window.innerHeight * 0.9, 800)

// Default size
const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 500

// Load persisted state
function loadPersistedState() {
  if (typeof window === 'undefined') {
    return {
      isOpen: false,
      position: { x: 0, y: 100 },
      size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    }
  }

  const savedOpen = localStorage.getItem('auroraIsOpen')
  const savedPosition = localStorage.getItem('auroraPosition')
  const savedSize = localStorage.getItem('auroraSize')

  // Calculate default position (bottom-right)
  const defaultX = Math.max(0, window.innerWidth - DEFAULT_WIDTH - 24)
  const defaultY = Math.max(0, window.innerHeight - DEFAULT_HEIGHT - 24)

  let position = { x: defaultX, y: defaultY }
  if (savedPosition) {
    try {
      const parsed = JSON.parse(savedPosition)
      const maxX = Math.max(0, window.innerWidth - MIN_WIDTH)
      const maxY = Math.max(0, window.innerHeight - MIN_HEIGHT)
      position = {
        x: Math.max(0, Math.min(maxX, parsed.x || defaultX)),
        y: Math.max(0, Math.min(maxY, parsed.y || defaultY)),
      }
    } catch {
      // Use default
    }
  }

  let size = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  if (savedSize) {
    try {
      const parsed = JSON.parse(savedSize)
      size = {
        width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed.width || DEFAULT_WIDTH)),
        height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT(), parsed.height || DEFAULT_HEIGHT)),
      }
    } catch {
      // Use default
    }
  }

  return {
    isOpen: savedOpen === 'true',
    position,
    size,
  }
}

export default function AssistantPanel() {
  const taskContext = useTasks()
  const assistantContext = useAssistant()
  const { tasks, fetchTasks, deleteAllTasks } = taskContext
  const {
    pendingAction,
    pendingStep,
    pendingData,
    messages: contextMessages,
    introShown,
    hintDismissed,
    introAddedRef,
    updatePendingAction,
    updatePendingStep,
    updatePendingData,
    addMessage: contextAddMessage,
    resetState: contextResetState,
    markIntroShown,
    dismissHint,
    clearChat: contextClearChat,
  } = assistantContext

  // Load persisted UI state
  const persistedState = useMemo(() => loadPersistedState(), [])
  const [isOpen, setIsOpen] = useState(persistedState.isOpen)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState(persistedState.position)
  const [size, setSize] = useState(persistedState.size)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [hasNewMessage, setHasNewMessage] = useState(false)
  // Show hint on every refresh unless user dismissed it
  const [showAssistantHint, setShowAssistantHint] = useState(!hintDismissed)

  const messagesEndRef = useRef(null)
  const engineRef = useRef(null)
  const conversationEngineRef = useRef(null)
  const stateMachineRef = useRef(null)
  const memoryManagerRef = useRef(null)
  const toneEngineRef = useRef(null)
  const dateTimeParserRef = useRef(null)
  const auroraResponseEngineRef = useRef(null)
  const taskContextRef = useRef(taskContext)
  const windowRef = useRef(null)
  const initializedRef = useRef(false)

  // Initialize engines (only once)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (!conversationEngineRef.current) {
      conversationEngineRef.current = new ConversationEngine()
    }
    if (!stateMachineRef.current) {
      stateMachineRef.current = new StateMachine()
      // Restore state from context
      stateMachineRef.current.pendingAction = pendingAction
      stateMachineRef.current.pendingStep = pendingStep
      stateMachineRef.current.pendingData = { ...pendingData }
    }
    if (!memoryManagerRef.current) {
      memoryManagerRef.current = getMemoryManager()
      memoryManagerRef.current.loadMemory().then(memory => {
        if (!toneEngineRef.current) {
          toneEngineRef.current = getToneEngine(memory.ai_tone_preference || 'professional')
        }
        if (!dateTimeParserRef.current) {
          dateTimeParserRef.current = new EnhancedDateTimeParser(memoryManagerRef.current)
          setEnhancedParser(dateTimeParserRef.current)
        }
        // Initialize Aurora response engine
        if (!auroraResponseEngineRef.current) {
          auroraResponseEngineRef.current = getAuroraResponseEngine(
            memoryManagerRef.current,
            toneEngineRef.current
          )
        }
      })
    }
  }, []) // Empty deps - only run once

  // Ref to track if intro was added locally (prevents multiple intro messages)
  const introAddedLocalRef = useRef(false)

  // Add intro message ONLY ONCE after messages are loaded
  useEffect(() => {
    // If intro was already added locally or in context, skip
    if (introAddedLocalRef.current || introAddedRef.current) {
      return
    }

    // Wait for messages to be loaded from localStorage
    if (contextMessages.length > 0) {
      // Messages exist, intro was already shown
      introAddedLocalRef.current = true
      return
    }

    // Only add intro if we have all engines initialized
    if (!memoryManagerRef.current || !toneEngineRef.current) {
      // Wait a bit for engines to initialize
      const timer = setTimeout(() => {
        if (!introAddedLocalRef.current && !introAddedRef.current && contextMessages.length === 0) {
          if (memoryManagerRef.current && toneEngineRef.current) {
            memoryManagerRef.current.loadMemory().then(memory => {
              // Final check before adding
              if (contextMessages.length === 0 && !introAddedLocalRef.current && !introAddedRef.current) {
                const greeting = toneEngineRef.current.generateGreeting(AGENT_NAME)
                const personalizedGreeting = applyAuroraPersona(greeting, {}, memory)
                contextAddMessage({ from: 'agent', text: personalizedGreeting })
                markIntroShown()
                introAddedLocalRef.current = true
              }
            })
          }
        }
      }, 500)
      return () => clearTimeout(timer)
    }

    // Add intro message ONCE
    introAddedLocalRef.current = true
    memoryManagerRef.current.loadMemory().then(memory => {
      // Final check: only add if still no messages
      if (contextMessages.length === 0) {
        const greeting = toneEngineRef.current.generateGreeting(AGENT_NAME)
        const personalizedGreeting = applyAuroraPersona(greeting, {}, memory)
        contextAddMessage({ from: 'agent', text: personalizedGreeting })
        markIntroShown()
      }
    })
  }, []) // Empty deps - only run once on mount

  // Sync state machine with context
  useEffect(() => {
    if (stateMachineRef.current) {
      stateMachineRef.current.pendingAction = pendingAction
      stateMachineRef.current.pendingStep = pendingStep
      stateMachineRef.current.pendingData = { ...pendingData }
    }
  }, [pendingAction, pendingStep, pendingData])

  // Persist UI state
  useEffect(() => {
    localStorage.setItem('auroraIsOpen', isOpen.toString())
  }, [isOpen])

  useEffect(() => {
    localStorage.setItem('auroraPosition', JSON.stringify(position))
  }, [position])

  useEffect(() => {
    localStorage.setItem('auroraSize', JSON.stringify(size))
  }, [size])

  // Update ref when context changes
  useEffect(() => {
    taskContextRef.current = taskContext
    if (engineRef.current) {
      engineRef.current.contextRef = taskContextRef
    }
  }, [taskContext])

  // Create engine instance
  const engine = useMemo(() => {
    if (!engineRef.current) {
      engineRef.current = new TaskDomainEngine(tasks || [], taskContextRef)
    }
    engineRef.current.tasks = tasks || []
    return engineRef.current
  }, [tasks])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && contextMessages.length > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [contextMessages.length])

  // Refresh tasks when panel opens
  useEffect(() => {
    if (isOpen && tasks.length === 0) {
      fetchTasks()
    }
  }, [isOpen, tasks.length, fetchTasks])

  // Hide hint after interaction
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowAssistantHint(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleToggle = useCallback((e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsOpen(prev => {
      const newState = !prev
      if (!newState) {
        setHasNewMessage(false)
      }
      return newState
    })
  }, [])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
  }, [])

  // Pointer-based drag handlers
  const handleDragStart = useCallback((e) => {
    if (!isOpen || !windowRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const rect = windowRef.current.getBoundingClientRect()
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0

    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    })
    setIsDragging(true)
  }, [isOpen])

  // Resize handlers
  const handleResizeStart = useCallback((e) => {
    if (!isOpen || !windowRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const rect = windowRef.current.getBoundingClientRect()
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0

    setResizeStart({
      x: clientX,
      y: clientY,
      width: rect.width,
      height: rect.height,
    })
    setIsResizing(true)
  }, [isOpen])

  // Drag and resize effects
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0

      if (isDragging) {
        const newX = clientX - dragOffset.x
        const newY = clientY - dragOffset.y

        const maxX = window.innerWidth - size.width
        const maxY = window.innerHeight - size.height
        const constrainedX = Math.max(0, Math.min(maxX, newX))
        const constrainedY = Math.max(0, Math.min(maxY, newY))

        setPosition({ x: constrainedX, y: constrainedY })
      }

      if (isResizing) {
        const deltaX = clientX - resizeStart.x
        const deltaY = clientY - resizeStart.y

        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + deltaX))
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT(), resizeStart.height + deltaY))

        setSize({ width: newWidth, height: newHeight })

        const maxX = window.innerWidth - newWidth
        const maxY = window.innerHeight - newHeight
        setPosition(prev => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        }))
      }
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('touchmove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('touchend', handlePointerUp)
    document.body.style.cursor = isResizing ? 'nwse-resize' : 'grabbing'
    document.body.style.userSelect = 'none'
    document.body.style.touchAction = 'none'

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('touchmove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('touchend', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, size])

  const send = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const userMsg = { from: 'user', text: trimmed }
    contextAddMessage(userMsg)
    setInput('')
    setIsSending(true)

    try {
      const stateMachine = stateMachineRef.current
      const memoryManager = memoryManagerRef.current
      const toneEngine = toneEngineRef.current
      const auroraEngine = auroraResponseEngineRef.current

      // Learn from user input
      if (memoryManager) {
        const learned = await memoryManager.learnFromInput(trimmed)
        if (learned) {
          const confirmation = `Understood — I'll remember that for next time.`
          const personalized = auroraEngine
            ? auroraEngine.generateResponse(confirmation, { actionCompleted: false })
            : applyAuroraPersona(confirmation, {}, memoryManager.getAll())
          contextAddMessage({ from: 'agent', text: personalized })
        }
      }

      // PRIORITY 1: Check if we're in an active flow
      if (stateMachine && stateMachine.isInActiveFlow()) {
        const result = stateMachine.processInput(trimmed, tasks)

        // Handle bulk confirmation
        if (result.action === 'confirm_bulk') {
          if (result.bulkAction === PENDING_ACTIONS.BULK_DELETE_ALL) {
            const taskCount = tasks.length
            try {
              await deleteAllTasks()
              const memory = memoryManager?.getAll() || {}
              const response = `Done — I've deleted all ${taskCount} tasks. Your list is now empty.`
              const personalized = auroraEngine
                ? auroraEngine.generateResponse(response, { actionCompleted: true })
                : applyAuroraPersona(response, { actionCompleted: true }, memory)
              contextAddMessage({ from: 'agent', text: personalized })
              stateMachine.reset()
              contextResetState()
              setTimeout(() => fetchTasks(), 300)
            } catch (error) {
              console.error('Bulk delete error:', error)
              const memory = memoryManager?.getAll() || {}
              const errorMsg = "I encountered an error deleting the tasks. Please try again."
              const personalized = auroraEngine
                ? auroraEngine.generateResponse(errorMsg, {})
                : applyAuroraPersona(errorMsg, {}, memory)
              contextAddMessage({ from: 'agent', text: personalized })
              stateMachine.reset()
              contextResetState()
            }
          }
          setIsSending(false)
          return
        }

        // Handle cancel
        if (result.action === 'cancel') {
          const memory = memoryManager?.getAll() || {}
          const personalized = auroraEngine
            ? auroraEngine.generateResponse(result.message, {})
            : applyAuroraPersona(result.message, {}, memory)
          contextAddMessage({ from: 'agent', text: personalized })
          stateMachine.reset()
          contextResetState()
          setIsSending(false)
          return
        }

        // Handle retry
        if (result.action === 'retry') {
          const question = stateMachine.getCurrentQuestion()
          if (question) {
            const memory = memoryManager?.getAll() || {}
            const personalized = auroraEngine
              ? auroraEngine.generateResponse(question, {})
              : applyAuroraPersona(question, {}, memory)
            contextAddMessage({ from: 'agent', text: personalized })
          }
          setIsSending(false)
          return
        }

        // Handle continue in task creation
        if (result.action === 'continue') {
          // Update context state
          if (result.data) {
            updatePendingData(result.data)
          }
          updatePendingStep(stateMachine.pendingStep)

          // Check if complete
          if (stateMachine.isComplete()) {
            const taskData = stateMachine.getFinalTaskData()
            const context = taskContextRef.current

            try {
              const task = await context.createTask(taskData)

              // Use Aurora's task creation confirmation format
              const memory = memoryManager?.getAll() || {}
              const confirmation = auroraEngine
                ? auroraEngine.generateTaskCreationConfirmation(task, taskData, memory)
                : `Absolutely — I can take care of that for you.\n\nI've created a task called '${task.title}' with:\n• Description: ${taskData.description || 'none'}\n• Due: ${taskData.due_at ? new Date(taskData.due_at).toLocaleDateString() : 'none'}\n• Priority: ${taskData.priority || 'medium'}\n• Category: ${taskData.category || 'other'}\n\nWould you like to:\n• Create another task\n• Update a task\n• Show my tasks\n• Just chat`

              const personalized = auroraEngine
                ? auroraEngine.generateResponse(confirmation, { actionCompleted: true, shouldOfferNextSteps: true })
                : applyAuroraPersona(confirmation, { actionCompleted: true, shouldOfferNextSteps: true }, memory)

              contextAddMessage({ from: 'agent', text: personalized })
              stateMachine.reset()
              contextResetState()

              // Next steps already included in confirmation

              setTimeout(() => {
                fetchTasks()
              }, 300)
            } catch (error) {
              console.error('Task creation error:', error)
              const memory = memoryManager?.getAll() || {}
              const errorMsg = "I encountered an error creating the task. Please try again."
              const personalized = auroraEngine
                ? auroraEngine.generateResponse(errorMsg, {})
                : applyAuroraPersona(errorMsg, {}, memory)
              contextAddMessage({ from: 'agent', text: personalized })
            }
          } else {
            const question = stateMachine.getCurrentQuestion()
            if (question) {
              const memory = memoryManager?.getAll() || {}
              const personalized = auroraEngine
                ? auroraEngine.generateResponse(question, {})
                : applyAuroraPersona(question, {}, memory)
              contextAddMessage({ from: 'agent', text: personalized })
            }
          }
          setIsSending(false)
          return
        }

        // Handle complete
        if (result.action === 'complete') {
          const taskData = stateMachine.getFinalTaskData()
          const context = taskContextRef.current

          try {
            const task = await context.createTask(taskData)

            // Use Aurora's task creation confirmation format
            const memory = memoryManager?.getAll() || {}
            const confirmation = auroraEngine
              ? auroraEngine.generateTaskCreationConfirmation(task, taskData, memory)
              : `Absolutely — I can take care of that for you.\n\nI've created a task called '${task.title}' with:\n• Description: ${taskData.description || 'none'}\n• Due: ${taskData.due_at ? new Date(taskData.due_at).toLocaleDateString() : 'none'}\n• Priority: ${taskData.priority || 'medium'}\n• Category: ${taskData.category || 'other'}\n\nWould you like to:\n• Create another task\n• Update a task\n• Show my tasks\n• Just chat`

            const personalized = auroraEngine
              ? auroraEngine.generateResponse(confirmation, { actionCompleted: true, shouldOfferNextSteps: true })
              : applyAuroraPersona(confirmation, { actionCompleted: true, shouldOfferNextSteps: true }, memory)

            contextAddMessage({ from: 'agent', text: personalized })
            stateMachine.reset()
            contextResetState()

            setTimeout(() => {
              fetchTasks()
            }, 300)
          } catch (error) {
            console.error('Task creation error:', error)
            const memory = memoryManager?.getAll() || {}
            const errorMsg = "I encountered an error creating the task. Please try again."
            const personalized = auroraEngine
              ? auroraEngine.generateResponse(errorMsg, {})
              : applyAuroraPersona(errorMsg, {}, memory)
            contextAddMessage({ from: 'agent', text: personalized })
          }

          setIsSending(false)
          return
        }
      }

      // PRIORITY 2: Clear chat command
      if (detectClearChat(trimmed)) {
        contextClearChat()
        // Reset local intro ref so intro can be shown again
        introAddedLocalRef.current = false
        // Show confirmation and re-add intro message
        const memory = memoryManager?.getAll() || {}
        const confirmation = "Chat cleared! Starting fresh. How can I help you today?"
        const personalized = auroraEngine
          ? auroraEngine.generateResponse(confirmation, {})
          : applyAuroraPersona(confirmation, {}, memory)
        contextAddMessage({ from: 'agent', text: personalized })
        
        // Re-add intro message after a short delay
        setTimeout(() => {
          if (memoryManagerRef.current && toneEngineRef.current) {
            memoryManagerRef.current.loadMemory().then(memory => {
              const greeting = toneEngineRef.current.generateGreeting(AGENT_NAME)
              const personalizedGreeting = applyAuroraPersona(greeting, {}, memory)
              contextAddMessage({ from: 'agent', text: personalizedGreeting })
              markIntroShown()
            })
          }
        }, 500)
        
        setIsSending(false)
        return
      }

      // PRIORITY 3: Small talk
      if (detectSmallTalk(trimmed)) {
        const response = processSmallTalk(trimmed)
        if (response) {
          const memory = memoryManager?.getAll() || {}
          const personalized = auroraEngine
            ? auroraEngine.generateResponse(response, {})
            : applyAuroraPersona(response, {}, memory)
          contextAddMessage({ from: 'agent', text: personalized })
          setIsSending(false)
          return
        }
      }

      // PRIORITY 4: Bulk intents
      if (detectBulkDeleteAll(trimmed)) {
        const taskCount = tasks.length
        if (taskCount === 0) {
          const memory = memoryManager?.getAll() || {}
          const response = "You don't have any tasks to delete. Your list is already empty!"
          const personalized = auroraEngine
            ? auroraEngine.generateResponse(response, {})
            : applyAuroraPersona(response, {}, memory)
          contextAddMessage({ from: 'agent', text: personalized })
          setIsSending(false)
          return
        }

        stateMachine.startBulkDeleteAll(taskCount)
        updatePendingAction(PENDING_ACTIONS.BULK_DELETE_ALL)
        updatePendingStep(PENDING_STEPS.CONFIRM)
        const memory = memoryManager?.getAll() || {}
        const confirmationMsg = `You currently have ${taskCount} tasks. Do you want me to delete **ALL** of them?\n\nType **confirm** to delete everything, or **cancel** to leave them.`
        const personalized = auroraEngine
          ? auroraEngine.generateResponse(confirmationMsg, {})
          : applyAuroraPersona(confirmationMsg, {}, memory)
        contextAddMessage({
          from: 'agent',
          text: personalized
        })
        setIsSending(false)
        return
      }

      // PRIORITY 4: Normal CRUD actions
      if (isCommandListRequest(trimmed)) {
        contextAddMessage({ from: 'agent', text: generateCommandList() })
        setIsSending(false)
        return
      }

      if (detectCreateTaskIntent(trimmed)) {
        stateMachine.startTaskCreation()
        updatePendingAction(PENDING_ACTIONS.CREATE_TASK)
        updatePendingStep(PENDING_STEPS.TITLE)
        const question = stateMachine.getCurrentQuestion()
        const memory = memoryManager?.getAll() || {}
        const personalized = auroraEngine
          ? auroraEngine.generateResponse(question, {})
          : applyAuroraPersona(question, {}, memory)
        contextAddMessage({ from: 'agent', text: personalized })
        setIsSending(false)
        return
      }

      const lower = trimmed.toLowerCase()
      if (lower.match(/^(yes|yeah|yep|sure|ok|okay|add|create|make|new|another task)/) &&
          contextMessages.length > 0 &&
          contextMessages[contextMessages.length - 1].text.includes("Do you want to create another task")) {
        stateMachine.startTaskCreation()
        updatePendingAction(PENDING_ACTIONS.CREATE_TASK)
        updatePendingStep(PENDING_STEPS.TITLE)
        const question = stateMachine.getCurrentQuestion()
        const memory = memoryManager?.getAll() || {}
        const personalized = auroraEngine
          ? auroraEngine.generateResponse(question, {})
          : applyAuroraPersona(question, {}, memory)
        contextAddMessage({ from: 'agent', text: personalized })
        setIsSending(false)
        return
      }

      // PRIORITY 5: Task domain engine
      if (!engine || typeof engine.processCommand !== 'function') {
        throw new Error('Engine not initialized properly')
      }

      const reply = await engine.processCommand(trimmed)
      const memory = memoryManager?.getAll() || {}
      const personalized = auroraEngine
        ? auroraEngine.generateResponse(reply, { lastUserMessage: trimmed })
        : applyAuroraPersona(reply, { lastUserMessage: trimmed }, memory)
      contextAddMessage({ from: 'agent', text: personalized })

      const commandType = parseCommandType(trimmed)
      const actionTaken = reply.includes('✓') ||
                         reply.includes('Created') ||
                         reply.includes('Deleted') ||
                         reply.includes('Updated') ||
                         reply.includes('Completed') ||
                         reply.includes('Marked')

      if (actionTaken && commandType !== 'info' && commandType !== 'filter' && commandType !== 'plan') {
        setTimeout(() => {
          fetchTasks()
        }, 300)
      }
    } catch (err) {
      console.error('Assistant error:', err)
      const toneEngine = toneEngineRef.current
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
        try {
          const reply = await engine.processCommand(trimmed)
          errorMessage = reply
        } catch (localErr) {
          errorMessage = "I couldn't process that command. Please try again."
        }
      } else {
        errorMessage = err.message || "I couldn't process that command. Please try again."
      }

      const memory = memoryManager?.getAll() || {}
      const personalized = auroraEngine
        ? auroraEngine.generateResponse(errorMessage, { lastUserMessage: trimmed })
        : applyAuroraPersona(errorMessage, { lastUserMessage: trimmed }, memory)
      contextAddMessage({ from: 'agent', text: personalized })
    } finally {
      setIsSending(false)
    }
  }, [input, isSending, engine, fetchTasks, contextAddMessage, tasks, deleteAllTasks, contextMessages, updatePendingAction, updatePendingStep, updatePendingData, contextResetState, size])

  return (
    <>
          <AuroraBubble
            onClick={() => {
              handleToggle()
              if (showAssistantHint) {
                setShowAssistantHint(false)
                dismissHint()
              }
            }}
            hasNewMessage={hasNewMessage}
            showHint={showAssistantHint}
          />
      <AuroraWindow
        isOpen={isOpen}
        onClose={handleToggle}
        messages={contextMessages}
        input={input}
        onInputChange={handleInputChange}
        onSend={send}
        isSending={isSending}
        position={position}
        size={size}
        onPositionChange={setPosition}
        onSizeChange={setSize}
        onDragStart={handleDragStart}
        isDragging={isDragging}
        isResizing={isResizing}
        onResizeStart={handleResizeStart}
        windowRef={windowRef}
        messagesEndRef={messagesEndRef}
      />
    </>
  )
}
