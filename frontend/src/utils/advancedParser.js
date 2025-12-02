/**
 * Advanced Natural Language Parser
 * Deep understanding of user intent with fuzzy matching and synonym support
 */

/**
 * Detect intent from any natural language phrasing
 */
export function detectIntent(text) {
  const lower = text.toLowerCase().trim()
  
  // Synonyms mapping
  const synonyms = {
    create: ['create', 'add', 'make', 'new', 'remind me to', 'remember to', 'i need to', 'set up', 'schedule'],
    delete: ['delete', 'remove', 'clear', 'erase', 'get rid of', 'cancel', 'drop'],
    complete: ['complete', 'finish', 'done', 'tick off', 'check off', 'mark done', 'close', 'resolve', 'accomplish'],
    incomplete: ['incomplete', 'uncomplete', 'reopen', 'undo', 'unmark', 'reactivate', 'restore'],
    update: ['update', 'edit', 'change', 'modify', 'alter', 'adjust', 'revise', 'reschedule', 'move'],
    info: ['tell', 'show', 'what', 'when', 'where', 'which', 'list', 'summarize', 'summarise', 'explain', 'describe', 'info', 'details'],
    filter: ['filter', 'sort', 'show only', 'display', 'find', 'search'],
    plan: ['plan', 'schedule', 'organize', 'arrange', 'suggest', 'recommend', 'advise'],
  }
  
  // Check each intent category
  for (const [intent, words] of Object.entries(synonyms)) {
    for (const word of words) {
      if (lower.includes(word)) {
        // Check for specific patterns
        if (intent === 'delete' && (lower.includes('all') || lower.includes('everything'))) {
          return 'delete_all'
        }
        if (intent === 'delete' && lower.includes('completed')) {
          return 'delete_completed'
        }
        if (intent === 'complete' && lower.includes('all')) {
          return 'complete_all'
        }
        return intent
      }
    }
  }
  
  // Check for question patterns
  if (lower.match(/^(what|when|where|which|how|why|who|is|are|do|does|can|could|should|will)\s+/)) {
    return 'info'
  }
  
  // Check for time/date references (likely info or create)
  if (lower.match(/(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|night)/)) {
    if (lower.match(/(create|add|make|new|remind)/)) {
      return 'create'
    }
    return 'info'
  }
  
  return 'unknown'
}

/**
 * Enhanced date/time parsing with more patterns
 */
