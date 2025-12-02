/**
 * Conversation State Manager
 * Handles multi-step conversations and follow-up questions
 */

export class ConversationState {
  constructor() {
    this.pendingAction = null
    this.context = {}
    this.lastIntent = null
    this.pendingTaskEnrichment = null // Stores { taskId, taskTitle } after task creation
    this.enrichmentFieldsAsked = [] // Track which fields we've already asked about
  }

  /**
   * Set a pending action that needs more information
   */
  setPendingAction(action, context = {}) {
    this.pendingAction = action
    this.context = { ...this.context, ...context }
  }

  /**
   * Clear pending action
   */
  clearPendingAction() {
    this.pendingAction = null
    this.context = {}
  }

  /**
   * Check if there's a pending action
   */
  hasPendingAction() {
    return this.pendingAction !== null
  }

  /**
   * Get the pending action
   */
  getPendingAction() {
    return this.pendingAction
  }

  /**
   * Update context
   */
  updateContext(updates) {
    this.context = { ...this.context, ...updates }
  }

  /**
   * Get context value
   */
  getContext(key) {
    return this.context[key]
  }

  /**
   * Check if context has all required fields
   */
  hasRequiredFields(requiredFields) {
    return requiredFields.every(field => this.context[field] !== undefined && this.context[field] !== null)
  }

  /**
   * Get missing fields
   */
  getMissingFields(requiredFields) {
    return requiredFields.filter(field => !this.context[field] || this.context[field] === null)
  }

  /**
   * Set last intent for context
   */
  setLastIntent(intent) {
    this.lastIntent = intent
  }

  /**
   * Get last intent
   */
  getLastIntent() {
    return this.lastIntent
  }

  /**
   * Set pending task enrichment (after task creation)
   */
  setPendingTaskEnrichment(taskId, taskTitle) {
    this.pendingTaskEnrichment = { taskId, taskTitle }
    this.enrichmentFieldsAsked = []
  }

  /**
   * Clear pending task enrichment
   */
  clearPendingTaskEnrichment() {
    this.pendingTaskEnrichment = null
    this.enrichmentFieldsAsked = []
  }

  /**
   * Check if there's pending task enrichment
   */
  hasPendingTaskEnrichment() {
    return this.pendingTaskEnrichment !== null
  }

  /**
   * Get pending task enrichment
   */
  getPendingTaskEnrichment() {
    return this.pendingTaskEnrichment
  }

  /**
   * Mark enrichment field as asked
   */
  markEnrichmentFieldAsked(field) {
    if (!this.enrichmentFieldsAsked.includes(field)) {
      this.enrichmentFieldsAsked.push(field)
    }
  }

  /**
   * Check if enrichment field was already asked
   */
  wasEnrichmentFieldAsked(field) {
    return this.enrichmentFieldsAsked.includes(field)
  }

  /**
   * Reset all state
   */
  reset() {
    this.pendingAction = null
    this.context = {}
    this.lastIntent = null
    this.pendingTaskEnrichment = null
    this.enrichmentFieldsAsked = []
  }
}

/**
 * Generate follow-up question based on missing information
 */
export function generateFollowUpQuestion(missingField, context = {}) {
  const questions = {
    title: "What would you like to name this task? 😊",
    dueDate: "When would you like this task to be due?",
    time: "What time should this be scheduled?",
    priority: "What priority should this task have? (high, medium, low)",
    category: "Which category should this belong to? (work, personal, shopping, health, finance, education)",
    description: "Would you like to add a description?",
    taskId: "Which task are you referring to?",
  }

  const question = questions[missingField] || `What is the ${missingField}?`
  
  // Add context-specific hints
  if (missingField === 'dueDate' && context.title) {
    return `When is "${context.title}" due? You can say something like "tomorrow" or "next week".`
  }
  
  if (missingField === 'taskId' && context.suggestions) {
    return `Which task? Here are some options:\n${context.suggestions}`
  }
  
  return question
}

