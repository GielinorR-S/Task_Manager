/**
 * Conversation Engine
 * Multi-layer conversation intelligence with memory, intent tracking, and deep responses
 */

const MAX_MEMORY = 10 // Store last 10 messages

export class ConversationEngine {
  constructor() {
    this.conversationMemory = []
    this.pendingIntent = null
    this.pendingTaskData = {}
    this.lastUserMessage = null
    this.lastAssistantMessage = null
  }

  /**
   * Add message to conversation memory
   */
  addToMemory(message, from) {
    this.conversationMemory.push({ message, from, timestamp: Date.now() })
    if (this.conversationMemory.length > MAX_MEMORY) {
      this.conversationMemory.shift()
    }
    
    if (from === 'user') {
      this.lastUserMessage = message
    } else {
      this.lastAssistantMessage = message
    }
  }

  /**
   * Get conversation context
   */
  getContext() {
    return {
      memory: [...this.conversationMemory],
      lastUserMessage: this.lastUserMessage,
      lastAssistantMessage: this.lastAssistantMessage,
      pendingIntent: this.pendingIntent,
      pendingTaskData: { ...this.pendingTaskData },
    }
  }

  /**
   * Set pending intent
   */
  setPendingIntent(intent, data = {}) {
    this.pendingIntent = intent
    this.pendingTaskData = { ...this.pendingTaskData, ...data }
  }

  /**
   * Clear pending intent
   */
  clearPendingIntent() {
    this.pendingIntent = null
    this.pendingTaskData = {}
  }

  /**
   * Update pending task data
   */
  updatePendingTaskData(updates) {
    this.pendingTaskData = { ...this.pendingTaskData, ...updates }
  }

  /**
   * Get pending task data
   */
  getPendingTaskData() {
    return { ...this.pendingTaskData }
  }

  /**
   * Check if we're in a multi-step flow
   */
  isInMultiStepFlow() {
    return this.pendingIntent !== null && (
      this.pendingIntent === 'create_task' ||
      this.pendingIntent === 'edit_task' ||
      this.pendingIntent === 'add_description' ||
      this.pendingIntent === 'multi_step_task_input'
    )
  }

  /**
   * Reset conversation state
   */
  reset() {
    this.conversationMemory = []
    this.pendingIntent = null
    this.pendingTaskData = {}
    this.lastUserMessage = null
    this.lastAssistantMessage = null
  }
}

/**
 * Small Talk Engine
 * Recognizes and responds to casual conversation
 */
export function smallTalkEngine(message, context = {}) {
  const lower = message.toLowerCase().trim()
  
  // How's your day / What's up
  if (lower.match(/^(how'?s your day|how are you|how you doing|how's it going|what's up|what up|sup)/)) {
    return {
      recognized: true,
      response: `I'm having a pretty good digital day – I'm here inside your task manager keeping an eye on things for you.\n\nHow are you feeling about your tasks today? Want me to help you plan or tidy them up?`,
    }
  }
  
  // I'm bored
  if (lower.match(/^(i'?m bored|i'm so bored|bored|nothing to do)/)) {
    return {
      recognized: true,
      response: `I hear you. Sometimes a clear task list can help.\n\nWant me to suggest some tasks you could work on, or help you plan what to tackle next?`,
    }
  }
  
  // I'm stressed
  if (lower.match(/^(i'?m stressed|stressed|overwhelmed|too much|anxious)/)) {
    return {
      recognized: true,
      response: `I'm sorry you're feeling that way. Let's make things a bit lighter.\n\nWant me to:\n• Pick the top 3 tasks to focus on, or\n• Clear out anything low priority so your list feels less overwhelming?`,
    }
  }
  
  // How you going (casual)
  if (lower.match(/^(how you going|how ya going|how you doing)/)) {
    return {
      recognized: true,
      response: `I'm doing well, thanks for asking. Ready to help with your tasks whenever you need.\n\nWhat can I help you with today?`,
    }
  }
  
  // Thanks / Thank you
  if (lower.match(/^(thanks|thank you|ty|appreciate it|cheers)/)) {
    return {
      recognized: true,
      response: `You're welcome! Happy to help anytime. Is there anything else I can assist you with?`,
    }
  }
  
  // Greetings
  if (lower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    return {
      recognized: true,
      response: `Hi there! I'm Aurora, your productivity assistant. I'm here to help you manage tasks, plan your day, and stay organized.\n\nWhat would you like to do?`,
    }
  }
  
  return { recognized: false }
}

/**
 * Deep Response Engine
 * Handles open-ended questions, emotional responses, and reflective replies
 */
export function deepResponseEngine(message, context = {}) {
  const lower = message.toLowerCase().trim()
  
  // Emotional statements
  if (lower.match(/^(i feel|i'm feeling|feeling)/)) {
    const emotion = lower.match(/(?:feel|feeling)\s+(.+?)(?:\s|$)/)
    if (emotion) {
      const emotionText = emotion[1]
      if (emotionText.includes('tired') || emotionText.includes('exhausted')) {
        return `I hear you. It's important to listen to your body and get enough rest. Maybe take a short break, stretch, or grab a refreshing drink? A little rest can make a big difference! You've got this! 💪`
      }
      if (emotionText.includes('overwhelmed') || emotionText.includes('stressed')) {
        return `I understand that feeling. Let's break things down. Want me to help you prioritize your tasks so they feel more manageable? Sometimes focusing on just the top 2-3 things can make all the difference.`
      }
      if (emotionText.includes('motivated') || emotionText.includes('energized')) {
        return `That's great! Let's channel that energy. Want me to help you tackle your most important tasks or plan out your day?`
      }
    }
  }
  
  // Reflective questions
  if (lower.match(/^(what should i|what do you think|what would you|how should i)/)) {
    return `That's a thoughtful question. Based on your tasks, I'd suggest focusing on what's most urgent or what will give you the biggest sense of accomplishment.\n\nWant me to help you identify those priorities?`
  }
  
  // Open-ended statements
  if (lower.match(/^(i don't know|not sure|confused|unclear)/)) {
    return `That's okay – sometimes it helps to talk it through. What are you trying to figure out? I'm here to help you organize your thoughts and tasks.`
  }
  
  return null
}

/**
 * Detect if message is part of multi-step task creation
 */
export function isMultiStepTaskInput(message, context) {
  if (!context.pendingIntent) return false
  
  const lower = message.toLowerCase()
  
  // Check if user is providing task details
  if (context.pendingIntent === 'create_task' || context.pendingIntent === 'multi_step_task_input') {
    // User might be providing: date, time, description, priority, category
    if (lower.match(/\b(tomorrow|today|friday|monday|next week|in \d+ days|at \d+|\d+pm|\d+am|morning|afternoon|evening)\b/)) {
      return true
    }
    if (lower.match(/\b(high|medium|low|urgent)\s+priority\b/)) {
      return true
    }
    if (lower.match(/\b(work|personal|shopping|health|finance|education|other)\s+category\b/)) {
      return true
    }
    if (lower.length > 20 && !lower.match(/^(yes|no|skip|done|that's fine)/)) {
      // Might be a description
      return true
    }
  }
  
  return false
}