export function parseDateTime(text) {
  const lower = text.toLowerCase()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const patterns = [
    // Relative times
    { regex: /in\s+(\d+)\s+(minute|hour|day|week)s?/i, handler: (match) => {
      const amount = parseInt(match[1])
      const unit = match[2].toLowerCase()
      const date = new Date(now)
      if (unit.startsWith('minute')) date.setMinutes(date.getMinutes() + amount)
      else if (unit.startsWith('hour')) date.setHours(date.getHours() + amount)
      else if (unit.startsWith('day')) date.setDate(date.getDate() + amount)
      else if (unit.startsWith('week')) date.setDate(date.getDate() + (amount * 7))
      return date.toISOString()
    }},
    // Tomorrow morning/afternoon/evening
    { regex: /tomorrow\s+(morning|afternoon|evening|night)/i, handler: (match) => {
      const timeOfDay = match[1].toLowerCase()
      const date = new Date(today)
      date.setDate(date.getDate() + 1)
      if (timeOfDay === 'morning') date.setHours(9, 0, 0, 0)
      else if (timeOfDay === 'afternoon') date.setHours(14, 0, 0, 0)
      else if (timeOfDay === 'evening') date.setHours(18, 0, 0, 0)
      else if (timeOfDay === 'night') date.setHours(20, 0, 0, 0)
      return date.toISOString()
    }},
    // Day of week
    { regex: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(morning|afternoon|evening|night))?(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i, handler: (match) => {
      const dayName = match[1].toLowerCase()
      const timeOfDay = match[2]?.toLowerCase()
      const hours = match[3] ? parseInt(match[3]) : null
      const minutes = match[4] ? parseInt(match[4]) : 0
      const ampm = match[5]?.toLowerCase()
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(dayName)
      const currentDay = now.getDay()
      let daysUntil = targetDay - currentDay
      if (daysUntil <= 0) daysUntil += 7 // Next week
      
      const date = new Date(today)
      date.setDate(date.getDate() + daysUntil)
      
      if (hours !== null) {
        let hour24 = hours
        if (ampm === 'pm' && hours !== 12) hour24 = hours + 12
        if (ampm === 'am' && hours === 12) hour24 = 0
        date.setHours(hour24, minutes, 0, 0)
      } else if (timeOfDay) {
        if (timeOfDay === 'morning') date.setHours(9, 0, 0, 0)
        else if (timeOfDay === 'afternoon') date.setHours(14, 0, 0, 0)
        else if (timeOfDay === 'evening') date.setHours(18, 0, 0, 0)
        else if (timeOfDay === 'night') date.setHours(20, 0, 0, 0)
        else date.setHours(12, 0, 0, 0)
      } else {
        date.setHours(12, 0, 0, 0)
      }
      return date.toISOString()
    }},
    // "Next Monday", "This Friday"
    { regex: /(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, handler: (match) => {
      const modifier = match[1].toLowerCase()
      const dayName = match[2].toLowerCase()
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(dayName)
      const currentDay = now.getDay()
      let daysUntil = targetDay - currentDay
      if (modifier === 'next') {
        if (daysUntil <= 0) daysUntil += 7
      } else {
        if (daysUntil < 0) daysUntil += 7
      }
      const date = new Date(today)
      date.setDate(date.getDate() + daysUntil)
      date.setHours(12, 0, 0, 0)
      return date.toISOString()
    }},
    // "Sometime tomorrow morning" - partial time
    { regex: /sometime\s+(tomorrow|today)\s+(morning|afternoon|evening|night)/i, handler: (match) => {
      const when = match[1].toLowerCase()
      const timeOfDay = match[2].toLowerCase()
      const date = new Date(today)
      if (when === 'tomorrow') date.setDate(date.getDate() + 1)
      if (timeOfDay === 'morning') date.setHours(10, 0, 0, 0)
      else if (timeOfDay === 'afternoon') date.setHours(14, 0, 0, 0)
      else if (timeOfDay === 'evening') date.setHours(18, 0, 0, 0)
      else if (timeOfDay === 'night') date.setHours(20, 0, 0, 0)
      return date.toISOString()
    }},
    // Existing patterns from parseDateFromText
    { regex: /tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i, handler: (match) => {
      const hours = parseInt(match[1])
      const minutes = match[2] ? parseInt(match[2]) : 0
      const ampm = match[3]?.toLowerCase()
      let hour24 = hours
      if (ampm === 'pm' && hours !== 12) hour24 = hours + 12
      if (ampm === 'am' && hours === 12) hour24 = 0
      const date = new Date(today)
      date.setDate(date.getDate() + 1)
      date.setHours(hour24, minutes, 0, 0)
      return date.toISOString()
    }},
    { regex: /today\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i, handler: (match) => {
      const hours = parseInt(match[1])
      const minutes = match[2] ? parseInt(match[2]) : 0
      const ampm = match[3]?.toLowerCase()
      let hour24 = hours
      if (ampm === 'pm' && hours !== 12) hour24 = hours + 12
      if (ampm === 'am' && hours === 12) hour24 = 0
      const date = new Date(today)
      date.setHours(hour24, minutes, 0, 0)
      return date.toISOString()
    }},
    { regex: /tomorrow/i, handler: () => {
      const date = new Date(today)
      date.setDate(date.getDate() + 1)
      date.setHours(12, 0, 0, 0)
      return date.toISOString()
    }},
    { regex: /next\s+week/i, handler: () => {
      const date = new Date(today)
      date.setDate(date.getDate() + 7)
      date.setHours(12, 0, 0, 0)
      return date.toISOString()
    }},
    { regex: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i, handler: (match) => {
      const month = parseInt(match[1]) - 1
      const day = parseInt(match[2])
      const year = match[3] ? parseInt(match[3]) : now.getFullYear()
      const date = new Date(year, month, day, 12, 0, 0, 0)
      return date.toISOString()
    }},
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern.regex)
    if (match) {
      return pattern.handler(match)
    }
  }
  
  return null
}

