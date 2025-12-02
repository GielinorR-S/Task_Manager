/**
 * Advanced Reasoning Engine
 * Provides intelligent analysis, suggestions, and explanations
 */

import { formatDate, formatTaskList } from './commandParser'
import { taskService } from '../services/taskService'
import { findTaskAdvanced, findTasksByCategory, findTasksByPriority, parseDateTime } from './advancedParser'

/**
 * Generate intelligent summary with reasoning
 */
export function generateIntelligentSummary(tasks) {
  const stats = taskService.getStats(tasks)
  const now = new Date()
  
  const overdue = tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < now)
  const dueToday = tasks.filter(t => {
    if (t.completed || !t.due_at) return false
    const due = new Date(t.due_at)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return due >= today && due < tomorrow
  })
  const dueThisWeek = tasks.filter(t => {
    if (t.completed || !t.due_at) return false
    const due = new Date(t.due_at)
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
    return due >= now && due < weekEnd
  })
  
  let summary = `📊 **TASK OVERVIEW**\n\n`
  summary += `**Total Tasks:** ${stats.total}\n`
  summary += `**Active:** ${stats.active}\n`
  summary += `**Completed:** ${stats.completed} (${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)\n\n`
  
  if (overdue.length > 0) {
    summary += `⚠️ **URGENT: ${overdue.length} Overdue Task(s)**\n`
    summary += `These need immediate attention:\n`
    overdue.slice(0, 3).forEach(t => {
      const daysOverdue = Math.floor((now - new Date(t.due_at)) / (1000 * 60 * 60 * 24))
      summary += `  • Task #${t.id}: "${t.title}" (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue)\n`
    })
    summary += `\n`
  }
  
  if (dueToday.length > 0) {
    summary += `⏰ **Due Today: ${dueToday.length} Task(s)**\n`
    dueToday.slice(0, 3).forEach(t => {
      summary += `  • Task #${t.id}: "${t.title}" (${formatDate(t.due_at)})\n`
    })
    summary += `\n`
  }
  
  if (dueThisWeek.length > 0 && dueToday.length < dueThisWeek.length) {
    summary += `📅 **This Week: ${dueThisWeek.length} Task(s)**\n`
  }
  
  // Workload analysis
  if (stats.active > 10) {
    summary += `\n💡 **Workload Analysis:** You have ${stats.active} active tasks. Consider:\n`
    summary += `  • Breaking large tasks into smaller steps\n`
    summary += `  • Prioritizing by deadline and importance\n`
    summary += `  • Delegating or deferring less critical items\n`
  } else if (stats.active > 0) {
    summary += `\n✅ **Good balance!** You have a manageable workload.\n`
  }
  
  return summary
}

/**
 * Explain why a task is urgent or important
 */
export function explainTaskUrgency(task) {
  if (!task.due_at) {
    return `Task "${task.title}" doesn't have a due date set, so it's not time-sensitive.`
  }
  
  const now = new Date()
  const due = new Date(task.due_at)
  const diffMs = due - now
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMs < 0) {
    const daysOverdue = Math.abs(diffDays)
    return `⚠️ Task "${task.title}" is **${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue**. This needs immediate attention to avoid further delays.`
  }
  
  if (diffHours <= 3) {
    return `⏰ Task "${task.title}" is **due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}**. This is very urgent and should be prioritized.`
  }
  
  if (diffHours <= 24) {
    return `⏰ Task "${task.title}" is **due today** (in ${diffHours} hours). This should be completed soon.`
  }
  
  if (diffDays <= 3) {
    return `📅 Task "${task.title}" is **due in ${diffDays} day${diffDays !== 1 ? 's' : ''}**. Plan time to complete this soon.`
  }
  
  return `📅 Task "${task.title}" is **due in ${diffDays} day${diffDays !== 1 ? 's' : ''}** (${formatDate(task.due_at)}). You have time, but don't forget about it!`
}

/**
 * Suggest next task with reasoning
 */
