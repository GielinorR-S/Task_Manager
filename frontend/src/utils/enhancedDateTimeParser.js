/**
 * Enhanced Date/Time Parser
 * Deep natural language understanding for time expressions
 */

export class EnhancedDateTimeParser {
  constructor(memoryManager = null) {
    this.memoryManager = memoryManager
  }

  /**
   * Parse natural language time expressions
   */
  parseTimeExpression(text) {
    if (!text || typeof text !== 'string') return null

    const lower = text.toLowerCase().trim()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get user preferences
    const defaultTime = this.memoryManager?.get('default_time') || '09:00'
    const defaultLunch = this.memoryManager?.get('default_lunch') || '12:00'

    // Time patterns with deep understanding
    const patterns = [
      // "lunch time" → 12:00 (or user's default lunch time)
      {
        regex: /\b(lunch\s+time|lunchtime|at\s+lunch)\b/i,
        handler: () => {
          const [hours, minutes] = defaultLunch.split(':')
          const date = new Date(today)
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          return date
        },
      },
      // "this afternoon" → 2PM
      {
        regex: /\b(this\s+afternoon|afternoon|in\s+the\s+afternoon)\b/i,
        handler: () => {
          const date = new Date(today)
          date.setHours(14, 0, 0, 0)
          return date
        },
      },
      // "tonight" → 7PM
      {
        regex: /\b(tonight|this\s+evening|evening|in\s+the\s+evening)\b/i,
        handler: () => {
          const date = new Date(today)
          date.setHours(19, 0, 0, 0)
          return date
        },
      },
      // "first thing in the morning" → 9AM (or user's default time)
      {
        regex: /\b(first\s+thing\s+(?:in\s+)?(?:the\s+)?morning|early\s+morning|morning)\b/i,
        handler: () => {
          const [hours, minutes] = defaultTime.split(':')
          const date = new Date(today)
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          return date
        },
      },
      // "later today" → 3PM
      {
        regex: /\b(later\s+today|later\s+this\s+day)\b/i,
        handler: () => {
          const date = new Date(today)
          date.setHours(15, 0, 0, 0)
          return date
        },
      },
      // "tomorrow morning" → tomorrow at 9AM
      {
        regex: /\b(tomorrow\s+morning)\b/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(date.getDate() + 1)
          const [hours, minutes] = defaultTime.split(':')
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          return date
        },
      },
      // "tomorrow afternoon" → tomorrow at 2PM
      {
        regex: /\b(tomorrow\s+afternoon)\b/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(date.getDate() + 1)
          date.setHours(14, 0, 0, 0)
          return date
        },
      },
      // "tomorrow evening" → tomorrow at 7PM
      {
        regex: /\b(tomorrow\s+evening|tomorrow\s+night)\b/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(date.getDate() + 1)
          date.setHours(19, 0, 0, 0)
          return date
        },
      },
      // Specific times: "3pm", "14:00", "at 5"
      {
        regex: /\b(at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
        handler: (match) => {
          let hours = parseInt(match[2])
          const minutes = match[3] ? parseInt(match[3]) : 0
          const ampm = match[4]?.toLowerCase()

          if (ampm === 'pm' && hours !== 12) hours += 12
          if (ampm === 'am' && hours === 12) hours = 0

          const date = new Date(today)
          date.setHours(hours, minutes, 0, 0)
          return date
        },
      },
    ]

    // Try each pattern
    for (const pattern of patterns) {
      const match = lower.match(pattern.regex)
      if (match) {
        try {
          const result = pattern.handler(match)
          if (result instanceof Date) {
            return result.toISOString()
          }
        } catch (err) {
          console.log('Time parsing error:', err)
        }
      }
    }

    return null
  }

  /**
   * Parse date expressions
   */
  parseDateExpression(text) {
    if (!text || typeof text !== 'string') return null

    const lower = text.toLowerCase().trim()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const patterns = [
      // "tomorrow"
      {
        regex: /\btomorrow\b/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(date.getDate() + 1)
          return date
        },
      },
      // "today"
      {
        regex: /\btoday\b/i,
        handler: () => new Date(today),
      },
      // "next Monday", "this Friday"
      {
        regex: /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        handler: (match) => {
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
          return date
        },
      },
      // "in 3 days"
      {
        regex: /\bin\s+(\d+)\s+days?\b/i,
        handler: (match) => {
          const days = parseInt(match[1])
          const date = new Date(today)
          date.setDate(date.getDate() + days)
          return date
        },
      },
    ]

    for (const pattern of patterns) {
      const match = lower.match(pattern.regex)
      if (match) {
        try {
          const result = pattern.handler(match)
          if (result instanceof Date) {
            return result.toISOString()
          }
        } catch (err) {
          console.log('Date parsing error:', err)
        }
      }
    }

    return null
  }

  /**
   * Parse combined date and time
   */
  parseDateTime(text) {
    // Try time first (more specific)
    const time = this.parseTimeExpression(text)
    if (time) return time

    // Try date
    const date = this.parseDateExpression(text)
    if (date) return date

    // Try combined patterns
    const combined = text.match(/(.+?)\s+(at|@)\s+(.+)/i)
    if (combined) {
      const datePart = this.parseDateExpression(combined[1])
      const timePart = this.parseTimeExpression(combined[3])
      if (datePart && timePart) {
        const dateObj = new Date(datePart)
        const timeObj = new Date(timePart)
        dateObj.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0)
        return dateObj.toISOString()
      }
    }

    return null
  }
}

