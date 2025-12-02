/**
 * Intent Parser
 * Robust intent detection and data extraction
 */

/**
 * Extract task title from message
 * NEVER returns null, undefined, or empty string unless message is actually empty
 * 
 * Rules:
 * - If message includes task-like phrase, extract everything before keywords
 * - If user says ANY sentence after being asked for task name, treat ENTIRE sentence as title unless "skip"
 * - If extraction fails, fall back to: title = message.trim()
 */
export function extractTitle(message) {
  if (!message || typeof message !== 'string') {
    return ''
  }

  const trimmed = message.trim()
  if (trimmed.length === 0) {
    return ''
  }

  // Check for explicit skip commands first
  const lower = trimmed.toLowerCase()
  if (lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass' || lower === 'next') {
    return '' // Explicit skip - return empty to indicate skip
  }

  // Remove common command prefixes
  let cleaned = trimmed
    .replace(/^(create|add|make|new|remind me to|i need to|i have to|set up|schedule|task)\s+/i, '')
    .trim()

  // If cleaned is empty after removing prefix, use original
  if (cleaned.length === 0) {
    cleaned = trimmed
  }

  // Extract everything before time/date keywords
  const stopKeywords = [
    /\b(tomorrow|today|at|on|next|in|this|later|by|due|morning|afternoon|evening|night)\b/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
    /\b(high|medium|low|urgent|priority)\b/i,
    /\b(work|personal|shopping|health|finance|education|other)\s+category\b/i,
  ]

  let extractedTitle = cleaned
  for (const pattern of stopKeywords) {
    const match = cleaned.match(pattern)
    if (match && match.index > 0) {
      // Extract everything before the keyword
      extractedTitle = cleaned.substring(0, match.index).trim()
      break
    }
  }

  // Remove trailing punctuation
  extractedTitle = extractedTitle.replace(/[.,;:!?]+$/, '').trim()

  // If we extracted something meaningful, use it
  if (extractedTitle.length > 0) {
    return extractedTitle
  }

  // Fallback: use entire message as title (unless it's a skip command)
  // This ensures we NEVER return empty unless user explicitly says "skip"
  if (trimmed.toLowerCase().match(/^(skip|no|nope|pass|cancel|next)$/)) {
    return ''
  }

  // Final fallback: use trimmed message
  return trimmed
}

/**
 * Extract description from message
 */
export function extractDescription(message) {
  if (!message || typeof message !== 'string') return null

  const lower = message.toLowerCase().trim()
  if (lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass') {
    return null
  }

  // If it's a longer message, treat as description
  if (message.length > 10) {
    return message.trim()
  }

  return null
}

/**
 * Extract date from message
 */
export function extractDate(message) {
  if (!message || typeof message !== 'string') return null

  const lower = message.toLowerCase().trim()
  if (lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass' || lower === 'no date') {
    return null
  }

  // Date patterns
  const datePatterns = [
    /\b(tomorrow|today)\b/i,
    /\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(next\s+week|next\s+month|in\s+\d+\s+days?)\b/i,
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
  ]

  for (const pattern of datePatterns) {
    if (pattern.test(lower)) {
      return message // Return original for parsing
    }
  }

  return null
}

/**
 * Extract time from message
 */