export function suggestNextTask(tasks) {
  const active = tasks.filter(t => !t.completed)
  if (active.length === 0) {
    return `🎉 **Great job!** You don't have any active tasks. You're all caught up!`
  }
  
  const now = new Date()
  
  // Prioritize: overdue > due soon > due today > others
  const overdue = active.filter(t => t.due_at && new Date(t.due_at) < now)
  if (overdue.length > 0) {
    const task = overdue[0]
    return {
      task,
      reasoning: explainTaskUrgency(task),
      recommendation: `**I recommend starting with this overdue task immediately.**`
    }
  }
  
  const dueSoon = active.filter(t => {
    if (!t.due_at) return false
    const due = new Date(t.due_at)
    const hoursUntilDue = (due - now) / (1000 * 60 * 60)
    return hoursUntilDue > 0 && hoursUntilDue <= 24
  })
  
  if (dueSoon.length > 0) {
    const sorted = taskService.sort(dueSoon, 'due_at')
    const task = sorted[0]
    return {
      task,
      reasoning: explainTaskUrgency(task),
      recommendation: `**This should be your next priority** - it's due within 24 hours.`
    }
  }
  
  const dueToday = active.filter(t => {
    if (!t.due_at) return false
    const due = new Date(t.due_at)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return due >= today && due < tomorrow
  })
  
  if (dueToday.length > 0) {
    const sorted = taskService.sort(dueToday, 'due_at')
    const task = sorted[0]
    return {
      task,
      reasoning: explainTaskUrgency(task),
      recommendation: `**This is due today** - good to tackle it now.`
    }
  }
  
  // No urgent tasks, suggest first task by due date or creation
  const sorted = taskService.sort(active, 'due_at')
  const task = sorted[0]
  
  return {
    task,
    reasoning: task.due_at 
      ? `This task is due ${formatDate(task.due_at)}.`
      : `This task doesn't have a deadline, so you can work on it when convenient.`,
    recommendation: `**Suggested next task** - no urgent deadlines, so you can choose what feels most important.`
  }
}

/**
 * Generate day plan with time slots
 */
export function generateDayPlan(tasks, hours = 8) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const active = tasks.filter(t => !t.completed && t.due_at)
  
  // Sort by due date
  const sorted = taskService.sort(active, 'due_at')
  const todayTasks = sorted.filter(t => {
    const due = new Date(t.due_at)
    return due >= today && due < new Date(today.getTime() + 24 * 60 * 60 * 1000)
  })
  
  if (todayTasks.length === 0) {
    return `📅 **Today's Plan**\n\nYou don't have any tasks scheduled for today. Great opportunity to:\n• Work on tasks without deadlines\n• Plan ahead for upcoming tasks\n• Take a well-deserved break!`
  }
  
  let plan = `📅 **TODAY'S PLAN**\n\n`
  plan += `You have ${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} scheduled for today:\n\n`
  
  const timeSlots = [
    { start: 9, label: 'Morning (9am-12pm)' },
    { start: 13, label: 'Afternoon (1pm-5pm)' },
    { start: 18, label: 'Evening (6pm-9pm)' },
  ]
  
  todayTasks.forEach((task, idx) => {
    const due = new Date(task.due_at)
    const hour = due.getHours()
    let timeSlot = 'Flexible'
    
    if (hour >= 9 && hour < 12) timeSlot = '🌅 Morning'
    else if (hour >= 12 && hour < 17) timeSlot = '☀️ Afternoon'
    else if (hour >= 17) timeSlot = '🌆 Evening'
    
    plan += `${idx + 1}. ${timeSlot}: **${task.title}**\n`
    plan += `   Due: ${formatDate(task.due_at)}\n`
    if (task.description) {
      plan += `   ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}\n`
    }
    plan += `\n`
  })
  
  plan += `💡 **Tip:** Start with the earliest due time and work your way through. Take breaks between tasks!`
  
  return plan
}

/**
 * Detect scheduling conflicts
 */
export function detectConflicts(tasks) {
  const now = new Date()
  const conflicts = []
  
  // Group tasks by date/time
  const timeSlots = {}
  
  tasks.filter(t => !t.completed && t.due_at).forEach(task => {
    const due = new Date(task.due_at)
    const dateKey = due.toDateString()
    const hour = due.getHours()
    
    if (!timeSlots[dateKey]) {
      timeSlots[dateKey] = {}
    }
    
    const slotKey = `${hour}-${hour + 1}`
    if (!timeSlots[dateKey][slotKey]) {
      timeSlots[dateKey][slotKey] = []
    }
    
    timeSlots[dateKey][slotKey].push(task)
  })
  
  // Find conflicts (multiple tasks in same hour)
  for (const [date, slots] of Object.entries(timeSlots)) {
    for (const [slot, slotTasks] of Object.entries(slots)) {
      if (slotTasks.length > 1) {
        conflicts.push({
          date,
          time: slot,
          tasks: slotTasks,
        })
      }
    }
  }
  
  if (conflicts.length === 0) {
    return null
  }
  
  let conflictMsg = `⚠️ **SCHEDULING CONFLICTS DETECTED**\n\n`
  conflicts.forEach(conflict => {
    conflictMsg += `**${conflict.date} at ${conflict.time}:00** - ${conflict.tasks.length} tasks:\n`
    conflict.tasks.forEach(t => {
      conflictMsg += `  • "${t.title}" (${formatDate(t.due_at)})\n`
    })
    conflictMsg += `\n💡 **Suggestion:** Consider rescheduling some of these tasks to avoid overloading yourself.\n\n`
  })
  
  return conflictMsg
}

