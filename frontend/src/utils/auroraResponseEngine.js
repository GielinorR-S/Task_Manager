/**
 * Aurora Response Engine
 * Core intelligence layer that generates responses following Aurora's persona
 */

export class AuroraResponseEngine {
  constructor(memoryManager, toneEngine) {
    this.memoryManager = memoryManager
    this.toneEngine = toneEngine
  }

  /**
   * Generate response following Aurora's persona
   */
  generateResponse(baseResponse, context = {}) {
    if (!baseResponse || typeof baseResponse !== 'string') {
      return this.generateFallback(context)
    }

    // Get user preferences
    const memory = this.memoryManager?.getAll() || {}
    const tonePreference = memory.ai_tone_preference || 'professional'

    // Apply tone
    let response = this.toneEngine.rewrite(baseResponse, {
      ...context,
      tonePreference,
    })

    // Add Aurora's warmth and professionalism
    response = this.addAuroraPersonality(response, context, memory)

    // Ensure confirming statements after actions
    if (context.actionCompleted) {
      response = this.addConfirmation(response, context)
    }

    // Add next steps when appropriate
    if (context.shouldOfferNextSteps) {
      response = this.addNextSteps(response, context)
    }

    return response
  }

  /**
   * Add Aurora's personality to response
   */
  addAuroraPersonality(text, context, memory) {
    // Don't modify if already has personality markers
    if (text.includes('😊') || text.includes('✨') || text.includes('👍')) {
      return text
    }

    const tonePreference = memory.ai_tone_preference || 'professional'

    // Add warmth based on tone preference
    if (tonePreference === 'friendly' && context.actionCompleted) {
      const warmPhrases = ['✨', '👍', '😊']
      const phrase = warmPhrases[Math.floor(Math.random() * warmPhrases.length)]
      // Add at end if it's a short confirmation
      if (text.length < 100) {
        return `${text} ${phrase}`
      }
    }

    // Ensure professional but approachable tone
    if (tonePreference === 'professional') {
      // Replace overly casual phrases
      text = text.replace(/\b(yeah|yep|nope)\b/gi, (match) => {
        const replacements = {
          'yeah': 'yes',
          'yep': 'yes',
          'nope': 'no',
        }
        return replacements[match.toLowerCase()] || match
      })
    }

    return text
  }

  /**
   * Add confirmation statement after action
   */
  addConfirmation(text, context) {
    // Check if already has confirmation
    if (text.match(/\b(done|completed|created|updated|deleted|all set|got it|perfect)\b/i)) {
      return text
    }

    const confirmations = [
      "All set.",
      "Done.",
      "Got it.",
      "Consider it done.",
      "That's been taken care of.",
    ]

    const confirmation = confirmations[Math.floor(Math.random() * confirmations.length)]
    return `${text}\n\n${confirmation}`
  }

  /**
   * Add next steps when appropriate
   */
  addNextSteps(text, context) {
    // Don't add if already has next steps
    if (text.match(/\b(would you like|do you want|can i help|next step)\b/i)) {
      return text
    }

    const nextSteps = [
      "Would you like to do anything else?",
      "Is there anything else I can help with?",
      "What would you like to do next?",
    ]

    const nextStep = nextSteps[Math.floor(Math.random() * nextSteps.length)]
    return `${text}\n\n${nextStep}`
  }

