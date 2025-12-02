/**
 * Memory Manager
 * Handles user preferences and long-term memory storage
 */

import api from '../api'

const DEFAULT_MEMORY = {
  default_time: '09:00',
  default_lunch: '12:00',
  default_priority: 'medium',
  preferred_categories: [],
  ai_tone_preference: 'professional',
  banned_times: [],
  repeat_patterns: [],
}

export class MemoryManager {
  constructor() {
    this.memory = { ...DEFAULT_MEMORY }
    this.loaded = false
  }

  /**
   * Load user memory from backend
   */
  async loadMemory() {
    if (this.loaded) return this.memory

    try {
      const response = await api.get('/assistant/memory/')
      if (response.data) {
        this.memory = { ...DEFAULT_MEMORY, ...response.data }
      }
      this.loaded = true
      return this.memory
    } catch (error) {
      console.log('Memory not found, using defaults')
      this.loaded = true
      return this.memory
    }
  }

  /**
   * Save user memory to backend
   */
  async saveMemory(updates) {
    try {
      this.memory = { ...this.memory, ...updates }
      await api.post('/assistant/memory/', this.memory)
      return this.memory
    } catch (error) {
      console.error('Error saving memory:', error)
      // Still update local memory even if save fails
      this.memory = { ...this.memory, ...updates }
      return this.memory
    }
  }

  /**
   * Extract and save preferences from user input
   */
  async learnFromInput(text) {
    const lower = text.toLowerCase()
    const updates = {}

    // Learn lunch time
    if (lower.match(/i (usually|always|typically|normally) (eat|have) (lunch|dinner) (at|around) (\d{1,2})/)) {
      const match = lower.match(/(\d{1,2})/)
      if (match) {
        const hour = parseInt(match[1])
        updates.default_lunch = `${hour.toString().padStart(2, '0')}:00`
      }
    }

    // Learn default time
    if (lower.match(/i (usually|always|typically) (start|begin|work) (at|around) (\d{1,2})/)) {
      const match = lower.match(/(\d{1,2})/)
      if (match) {
        const hour = parseInt(match[1])
        updates.default_time = `${hour.toString().padStart(2, '0')}:00`
      }
    }

    // Learn tone preference
    if (lower.match(/be (more|less) (professional|casual|friendly)/)) {
      const match = lower.match(/(professional|casual|friendly)/)
      if (match) {
        updates.ai_tone_preference = match[1]
      }
    }

    // Learn banned times
    if (lower.match(/don'?t (schedule|plan|set) (anything|tasks) (on|for) (sunday|monday|tuesday|wednesday|thursday|friday|saturday)/)) {
      const match = lower.match(/(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/)
      if (match) {
        const day = match[1]
        if (!this.memory.banned_times.includes(day)) {
          updates.banned_times = [...this.memory.banned_times, day]
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.saveMemory(updates)
      return updates
    }

    return null
  }

  /**
   * Get memory value
   */
  get(key) {
    return this.memory[key]
  }

  /**
   * Get all memory
   */
  getAll() {
    return { ...this.memory }
  }
}

// Singleton instance
let memoryManagerInstance = null

export function getMemoryManager() {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager()
  }
  return memoryManagerInstance
}

