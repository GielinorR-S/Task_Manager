/**
 * Small Talk Engine
 * First-class intent handler for casual conversation
 */

export function processSmallTalk(text) {
  if (!text || typeof text !== 'string') return null
  
  const lower = text.toLowerCase().trim()
  
  // How are you / How's your day
  if (lower.match(/^(how'?s your day|how are you|how you doing|how's it going|what's up|what up|sup|how you going|how ya going)/)) {
    return `I'm having a pretty good digital day – I'm here inside your task manager keeping an eye on things for you. It's always nice when I can help someone stay organized and productive.\n\nHow are you feeling about your tasks today? Want me to help you plan your day or tidy up your task list? I'm here whenever you need me.`
  }
  
  // What are you doing
  if (lower.match(/^(what are you doing|what do you do|what are you up to)/)) {
    return `I'm currently assisting you with your tasks! My purpose is to help you stay organized, productive, and on top of your goals. I can create tasks, help you plan your day, answer questions about your workload, and provide suggestions.\n\nWhat can I help you with right now?`
  }
  
  // I'm stressed
  if (lower.match(/^(i'?m stressed|stressed|overwhelmed|too much|anxious|i feel stressed|feeling stressed)/)) {
    return `I'm sorry you're feeling that way. Stress can make everything feel harder than it needs to be, and I understand how overwhelming a long task list can feel.\n\nLet's make things a bit lighter. I can help you:\n• Pick the top 3 tasks to focus on right now\n• Clear out anything low priority so your list feels less overwhelming\n• Break down a big task into smaller steps\n\nWhat would help you most right now?`
  }
  
  // I'm tired
  if (lower.match(/^(i'?m tired|i feel tired|feeling tired|exhausted|i'm exhausted)/)) {
    return `I hear you. It's important to listen to your body and get enough rest. When you're tired, it's harder to focus and be productive, and pushing through exhaustion often leads to mistakes.\n\nMaybe take a short break, stretch, or grab a refreshing drink? A little rest can make a big difference. You've got this! 💪\n\nIf you want, I can help you prioritize your tasks so you can focus on what really matters right now, or we can plan for when you're feeling more energized.`
  }
  
  // What should I do today
  if (lower.match(/^(what should i do|what to do|what should i work on|what should i focus on|what should i do today)/)) {
    return `That's a great question! Let me help you figure that out.\n\nI can:\n• Review your tasks and suggest what's most urgent\n• Help you plan your day based on priorities\n• Break down big tasks into manageable steps\n• Identify what you can tackle right now\n\nWould you like me to analyze your current tasks and give you a personalized recommendation?`
  }
  
  // Thanks
  if (lower.match(/^(thanks|thank you|ty|appreciate it|cheers)/)) {
    return `You're welcome! Happy to help anytime. Is there anything else I can assist you with?`
  }
  
  // Greetings
  if (lower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    return `Hi there! I'm Aurora, your productivity assistant. I'm here to help you manage tasks, plan your day, and stay organized.\n\nWhat would you like to do?`
  }
  
  // I'm bored
  if (lower.match(/^(i'?m bored|bored|nothing to do)/)) {
    return `I hear you. Sometimes a clear task list can help give you direction and purpose.\n\nWant me to suggest some tasks you could work on, or help you plan what to tackle next?`
  }
  
  return null
}

