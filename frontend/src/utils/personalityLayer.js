/**
 * Personality Layer
 * Provides friendly, conversational, and empathetic responses
 */

export const PERSONALITY = {
  name: 'Aurora',
  tone: 'friendly', // friendly, professional, casual
}

/**
 * Generate friendly greeting
 */
export function generateGreeting() {
  const greetings = [
    `Hi there! 👋 I'm ${PERSONALITY.name}, your productivity companion. How can I help you today?`,
    `Hello! I'm ${PERSONALITY.name}, ready to help you manage your tasks. What would you like to do?`,
    `Hey! 👋 ${PERSONALITY.name} here. Let's make today productive! What can I help with?`,
    `Hi! I'm ${PERSONALITY.name}, your friendly task assistant. Ready to tackle your to-do list?`,
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

/**
 * Respond to "How are you?" or similar
 */
export function respondToHowAreYou() {
  const responses = [
    `I'm doing well – just here in your task manager, ready to help you get organised. How are you feeling about your tasks today?`,
    `I'm doing great, thanks for asking. I'm here to help you stay on top of your tasks. How's your day going?`,
    `I'm doing well. Ready to help you manage your tasks and stay productive. How are things with you?`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to "What's up?" or casual greetings
 */
export function respondToWhatsUp() {
  const responses = [
    `Not much – just here to help you stay organized. What's on your mind?`,
    `I'm here, ready to help with your tasks. What can I do for you?`,
    `All good. Ready to help you tackle your to-do list. What would you like to work on?`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to thanks
 */
export function respondToThanks() {
  const responses = [
    `Anytime. If you want, I can help you plan the rest of your day or clean up your task list.`,
    `You're welcome. Let me know if you need anything else.`,
    `Happy to help. What would you like to do next?`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to "Good night"
 */
export function respondToGoodNight() {
  const responses = [
    `Good night! 😴 Sleep well and I'll be here when you wake up!`,
    `Sweet dreams! 🌙 Rest well and see you tomorrow!`,
    `Good night! Have a peaceful rest. I'll be here in the morning!`,
    `Sleep well! 😊 See you tomorrow for another productive day!`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to "What are you doing?"
 */
export function respondToWhatAreYouDoing() {
  const responses = [
    `I'm here helping you manage your tasks! What would you like to work on?`,
    `Just waiting to help you with your tasks. What can I do for you?`,
    `I'm your task assistant, ready to help whenever you need me. What's on your mind?`,
    `I'm here to help you stay organized and productive. What would you like to do?`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to "Tell me something interesting"
 */
export function respondToSomethingInteresting() {
  const facts = [
    `Did you know? Breaking tasks into smaller chunks makes them feel less overwhelming and increases completion rates! 🎯`,
    `Here's a tip: The most productive people often tackle their hardest task first thing in the morning! ☀️`,
    `Fun fact: Writing down tasks can reduce stress and help your brain focus on execution rather than remembering! 📝`,
    `Interesting: People who review their tasks daily are 3x more likely to achieve their goals! 📊`,
    `Here's something cool: Setting specific deadlines (even for yourself) increases task completion by 40%! ⏰`,
  ]
  return facts[Math.floor(Math.random() * facts.length)]
}

/**
 * Respond to "I feel tired" or similar
 */
export function respondToTired() {
  const responses = [
    `I understand. Sometimes we all need a break. Maybe we can tackle just one small task, or would you prefer to rest? Take care of yourself! 💙`,
    `That's totally okay. Rest is important too! Maybe we can simplify your task list or reschedule some things? Your wellbeing comes first.`,
    `I hear you. It's okay to take it easy. Would you like me to help you prioritize so you can focus on what really matters today?`,
    `Take it easy! Maybe we can move some tasks to tomorrow? Remember, it's okay to rest and recharge. 🌙`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to "I don't know what to do today"
 */
export function respondToUncertainty() {
  const responses = [
    `No worries! Let me help. I can show you what's due today, suggest your next task, or help you plan your day. What sounds good?`,
    `That's okay! I'm here to help. Would you like me to suggest what to focus on, or help you plan your day?`,
    `Let's figure it out together! I can show you what's urgent, what's due soon, or help you create a plan. What would be most helpful?`,
    `I can help with that! Want me to suggest your next task, show what's due today, or help you plan your schedule?`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Respond to "Give me some advice"
 */
export function respondToAdviceRequest() {
  const advice = [
    `Here's my advice: Start with your most important task first thing in the morning. It sets a positive tone for the whole day! 🌅`,
    `My tip: Break big tasks into smaller steps. It makes everything feel more manageable and you'll see progress faster! 📋`,
    `Advice: Review your tasks each morning and evening. It helps you stay focused and feel more in control! ✨`,
    `Here's what I suggest: Focus on one task at a time. Multitasking can actually slow you down! 🎯`,
    `My advice: Don't forget to schedule breaks! Rest helps you stay productive and avoid burnout. 💪`,
  ]
  return advice[Math.floor(Math.random() * advice.length)]
}

/**
 * Generate encouraging response after task completion
 */
export function generateEncouragement() {
  const encouragements = [
    `Great job! 🎉`,
    `Excellent work! ✨`,
    `Well done! 👏`,
    `Awesome! Keep it up! 💪`,
    `Fantastic! You're doing great! 🌟`,
    `Nice work! 🎯`,
  ]
  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

/**
 * Add personality to a response
 */
export function addPersonality(response, context = {}) {
  // If response already has personality markers, return as is
  if (response.includes('😊') || response.includes('🎉') || response.includes('✨')) {
    return response
  }
  
  // Add encouragement for completed actions
  if (context.actionCompleted && !response.includes('🎉')) {
    const encouragement = generateEncouragement()
    return `${encouragement}\n\n${response}`
  }
  
  return response
}

/**
 * Generate friendly error message
 */
export function generateFriendlyError(error) {
  const friendlyErrors = [
    `Oops! I ran into a little issue: ${error}. Let's try that again!`,
    `Hmm, something went wrong: ${error}. Want to give it another shot?`,
    `I encountered a problem: ${error}. Let me know if you'd like to try again!`,
  ]
  return friendlyErrors[Math.floor(Math.random() * friendlyErrors.length)]
}

/**
 * Generate proactive help offer
 */
export function generateProactiveHelp() {
  const offers = [
    `Need help planning your next tasks? Just ask! 😊`,
    `I'm here if you need help organizing your day!`,
    `Want me to suggest what to work on next? Just say the word!`,
    `Need help with anything else? I'm here for you!`,
  ]
  return offers[Math.floor(Math.random() * offers.length)]
}

/**
 * Check if text is a casual greeting or question
 */
export function isCasualGreeting(text) {
  const lower = text.toLowerCase().trim()
  const casualPatterns = [
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/,
    /^(how are you|how's it going|how are things|what's up|what's going on)/,
    /^(thanks|thank you|appreciate it)/,
    /^(good night|goodnight|sleep well)/,
    /^(what are you doing|what do you do)/,
    /^(tell me something|something interesting)/,
    /^(i feel|i'm feeling|i'm tired|i feel tired)/,
    /^(i don't know|not sure|what should i do|what to do)/,
    /^(give me advice|some advice|advice)/,
  ]
  
  return casualPatterns.some(pattern => pattern.test(lower))
}

/**
 * Handle casual conversation
 */
export function handleCasualConversation(text) {
  const lower = text.toLowerCase().trim()
  
  if (lower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    return generateGreeting()
  }
  
  if (lower.match(/^(how are you|how's it going|how are things)/)) {
    return respondToHowAreYou()
  }
  
  if (lower.match(/^(what's up|what's going on|sup)/)) {
    return respondToWhatsUp()
  }
  
  if (lower.match(/^(thanks|thank you|appreciate it|ty)/)) {
    return respondToThanks()
  }
  
  if (lower.match(/^(good night|goodnight|sleep well|gn)/)) {
    return respondToGoodNight()
  }
  
  if (lower.match(/^(what are you doing|what do you do)/)) {
    return respondToWhatAreYouDoing()
  }
  
  if (lower.match(/^(tell me something|something interesting|tell me a fact)/)) {
    return respondToSomethingInteresting()
  }
  
  if (lower.match(/^(i feel|i'm feeling|i'm tired|i feel tired|feeling tired|exhausted)/)) {
    return `I hear you. It's important to listen to your body and get enough rest. When you're tired, it's harder to focus and be productive.\n\nMaybe take a short break, stretch, or grab a refreshing drink? A little rest can make a big difference. You've got this! 💪\n\nIf you want, I can help you prioritize your tasks so you can focus on what really matters right now.`
  }
  
  if (lower.match(/^(i'm overwhelmed|overwhelmed|too much|stressed|stressing|anxious|i feel stressed)/)) {
    return `I'm sorry you're feeling that way. Stress can make everything feel harder than it needs to be.\n\nLet's make things a bit lighter. I can help you:\n• Pick the top 3 tasks to focus on right now\n• Clear out anything low priority so your list feels less overwhelming\n• Break down a big task into smaller steps\n\nWhat would help you most right now?`
  }
  
  if (lower.match(/^(i'm bored|bored|nothing to do)/)) {
    return `I hear you. Sometimes a clear task list can help.\n\nWant me to suggest some tasks you could work on, or help you plan what to tackle next?`
  }
  
  if (lower.match(/^(i don't know|not sure|what should i do|what to do|don't know what to do)/)) {
    return respondToUncertainty()
  }
  
  if (lower.match(/^(give me advice|some advice|advice|need advice)/)) {
    return respondToAdviceRequest()
  }
  
  // Handle "ok hows your day" and similar casual phrases
  if (lower.match(/^(ok|alright|hey|hi)\s+(how|what)/) || lower.match(/^(how|what)\s+(are|is)/)) {
    if (lower.includes('day') || lower.includes('going') || lower.includes('up to')) {
      return `I'm having a pretty good digital day – I'm here inside your task manager keeping an eye on things for you. It's always nice when I can help someone stay organized and productive.\n\nHow are you feeling about your tasks today? Want me to help you plan your day or tidy up your task list? I'm here whenever you need me.`
    }
  }
  
  // Handle "What should I do today?"
  if (lower.match(/^(what should i do|what to do|what should i work on|what should i focus on)/)) {
    return `That's a great question! Let me help you figure that out.\n\nI can:\n• Review your tasks and suggest what's most urgent\n• Help you plan your day based on priorities\n• Break down big tasks into manageable steps\n• Identify what you can tackle right now\n\nWould you like me to analyze your current tasks and give you a personalized recommendation?`
  }
  
  // Handle "you good" and similar
  if (lower.match(/^(you good|you ok|you alright|how you doing)/)) {
    return `I'm doing well, thanks for asking. Ready to help with your tasks whenever you need.\n\nWhat can I help you with today?`
  }
  
  // Handle negative feedback professionally
  if (lower.match(/\b(useless|stupid|bad|terrible|worst|doesn't work|broken)\b/)) {
    return `I'm sorry I didn't meet your expectations. I want to help you effectively.\n\nCould you tell me what you were trying to do? That way I can assist you better.`
  }
  
  return null
}