/**
 * Enhanced task finding with better fuzzy matching
 */
export function findTaskAdvanced(tasks, query) {
  if (!query) return null
  
  const lowerQuery = query.toLowerCase().trim()
  
  // Remove common words
  const stopWords = ['the', 'a', 'an', 'task', 'tasks', 'my', 'this', 'that']
  const queryWords = lowerQuery.split(/\s+/).filter(w => !stopWords.includes(w))
  const cleanQuery = queryWords.join(' ')
  
  // Exact match
  let task = tasks.find(t => t.title.toLowerCase() === lowerQuery || t.title.toLowerCase() === cleanQuery)
  if (task) return task
  
  // ID match
  const idMatch = lowerQuery.match(/(?:task\s*)?#?(\d+)/i)
  if (idMatch) {
    const id = parseInt(idMatch[1])
    task = tasks.find(t => t.id === id)
    if (task) return task
  }
  
  // Contains match
  task = tasks.find(t => t.title.toLowerCase().includes(cleanQuery) || t.title.toLowerCase().includes(lowerQuery))
  if (task) return task
  
  // Word-based fuzzy match with scoring
  const scores = tasks.map(t => {
    const titleWords = t.title.toLowerCase().split(/\s+/)
    let score = 0
    let matchedWords = 0
    
    for (const qWord of queryWords) {
      for (const tWord of titleWords) {
        if (tWord === qWord) {
          score += 3 // Exact word match
          matchedWords++
          break
        } else if (tWord.includes(qWord) || qWord.includes(tWord)) {
          score += 1 // Partial match
          matchedWords++
          break
        }
      }
    }
    
    // Bonus for matching all words
    if (matchedWords === queryWords.length && queryWords.length > 0) {
      score += 5
    }
    
    return { task: t, score }
  })
  
  scores.sort((a, b) => b.score - a.score)
  if (scores[0] && scores[0].score > 0) {
    return scores[0].task
  }
  
  return null
}

/**
 * Find tasks by category with fuzzy matching
 */
export function findTasksByCategory(tasks, categoryQuery) {
  if (!categoryQuery) return []
  
  const lower = categoryQuery.toLowerCase()
  const categoryMap = {
    'work': ['work', 'job', 'office', 'business', 'professional'],
    'personal': ['personal', 'home', 'private', 'self'],
    'shopping': ['shopping', 'shop', 'buy', 'purchase', 'store'],
    'health': ['health', 'fitness', 'gym', 'exercise', 'medical', 'doctor'],
    'finance': ['finance', 'money', 'bank', 'bills', 'payment'],
    'education': ['education', 'study', 'learn', 'school', 'course'],
    'other': ['other', 'misc', 'miscellaneous'],
  }
  
  // Find matching category
  for (const [cat, synonyms] of Object.entries(categoryMap)) {
    if (synonyms.some(syn => lower.includes(syn))) {
      return tasks.filter(t => t.category === cat)
    }
  }
  
  return []
}

/**
 * Find tasks by priority with fuzzy matching
 */
export function findTasksByPriority(tasks, priorityQuery) {
  if (!priorityQuery) return []
  
  const lower = priorityQuery.toLowerCase()
  const priorityMap = {
    'urgent': ['urgent', 'critical', 'emergency', 'asap', 'immediate'],
    'high': ['high', 'important', 'priority'],
    'medium': ['medium', 'normal', 'regular', 'standard'],
    'low': ['low', 'minor', 'optional'],
  }
  
  for (const [priority, synonyms] of Object.entries(priorityMap)) {
    if (synonyms.some(syn => lower.includes(syn))) {
      return tasks.filter(t => t.priority === priority)
    }
  }
  
  return []
}

/**
 * Extract all task-related information from text
 */
export function extractTaskInfo(text) {
  const info = {
    title: null,
    description: null,
    dueDate: null,
    priority: null,
    category: null,
    time: null,
  }
  
  // Extract title (try various patterns)
  const titlePatterns = [
    /(?:called|named|titled|to)\s+["']([^"']+)["']/i,
    /(?:called|named|titled|to)\s+([^,\.]+?)(?:\s+with|\s+due|\s+at|$)/i,
    /(?:create|add|make|new)\s+(?:a\s+)?(?:new\s+)?task\s+(.+?)(?:\s+with|\s+due|\s+at|$)/i,
  ]
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.title = match[1].trim()
      break
    }
  }
  
  // Extract description
  const descMatch = text.match(/(?:description|details|about|note):\s*(.+?)(?:\s+due|\s+at|$)/i)
  if (descMatch) {
    info.description = descMatch[1].trim()
  }
  
  // Extract date/time
  info.dueDate = parseDateTime(text)
  
  // Extract priority
  const priorityMatch = text.match(/(?:priority|importance):\s*(urgent|high|medium|low|critical)/i)
  if (priorityMatch) {
    info.priority = priorityMatch[1].toLowerCase()
  } else {
    const lower = text.toLowerCase()
    if (lower.includes('urgent') || lower.includes('critical')) info.priority = 'urgent'
    else if (lower.includes('high priority') || lower.includes('important')) info.priority = 'high'
    else if (lower.includes('low priority')) info.priority = 'low'
  }
  
  // Extract category
  const categoryMatch = text.match(/(?:category|type|tag):\s*(work|personal|shopping|health|finance|education|other)/i)
  if (categoryMatch) {
    info.category = categoryMatch[1].toLowerCase()
  } else {
    const lower = text.toLowerCase()
    if (lower.includes('work') || lower.includes('job')) info.category = 'work'
    else if (lower.includes('personal') || lower.includes('home')) info.category = 'personal'
    else if (lower.includes('shopping') || lower.includes('buy')) info.category = 'shopping'
    else if (lower.includes('health') || lower.includes('gym')) info.category = 'health'
    else if (lower.includes('finance') || lower.includes('money')) info.category = 'finance'
    else if (lower.includes('education') || lower.includes('study')) info.category = 'education'
  }
  
  return info
}

