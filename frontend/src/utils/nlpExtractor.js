/**
 * NLP Extraction Layer
 * Robust natural language parsing for task creation and conversation
 */

import { parseDateTime } from './advancedParser'

/**
 * Extract task title from natural language
 */
export function extractTitle(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  // Remove common command prefixes
  let cleaned = text.replace(/^(create|add|make|new|remind me to|i need to|i have to|set up|schedule)\s+(?:a\s+)?(?:task\s+)?(?:called|named|titled)?\s*/i, '').trim()
  
  // Check for quoted strings
  const quoted = cleaned.match(/["'](.+?)["']/)
  if (quoted && quoted[1].length > 2) return quoted[1].trim()
  
  // Check for "called X" or "named X"
  const called = cleaned.match(/(?:called|named|titled|for)\s+["']?([^"']+?)["']?(?:\s+(?:due|on|at|with|priority)|$)/i)
  if (called && called[1].length > 2) return called[1].trim()
  
  // If it's a reasonable length and doesn't contain date/time/priority keywords, use it
  if (cleaned.length >= 3 && cleaned.length <= 200) {
    // Check if it looks like a title (not a command or date/time)
    const hasDateKeywords = /\b(tomorrow|today|friday|monday|tuesday|wednesday|thursday|saturday|sunday|next week|next month|morning|afternoon|evening|at \d+|pm|am)\b/i.test(cleaned)
    const hasPriorityKeywords = /\b(high|medium|low|urgent|priority)\b/i.test(cleaned)
    const hasCategoryKeywords = /\b(work|personal|shopping|health|finance|education|other)\s+category\b/i.test(cleaned)
    
    if (!hasDateKeywords && !hasPriorityKeywords && !hasCategoryKeywords) {
      return cleaned
    }
  }
  
  return null
}

/**
 * Extract description from natural language
 */
export function extractDescription(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  // Skip if it's a command
  if (lower.match(/^(skip|no|nope|not needed|don't need|pass|next|cancel|done)$/)) {
    return null
  }
  
  // Check for explicit description markers
  const descPatterns = [
    /(?:description|details|about|note|info|description is|details are)[:\s]+(.+?)(?:\s+(?:due|on|at|priority|category)|$)/i,
    /(?:it'?s|it is|about)\s+(.+?)(?:\s+(?:due|on|at|priority|category)|$)/i,
  ]
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern)
    if (match && match[1] && match[1].trim().length > 3) {
      return match[1].trim()
    }
  }
  
  // If it's a longer text without date/time/priority keywords, treat as description
  if (text.length > 20 && !extractDate(text) && !extractTime(text) && !extractPriority(text)) {
    return text.trim()
  }
  
  return null
}

// Global enhanced parser instance (will be set by AssistantPanel)
let enhancedParser = null

export function setEnhancedParser(parser) {
  enhancedParser = parser
}

/**
 * Extract date from natural language
 */
export function extractDate(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  // Check for negation first
  if (detectNegation(text, 'date')) {
    return null
  }
  
  // Try enhanced parser first if available
  if (enhancedParser) {
    try {
      const parsed = enhancedParser.parseDateExpression(text)
      if (parsed) return parsed
    } catch {
      // Fall through
    }
  }
  
  // Try parseDateTime (fallback)
  try {
    const parsed = parseDateTime(text)
    if (parsed) return parsed
  } catch {
    // Continue to pattern matching
  }
  
  // Pattern matching for common date phrases
  const datePatterns = [
    /\b(tomorrow|today)\b/,
    /\b(friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/,
    /\b(next week|next month|in \d+ days?)\b/,
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
    /\b(later|soon|eventually)\b/,
  ]
  
  for (const pattern of datePatterns) {
    if (pattern.test(lower)) {
      try {
        const parsed = parseDateTime(text)
        if (parsed) return parsed
      } catch {
        const match = lower.match(pattern)
        if (match) return match[0]
      }
    }
  }
  
  return null
}

/**
 * Extract time from natural language
 */
export function extractTime(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  // Check for negation
  if (detectNegation(text, 'time')) {
    return null
  }
  
  // Try enhanced parser first if available
  if (enhancedParser) {
    try {
      const parsed = enhancedParser.parseTimeExpression(text)
      if (parsed) return parsed
    } catch {
      // Fall through
    }
  }
  
  // Time patterns
  const timePatterns = [
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
    /\b(\d{1,2}:\d{2})\b/,
    /\b(morning|afternoon|evening|noon|midnight)\b/,
    /\b(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  ]
  
  for (const pattern of timePatterns) {
    const match = lower.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  
  return null
}

/**
 * Extract priority from natural language
 */
export function extractPriority(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  // Check for negation
  if (detectNegation(text, 'priority')) {
    return null
  }
  
  // Priority patterns
  if (lower.match(/\b(high|urgent|important|critical|asap|as soon as possible)\b/)) {
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
 * Extract category from natural language
 */
export function extractCategory(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  const categories = ['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other']
  for (const cat of categories) {
    if (lower.includes(cat)) {
      return cat
    }
  }
  
  return null
}

/**
 * Detect small talk
 */
export function detectSmallTalk(text) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
  const smallTalkPatterns = [
    /^(how'?s your day|how are you|how you doing|how's it going|what's up|what up|sup|how you going|how ya going)/,
    /^(i'?m stressed|stressed|overwhelmed|too much|anxious|i feel stressed)/,
    /^(i'?m tired|i feel tired|feeling tired|exhausted|i'm exhausted)/,
    /^(what are you doing|what do you do|what are you up to)/,
    /^(what should i do|what to do|what should i work on|what should i focus on)/,
    /^(thanks|thank you|ty|appreciate it|cheers)/,
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/,
    /^(i'?m bored|bored|nothing to do)/,
  ]
  
  return smallTalkPatterns.some(pattern => pattern.test(lower))
}

/**
 * Detect skip command
 */
export function detectSkip(text) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
  return lower.match(/^(skip|next|no|nope|not needed|don't need|pass|not required|no thanks|that's fine|that's good)$/)
}

/**
 * Detect negation for specific fields
 */
export function detectNegation(text, field) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
  const negations = {
    date: /\b(no date|not due|doesn't have a date|no due date|it's not due|not scheduled|no deadline)\b/i,
    time: /\b(no time|not scheduled|doesn't have a time|no specific time|anytime)\b/i,
    priority: /\b(no priority|not important|doesn't matter|any priority)\b/i,
    category: /\b(no category|doesn't matter|any category)\b/i,
    description: /\b(no description|no details|nothing to add)\b/i,
  }
  
  const pattern = negations[field]
  return pattern ? pattern.test(lower) : false
}

/**
 * Detect if user wants to cancel/exit
 */
export function detectCancel(text) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
  return lower.match(/^(cancel|stop|nevermind|forget it|abort|quit|exit|done|finished|that's all|that's fine|all set|no more)$/)
}

/**
 * Detect if user wants to create a task
 */
export function detectCreateTaskIntent(text) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
  const createPatterns = [
    /\b(create|add|make|new|remind me to|i need to|i have to|set up|schedule)\s+(?:a\s+)?task\b/,
    /\b(create|add|make|new)\s+(?:a\s+)?task\s+(?:called|named|titled|for)\s+/i,
    /^(create|add|make|new)\s+/i, // Simple "create X" at start
  ]
  
  return createPatterns.some(pattern => pattern.test(lower))
}

/**
 * Detect bulk delete all intent
 */
export function detectBulkDeleteAll(text) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
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
export function detectConfirm(text) {
  if (!text || typeof text !== 'string') return false
  
  const lower = text.toLowerCase().trim()
  
  const confirmPatterns = [
    /^(confirm|yes|yeah|yep|sure|ok|okay|do it|go ahead|all of them|delete them all|yes delete|yes clear)$/,
    /^(yes,?\s+(?:delete|clear|remove|do it))$/,
  ]
  
  return confirmPatterns.some(pattern => pattern.test(lower))
}