/**
 * Suggest task improvements
 */
export function suggestTaskImprovements(task) {
  const suggestions = []
  
  if (!task.description || task.description.length < 10) {
    suggestions.push(`• Add a detailed description to clarify what needs to be done`)
  }
  
  if (!task.due_at) {
    suggestions.push(`• Set a due date to create urgency and help with planning`)
  }
  
  if (task.title.length < 5) {
    suggestions.push(`• Use a more descriptive title (current: "${task.title}")`)
  }
  
  if (task.title.length > 50) {
    suggestions.push(`• Consider shortening the title and moving details to the description`)
  }
  
  if (suggestions.length === 0) {
    return `✅ Task "${task.title}" looks good! It has a clear title${task.description ? ', description' : ''}${task.due_at ? ', and due date' : ''}.`
  }
  
  let msg = `💡 **SUGGESTIONS FOR TASK #${task.id}: "${task.title}"**\n\n`
  msg += suggestions.join('\n')
  msg += `\n\nThese improvements will help you stay organized and focused.`
  
  return msg
}

/**
 * Answer any question about tasks
 */
export function answerQuestion(question, tasks) {
  const lower = question.toLowerCase()
  
  // "How many tasks..."
  if (lower.match(/how many/)) {
    const stats = taskService.getStats(tasks)
    if (lower.includes('overdue')) {
      return `You have ${stats.overdue} overdue task${stats.overdue !== 1 ? 's' : ''}.`
    }
    if (lower.includes('completed')) {
      return `You have ${stats.completed} completed task${stats.completed !== 1 ? 's' : ''}.`
    }
    if (lower.includes('active')) {
      return `You have ${stats.active} active task${stats.active !== 1 ? 's' : ''}.`
    }
    return `You have ${stats.total} total task${stats.total !== 1 ? 's' : ''} (${stats.active} active, ${stats.completed} completed).`
  }
  
  // "What tasks..."
  if (lower.match(/what task/)) {
    if (lower.includes('overdue')) {
      const overdue = tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < new Date())
      if (overdue.length === 0) return `You don't have any overdue tasks. Great job! 🎉`
      return `Here are your overdue tasks:\n${formatTaskList(overdue)}`
    }
    if (lower.includes('due today')) {
      const dueToday = tasks.filter(t => {
        if (t.completed || !t.due_at) return false
        const due = new Date(t.due_at)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return due >= today && due < tomorrow
      })
      if (dueToday.length === 0) return `You don't have any tasks due today.`
      return `Here are your tasks due today:\n${formatTaskList(dueToday)}`
    }
  }
  
  // "When is..."
  if (lower.match(/when is/)) {
    const taskMatch = question.match(/when is\s+(?:task\s+)?(.+?)(?:\s+due|\?|$)/i)
    if (taskMatch) {
      const query = taskMatch[1].trim()
      const task = findTaskAdvanced(tasks, query)
      if (!task) {
        return `I couldn't find a task matching "${query}".`
      }
      if (!task.due_at) {
        return `Task "${task.title}" doesn't have a due date set.`
      }
      return `Task "${task.title}" is due ${formatDate(task.due_at)}.`
    }
  }
  
  // "Why is..."
  if (lower.match(/why is/)) {
    const taskMatch = question.match(/why is\s+(?:task\s+)?(.+?)(?:\s+urgent|\?|$)/i)
    if (taskMatch) {
      const query = taskMatch[1].trim()
      const task = findTaskAdvanced(tasks, query)
      if (!task) {
        return `I couldn't find a task matching "${query}".`
      }
      return explainTaskUrgency(task)
    }
  }
  
  // Default: try to provide helpful response
  return `I understand you're asking about your tasks. Could you be more specific? For example:\n• "How many tasks do I have?"\n• "What tasks are due today?"\n• "When is [task name] due?"\n• "Why is [task name] urgent?"`
}