/**
 * Check if text is asking a question
 */
export function isQuestion(text) {
  const lower = text.toLowerCase().trim()
  return lower.endsWith('?') || 
         lower.match(/^(what|when|where|which|how|why|who|is|are|do|does|can|could|should|will)\s+/)
}

/**
 * Check if text contains incomplete information for task creation
 */
export function needsMoreInfo(text, intent) {
  if (intent !== 'create' && intent !== 'update') return false
  
  const lower = text.toLowerCase()
  const hasTitle = !!(text.match(/(?:called|named|titled|to)\s+["']?([^"']+)["']?/i) || 
                      text.match(/(?:create|add|make|new)\s+(?:a\s+)?(?:new\s+)?task\s+(.+?)(?:\s+with|\s+due|\s+at|$)/i))
  
  if (!hasTitle && intent === 'create') return { field: 'title', question: "What would you like to name this task?" }
  
  // Check if user might want to add more details
  const hasDate = !!parseDateTime(text)
  const hasPriority = lower.match(/(?:priority|urgent|high|low|important)/)
  const hasCategory = lower.match(/(?:category|work|personal|shopping|health|finance|education)/)
  const hasDescription = lower.match(/(?:description|details|about|note):/)
  
  // Don't ask if user explicitly said "no" or "skip"
  if (lower.includes('no ') || lower.includes('skip') || lower.includes("don't")) {
    return false
  }
  
  return false // For now, don't be too pushy with questions
}

