/**
 * Task Enrichment Handler
 * Manages follow-up questions after task creation
 */

import { parseDateTime, extractTaskInfo } from './advancedParser'
import { formatDate } from './commandParser'

/**
 * Generate follow-up question for task enrichment
 */
export function generateEnrichmentQuestion(taskTitle, fieldsAsked = []) {
  const availableFields = [
    { key: 'description', question: 'Do you want to add a description?' },
    { key: 'dueDate', question: 'Do you want to set a due date?' },
    { key: 'time', question: 'Do you want to set a specific time?' },
    { key: 'priority', question: 'Do you want to set a priority?' },
    { key: 'category', question: 'Do you want to add a category?' },
  ]

  // Find first field not yet asked
  const nextField = availableFields.find(f => !fieldsAsked.includes(f.key))
  
  if (!nextField) {
    return null // All fields asked
  }

  return nextField.question
}

/**
 * Generate enrichment follow-up message
 */
export function generateEnrichmentFollowUp(taskTitle, fieldsAsked = []) {
  const nextQuestion = generateEnrichmentQuestion(taskTitle, fieldsAsked)
  
  if (!nextQuestion) {
    return `Great! "${taskTitle}" is all set. Do you want to create another task?`
  }

  return `Perfect! ✨ I've created a task called "${taskTitle}".\n\n${nextQuestion}\n\nYou can also say "no" or "that's fine" if you're done.`
}

/**
 * Check if user response is enrichment-related
 */
export function isEnrichmentResponse(text, pendingEnrichment) {
  if (!pendingEnrichment) return false

  const lower = text.toLowerCase()
  
  // Check for "yes", "yeah", "sure", "ok", "add", "set"
  if (lower.match(/^(yes|yeah|yep|sure|ok|okay|add|set|do it|go ahead)/)) {
    return { type: 'affirmative', text }
  }
  
  // Check for "no", "skip", "that's fine", "done"
  if (lower.match(/^(no|nope|skip|that's fine|that's good|done|finished|all set|that's all)/)) {
    return { type: 'negative', text }
  }
  
  // Check if it contains enrichment data (date, time, description, priority, category)
  const info = extractTaskInfo(text)
  if (info.dueDate || info.description || info.priority || info.category) {
    return { type: 'data', text, info }
  }
  
  return false
}

/**
 * Parse enrichment data from user response
 */
export function parseEnrichmentData(text) {
  const info = extractTaskInfo(text)
  const lower = text.toLowerCase()
  
  const enrichment = {}
  
  // Check for description
  if (lower.includes('description') || lower.match(/describe|details|about|note/)) {
    const descMatch = text.match(/(?:description|details|about|note)[:\s]+(.+?)(?:\s+and|\s+or|$)/i)
    if (descMatch) {
      enrichment.description = descMatch[1].trim()
    }
  }
  
  // Date/time
  if (info.dueDate) {
    enrichment.due_at = info.dueDate
  }
  
  // Priority
  if (info.priority) {
    enrichment.priority = info.priority
  }
  
  // Category
  if (info.category) {
    enrichment.category = info.category
  }
  
  return enrichment
}

