/**
 * Smart Fallback Handler
 * Provides context-aware fallback responses - ONLY when appropriate
 */

/**
 * Check if fallback should be used
 * Returns false if we're in a multi-step flow or small talk was detected
 */
export function shouldUseFallback(command, isInTaskCreation, smallTalkDetected) {
  // NEVER use fallback if:
  // 1. We're in task creation (user is answering a question)
  if (isInTaskCreation) {
    return false
  }
  
  // 2. Small talk was detected (handled separately)
  if (smallTalkDetected) {
    return false
  }
  
  // 3. Command is very short (might be partial input)
  if (command.trim().length < 3) {
    return false
  }
  
  return true
}

/**
 * Analyze context and generate smart fallback
 */
export function generateSmartFallback(command, lastIntent, tasks, isInTaskCreation = false) {
  // Don't show fallback if in task creation
  if (isInTaskCreation) {
    return null
  }
  
  const lower = command.toLowerCase().trim()
  
  // Check for vague references that might need clarification
  if (lower.match(/\b(clear|delete|remove|get rid of)\s+(it|that|this|them|those)\b/)) {
    return "I want to help, but I need a bit more clarity. Do you mean you want me to:\n• Delete a specific task?\n• Clear all tasks?\n• Remove completed tasks?\n\nWhich one did you have in mind?"
  }
  
  if (lower.match(/\b(do|complete|finish|tackle)\s+(it|that|this|them)\b/)) {
    return "I'd be happy to help you complete something! Could you tell me which task you're referring to? Or would you like me to suggest what to work on next?"
  }
  
  if (lower.match(/\b(change|update|edit|modify)\s+(it|that|this)\b/)) {
    return "I can help you update a task! Which task would you like to change, and what would you like to update? (e.g., due date, priority, title)"
  }
  
  // Check if it sounds like task creation
  if (lower.match(/\b(need|want|have to|must|should)\s+to\b/) && !lower.includes('task')) {
    return "It sounds like you might want to create a task. Try saying something like:\n• \"Create a task called [what you need to do]\"\n• \"I need to [do something]\"\n• \"Remind me to [do something]\"\n\nOr just tell me what you need to do in plain language!"
  }
  
  // Check if it sounds like a question about tasks
  if (lower.match(/\b(what|when|where|which|how many|how much)\b/) && lower.length < 30) {
    return "I can help you find information about your tasks! Try asking:\n• \"What's due today?\"\n• \"How many tasks do I have?\"\n• \"What tasks are overdue?\"\n• \"When is [task name] due?\""
  }
  
  // Check if it's very short or unclear
  if (lower.length < 5 || lower.match(/^(huh|what|hmm|ok|yeah|sure)$/)) {
    return "I'm here to help! 😊 You can ask me to:\n• Create or manage tasks\n• Show what's due today\n• Plan your day\n• Get a summary of your workload\n\nWhat would you like to do?"
  }
  
  // Default smart fallback
  return "I'm not 100% sure what you mean, but I want to help.\n\nIt sounds like you might want to manage your tasks or get a summary. You can say things like:\n• \"Show me what's due today\"\n• \"Create a task called Pay Rent tomorrow at 5pm\"\n• \"Clear all completed tasks\"\n\nOr just tell me what you're trying to do in plain language, and I'll handle it. 😊"
}

/**
 * Check if command needs clarification
 */
export function needsClarification(command, lastIntent) {
  const lower = command.toLowerCase().trim()
  
  // Vague references
  if (lower.match(/\b(it|that|this|them|those)\b/) && 
      (lower.includes('delete') || lower.includes('clear') || lower.includes('remove') || 
       lower.includes('complete') || lower.includes('update') || lower.includes('change'))) {
    return true
  }
  
  // Very short commands that could mean multiple things
  if (lower.length < 10 && (lower.includes('clear') || lower.includes('delete') || lower.includes('remove'))) {
    return true
  }
  
  return false
}

