/**
 * Task Creation State Machine
 * Professional finite state machine for multi-step task creation
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
} from './nlpExtractor'
import { parseDateTime } from './advancedParser'

export const TASK_CREATION_STEPS = {
  IDLE: 'idle',
  TITLE: 'title',
  DESCRIPTION: 'description',
  DATE: 'date',
  TIME: 'time',
  PRIORITY: 'priority',
  CATEGORY: 'category',
  COMPLETED: 'completed',
}

export class TaskCreationStateMachine {
  constructor() {
    this.pendingAction = null // "create_task" | "edit_task" | null
    this.pendingStep = TASK_CREATION_STEPS.IDLE
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
   * Start task creation
   */
  startTaskCreation() {
    this.pendingAction = 'create_task'
    this.pendingStep = TASK_CREATION_STEPS.TITLE
    this.pendingData = {
      title: null,
      description: null,
      date: null,
      time: null,
      priority: null,
      category: null,
    }
    this.stepHistory = [TASK_CREATION_STEPS.TITLE]
    this.retryCount = {}
  }

  /**
   * Check if in task creation
   */
  isInTaskCreation() {
    return this.pendingAction === 'create_task' && this.pendingStep !== TASK_CREATION_STEPS.IDLE
  }

  /**
   * Get current step
   */
  getCurrentStep() {
    return this.pendingStep
  }

  /**
   * Get pending data
   */
  getPendingData() {
    return { ...this.pendingData }
  }

  /**
   * Process input in current step
   */
  processInput(text) {
    // Check for cancel
    if (detectCancel(text)) {
      this.reset()
      return { action: 'cancel', message: "No problem. I've cancelled the task creation." }
    }

    // Process based on current step
    switch (this.pendingStep) {
      case TASK_CREATION_STEPS.TITLE:
        return this.processTitle(text)
      case TASK_CREATION_STEPS.DESCRIPTION:
        return this.processDescription(text)
      case TASK_CREATION_STEPS.DATE:
        return this.processDate(text)
      case TASK_CREATION_STEPS.TIME:
        return this.processTime(text)
      case TASK_CREATION_STEPS.PRIORITY:
        return this.processPriority(text)
      case TASK_CREATION_STEPS.CATEGORY:
        return this.processCategory(text)
      default:
        return { action: 'unknown' }
    }
  }

  /**
   * Process title step
   */
  processTitle(text) {
    const title = extractTitle(text)
    
    if (title) {
      this.pendingData.title = title
      this.advanceStep(TASK_CREATION_STEPS.DESCRIPTION, 'title')
      return { action: 'continue', data: { title } }
    }
    
    // Increment retry
    this.incrementRetry('title')
    if (this.hasExceededRetries('title')) {
      // Use a default title and move on
      this.pendingData.title = 'Untitled Task'
      this.advanceStep(TASK_CREATION_STEPS.DESCRIPTION)
      return { action: 'continue', message: "I'll use 'Untitled Task' as the title. You can edit it later." }
    }
    
    return { action: 'retry', field: 'title' }
  }

  /**
   * Process description step
   */
  processDescription(text) {
    if (detectSkip(text)) {
      this.advanceStep(TASK_CREATION_STEPS.DATE)
      return { action: 'continue', message: "No description needed." }
    }
    
    const description = extractDescription(text)
    if (description) {
      this.pendingData.description = description
      this.advanceStep(TASK_CREATION_STEPS.DATE, 'description')
      return { action: 'continue', data: { description } }
    }
    
    // Accept any reasonable text as description
    if (text.length > 3) {
      this.pendingData.description = text
      this.advanceStep(TASK_CREATION_STEPS.DATE, 'description')
      return { action: 'continue', data: { description: text } }
    }
    
    // Retry
    this.incrementRetry('description')
    if (this.hasExceededRetries('description')) {
      this.advanceStep(TASK_CREATION_STEPS.DATE)
      return { action: 'continue', message: "I'll skip the description." }
    }
    
    return { action: 'retry', field: 'description' }
  }

  /**
   * Process date step
   */
  processDate(text) {
    if (detectSkip(text) || detectNegation(text, 'date')) {
      this.advanceStep(TASK_CREATION_STEPS.PRIORITY)
      return { action: 'continue', message: "No due date needed." }
    }
    
    const date = extractDate(text)
    if (date) {
      // Try to parse it
      let parsedDate = null
      try {
        parsedDate = parseDateTime(text)
      } catch {
        // Use the extracted text
        parsedDate = date
      }
      
      this.pendingData.date = parsedDate
      this.advanceStep(TASK_CREATION_STEPS.TIME, 'date')
      return { action: 'continue', data: { date: parsedDate } }
    }
    
    // Retry
    this.incrementRetry('date')
    if (this.hasExceededRetries('date')) {
      this.advanceStep(TASK_CREATION_STEPS.PRIORITY)
      return { action: 'continue', message: "I'll skip the date." }
    }
    
    return { action: 'retry', field: 'date' }
  }

  /**
   * Process time step
   */
  processTime(text) {
    if (detectSkip(text) || detectNegation(text, 'time')) {
      this.advanceStep(TASK_CREATION_STEPS.PRIORITY)
      return { action: 'continue' }
    }
    
    const time = extractTime(text)
    if (time) {
      // If we have a date, try to combine date + time
      if (this.pendingData.dateText) {
        try {
          // Combine the original date text with time
          const combined = `${this.pendingData.dateText} ${text}`
          const combinedDate = parseDateTime(combined)
          if (combinedDate) {
            this.pendingData.date = combinedDate
            this.pendingData.time = null // Clear time since it's in the date
          } else {
            this.pendingData.time = time
          }
        } catch {
          this.pendingData.time = time
        }
      } else {
        this.pendingData.time = time
      }
      
      this.advanceStep(TASK_CREATION_STEPS.PRIORITY, 'time')
      return { action: 'continue', data: { time } }
    }
    
    // Retry
    this.incrementRetry('time')
    if (this.hasExceededRetries('time')) {
      this.advanceStep(TASK_CREATION_STEPS.PRIORITY)
      return { action: 'continue' }
    }
    
    return { action: 'retry', field: 'time' }
  }

  /**
   * Process priority step
   */
  processPriority(text) {
    if (detectSkip(text) || detectNegation(text, 'priority')) {
      this.advanceStep(TASK_CREATION_STEPS.CATEGORY)
      return { action: 'continue' }
    }
    
    const priority = extractPriority(text)
    if (priority) {
      this.pendingData.priority = priority
      this.advanceStep(TASK_CREATION_STEPS.CATEGORY, 'priority')
      return { action: 'continue', data: { priority } }
    }
    
    // Retry
    this.incrementRetry('priority')
    if (this.hasExceededRetries('priority')) {
      this.advanceStep(TASK_CREATION_STEPS.CATEGORY)
      return { action: 'continue' }
    }
    
    return { action: 'retry', field: 'priority' }
  }

  /**
   * Process category step
   */
  processCategory(text) {
    if (detectSkip(text) || detectNegation(text, 'category')) {
      this.advanceStep(TASK_CREATION_STEPS.COMPLETED)
      return { action: 'complete' }
    }
    
    const category = extractCategory(text)
    if (category) {
      this.pendingData.category = category
      this.advanceStep(TASK_CREATION_STEPS.COMPLETED, 'category')
      return { action: 'complete', data: { category } }
    }
    
    // Retry
    this.incrementRetry('category')
    if (this.hasExceededRetries('category')) {
      this.advanceStep(TASK_CREATION_STEPS.COMPLETED)
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
    if (nextStep !== TASK_CREATION_STEPS.IDLE && nextStep !== TASK_CREATION_STEPS.COMPLETED) {
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
      [TASK_CREATION_STEPS.TITLE]: "What would you like to name this task?",
      [TASK_CREATION_STEPS.DESCRIPTION]: "Would you like to add a description? (or say 'skip')",
      [TASK_CREATION_STEPS.DATE]: "When is this task due? (or say 'skip' or 'no date')",
      [TASK_CREATION_STEPS.TIME]: "What time should this be scheduled? (or say 'skip')",
      [TASK_CREATION_STEPS.PRIORITY]: "What priority should this have? (high, medium, low, or 'skip')",
      [TASK_CREATION_STEPS.CATEGORY]: "Which category? (work, personal, shopping, health, finance, education, or 'skip')",
    }
    return questions[this.pendingStep] || null
  }

  /**
   * Check if complete
   */
  isComplete() {
    return this.pendingStep === TASK_CREATION_STEPS.COMPLETED
  }

  /**
   * Get final task data (validated)
   */
  getFinalTaskData() {
    const data = { ...this.pendingData }
    
    // Ensure required fields
    if (!data.title) {
      data.title = 'Untitled Task'
    }
    
    // Combine date and time if both provided
    let due_at = null
    if (data.date) {
      try {
        // If date is already a Date object or ISO string, use it
        if (data.date instanceof Date) {
          due_at = data.date.toISOString()
        } else if (typeof data.date === 'string' && data.date.includes('T')) {
          // Already an ISO string
          due_at = data.date
        } else {
          // Try to parse it
          due_at = parseDateTime(data.date)
          
          // If we have separate time and date wasn't fully parsed, try combining
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
        // If parsing fails, try just the date
        try {
          due_at = parseDateTime(data.date)
        } catch {
          due_at = null
        }
      }
    }
    
    // Set defaults
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
    this.pendingAction = null
    this.pendingStep = TASK_CREATION_STEPS.IDLE
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
