/**
 * Memoized date formatting utilities
 * Prevents unnecessary date object creation and formatting
 */

// Cache for formatted dates
const dateCache = new Map()
const CACHE_TTL = 60000 // 1 minute cache

function getCacheKey(value, options) {
  return `${value || 'null'}-${JSON.stringify(options)}`
}

function clearExpiredCache() {
  const now = Date.now()
  for (const [key, entry] of dateCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      dateCache.delete(key)
    }
  }
}

// Clear cache periodically
if (typeof window !== 'undefined') {
  setInterval(clearExpiredCache, CACHE_TTL)
}

/**
 * Format date/time with caching
 */
export function formatDateTime(value) {
  if (!value) return 'No due date set'
  
  const cacheKey = getCacheKey(value, { dateStyle: 'medium', timeStyle: 'short' })
  const cached = dateCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.formatted
  }
  
  const formatted = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
  
  dateCache.set(cacheKey, {
    formatted,
    timestamp: Date.now(),
  })
  
  return formatted
}

/**
 * Get due details with memoization
 */
const dueDetailsCache = new Map()

export function getDueDetails(due_at, completed) {
  if (!due_at) return { label: 'No schedule', tone: 'muted' }
  
  const cacheKey = `${due_at}-${completed}`
  const cached = dueDetailsCache.get(cacheKey)
  
  if (cached) {
    const now = Date.now()
    // Cache for 1 minute
    if (now - cached.timestamp < 60000) {
      return cached.result
    }
  }
  
  const now = new Date()
  const dueDate = new Date(due_at)
  
  let result
  if (completed) {
    result = { label: 'Completed', tone: 'success' }
  } else if (dueDate < now) {
    result = { label: 'Overdue', tone: 'danger' }
  } else {
    const diffHours = Math.round((dueDate - now) / (1000 * 60 * 60))
    if (diffHours <= 3) {
      result = { label: 'Due soon', tone: 'warning' }
    } else {
      result = { label: 'Scheduled', tone: 'success' }
    }
  }
  
  dueDetailsCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  })
  
  return result
}

