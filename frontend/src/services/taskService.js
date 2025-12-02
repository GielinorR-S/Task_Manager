/**
 * Task Service API Layer
 * Provides clean, reusable methods for task operations
 */

import api from '../api'

export const taskService = {
  /**
   * Fetch all tasks
   */
  async getAll() {
    const res = await api.get('/tasks/')
    return res.data || []
  },

  /**
   * Get a single task by ID
   */
  async getById(id) {
    const res = await api.get(`/tasks/${id}/`)
    return res.data
  },

  /**
   * Create a new task
   */
  async create(taskData) {
    const res = await api.post('/tasks/', taskData)
    return res.data
  },

  /**
   * Update an existing task
   */
  async update(id, taskData) {
    const res = await api.put(`/tasks/${id}/`, taskData)
    return res.data
  },

  /**
   * Delete a task
   */
  async delete(id) {
    await api.delete(`/tasks/${id}/`)
    return true
  },

  /**
   * Mark task as complete/incomplete
   */
  async toggleComplete(task) {
    return this.update(task.id, {
      title: task.title,
      description: task.description,
      completed: !task.completed,
      due_at: task.due_at,
    })
  },

  /**
   * Filter tasks by status
   */
  filterByStatus(tasks, status) {
    if (status === 'active') return tasks.filter(t => !t.completed)
    if (status === 'completed') return tasks.filter(t => t.completed)
    if (status === 'overdue') {
      const now = new Date()
      return tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < now)
    }
    return tasks
  },

  /**
   * Filter tasks by due date range
   */
  filterByDueDate(tasks, range = 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (range) {
      case 'today':
        return tasks.filter(t => {
          if (!t.due_at) return false
          const due = new Date(t.due_at)
          return due >= today && due < tomorrow
        })
      case 'tomorrow':
        const dayAfter = new Date(tomorrow)
        dayAfter.setDate(dayAfter.getDate() + 1)
        return tasks.filter(t => {
          if (!t.due_at) return false
          const due = new Date(t.due_at)
          return due >= tomorrow && due < dayAfter
        })
      case 'thisWeek':
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() + 7)
        return tasks.filter(t => {
          if (!t.due_at) return false
          const due = new Date(t.due_at)
          return due >= today && due < weekEnd
        })
      case 'overdue':
        return tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < now)
      default:
        return tasks
    }
  },

  /**
   * Search tasks by query
   */
  search(tasks, query) {
    if (!query) return tasks
    const lowerQuery = query.toLowerCase()
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description && task.description.toLowerCase().includes(lowerQuery))
    )
  },

  /**
   * Sort tasks
   */
  sort(tasks, sortBy = 'due_at') {
    const sorted = [...tasks]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'due_at':
          if (!a.due_at) return 1
          if (!b.due_at) return -1
          return new Date(a.due_at) - new Date(b.due_at)
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'priority':
          // If priority field exists, sort by it
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          const aPriority = priorityOrder[a.priority] || 0
          const bPriority = priorityOrder[b.priority] || 0
          return bPriority - aPriority
        default:
          return 0
      }
    })
    return sorted
  },

  /**
   * Get task statistics
   */
  getStats(tasks) {
    const now = new Date()
    const completed = tasks.filter(t => t.completed).length
    const active = tasks.filter(t => !t.completed).length
    const overdue = tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < now).length
    const dueSoon = tasks.filter(t => {
      if (t.completed || !t.due_at) return false
      const due = new Date(t.due_at)
      const hoursUntilDue = (due - now) / (1000 * 60 * 60)
      return hoursUntilDue > 0 && hoursUntilDue <= 24
    }).length

    return {
      total: tasks.length,
      completed,
      active,
      overdue,
      dueSoon,
    }
  },
}

