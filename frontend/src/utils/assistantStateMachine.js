/**
 * Assistant State Machine
 * Unified state machine for all assistant operations including bulk actions and task creation
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
  detectNegation,
  detectBulkDeleteAll,
  detectConfirm,
} from './nlpExtractor'
import { parseDateTime } from './advancedParser'

export const PENDING_ACTIONS = {
  NONE: null,
  CREATE_TASK: 'create_task',
  BULK_DELETE_ALL: 'bulk_delete_all_tasks',
  BULK_COMPLETE_ALL: 'bulk_complete_all_tasks',
  BULK_DELETE_COMPLETED: 'bulk_delete_completed_tasks',
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
  COMPLETED: 'completed',
}

export class AssistantStateMachine {
  constructor() {
    this.pendingAction = PENDING_ACTIONS.NONE
    this.pendingStep = PENDING_STEPS.NONE
    this.pendingData = {
      title: null,
      description: null,
      date: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = []
    this.maxRetries = 2
    this.retryCount = {}
  }

  /**
   * Check if we're in any active flow
   */
  isInActiveFlow() {
    return this.pendingAction !== PENDING_ACTIONS.NONE && this.pendingStep !== PENDING_STEPS.NONE
  }

  /**
   * Check if in task creation
   */
  isInTaskCreation() {
    return this.pendingAction === PENDING_ACTIONS.CREATE_TASK && this.pendingStep !== PENDING_STEPS.NONE
  }

  /**
   * Check if in bulk operation confirmation
   */
  isInBulkConfirmation() {
    return (
      (this.pendingAction === PENDING_ACTIONS.BULK_DELETE_ALL ||
       this.pendingAction === PENDING_ACTIONS.BULK_COMPLETE_ALL ||
       this.pendingAction === PENDING_ACTIONS.BULK_DELETE_COMPLETED) &&
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
      title: null,
      description: null,
      date: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = [PENDING_STEPS.TITLE]
    this.retryCount = {}
  }

  /**
   * Start bulk delete all confirmation
   */
  startBulkDeleteAll(taskCount) {
    this.pendingAction = PENDING_ACTIONS.BULK_DELETE_ALL
    this.pendingStep = PENDING_STEPS.CONFIRM
    this.pendingData = { taskCount }
    this.stepHistory = [PENDING_STEPS.CONFIRM]
    this.retryCount = {}
  }

  /**
   * Process input based on current state
   */
  processInput(text, tasks = []) {
    // Handle bulk confirmation flows
    if (this.isInBulkConfirmation()) {
      return this.processBulkConfirmation(text, tasks)
    }

    // Handle task creation flow
    if (this.isInTaskCreation()) {
      return this.processTaskCreation(text)
    }

    return { action: 'unknown' }
  }

  /**
   * Process bulk confirmation
   */
  processBulkConfirmation(text, tasks) {
    const lower = text.toLowerCase().trim()

    // Check for confirm
    if (detectConfirm(lower)) {
      return { action: 'confirm_bulk', bulkAction: this.pendingAction }
    }

    // Check for cancel
    if (detectCancel(lower)) {
      this.reset()
      return { action: 'cancel', message: "Okay, I've left your tasks as they are." }
    }

    // Retry confirmation
    return { action: 'retry', field: 'confirm' }
  }

  /**
   * Process task creation input
   */
  processTaskCreation(text) {
    // Check for cancel (only explicit cancel phrases)
    const lower = text.toLowerCase().trim()
    if (lower.match(/^(cancel the task|cancel this task|forget it|leave it|stop creating|abort|quit creating)/)) {
      this.reset()
      return { action: 'cancel', message: "No problem. I've cancelled the task creation." }
    }

    // Process based on current step
    switch (this.pendingStep) {
      case PENDING_STEPS.TITLE:
        return this.processTitle(text)
      case PENDING_STEPS.DESCRIPTION:
        return this.processDescription(text)
      case PENDING_STEPS.DATE:
        return this.processDate(text)
      case PENDING_STEPS.TIME:
        return this.processTime(text)
      case PENDING_STEPS.PRIORITY:
        return this.processPriority(text)
      case PENDING_STEPS.CATEGORY:
        return this.processCategory(text)
      default:
        return { action: 'unknown' }
    }
  }

  /**
   * Process title step
   */
  processTitle(text) {
    // Skip is not allowed for title - it's required
    const title = extractTitle(text)
    
    if (title) {
      this.pendingData.title = title
      this.advanceStep(PENDING_STEPS.DESCRIPTION, 'title')
      return { action: 'continue', data: { title } }
    }
    
    // Increment retry
    this.incrementRetry('title')
    if (this.hasExceededRetries('title')) {
      // Use a default title and move on
      this.pendingData.title = 'Untitled Task'
      this.advanceStep(PENDING_STEPS.DESCRIPTION)
      return { action: 'continue', message: "I'll use 'Untitled Task' as the title. You can edit it later." }
    }
    
    return { action: 'retry', field: 'title' }
  }

  /**
   * Process description step
   */
  processDescription(text) {
    if (detectSkip(text)) {
      this.advanceStep(PENDING_STEPS.DATE)
      return { action: 'continue', message: "No description needed." }
    }
    
    const description = extractDescription(text)
    if (description) {
      this.pendingData.description = description
      this.advanceStep(PENDING_STEPS.DATE, 'description')
      return { action: 'continue', data: { description } }
    }
    
    // Accept any reasonable text as description
    if (text.length > 3) {
      this.pendingData.description = text
      this.advanceStep(PENDING_STEPS.DATE, 'description')
      return { action: 'continue', data: { description: text } }
    }
    
    // Retry
    this.incrementRetry('description')
    if (this.hasExceededRetries('description')) {
      this.advanceStep(PENDING_STEPS.DATE)
      return { action: 'continue', message: "I'll skip the description." }
    }
    
    return { action: 'retry', field: 'description' }
  }

  /**
   * Process date step
   */
  processDate(text) {
    if (detectSkip(text) || detectNegation(text, 'date')) {
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue', message: "No due date needed." }
    }
    
    const date = extractDate(text)
    if (date) {
      let parsedDate = null
      try {
        parsedDate = parseDateTime(text)
        if (!parsedDate) {
          parsedDate = parseDateTime(date)
        }
      } catch (err) {
        console.log('Date parsing error:', err)
        try {
          parsedDate = parseDateTime(date)
        } catch {
          parsedDate = null
        }
      }
      
      this.pendingData.date = parsedDate || date
      this.pendingData.dateText = text
      this.advanceStep(PENDING_STEPS.TIME, 'date')
      return { action: 'continue', data: { date: parsedDate || date } }
    }
    
    // Retry
    this.incrementRetry('date')
    if (this.hasExceededRetries('date')) {
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue', message: "I'll skip the date." }
    }
    
    return { action: 'retry', field: 'date' }
  }

  /**
   * Process time step
   */
  processTime(text) {
    if (detectSkip(text) || detectNegation(text, 'time')) {
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue' }
    }
    
    const time = extractTime(text)
    if (time) {
      if (this.pendingData.dateText) {
        try {
          const combined = `${this.pendingData.dateText} ${text}`
          const combinedDate = parseDateTime(combined)
          if (combinedDate) {
            this.pendingData.date = combinedDate
            this.pendingData.time = null
          } else {
            this.pendingData.time = time
          }
        } catch {
          this.pendingData.time = time
        }
      } else {
        this.pendingData.time = time
      }
      
      this.advanceStep(PENDING_STEPS.PRIORITY, 'time')
      return { action: 'continue', data: { time } }
    }
    
    // Retry
    this.incrementRetry('time')
    if (this.hasExceededRetries('time')) {
      this.advanceStep(PENDING_STEPS.PRIORITY)
      return { action: 'continue' }
    }
    
    return { action: 'retry', field: 'time' }
  }

  /**
   * Process priority step
   */
  processPriority(text) {
    if (detectSkip(text) || detectNegation(text, 'priority')) {
      this.advanceStep(PENDING_STEPS.CATEGORY)
      return { action: 'continue' }
    }
    
    const priority = extractPriority(text)
    if (priority) {
      this.pendingData.priority = priority
      this.advanceStep(PENDING_STEPS.CATEGORY, 'priority')
      return { action: 'continue', data: { priority } }
    }
    
    // Retry
    this.incrementRetry('priority')
    if (this.hasExceededRetries('priority')) {
      this.advanceStep(PENDING_STEPS.CATEGORY)
      return { action: 'continue' }
    }
    
    return { action: 'retry', field: 'priority' }
  }

  /**
   * Process category step
   */
  processCategory(text) {
    if (detectSkip(text) || detectNegation(text, 'category')) {
      this.advanceStep(PENDING_STEPS.COMPLETED)
      return { action: 'complete' }
    }
    
    const category = extractCategory(text)
    if (category) {
      this.pendingData.category = category
      this.advanceStep(PENDING_STEPS.COMPLETED, 'category')
      return { action: 'complete', data: { category } }
    }
    
    // Retry
    this.incrementRetry('category')
    if (this.hasExceededRetries('category')) {
      this.advanceStep(PENDING_STEPS.COMPLETED)
      return { action: 'complete' }
    }
    
    return { action: 'retry', field: 'category' }
  }

  /**
   * Advance to next step
   */
  advanceStep(nextStep, fieldProvided = null) {
    if (fieldProvided) {
      this.retryCount[fieldProvided] = 0
    }
    
    this.pendingStep = nextStep
    if (nextStep !== PENDING_STEPS.NONE && nextStep !== PENDING_STEPS.COMPLETED) {
      this.stepHistory.push(nextStep)
    }
  }

  /**
   * Increment retry count
   */
  incrementRetry(field) {
    this.retryCount[field] = (this.retryCount[field] || 0) + 1
  }

  /**
   * Check if exceeded retries
   */
  hasExceededRetries(field) {
    return (this.retryCount[field] || 0) >= this.maxRetries
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
   * Check if task creation is complete
   */
  isTaskCreationComplete() {
    return this.pendingAction === PENDING_ACTIONS.CREATE_TASK && this.pendingStep === PENDING_STEPS.COMPLETED
  }

  /**
   * Check if we have minimum required data (at least title)
   */
  hasMinimumData() {
    return this.pendingData.title !== null && this.pendingData.title.trim().length > 0
  }

  /**
   * Get final task data (validated)
   */
  getFinalTaskData() {
    const data = { ...this.pendingData }
    
    if (!data.title) {
      data.title = 'Untitled Task'
    }
    
    let due_at = null
    if (data.date) {
      try {
        if (data.date instanceof Date) {
          due_at = data.date.toISOString()
        } else if (typeof data.date === 'string' && data.date.includes('T')) {
          due_at = data.date
        } else {
          due_at = parseDateTime(data.date)
          
          if (data.time && (!due_at || !due_at.includes('T'))) {
            const combined = `${data.dateText || data.date} ${data.time}`
            const combinedParsed = parseDateTime(combined)
            if (combinedParsed) {
              due_at = combinedParsed
            }
          }
        }
      } catch (err) {
        console.log('Date parsing error in getFinalTaskData:', err)
        try {
          due_at = parseDateTime(data.date)
        } catch {
          due_at = null
        }
      }
    }
    
    return {
      title: data.title,
      description: data.description || '',
      due_at,
      priority: data.priority || 'medium',
      category: data.category || 'other',
      completed: false,
    }
  }

  /**
   * Reset state machine
   */
  reset() {
    this.pendingAction = PENDING_ACTIONS.NONE
    this.pendingStep = PENDING_STEPS.NONE
    this.pendingData = {
      title: null,
      description: null,
      date: null,
      dateText: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = []
    this.retryCount = {}
  }
}