  /**
   * Generate task creation confirmation
   */
  generateTaskCreationConfirmation(task, taskData, memory) {
    let response = `Absolutely — I can take care of that for you.\n\nI've added the task and scheduled it`

    if (taskData.due_at) {
      const dueDate = new Date(taskData.due_at)
      response += ` for ${dueDate.toLocaleDateString()}`
      if (taskData.time) {
        response += ` at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
    } else {
      response += `.`
    }

    response += `\n\nHere's what I've added:\n`
    response += `• Title: ${task.title}\n`
    if (taskData.description) {
      response += `• Description: ${taskData.description}\n`
    }
    if (taskData.priority && taskData.priority !== 'medium') {
      response += `• Priority: ${taskData.priority}\n`
    }
    if (taskData.category && taskData.category !== 'other') {
      response += `• Category: ${taskData.category}\n`
    }

    response += `\nWould you like to:\n`
    response += `• Create another task\n`
    response += `• Update a task\n`
    response += `• Show my tasks\n`
    response += `• Just chat`

    return response
  }

  /**
   * Generate clarifying question (never blame user)
   */
  generateClarifyingQuestion(intent, context) {
    const questions = {
      create: "I want to help — what would you like to name this task?",
      update: "I want to help — which task would you like to update, and what should I change?",
      delete: "I want to help — which task would you like to delete?",
      unclear: "I want to help — did you want to create a new task, adjust an existing one, or something else?",
    }

    return questions[intent] || questions.unclear
  }

  /**
   * Generate fallback (never say "I don't understand")
   */
  generateFallback(context) {
    // Try to infer intent first
    if (context.lastUserMessage) {
      const lower = context.lastUserMessage.toLowerCase()
      
      if (lower.match(/\b(create|add|make|new|task)\b/)) {
        return "I want to help — what would you like to name this task?"
      }
      
      if (lower.match(/\b(delete|remove|clear)\b/)) {
        return "I want to help — which task would you like to delete, or did you want to clear all tasks?"
      }
      
      if (lower.match(/\b(update|change|edit|modify)\b/)) {
        return "I want to help — which task would you like to update, and what should I change?"
      }
    }

    // Gentle fallback
    return "I want to help — could you tell me a bit more about what you'd like to do? I can help you create tasks, manage your list, or plan your day."
  }

  /**
   * Generate empathetic response for stress/tiredness
   */
  generateEmpatheticResponse(emotion, context, memory) {
    const responses = {
      stressed: `I'm sorry you're feeling that way. Stress can make everything feel harder than it needs to be.\n\nLet's make things a bit lighter. I can help you:\n• Pick the top 3 tasks to focus on right now\n• Clear out anything low priority so your list feels less overwhelming\n• Break down a big task into smaller steps\n\nWhat would help you most right now?`,
      
      tired: `I hear you. It's important to listen to your body and get enough rest. When you're tired, it's harder to focus and be productive.\n\nMaybe take a short break, stretch, or grab a refreshing drink? A little rest can make a big difference. You've got this! 💪\n\nIf you want, I can help you prioritize your tasks so you can focus on what really matters right now, or we can plan for when you're feeling more energized.`,
      
      overwhelmed: `I understand that feeling. Let's break things down. Want me to help you prioritize your tasks so they feel more manageable? Sometimes focusing on just the top 2-3 things can make all the difference.`,
    }

    return responses[emotion] || responses.stressed
  }

  /**
   * Generate proactive suggestion
   */
  generateProactiveSuggestion(tasks, context, memory) {
    const overdue = tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < new Date())
    const dueSoon = tasks.filter(t => {
      if (!t.due_at || t.completed) return false
      const due = new Date(t.due_at)
      const hoursUntilDue = (due - new Date()) / (1000 * 60 * 60)
      return hoursUntilDue > 0 && hoursUntilDue <= 24
    })

    if (overdue.length > 0) {
      return `I noticed you have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}. Would you like me to highlight them or help you prioritize what to tackle first?`
    }

    if (dueSoon.length > 0) {
      return `You have ${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due in the next 24 hours. Would you like me to help you plan your day around them?`
    }

    if (tasks.filter(t => !t.completed).length === 0) {
      return `Your task list is looking great — everything's completed! Would you like to add something new or take a well-deserved break?`
    }

    return null
  }
}

// Singleton instance
let auroraResponseEngineInstance = null

export function getAuroraResponseEngine(memoryManager, toneEngine) {
  if (!auroraResponseEngineInstance) {
    auroraResponseEngineInstance = new AuroraResponseEngine(memoryManager, toneEngine)
  }
  auroraResponseEngineInstance.memoryManager = memoryManager
  auroraResponseEngineInstance.toneEngine = toneEngine
  return auroraResponseEngineInstance
}