export function extractTime(message) {
  if (!message || typeof message !== 'string') return null

  const lower = message.toLowerCase().trim()
  if (lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass' || lower === 'no time') {
    return null
  }

  // Time patterns
  const timePatterns = [
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
    /\b(\d{1,2}:\d{2})\b/,
    /\b(morning|afternoon|evening|noon|midnight)\b/i,
    /\b(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  ]

  for (const pattern of timePatterns) {
    if (pattern.test(lower)) {
      return message // Return original for parsing
    }
  }

  return null
}

/**
 * Extract priority from message
 */
export function extractPriority(message) {
  if (!message || typeof message !== 'string') return null

  const lower = message.toLowerCase().trim()
  if (lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass') {
    return null
  }

  if (lower.match(/\b(high|urgent|important|critical|asap)\b/)) {
    return 'high'
  }
  if (lower.match(/\b(medium|normal|moderate|standard)\b/)) {
    return 'medium'
  }
  if (lower.match(/\b(low|minor|optional|whenever)\b/)) {
    return 'low'
  }

  return null
}

/**
 * Extract category from message
 */
export function extractCategory(message) {
  if (!message || typeof message !== 'string') return null

  const lower = message.toLowerCase().trim()
  if (lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass') {
    return null
  }

  const categories = ['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other']
  for (const cat of categories) {
    if (lower.includes(cat)) {
      return cat
    }
  }

  return null
}

/**
 * Detect skip command
 */
export function detectSkip(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  return lower === 'skip' || lower === 'no' || lower === 'nope' || lower === 'pass' || lower === 'next'
}

/**
 * Detect cancel command
 */
export function detectCancel(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  return lower.match(/^(cancel|stop|nevermind|forget it|abort|quit|exit|done|finished|that's all)$/)
}

/**
 * Detect create task intent
 */
export function detectCreateTaskIntent(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  
  const createPatterns = [
    /\b(create|add|make|new|remind me to|i need to|i have to|set up|schedule)\s+(?:a\s+)?task\b/i,
    /\b(create|add|make|new)\s+(?:a\s+)?task\s+(?:called|named|titled|for)\s+/i,
    /^(create|add|make|new)\s+/i,
  ]
  
  return createPatterns.some(pattern => pattern.test(lower))
}

/**
 * Detect bulk delete all intent
 */
export function detectBulkDeleteAll(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  
  const bulkDeletePatterns = [
    /^(clear|delete|remove|wipe)\s+(?:all\s+)?tasks?$/,
    /^(clear|delete|remove|wipe)\s+(?:all\s+)?(?:my\s+)?tasks?$/,
    /^(clear|delete|remove)\s+everything$/,
    /^remove\s+all$/,
    /^wipe\s+my\s+tasks$/,
  ]
  
  return bulkDeletePatterns.some(pattern => pattern.test(lower))
}

/**
 * Detect confirmation intent
 */
export function detectConfirm(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  
  const confirmPatterns = [
    /^(confirm|yes|yeah|yep|sure|ok|okay|do it|go ahead|all of them|delete them all|yes delete|yes clear)$/,
    /^(yes,?\s+(?:delete|clear|remove|do it))$/,
  ]
  
  return confirmPatterns.some(pattern => pattern.test(lower))
}

/**
 * Detect clear chat intent
 */
export function detectClearChat(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  
  const clearChatPatterns = [
    /^(clear|reset|delete|wipe)\s+(?:the\s+)?(?:chat|conversation|messages?|history)$/,
    /^(clear|reset|delete|wipe)\s+(?:chat|conversation|messages?|history)$/,
    /^(start\s+over|new\s+chat|fresh\s+start|begin\s+again)$/,
    /^clear\s+all\s+messages?$/,
    /^reset\s+chat$/,
  ]
  
  return clearChatPatterns.some(pattern => pattern.test(lower))
}

/**
 * Detect small talk
 */
export function detectSmallTalk(message) {
  if (!message || typeof message !== 'string') return false
  const lower = message.toLowerCase().trim()
  
  const smallTalkPatterns = [
    /^(how'?s your day|how are you|how you doing|how's it going|what's up|what up|sup|how you going|how ya going)/,
    /^(i'?m stressed|stressed|overwhelmed|too much|anxious|i feel stressed)/,
    /^(i'?m tired|i feel tired|feeling tired|exhausted|i'm exhausted)/,
    /^(what are you doing|what do you do|what are you up to)/,
    /^(what should i do|what to do|what should i work on|what should i focus on|what should i do today)/,
    /^(thanks|thank you|ty|appreciate it|cheers)/,
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/,
    /^(i'?m bored|bored|nothing to do)/,
  ]
  
  return smallTalkPatterns.some(pattern => pattern.test(lower))
}

