/**
 * Enhanced Conversation State Machine
 * Handles all conversation states with proper exit conditions
 */

import { TASK_CREATION_STEPS, TaskCreationStateMachine } from './taskCreationStateMachine'

export class ConversationStateMachine {
  constructor() {
    this.taskCreationSM = new TaskCreationStateMachine()
    this.pendingAction = null
    this.pendingStep = null
    this.pendingData = {}
    this.lastIntent = null
    this.conversationHistory = []
  }

  /**
   * Start task creation
   */
  startTaskCreation() {
    this.taskCreationSM.startTaskCreation()
    this.pendingAction = 'create_task'
    this.pendingStep = this.taskCreationSM.getCurrentStep()
  }

  /**
   * Check if in task creation
   */
  isInTaskCreation() {
    return this.taskCreationSM.isInTaskCreation()
  }

  /**
   * Process input for task creation
   */
  processTaskCreationInput(text) {
    return this.taskCreationSM.processInput(text)
  }

  /**
   * Get current question for task creation
   */
  getTaskCreationQuestion() {
    return this.taskCreationSM.getCurrentQuestion()
  }

  /**
   * Get pending task data
   */
  getPendingTaskData() {
    return this.taskCreationSM.getPendingData()
  }

  /**
   * Complete task creation
   */
  completeTaskCreation() {
    const data = this.taskCreationSM.getPendingData()
    this.taskCreationSM.reset()
    this.pendingAction = null
    this.pendingStep = null
    return data
  }

  /**
   * Reset all state
   */
  reset() {
    this.taskCreationSM.reset()
    this.pendingAction = null
    this.pendingStep = null
    this.pendingData = {}
    this.lastIntent = null
  }
}

