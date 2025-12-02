/**
 * Advanced Task Domain Engine
 * Comprehensive natural language understanding with multi-step conversation flow
 */

import {
  parseCommandType,
  parseDateFromText,
  parsePriority,
  parseCategory,
  findTaskByName,
  findTasksByQuery,
  formatDate,
  formatTaskList,
  extractTaskName,
} from './commandParser'
import {
  detectIntent,
  parseDateTime,
  findTaskAdvanced,
  findTasksByCategory,
  findTasksByPriority,
  extractTaskInfo,
  isQuestion,
} from './advancedParser'
import {
  generateIntelligentSummary,
  explainTaskUrgency,
  suggestNextTask,
  generateDayPlan,
  detectConflicts,
  suggestTaskImprovements,
  answerQuestion,
} from './reasoningEngine'
import { ConversationState, generateFollowUpQuestion } from './conversationState'
import { taskService } from '../services/taskService'

/**
 * Advanced Task Domain Engine Class
 */
class TaskDomainEngine {
  constructor(tasks, taskContext) {
    this.tasks = tasks || []
    // Store context as ref to avoid recreating engine when context changes
    this.contextRef = taskContext
    this.conversationState = new ConversationState()
  }

  get context() {
    // Access current context from ref (if it's a ref object) or use directly
    if (this.contextRef && typeof this.contextRef === 'object' && 'current' in this.contextRef) {
      return this.contextRef.current
    }
    return this.contextRef
  }

  /**
   * Process a natural language command with advanced understanding
   */
  async processCommand(command) {
    if (!command || typeof command !== 'string') {
      return "I didn't receive a valid command. Please try again."
    }
    
    // Ensure tasks array exists
    if (!this.tasks) {
      this.tasks = []
    }
    
    // Check for pending action first (multi-step conversation)
    if (this.conversationState && this.conversationState.hasPendingAction()) {
      return await this.handleFollowUp(command)
    }
    
    // Detect intent with advanced parser
    const intent = detectIntent(command)
    if (this.conversationState) {
      this.conversationState.setLastIntent(intent)
    }
    
    // Map intent to command type
    const commandType = this.mapIntentToCommandType(intent, command)
    
    try {
      switch (commandType) {
        case 'create':
          return await this.handleCreateAdvanced(command)
        case 'delete':
          return await this.handleDeleteAdvanced(command)
        case 'delete_all':
          return await this.handleDeleteAll(command)
        case 'delete_completed':
          return await this.handleDeleteCompleted(command)
        case 'update':
          return await this.handleUpdateAdvanced(command)
        case 'complete':
          return await this.handleCompleteAdvanced(command)
        case 'complete_all':
          return await this.handleCompleteAll(command)
        case 'incomplete':
          return await this.handleIncomplete(command)
        case 'info':
          return await this.handleInfoAdvanced(command)
        case 'filter':
          return await this.handleFilterAdvanced(command)
        case 'plan':
          return await this.handlePlan(command)
        default:
          return this.handleUnknownAdvanced(command)
      }
    } catch (error) {
      console.error('Command processing error:', error)
      return `I encountered an error: ${error.message}. Please try again.`
    }
  }

  /**
   * Map advanced intent to command type
   */
  mapIntentToCommandType(intent, command) {
    const lower = command.toLowerCase()
    
    if (intent === 'create') return 'create'
    if (intent === 'delete_all') return 'delete_all'
    if (lower.includes('delete completed') || lower.includes('clear completed')) return 'delete_completed'
    if (intent === 'delete') return 'delete'
    if (intent === 'update') return 'update'
    if (intent === 'complete_all') return 'complete_all'
    if (intent === 'complete') return 'complete'
    if (intent === 'incomplete') return 'incomplete'
    if (intent === 'plan') return 'plan'
    if (intent === 'filter') return 'filter'
    if (intent === 'info') return 'info'
    
    return 'unknown'
  }

