/**
 * Command List Generator
 * Provides a comprehensive list of available commands
 */

export function generateCommandList() {
  return `I can do quite a lot for you in this task manager. Here are some ideas:

**General & Chat**
• "How's your day?"
• "Help me focus"
• "I'm stressed" (I'll help you prioritize)
• "Clear chat" or "Reset chat" (start a fresh conversation)

**Create & Edit Tasks**
• "Create a task called Pay Rent tomorrow at 5pm"
• "Add a description to the gym task"
• "Change the time of test aurora to 3pm"
• "Set priority of groceries to high"
• "Reschedule gym task to Friday"

**Information & Summaries**
• "What's due today?"
• "What's overdue?"
• "Tell me about the task test aurora"
• "How many tasks do I have?"
• "Summarise my tasks for today"

**Planning**
• "Plan my evening"
• "Pick the top 3 tasks I should do next"
• "What should I focus on today?"
• "Plan my next 3 hours"

**Bulk Actions**
• "Clear all completed tasks"
• "Delete all tasks" (I'll ask for confirmation)
• "Complete everything due today"
• "Show only high priority tasks"`

}

/**
 * Check if user is asking for command list
 */
export function isCommandListRequest(text) {
  const lower = text.toLowerCase().trim()
  const patterns = [
    /^(what can you do|what can you help|what do you do)/,
    /^(show me what you can do|show commands|list commands|available commands)/,
    /^(what are your abilities|what tasks can you|what operations|what features)/,
    /^(how can you help me|help|commands|what commands)/,
    /^(capabilities|features|what are your)/,
  ]
  return patterns.some(pattern => pattern.test(lower))
}

