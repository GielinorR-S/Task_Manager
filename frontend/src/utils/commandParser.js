/**
 * Command Parser Utility
 * Parses natural language commands and extracts intent and parameters
 */

/**
 * Parse date/time from natural language text
 */
export function parseDateFromText(text) {
  const lower = text.toLowerCase()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Patterns for date/time parsing
  const patterns = [
    // Tomorrow at specific time
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
    // Today at specific time
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
    // Tomorrow
    { regex: /tomorrow/i, handler: () => {
      const date = new Date(today)
      date.setDate(date.getDate() + 1)
      date.setHours(12, 0, 0, 0)
      return date.toISOString()
    }},
    // Next week
    { regex: /next\s+week/i, handler: () => {
      const date = new Date(today)
      date.setDate(date.getDate() + 7)
      date.setHours(12, 0, 0, 0)
      return date.toISOString()
    }},
    // Specific date formats
    { regex: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i, handler: (match) => {
      const month = parseInt(match[1]) - 1
      const day = parseInt(match[2])
      const year = match[3] ? parseInt(match[3]) : now.getFullYear()
      const date = new Date(year, month, day, 12, 0, 0, 0)
      return date.toISOString()
    }},
    // ISO format
    { regex: /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?/i, handler: (match) => {
      return match[0].includes('T') ? match[0] : `${match[0]}T12:00:00`
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
 * Parse priority from text
 */
export function parsePriority(text) {
  const lower = text.toLowerCase()
  if (lower.includes('urgent') || lower.includes('critical')) return 'urgent'
  if (lower.includes('high')) return 'high'
  if (lower.includes('medium') || lower.includes('normal')) return 'medium'
  if (lower.includes('low')) return 'low'
  return 'medium' // default
}

/**
 * Parse category from text
 */
export function parseCategory(text) {
  const lower = text.toLowerCase()
  const categories = ['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other']
  for (const cat of categories) {
    if (lower.includes(cat)) return cat
  }
  return 'other' // default
}

/**
 * Find task by name with fuzzy matching
 */
export function findTaskByName(tasks, query) {
  if (!query) return null
  
  const lowerQuery = query.toLowerCase().trim()
  
  // Try exact match first
  let task = tasks.find(t => t.title.toLowerCase() === lowerQuery)
  if (task) return task
  
  // Try ID match
  const idMatch = lowerQuery.match(/^(?:task\s*)?#?(\d+)$/i)
  if (idMatch) {
    const id = parseInt(idMatch[1])
    task = tasks.find(t => t.id === id)
    if (task) return task
  }
  
  // Try contains match
  task = tasks.find(t => t.title.toLowerCase().includes(lowerQuery))
  if (task) return task
  
  // Try fuzzy match (word-based)
  const queryWords = lowerQuery.split(/\s+/)
  const scores = tasks.map(t => {
    const titleWords = t.title.toLowerCase().split(/\s+/)
    let score = 0
    for (const qWord of queryWords) {
      for (const tWord of titleWords) {
        if (tWord.includes(qWord) || qWord.includes(tWord)) {
          score++
          break
        }
      }
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
 * Find multiple tasks by name/query
 */
export function findTasksByQuery(tasks, query) {
  if (!query) return []
  
  const lowerQuery = query.toLowerCase().trim()
  
  // Try exact matches
  let matches = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery))
  if (matches.length > 0) return matches
  
  // Try fuzzy matching
  const queryWords = lowerQuery.split(/\s+/)
  matches = tasks.filter(t => {
    const titleWords = t.title.toLowerCase().split(/\s+/)
    return queryWords.some(qWord => 
      titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
    )
  })
  
  return matches
}

import { detectIntent } from './advancedParser'

/**
 * Parse command type from text - enhanced with advanced detection
 */
export function parseCommandType(text) {
  // Use advanced parser for better detection
  const intent = detectIntent(text)
  
  // Map advanced intents to command types
  if (intent === 'create') return 'create'
  if (intent === 'delete_all') return 'delete_all'
  if (intent === 'delete') return 'delete'
  if (intent === 'update') return 'update'
  if (intent === 'complete_all') return 'complete_all'
  if (intent === 'complete') return 'complete'
  if (intent === 'incomplete') return 'incomplete'
  if (intent === 'info') return 'info'
  if (intent === 'filter') return 'filter'
  if (intent === 'plan') return 'info' // Planning is info-based
  
  // Fallback to original logic for edge cases
  const lower = text.toLowerCase().trim()
  
  if (lower.match(/^(create|add|make|new)\s+(?:a\s+)?(?:new\s+)?task/i)) return 'create'
  if (lower.match(/^(delete|remove|clear)\s+(?:all|everything)/i)) return 'delete_all'
  if (lower.match(/^(clear|delete)\s+all\s+completed/i)) return 'delete_completed'
  if (lower.match(/^(complete|finish|done)\s+all/i)) return 'complete_all'
  
  return 'unknown'
}

/**
 * Extract task name from command
 */
export function extractTaskName(text, commandType) {
  const lower = text.toLowerCase()
  
  // Extract text between quotes first (highest priority)
  const quoted = text.match(/"([^"]+)"/) || text.match(/'([^']+)'/)
  if (quoted) {
    let name = quoted[1].trim()
    // Remove trailing command words
    name = name.replace(/\s+(with|due|at|on|to|as|is|are)$/i, '').trim()
    return name
  }
  
  // For create commands
  if (commandType === 'create') {
    // "create task called X" or "create task named X"
    const calledMatch = text.match(/(?:create|add|make|new)\s+(?:a\s+)?(?:new\s+)?task\s+(?:called|named|titled)\s+(.+?)(?:\s+with|\s+due|\s+at|\s+on|$)/i)
    if (calledMatch) return calledMatch[1].trim()
    
    // "create task X" or "add task X"
    const createMatch = text.match(/(?:create|add|make|new)\s+(?:a\s+)?(?:new\s+)?task\s+(.+?)(?:\s+with|\s+due|\s+at|\s+on|$)/i)
    if (createMatch) return createMatch[1].trim()
    
    // "create X" (without task keyword)
    const simpleMatch = text.match(/(?:create|add|make|new)\s+(.+?)(?:\s+with|\s+due|\s+at|\s+on|$)/i)
    if (simpleMatch) return simpleMatch[1].trim()
  }
  
  // For delete/update/complete/incomplete commands
  if (commandType === 'delete' || commandType === 'update' || commandType === 'complete' || commandType === 'incomplete') {
    // Try to find task ID first (most reliable)
    const idMatch = text.match(/(?:task\s*)?#?(\d+)/i)
    if (idMatch) return idMatch[1]
    
    // "task titled X" or "task called X"
    const titledMatch = text.match(/task\s+(?:titled|called|named)\s+(.+?)(?:\s+as|\s+to|\s+with|$)/i)
    if (titledMatch) return titledMatch[1].trim()
    
    // "task X" (simple)
    const taskMatch = text.match(/task\s+(.+?)(?:\s+as|\s+to|\s+with|$)/i)
    if (taskMatch) return taskMatch[1].trim()
    
    // Extract after command words
    const afterCommand = text.replace(/^(delete|remove|edit|update|change|modify|complete|finish|mark|done|uncomplete|incomplete|set|reschedule)\s+/i, '')
      .replace(/^(task|tasks)\s+/i, '')
      .replace(/\s+(as|to|with|is|are)$/i, '')
      .trim()
    
    if (afterCommand && afterCommand.length > 0) {
      return afterCommand
    }
  }
  
  // For info commands
  if (commandType === 'info') {
    // "task X" or "task #X"
    const taskMatch = text.match(/task\s+(?:#?(\d+)|(.+?))(?:\s+is|\s+due|$)/i)
    if (taskMatch) {
      return taskMatch[1] || taskMatch[2]?.trim()
    }
  }
  
  // Fallback: clean and return
  let cleaned = text
    .replace(/^(create|add|make|new|delete|remove|edit|update|change|modify|complete|finish|mark|done|uncomplete|incomplete|tell|show|what|when|where|which|list|filter|sort|set|move|reschedule)\s+/i, '')
    .replace(/\s+(task|tasks|called|titled|named|with|due|date|time|priority|category)\s+/gi, ' ')
    .replace(/\s+(as|is|are|the|a|an)\s+/gi, ' ')
    .trim()
  
  return cleaned || null
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/**
 * Format task list for display
 */
export function formatTaskList(tasks, maxItems = 10) {
  if (tasks.length === 0) return 'No tasks found.'
  
  const limited = tasks.slice(0, maxItems)
  const lines = limited.map((task, idx) => {
    const status = task.completed ? '✓' : '○'
    const due = task.due_at ? ` (Due: ${formatDate(task.due_at)})` : ''
    return `${idx + 1}. ${status} Task #${task.id}: ${task.title}${due}`
  })
  
  if (tasks.length > maxItems) {
    lines.push(`\n... and ${tasks.length - maxItems} more`)
  }
  
  return lines.join('\n')
}