  /**
   * Handle follow-up in multi-step conversation
   */
  async handleFollowUp(command) {
    const pendingAction = this.conversationState.getPendingAction()
    const context = this.conversationState.context || {}
    
    if (pendingAction === 'create') {
      // Try to extract information from follow-up
      const info = extractTaskInfo(command)
      const updatedContext = { ...context, ...info }
      this.conversationState.updateContext(updatedContext)
      
      // Check if we have enough info now
      if (updatedContext.title) {
        const taskData = {
          title: updatedContext.title,
          description: updatedContext.description || '',
          completed: false,
          due_at: updatedContext.dueDate || null,
        }
        
        const ctx = this.context
        const task = await ctx.createTask(taskData)
        this.conversationState.clearPendingAction()
        
        let response = `✓ Created task #${task.id}: "${task.title}"`
        if (taskData.due_at) {
          response += `\nDue: ${formatDate(taskData.due_at)}`
        }
        return response
      } else {
        return generateFollowUpQuestion('title', updatedContext)
      }
    }
    
    // Clear if user says "cancel" or "nevermind"
    if (command.toLowerCase().match(/(cancel|nevermind|forget it|skip)/)) {
      this.conversationState.clearPendingAction()
      return "Okay, I've cancelled that. What would you like to do instead?"
    }
    
    return "I'm still waiting for more information. " + generateFollowUpQuestion('title', context)
  }

  /**
   * Advanced CREATE handler with better parsing
   */
  async handleCreateAdvanced(command) {
    const info = extractTaskInfo(command)
    
    // Check if we have enough information
    if (!info.title) {
      // Check if user might be starting a task creation
      const lower = command.toLowerCase()
      if (lower.match(/(create|add|make|new|remind|remember|need to)/)) {
        // Set pending action and ask for title
        this.conversationState.setPendingAction('create', info)
        return generateFollowUpQuestion('title')
      }
      return "I need a task name to create a task. Try: 'Create a task called [name]' or just tell me what you need to do."
    }

    const taskData = {
      title: info.title,
      description: info.description || '',
      completed: false,
      due_at: info.dueDate || null,
    }

    const context = this.context
    const task = await context.createTask(taskData)

    let response = `✓ **Created task #${task.id}:** "${task.title}"`
    if (taskData.due_at) {
      response += `\n📅 **Due:** ${formatDate(taskData.due_at)}`
    }
    if (info.priority) {
      response += `\n⚡ **Priority:** ${info.priority}`
    }
    if (info.category) {
      response += `\n📁 **Category:** ${info.category}`
    }
    
    return response
  }

  /**
   * Advanced DELETE handler with better matching
   */
  async handleDeleteAdvanced(command) {
    const lower = command.toLowerCase()
    
    // Handle "delete all except X"
    if (lower.includes('except') || lower.includes('but not')) {
      const exceptMatch = command.match(/(?:except|but not)\s+(.+?)(?:\s+and|\s+or|$)/i)
      if (exceptMatch) {
        const exceptQuery = exceptMatch[1].trim()
        const exceptTask = findTaskAdvanced(this.tasks, exceptQuery)
        
        if (exceptTask) {
          const toDelete = this.tasks.filter(t => t.id !== exceptTask.id)
          if (toDelete.length === 0) {
            return `You only have one task (${exceptTask.title}), so there's nothing to delete.`
          }
          
          const context = this.context
          const deletePromises = toDelete.map(t => context.deleteTask(t.id))
          await Promise.all(deletePromises)
          
          return `✓ Deleted ${toDelete.length} task(s), keeping "${exceptTask.title}".`
        }
      }
    }
    
    // Handle "delete all overdue"
    if (lower.includes('overdue')) {
      const now = new Date()
      const overdue = this.tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < now)
      if (overdue.length === 0) {
        return "You don't have any overdue tasks to delete."
      }
      
      const context = this.context
      const deletePromises = overdue.map(t => context.deleteTask(t.id))
      await Promise.all(deletePromises)
      
      return `✓ Deleted ${overdue.length} overdue task(s).`
    }
    
    // Standard delete
    const taskName = extractTaskName(command, 'delete')
    if (!taskName) {
      const suggestions = this.tasks.slice(0, 5).map(t => `#${t.id}: ${t.title}`).join(', ')
      return `I need to know which task to delete. Here are your tasks:\n${suggestions}\n\nTry: "Delete task [name or ID]"`
    }

    const task = findTaskAdvanced(this.tasks, taskName)
    if (!task) {
      const suggestions = this.tasks.slice(0, 5).map(t => `#${t.id}: ${t.title}`).join(', ')
      return `I couldn't find a task matching "${taskName}". Here are your tasks:\n${suggestions}`
    }

