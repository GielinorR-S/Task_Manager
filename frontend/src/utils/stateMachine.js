/**
 * State Machine
 * Strict finite state machine for task creation and bulk operations
 */

import {
  extractTitle,
  extractDescription,
  extractDate,
  extractTime,
  extractPriority,
  extractCategory,
  detectSkip,
  detectCancel,
} from './intentParser'
import { parseDateTime } from './advancedParser'

export const PENDING_ACTIONS = {
  NONE: null,
  CREATE_TASK: 'create_task',
  BULK_DELETE_ALL: 'bulk_delete_all_tasks',
}

export const PENDING_STEPS = {
  NONE: null,
  TITLE: 'title',
  DESCRIPTION: 'description',
  DATE: 'date',
  TIME: 'time',
  PRIORITY: 'priority',
  CATEGORY: 'category',
  CONFIRM: 'confirm',
}

export class StateMachine {
  constructor() {
    this.pendingAction = PENDING_ACTIONS.NONE
    this.pendingStep = PENDING_STEPS.NONE
    this.pendingData = {
      title: '',
      description: '',
      date: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = [] // Track which steps we've asked
  }

  /**
   * Check if in active flow
   */
  isInActiveFlow() {
    return this.pendingAction !== PENDING_ACTIONS.NONE && this.pendingStep !== PENDING_STEPS.NONE
  }

  /**
   * Check if in task creation
   */
  isInTaskCreation() {
    return this.pendingAction === PENDING_ACTIONS.CREATE_TASK
  }

  /**
   * Check if in bulk confirmation
   */
  isInBulkConfirmation() {
    return (
      this.pendingAction === PENDING_ACTIONS.BULK_DELETE_ALL &&
      this.pendingStep === PENDING_STEPS.CONFIRM
    )
  }

  /**
   * Start task creation
   */
  startTaskCreation() {
    this.pendingAction = PENDING_ACTIONS.CREATE_TASK
    this.pendingStep = PENDING_STEPS.TITLE
    this.pendingData = {
      title: '',
      description: '',
      date: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = [PENDING_STEPS.TITLE]
  }

  /**
   * Start bulk delete confirmation
   */
  startBulkDeleteAll(taskCount) {
    this.pendingAction = PENDING_ACTIONS.BULK_DELETE_ALL
    this.pendingStep = PENDING_STEPS.CONFIRM
    this.pendingData = { taskCount }
    this.stepHistory = [PENDING_STEPS.CONFIRM]
  }

  /**
   * Process input based on current state
   */
  processInput(message, tasks = []) {
    // Handle bulk confirmation
    if (this.isInBulkConfirmation()) {
      return this.processBulkConfirmation(message)
    }

    // Handle task creation
    if (this.isInTaskCreation()) {
      return this.processTaskCreation(message)
    }

    return { action: 'unknown' }
  }

  /**
   * Process bulk confirmation
   */
  processBulkConfirmation(message) {
    const lower = message.toLowerCase().trim()

    if (detectConfirm(lower)) {
      return { action: 'confirm_bulk', bulkAction: this.pendingAction }
    }

    if (detectCancel(lower)) {
      this.reset()
      return { action: 'cancel', message: "Okay, I've left your tasks as they are." }
    }

    return { action: 'retry', field: 'confirm' }
  }

  /**
   * Process task creation input
   */
  processTaskCreation(message) {
    // Check for cancel (only explicit cancel)
    const lower = message.toLowerCase().trim()
    if (detectCancel(lower)) {
      this.reset()
      return { action: 'cancel', message: "No problem. I've cancelled the task creation." }
    }

    // Process based on current step
    switch (this.pendingStep) {
      case PENDING_STEPS.TITLE:
        return this.processTitle(message)
      case PENDING_STEPS.DESCRIPTION:
        return this.processDescription(message)
      case PENDING_STEPS.DATE:
        return this.processDate(message)
      case PENDING_STEPS.TIME:
        return this.processTime(message)
      case PENDING_STEPS.PRIORITY:
        return this.processPriority(message)
      case PENDING_STEPS.CATEGORY:
        return this.processCategory(message)
      default:
        return { action: 'unknown' }
    }
  }

  /**
   * Process title step
   */
  processTitle(message) {
    // Check for explicit skip
    if (detectSkip(message)) {
      // Title is required, so we can't skip - ask again
      return { action: 'retry', field: 'title', message: "I need a title for the task. What would you like to name it?" }
    }

    const title = extractTitle(message)
    
    // Title extraction should NEVER return empty unless user explicitly said "skip"
    // If title is empty, it means user said "skip" - but title is required
    if (!title || title.length === 0) {
      return { action: 'retry', field: 'title', message: "I need a title for the task. What would you like to name it?" }
    }

    // We have a valid title - store it and advance
    this.pendingData.title = title
    this.advanceStep(PENDING_STEPS.DESCRIPTION)
    return { action: 'continue', data: { title } }
  }

  /**
   * Process description step
   */
  processDescription(message) {
    if (detectSkip(message)) {
      this.advanceStep(PENDING_STEPS.DATE)
      return { action: 'continue', message: "No description needed." }
    }

    const description = extractDescription(message)
    if (description) {
      this.pendingData.description = description
      this.advanceStep(PENDING_STEPS.DATE)
      return { action: 'continue', data: { description } }
    }

    // Accept any text as description
    if (message.trim().length > 0) {
      this.pendingData.description = message.trim()
      this.advanceStep(PENDING_STEPS.DATE)
      return { action: 'continue', data: { description: this.pendingData.description } }
    }

    // If empty, skip
    this.advanceStep(PENDING_STEPS.DATE)
    return { action: 'continue', message: "No description needed." }
  }

  /**
   * Process date step
   */
  processDate(message) {
    if (detectSkip(message)) {
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue', message: "No due date needed." }
    }

    const date = extractDate(message)
    if (date) {
      // Try to parse it
      let parsedDate = null
      try {
        parsedDate = parseDateTime(message)
      } catch (err) {
        console.log('Date parsing error:', err)
      }

      this.pendingData.date = parsedDate || date
      this.advanceStep(PENDING_STEPS.TIME)
      return { action: 'continue', data: { date: this.pendingData.date } }
    }

    // Skip if no date found
    this.advanceStep(PENDING_STEPS.PRIORITY)
    return { action: 'continue', message: "No due date needed." }
  }

  /**
   * Process time step
   */
  processTime(message) {
    if (detectSkip(message)) {
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue' }
    }

    const time = extractTime(message)
    if (time) {
      this.pendingData.time = time
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue', data: { time } }
    }

    // Skip if no time found
    this.advanceStep(PENDING_STEPS.PRIORITY)
    return { action: 'continue' }
  }

  /**
   * Process priority step
   */
  processPriority(message) {
    if (detectSkip(message)) {
      this.advanceStep(PENDING_STEPS.CATEGORY)
      return { action: 'continue' }
    }

    const priority = extractPriority(message)
    if (priority) {
      this.pendingData.priority = priority
      this.advanceStep(PENDING_STEPS.CATEGORY)
      return { action: 'continue', data: { priority } }
    }

    // Skip if no priority found
    this.advanceStep(PENDING_STEPS.CATEGORY)
    return { action: 'continue' }
  }

  /**
   * Process category step
   */
  processCategory(message) {
    if (detectSkip(message)) {
      // All fields collected, ready to create
      return { action: 'complete' }
    }

    const category = extractCategory(message)
    if (category) {
      this.pendingData.category = category
      // All fields collected, ready to create
      return { action: 'complete', data: { category } }
    }

    // Skip if no category found, ready to create
    return { action: 'complete' }
  }

  /**
   * Advance to next step
   */
  advanceStep(nextStep) {
    this.pendingStep = nextStep
    if (nextStep !== PENDING_STEPS.NONE) {
      this.stepHistory.push(nextStep)
    }
  }

  /**
   * Get question for current step
   */
  getCurrentQuestion() {
    const questions = {
      [PENDING_STEPS.TITLE]: "What would you like to name this task?",
      [PENDING_STEPS.DESCRIPTION]: "Would you like to add a description? (or say 'skip')",
      [PENDING_STEPS.DATE]: "When is this task due? (or say 'skip' or 'no date')",
      [PENDING_STEPS.TIME]: "What time should this be scheduled? (or say 'skip')",
      [PENDING_STEPS.PRIORITY]: "What priority should this have? (high, medium, low, or 'skip')",
      [PENDING_STEPS.CATEGORY]: "Which category? (work, personal, shopping, health, finance, education, or 'skip')",
    }
    return questions[this.pendingStep] || null
  }

  /**
   * Check if we have minimum required data (at least title)
   */
  hasMinimumData() {
    return this.pendingData.title && this.pendingData.title.trim().length > 0
  }

  /**
   * Check if all fields are collected
   */
  isComplete() {
    return this.hasMinimumData() && this.pendingStep === PENDING_STEPS.CATEGORY
  }

  /**
   * Get final task data (validated)
   */
  getFinalTaskData() {
    const data = { ...this.pendingData }

    // Ensure title
    if (!data.title || data.title.trim().length === 0) {
      data.title = 'Untitled Task'
    }

    // Combine date and time
    let due_at = null
    if (data.date) {
      try {
        if (data.date instanceof Date) {
          due_at = data.date.toISOString()
        } else if (typeof data.date === 'string' && data.date.includes('T')) {
          due_at = data.date
        } else {
          due_at = parseDateTime(data.date)
          if (data.time && due_at) {
            // Try to combine time
            const timeMatch = data.time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
            if (timeMatch) {
              let hours = parseInt(timeMatch[1])
              const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
              const ampm = timeMatch[3]?.toLowerCase()

              if (ampm === 'pm' && hours !== 12) hours += 12
              if (ampm === 'am' && hours === 12) hours = 0

              const dateObj = new Date(due_at)
              dateObj.setHours(hours, minutes, 0, 0)
              due_at = dateObj.toISOString()
            }
          }
        }
      } catch (err) {
        console.log('Date parsing error in getFinalTaskData:', err)
        due_at = null
      }
    }

    return {
      title: data.title.trim(),
      description: data.description || '',
      due_at,
      priority: data.priority || 'medium',
      category: data.category || 'other',
      completed: false,
    }
  }

  /**
   * Get current state (for persistence)
   */
  getState() {
    return {
      pendingAction: this.pendingAction,
      pendingStep: this.pendingStep,
      pendingData: { ...this.pendingData },
      stepHistory: [...this.stepHistory],
    }
  }

  /**
   * Restore state (from persistence)
   */
  restoreState(state) {
    if (state) {
      this.pendingAction = state.pendingAction || PENDING_ACTIONS.NONE
      this.pendingStep = state.pendingStep || PENDING_STEPS.NONE
      this.pendingData = { ...this.pendingData, ...(state.pendingData || {}) }
      this.stepHistory = state.stepHistory || []
    }
  }

  /**
   * Reset state machine
   */
  reset() {
    this.pendingAction = PENDING_ACTIONS.NONE
    this.pendingStep = PENDING_STEPS.NONE
    this.pendingData = {
      title: '',
      description: '',
      date: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = []
  }
}

