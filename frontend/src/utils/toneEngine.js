/**
 * Tone Engine
 * Rewrites responses into professional, GPT-like conversational style
 */

export class ToneEngine {
  constructor(tonePreference = 'professional') {
    this.tone = tonePreference // 'professional' | 'casual' | 'friendly'
  }

  /**
   * Set tone preference
   */
  setTone(tone) {
    this.tone = tone
  }

  /**
   * Rewrite response with appropriate tone
   */
  rewrite(response, context = {}) {
    if (!response || typeof response !== 'string') return response

    // Remove repetitive phrases
    response = this.removeRepetition(response)

    // Add professional polish
    response = this.addProfessionalPolish(response, context)

    // Ensure multi-sentence when appropriate
    response = this.ensureMultiSentence(response, context)

    // Add context awareness
    response = this.addContextAwareness(response, context)

    return response
  }

  /**
   * Remove repetitive phrases
   */
  removeRepetition(text) {
    // Remove duplicate sentences
    const sentences = text.split(/[.!?]\s+/)
    const unique = []
    const seen = new Set()

    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().trim()
      if (!seen.has(normalized) && sentence.trim().length > 0) {
        seen.add(normalized)
        unique.push(sentence.trim())
      }
    }

    return unique.join('. ') + (text.endsWith('.') ? '.' : '')
  }

  /**
   * Add professional polish
   */
  addProfessionalPolish(text, context) {
    // Replace casual phrases with professional ones
    const replacements = {
      'yeah': 'yes',
      'yep': 'yes',
      'nope': 'no',
      "i'm": "I'm",
      "i've": "I've",
      "i'll": "I'll",
      "i'd": "I'd",
      "can't": "cannot",
      "won't": "will not",
      "don't": "do not",
      "doesn't": "does not",
      "isn't": "is not",
      "aren't": "are not",
      "wasn't": "was not",
      "weren't": "were not",
      "haven't": "have not",
      "hasn't": "has not",
      "hadn't": "had not",
      "wouldn't": "would not",
      "couldn't": "could not",
      "shouldn't": "should not",
      "mightn't": "might not",
      "mustn't": "must not",
    }

    let polished = text
    for (const [casual, professional] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${casual}\\b`, 'gi')
      polished = polished.replace(regex, professional)
    }

    // Ensure proper capitalization
    polished = polished.charAt(0).toUpperCase() + polished.slice(1)

    return polished
  }

  /**
   * Ensure multi-sentence responses when appropriate
   */
  ensureMultiSentence(text, context) {
    const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0)

    // If it's a single sentence and it's an action confirmation, add context
    if (sentences.length === 1 && context.actionCompleted) {
      const actionPhrases = [
        "I've completed that for you.",
        "That's been taken care of.",
        "Consider it done.",
      ]
      return `${text} ${actionPhrases[Math.floor(Math.random() * actionPhrases.length)]}`
    }

    // If it's a question, add helpful context
    if (sentences.length === 1 && text.includes('?')) {
      return `${text} I'm here to help you with that.`
    }

    return text
  }

  /**
   * Add context awareness
   */
  addContextAwareness(text, context) {
    // Add reasoning when appropriate
    if (context.needsReasoning && !text.includes('because') && !text.includes('since')) {
      const reasoningPhrases = [
        "This will help you stay organized.",
        "This approach should work well for your workflow.",
        "This should make things easier to manage.",
      ]
      return `${text} ${reasoningPhrases[Math.floor(Math.random() * reasoningPhrases.length)]}`
    }

    return text
  }

  /**
   * Generate professional greeting
   */
  generateGreeting(name = 'Aurora') {
    const greetings = {
      professional: `Hello. I'm ${name}, your productivity assistant. I'm here to help you manage tasks, plan your day, and stay organized. How can I assist you today?`,
      casual: `Hey there! I'm ${name}, your productivity assistant. Ready to help you get things done. What's on your mind?`,
      friendly: `Hi! I'm ${name}, your friendly productivity assistant. I'm here to help you stay organized and productive. What would you like to do today?`,
    }
    return greetings[this.tone] || greetings.professional
  }

  /**
   * Generate professional confirmation
   */
  generateConfirmation(action, details = {}) {
    const confirmations = {
      professional: `I've ${action}${details.item ? ` ${details.item}` : ''}${details.count ? ` (${details.count} item${details.count > 1 ? 's' : ''})` : ''}.${details.nextStep ? ` ${details.nextStep}` : ''}`,
      casual: `Done! ${action}${details.item ? ` ${details.item}` : ''}${details.count ? ` (${details.count} item${details.count > 1 ? 's' : ''})` : ''}.${details.nextStep ? ` ${details.nextStep}` : ''}`,
      friendly: `Perfect! I've ${action}${details.item ? ` ${details.item}` : ''}${details.count ? ` (${details.count} item${details.count > 1 ? 's' : ''})` : ''}.${details.nextStep ? ` ${details.nextStep}` : ''}`,
    }
    return confirmations[this.tone] || confirmations.professional
  }
}

// Singleton instance
let toneEngineInstance = null

export function getToneEngine(tonePreference = 'professional') {
  if (!toneEngineInstance) {
    toneEngineInstance = new ToneEngine(tonePreference)
  } else if (tonePreference !== toneEngineInstance.tone) {
    toneEngineInstance.setTone(tonePreference)
  }
  return toneEngineInstance
}