    const context = this.context
    await context.deleteTask(task.id)

    return `✓ Deleted task #${task.id}: "${task.title}"`
  }

  /**
   * Advanced UPDATE handler
   */
  async handleUpdateAdvanced(command) {
    const lower = command.toLowerCase()
    const taskName = extractTaskName(command, 'update')
    
    if (!taskName) {
      const suggestions = this.tasks.slice(0, 5).map(t => `#${t.id}: ${t.title}`).join(', ')
      return `I need to know which task to update. Here are your tasks:\n${suggestions}`
    }

    const task = findTaskAdvanced(this.tasks, taskName)
    if (!task) {
      const suggestions = this.tasks.slice(0, 5).map(t => `#${t.id}: ${t.title}`).join(', ')
      return `I couldn't find a task matching "${taskName}". Here are your tasks:\n${suggestions}`
    }

    const updates = {}
    const responseParts = []

    // Extract all possible updates
    const info = extractTaskInfo(command)
    
    if (info.dueDate) {
      updates.due_at = info.dueDate
      responseParts.push(`📅 Due date: ${formatDate(info.dueDate)}`)
    }
    
    if (info.priority) {
      updates.priority = info.priority
      responseParts.push(`⚡ Priority: ${info.priority}`)
    }
    
    if (info.category) {
      updates.category = info.category
      responseParts.push(`📁 Category: ${info.category}`)
    }
    
    if (info.description) {
      updates.description = info.description
      responseParts.push(`📝 Description updated`)
    }
    
    if (info.title) {
      updates.title = info.title
      responseParts.push(`📋 Title: ${info.title}`)
    }

    // Check for specific update patterns
    if (lower.includes('reschedule') || lower.includes('move to')) {
      const newDate = parseDateTime(command) || parseDateFromText(command)
      if (newDate) {
        updates.due_at = newDate
        responseParts.push(`📅 Rescheduled to: ${formatDate(newDate)}`)
      }
    }

    if (lower.includes('change title') || lower.includes('rename')) {
      const titleMatch = command.match(/(?:to|as)\s+["']?([^"']+)["']?/i)
      if (titleMatch) {
        updates.title = titleMatch[1].trim()
        responseParts.push(`📋 Title: ${updates.title}`)
      }
    }

    if (Object.keys(updates).length === 0) {
      return `I couldn't determine what to update. Try:\n• "Reschedule [task] to [date]"\n• "Change [task] priority to high"\n• "Move [task] to category work"`
    }

    const taskData = {
      title: updates.title || task.title,
      description: updates.description !== undefined ? updates.description : task.description,
      completed: updates.completed !== undefined ? updates.completed : task.completed,
      due_at: updates.due_at || task.due_at,
    }

    const context = this.context
    await context.updateTask(task.id, taskData)

    return `✓ **Updated task #${task.id}:** "${taskData.title}"\n${responseParts.join('\n')}`
  }

  /**
   * Advanced COMPLETE handler
   */
  async handleCompleteAdvanced(command) {
    const lower = command.toLowerCase()
    const taskName = extractTaskName(command, 'complete')
    
    if (!taskName) {
      // Try to find task by synonyms
      const synonyms = ['finish', 'done', 'complete', 'tick off', 'check off']
      for (const syn of synonyms) {
        if (lower.includes(syn)) {
          const afterSyn = command.substring(command.toLowerCase().indexOf(syn) + syn.length).trim()
          if (afterSyn) {
            const task = findTaskAdvanced(this.tasks, afterSyn)
            if (task) {
              if (task.completed) {
                return `Task #${task.id} "${task.title}" is already completed.`
              }
              const context = this.context
              await context.toggleComplete(task)
              return `✓ Marked task #${task.id} "${task.title}" as complete. Great job! 🎉`
            }
          }
        }
      }
      
      const suggestions = this.tasks.filter(t => !t.completed).slice(0, 5).map(t => `#${t.id}: ${t.title}`).join(', ')
      return `I need to know which task to complete. Here are your active tasks:\n${suggestions}`
    }

    const task = findTaskAdvanced(this.tasks, taskName)
    if (!task) {
      const suggestions = this.tasks.filter(t => !t.completed).slice(0, 5).map(t => `#${t.id}: ${t.title}`).join(', ')
      return `I couldn't find a task matching "${taskName}". Here are your active tasks:\n${suggestions}`
    }

    if (task.completed) {
      return `Task #${task.id} "${task.title}" is already completed. 🎉`
    }

    const context = this.context
    await context.toggleComplete(task)

    return `✓ **Completed task #${task.id}:** "${task.title}"\n\nGreat work! 🎉`
  }

  /**
   * Advanced INFO handler with deep understanding
   */
  async handleInfoAdvanced(command) {
    const lower = command.toLowerCase()
    
    // Check if it's a question
    if (isQuestion(command)) {
      const answer = answerQuestion(command, this.tasks)
      if (answer && !answer.includes('Could you be more specific')) {
        return answer
      }
    }
    
    // Specific task info
    if (lower.match(/task\s+(?:#?\d+|.+)/)) {
      const taskName = extractTaskName(command, 'info')
      if (taskName) {
        const task = findTaskAdvanced(this.tasks, taskName)
        if (!task) {
          return `I couldn't find a task matching "${taskName}".`
        }

        let info = `📋 **Task #${task.id}: ${task.title}**\n\n`
        info += `**Status:** ${task.completed ? '✅ Completed' : '○ Active'}\n`
        if (task.description) {
          info += `**Description:** ${task.description}\n`
        }
        if (task.due_at) {
          info += `**Due:** ${formatDate(task.due_at)}\n`
          info += `\n${explainTaskUrgency(task)}\n`
        } else {
          info += `**Due:** No due date set\n`
        }
        info += `**Created:** ${formatDate(task.created_at)}\n`
        info += `**Updated:** ${formatDate(task.updated_at)}\n`
        
        // Add suggestions
        if (!task.completed) {
          info += `\n${suggestTaskImprovements(task)}`
        }
        
        return info
      }
    }

    // Overdue tasks
    if (lower.includes('overdue')) {
      const overdue = taskService.filterByStatus(this.tasks, 'overdue')
      if (overdue.length === 0) {
        return "✅ **Great news!** You don't have any overdue tasks. Keep up the excellent work! 🎉"
      }
      let response = `⚠️ **You have ${overdue.length} overdue task(s):**\n\n`
      overdue.forEach(t => {
        response += `• Task #${t.id}: "${t.title}"\n`
        response += `  ${explainTaskUrgency(t)}\n\n`
      })
      return response
    }

    // Due today
    if (lower.includes('due today') || lower.includes("what's due today") || lower.includes('today')) {
      const today = taskService.filterByDueDate(this.tasks, 'today')
      if (today.length === 0) {
        return "📅 You don't have any tasks due today. Great opportunity to work ahead or take a break!"
      }
      let response = `📅 **Today's tasks (${today.length}):**\n\n`
      today.forEach(t => {
        response += `• Task #${t.id}: "${t.title}"\n`
        response += `  Due: ${formatDate(t.due_at)}\n\n`
      })
      return response
    }

    // Due this week
    if (lower.includes('due this week') || lower.includes('this week')) {
      const thisWeek = taskService.filterByDueDate(this.tasks, 'thisWeek')
      if (thisWeek.length === 0) {
        return "📅 You don't have any tasks due this week. Good planning!"
      }
      return `📅 **This week's tasks (${thisWeek.length}):**\n\n${formatTaskList(thisWeek)}`
    }

    // High priority
    if (lower.includes('high priority') || lower.includes('highest priority') || lower.includes('urgent')) {
      const highPriority = this.tasks.filter(t => t.priority === 'high' || t.priority === 'urgent')
      if (highPriority.length === 0) {
        return "You don't have any high priority tasks. That's good for managing stress!"
      }
      return `⚡ **High priority tasks (${highPriority.length}):**\n\n${formatTaskList(highPriority)}`
    }

    // Category filter
    const categoryMatch = lower.match(/(?:category|in)\s+(work|personal|shopping|health|finance|education|other)/)
    if (categoryMatch) {
      const category = categoryMatch[1]
      const filtered = findTasksByCategory(this.tasks, category)
      if (filtered.length === 0) {
        return `You don't have any tasks in the "${category}" category.`
      }
      return `📁 **${category.charAt(0).toUpperCase() + category.slice(1)} tasks (${filtered.length}):**\n\n${formatTaskList(filtered)}`
    }

    // Summarize
    if (lower.includes('summarize') || lower.includes('summarise') || lower.includes('summary') || lower.includes('overview')) {
      return generateIntelligentSummary(this.tasks)
    }

    // What should I do next
    if (lower.includes('what should i do') || lower.includes('what to do next') || lower.includes('next task') || lower.includes('recommend')) {
      const suggestion = suggestNextTask(this.tasks)
      if (typeof suggestion === 'string') {
        return suggestion
      }
      
      let response = `💡 **RECOMMENDATION**\n\n`
      response += `${suggestion.reasoning}\n\n`
      response += `${suggestion.recommendation}\n\n`
      response += `**Task:** #${suggestion.task.id} - "${suggestion.task.title}"`
      if (suggestion.task.due_at) {
        response += `\n**Due:** ${formatDate(suggestion.task.due_at)}`
      }
      return response
    }

    // Default: show intelligent summary
    return generateIntelligentSummary(this.tasks)
  }

  /**
   * Advanced FILTER handler
   */
  async handleFilterAdvanced(command) {
    const lower = command.toLowerCase()
    let filtered = [...this.tasks]

    // Filter by status
    if (lower.includes('active') || lower.includes('incomplete')) {
      filtered = taskService.filterByStatus(filtered, 'active')
    } else if (lower.includes('completed') || lower.includes('done')) {
      filtered = taskService.filterByStatus(filtered, 'completed')
    } else if (lower.includes('overdue')) {
      filtered = taskService.filterByStatus(filtered, 'overdue')
    }

    // Filter by priority
    if (lower.includes('priority')) {
      const priorityTasks = findTasksByPriority(filtered, command)
      if (priorityTasks.length > 0) {
        filtered = priorityTasks
      }
    }

    // Filter by category
    if (lower.includes('category')) {
      const categoryTasks = findTasksByCategory(filtered, command)
      if (categoryTasks.length > 0) {
        filtered = categoryTasks
      }
    }

    // Sort
    if (lower.includes('sort')) {
      if (lower.includes('due date') || lower.includes('deadline')) {
        filtered = taskService.sort(filtered, 'due_at')
      } else if (lower.includes('priority')) {
        filtered = taskService.sort(filtered, 'priority')
      } else if (lower.includes('created') || lower.includes('newest')) {
        filtered = taskService.sort(filtered, 'created_at')
      } else if (lower.includes('title') || lower.includes('name')) {
        filtered = taskService.sort(filtered, 'title')
      }
    }

    if (filtered.length === 0) {
      return "No tasks match your filter criteria. Try adjusting your filters or create new tasks."
    }

    return `📋 **Found ${filtered.length} task(s):**\n\n${formatTaskList(filtered)}`
  }

  /**
   * Handle PLAN command
   */
  async handlePlan(command) {
    const lower = command.toLowerCase()
    
    if (lower.includes('3 hour') || lower.includes('3-hour') || lower.includes('next 3 hours')) {
      return this.generate3HourPlan()
    }
    
    if (lower.includes('day') || lower.includes('today')) {
      return generateDayPlan(this.tasks)
    }
    
    // Default: full day plan
    return generateDayPlan(this.tasks)
  }

  /**
   * Generate 3-hour focused plan
   */
  generate3HourPlan() {
    const now = new Date()
    const active = this.tasks.filter(t => !t.completed)
    
    if (active.length === 0) {
      return `🎉 **Great!** You don't have any active tasks. Perfect time for a break or planning ahead!`
    }
    
    // Prioritize by urgency
    const overdue = active.filter(t => t.due_at && new Date(t.due_at) < now)
    const dueSoon = active.filter(t => {
      if (!t.due_at) return false
      const due = new Date(t.due_at)
      const hoursUntilDue = (due - now) / (1000 * 60 * 60)
      return hoursUntilDue > 0 && hoursUntilDue <= 24
    })
    
    const prioritized = [...overdue, ...dueSoon, ...active.filter(t => !overdue.includes(t) && !dueSoon.includes(t))]
    const focusTasks = prioritized.slice(0, 3)
    
    let plan = `⏰ **3-HOUR FOCUS PLAN**\n\n`
    plan += `Here's your focused work plan for the next 3 hours:\n\n`
    
    focusTasks.forEach((task, idx) => {
      const timeSlot = idx === 0 ? 'Now' : idx === 1 ? 'Next hour' : 'Final hour'
      plan += `${idx + 1}. **${timeSlot}:** "${task.title}"\n`
      if (task.due_at) {
        plan += `   Due: ${formatDate(task.due_at)}\n`
      }
      if (task.description) {
        plan += `   ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}\n`
      }
      plan += `\n`
    })
    
    plan += `💡 **Tips:**\n`
    plan += `• Focus on one task at a time\n`
    plan += `• Take a 5-minute break between tasks\n`
    plan += `• Check off tasks as you complete them\n`
    
    return plan
  }

  /**
   * Handle DELETE ALL command
   */
  async handleDeleteAll(command) {
    if (this.tasks.length === 0) {
      return "You don't have any tasks to delete."
    }

    const context = this.context
    await context.deleteAllTasks()

    return `✓ Deleted all ${this.tasks.length} task(s).`
  }

  /**
   * Handle DELETE COMPLETED command
   */
  async handleDeleteCompleted(command) {
    const completed = this.tasks.filter(t => t.completed)
    if (completed.length === 0) {
      return "You don't have any completed tasks to delete."
    }

    const context = this.context
    const count = await context.deleteCompletedTasks()

    return `✓ Deleted ${count} completed task(s).`
  }

  /**
   * Handle COMPLETE ALL command
   */
  async handleCompleteAll(command) {
    const incomplete = this.tasks.filter(t => !t.completed)
    if (incomplete.length === 0) {
      return "All tasks are already completed! 🎉"
    }

    const context = this.context
    const count = await context.completeAllTasks()

    return `✓ Marked ${count} task(s) as complete. Excellent work! 🎉`
  }

  /**
   * Handle INCOMPLETE command
   */
  async handleIncomplete(command) {
    const taskName = extractTaskName(command, 'incomplete')
    if (!taskName) {
      return "I need to know which task to mark as incomplete. Try: 'Mark task [name or ID] as incomplete'"
    }

    const task = findTaskAdvanced(this.tasks, taskName)
    if (!task) {
      return `I couldn't find a task matching "${taskName}".`
    }

    if (!task.completed) {
      return `Task #${task.id} "${task.title}" is already incomplete.`
    }

    const context = this.context
    await context.updateTask(task.id, {
      title: task.title,
      description: task.description,
      completed: false,
      due_at: task.due_at,
    })

    return `✓ Marked task #${task.id} "${task.title}" as incomplete.`
  }

  /**
   * Advanced UNKNOWN handler - try to be helpful
   */
  handleUnknownAdvanced(command) {
    const lower = command.toLowerCase()
    
    // Check for greetings
    if (lower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
      return `Hi! 👋 I'm here to help you manage your tasks. What would you like to do?\n\nYou can:\n• Create tasks\n• View your tasks\n• Complete tasks\n• Get recommendations\n• Plan your day`
    }
    
    // Check if it might be a task creation attempt
    if (lower.match(/(need to|have to|must|should|want to)/)) {
      return `It sounds like you might want to create a task. Try saying:\n• "I need to [do something]"\n• "Create a task to [do something]"\n• "Remind me to [do something]"`
    }
    
    // Check for conflicts
    const conflicts = detectConflicts(this.tasks)
    if (conflicts) {
      return conflicts
    }
    
    // Default helpful response
    return `I'm not entirely sure what you'd like to do. Here's what I can help with:\n\n**Task Management:**\n• Create, update, delete, complete tasks\n• Filter and search tasks\n• View task details\n\n**Planning & Analysis:**\n• Summarize your workload\n• Suggest next tasks\n• Plan your day or next 3 hours\n• Detect scheduling conflicts\n\n**Questions:**\n• "What tasks are due today?"\n• "How many tasks do I have?"\n• "When is [task] due?"\n• "Why is [task] urgent?"\n\nTry rephrasing your request, or ask me a specific question!`
  }
}

export { TaskDomainEngine }
